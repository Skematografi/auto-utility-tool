// ----------------------------------------
// TAB 12: DUMMY FILE LOGIC
// Generate a blank file of a chosen type and size, for upload/limit testing.
//
// There is no single byte layout that is valid for every format, so each family
// has its own small builder. They all share the same contract —
// build(targetBytes) -> Uint8Array — and are looked up through one registry,
// so adding a format is a single entry. Padding is always placed where the
// format allows ignorable data (a comment/metadata slot, a stream, or the text
// body) so the generated file still opens in its application.
// ----------------------------------------
const dummyType = document.getElementById('dummyType');
const dummyCustomWrap = document.getElementById('dummyCustomWrap');
const dummyExtension = document.getElementById('dummyExtension');
const dummyName = document.getElementById('dummyName');
const dummySize = document.getElementById('dummySize');
const dummyUnit = document.getElementById('dummyUnit');
const generateDummyBtn = document.getElementById('generateDummyBtn');
const dummyStatus = document.getElementById('dummyStatus');

// Keep the browser from choking on very large in-memory buffers
const DUMMY_MAX_BYTES = 100 * 1024 * 1024;

// Show the extension field only for the custom type
dummyType.addEventListener('change', function () {
    dummyCustomWrap.classList.toggle('hidden', dummyType.value !== 'custom');
});

// --- Shared helpers ------------------------------------------

const dummyEncoder = new TextEncoder();

// CRC-32 (needed to build a valid PNG chunk)
const DUMMY_CRC_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
        crc = DUMMY_CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Wrap padding between a fixed head and tail, sized so the total hits the target
function buildWrapped(target, head, tail, label) {
    const overhead = head.length + tail.length;
    if (target < overhead) throw new Error(`${label} needs at least ${overhead} bytes`);
    const out = new Uint8Array(target);
    out.set(dummyEncoder.encode(head), 0);
    out.fill(0x20, head.length, target - tail.length);
    out.set(dummyEncoder.encode(tail), target - tail.length);
    return out;
}

// Re-run a size-dependent builder until it lands on the target.
// Used by container formats whose own structure grows with the padding.
function refine(target, write) {
    let pad = Math.max(0, target - write(0).length);
    let best = write(pad);
    for (let i = 0; i < 8 && best.length !== target; i++) {
        const nextPad = Math.max(0, pad + (target - best.length));
        const next = write(nextPad);
        if (Math.abs(target - next.length) >= Math.abs(target - best.length)) break;
        pad = nextPad;
        best = next;
    }
    return best;
}

async function refineAsync(target, write) {
    let pad = Math.max(0, target - (await write(0)).length);
    let best = await write(pad);
    for (let i = 0; i < 8 && best.length !== target; i++) {
        const nextPad = Math.max(0, pad + (target - best.length));
        const next = await write(nextPad);
        if (Math.abs(target - next.length) >= Math.abs(target - best.length)) break;
        pad = nextPad;
        best = next;
    }
    return best;
}

// Render a blank 1x1 image and return its bytes
function blankImageBytes(mime) {
    return new Promise(function (resolve, reject) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1, 1);
        canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('Canvas export failed')); return; }
            blob.arrayBuffer().then(function (buf) { resolve(new Uint8Array(buf)); }, reject);
        }, mime, 0.92);
    });
}

// --- Builders: plain text ------------------------------------

// Spaces with a line break every 80 bytes, so it still reads as normal text
function buildText(target) {
    const bytes = new Uint8Array(target);
    for (let i = 0; i < target; i++) {
        bytes[i] = ((i + 1) % 80 === 0) ? 0x0A : 0x20;
    }
    return bytes;
}

function buildJson(target) {
    return buildWrapped(target, '{\n  "padding": "', '"\n}\n', 'JSON');
}

function buildXml(target) {
    return buildWrapped(
        target,
        '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <padding>',
        '</padding>\n</root>\n',
        'XML'
    );
}

// --- Builders: images ----------------------------------------

// Pad a PNG by inserting a tEXt chunk before IEND
async function buildPng(target) {
    const base = await blankImageBytes('image/png');
    const KEYWORD = 'Comment';
    const overhead = 12 + KEYWORD.length + 1; // length + type + crc + keyword + separator
    const padLength = target - base.length - overhead;
    if (padLength < 0) throw new Error(`PNG needs at least ${base.length + overhead} bytes`);

    const dataLength = KEYWORD.length + 1 + padLength;
    const chunk = new Uint8Array(12 + dataLength);
    const view = new DataView(chunk.buffer);

    view.setUint32(0, dataLength);
    chunk.set([0x74, 0x45, 0x58, 0x74], 4); // "tEXt"
    for (let i = 0; i < KEYWORD.length; i++) chunk[8 + i] = KEYWORD.charCodeAt(i);
    chunk[8 + KEYWORD.length] = 0x00;
    chunk.fill(0x20, 8 + KEYWORD.length + 1, 8 + dataLength);
    view.setUint32(8 + dataLength, crc32(chunk.subarray(4, 8 + dataLength)));

    // IEND is the last 12 bytes; the padding chunk goes right before it
    const cut = base.length - 12;
    const out = new Uint8Array(target);
    out.set(base.subarray(0, cut), 0);
    out.set(chunk, cut);
    out.set(base.subarray(cut), cut + chunk.length);
    return out;
}

// Pad a JPEG with COM (comment) segments placed right after SOI
async function buildJpeg(target) {
    const base = await blankImageBytes('image/jpeg');
    const extra = target - base.length;
    if (extra < 4) throw new Error(`JPEG needs at least ${base.length + 4} bytes`);

    const MAX_PAYLOAD = 65533; // the length field counts itself (2 bytes)
    const segments = [];
    let count = Math.max(1, Math.ceil(extra / (MAX_PAYLOAD + 4)));
    let payloadLeft = extra - count * 4;
    while (payloadLeft < 0) { count--; payloadLeft = extra - count * 4; }
    for (let i = 0; i < count; i++) {
        const size = Math.min(MAX_PAYLOAD, payloadLeft);
        segments.push(size);
        payloadLeft -= size;
    }

    const out = new Uint8Array(target);
    out.set(base.subarray(0, 2), 0); // SOI
    let offset = 2;
    for (const size of segments) {
        out[offset] = 0xFF;
        out[offset + 1] = 0xFE; // COM marker
        const len = size + 2;
        out[offset + 2] = (len >> 8) & 0xFF;
        out[offset + 3] = len & 0xFF;
        out.fill(0x20, offset + 4, offset + 4 + size);
        offset += 4 + size;
    }
    out.set(base.subarray(2), offset);
    return out;
}

// Minimal 1x1 GIF89a; padding goes into a comment extension before the trailer
function buildGif(target) {
    const base = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // "GIF89a"
        0x01, 0x00, 0x01, 0x00,             // 1x1
        0x80, 0x00, 0x00,                   // global colour table, 2 entries
        0xFF, 0xFF, 0xFF,                   // white
        0x00, 0x00, 0x00,                   // black
        0x2C,                               // image descriptor
        0x00, 0x00, 0x00, 0x00,             // left, top
        0x01, 0x00, 0x01, 0x00,             // width, height
        0x00,                               // no local table
        0x02, 0x02, 0x44, 0x01, 0x00,       // LZW data for one pixel
        0x3B,                               // trailer
    ]);

    const extra = target - base.length;
    if (extra < 5) throw new Error(`GIF needs at least ${base.length + 5} bytes`);

    // Comment extension: 0x21 0xFE + sub-blocks (len + data) + 0x00 terminator
    const budget = extra - 3;
    let blocks = Math.max(1, Math.ceil(budget / 256));
    let dataLeft = budget - blocks;
    while (dataLeft < 0) { blocks--; dataLeft = budget - blocks; }
    const sizes = [];
    for (let i = 0; i < blocks; i++) {
        const size = Math.min(255, dataLeft);
        sizes.push(size);
        dataLeft -= size;
    }

    const out = new Uint8Array(target);
    const cut = base.length - 1; // everything before the trailer
    out.set(base.subarray(0, cut), 0);
    let offset = cut;
    out[offset++] = 0x21;
    out[offset++] = 0xFE;
    for (const size of sizes) {
        out[offset++] = size;
        out.fill(0x20, offset, offset + size);
        offset += size;
    }
    out[offset++] = 0x00; // end of comment
    out[offset] = 0x3B;   // trailer
    return out;
}

// --- Builders: documents -------------------------------------

// Valid single-page PDF; the padding lives in the page content stream and the
// xref offsets are recalculated on every pass.
function buildPdf(target) {
    function write(streamLength) {
        const objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>',
            `<< /Length ${streamLength} >>\nstream\n${' '.repeat(streamLength)}\nendstream`,
        ];

        let body = '%PDF-1.4\n';
        const offsets = [];
        objects.forEach(function (obj, i) {
            offsets.push(body.length);
            body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
        });

        const xrefOffset = body.length;
        let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        offsets.forEach(function (off) {
            xref += String(off).padStart(10, '0') + ' 00000 n \n';
        });

        const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
        return dummyEncoder.encode(body + xref + trailer);
    }
    return refine(target, write);
}

// OOXML (xlsx/docx) share one ZIP-based builder: a minimal valid package whose
// padding sits in a cell / paragraph, stored uncompressed so the size is exact.
const OOXML_TEMPLATES = {
    docx: function (pad) {
        return {
            '[Content_Types].xml':
                '<?xml version="1.0" encoding="UTF-8"?>' +
                '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
                '</Types>',
            '_rels/.rels':
                '<?xml version="1.0" encoding="UTF-8"?>' +
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
                '</Relationships>',
            'word/document.xml':
                '<?xml version="1.0" encoding="UTF-8"?>' +
                '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r>' +
                `<w:t xml:space="preserve">${' '.repeat(pad)}</w:t>` +
                '</w:r></w:p></w:body></w:document>',
        };
    },
};

async function buildOoxml(target, kind) {
    if (typeof JSZip === 'undefined') throw new Error('JSZip is not available');
    const template = OOXML_TEMPLATES[kind];
    return refineAsync(target, async function (pad) {
        const zip = new JSZip();
        const files = template(pad);
        Object.keys(files).forEach(function (path) { zip.file(path, files[path]); });
        return zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
    });
}

// Excel is built through SheetJS (a real workbook), padded with blank cells and
// written uncompressed so the final size is predictable.
function buildXlsx(target) {
    const CHUNK = 4000; // characters per cell (Excel allows up to 32767)
    return refine(target, function (pad) {
        const rows = [];
        let left = pad;
        while (left > 0) {
            const size = Math.min(CHUNK, left);
            rows.push([' '.repeat(size)]);
            left -= size;
        }
        if (rows.length === 0) rows.push(['']);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Sheet1');
        return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx', compression: false }));
    });
}

// --- Registry ------------------------------------------------
// One entry per supported extension: { build, mime }.
// Anything not listed falls back to a blank text file.
const DUMMY_BUILDERS = {
    xlsx: { build: buildXlsx, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    xls: { build: buildXlsx, mime: 'application/vnd.ms-excel' },
    docx: { build: (t) => buildOoxml(t, 'docx'), mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    pdf: { build: buildPdf, mime: 'application/pdf' },
    png: { build: buildPng, mime: 'image/png' },
    jpg: { build: buildJpeg, mime: 'image/jpeg' },
    jpeg: { build: buildJpeg, mime: 'image/jpeg' },
    gif: { build: buildGif, mime: 'image/gif' },
    json: { build: buildJson, mime: 'application/json' },
    xml: { build: buildXml, mime: 'application/xml' },
    csv: { build: buildText, mime: 'text/csv' },
    txt: { build: buildText, mime: 'text/plain' },
};

const DUMMY_FALLBACK = { build: buildText, mime: 'application/octet-stream' };

// Single entry point: resolve the extension and produce the file
async function buildDummyFile(extension, target) {
    const spec = DUMMY_BUILDERS[extension] || DUMMY_FALLBACK;
    const bytes = await spec.build(target);
    return { bytes: bytes, mime: spec.mime };
}

function formatBytes(bytes) {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' B';
}

// --- Generate ------------------------------------------------

generateDummyBtn.addEventListener('click', async function () {
    const amount = parseFloat(dummySize.value);
    const target = Math.round(amount * parseInt(dummyUnit.value, 10));

    if (!amount || amount <= 0 || !isFinite(target)) {
        showDummyStatus('Please enter a valid file size.', 'error');
        return;
    }
    if (target > DUMMY_MAX_BYTES) {
        showDummyStatus('Maximum size is 100 MB.', 'error');
        return;
    }

    const type = dummyType.value;
    let extension = type;
    if (type === 'custom') {
        extension = dummyExtension.value.trim().replace(/^\./, '').toLowerCase();
        if (!extension) {
            showDummyStatus('Please enter a file extension.', 'error');
            return;
        }
    }

    const baseName = (dummyName.value.trim() || 'dummy').replace(/[\\/:*?"<>|]+/g, '_');

    generateDummyBtn.disabled = true;
    showDummyStatus('Generating…', 'success');

    try {
        const result = await buildDummyFile(extension, target);
        const filename = `${baseName}.${extension}`;
        downloadDummy(new Blob([result.bytes], { type: result.mime }), filename);

        const actual = result.bytes.length;
        const known = Object.prototype.hasOwnProperty.call(DUMMY_BUILDERS, extension);
        showDummyStatus(
            `Created "${filename}" — ${formatBytes(actual)}` +
            (actual === target ? '' : ` (target ${formatBytes(target)}; the format rounds the size)`) +
            (known ? '.' : ' — blank file, this extension has no dedicated format.'),
            'success'
        );
    } catch (err) {
        console.error(err);
        showDummyStatus(err.message || 'Failed to generate the file.', 'error');
    } finally {
        generateDummyBtn.disabled = false;
    }
});

function showDummyStatus(message, type) {
    dummyStatus.textContent = message;
    dummyStatus.className = 'text-sm font-semibold px-4 py-3 rounded-md flex items-center gap-2 ' + (
        type === 'error'
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    );
    dummyStatus.classList.remove('hidden');
}

function downloadDummy(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
