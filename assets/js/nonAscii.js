// ----------------------------------------
// TAB 3: AUTO DETECT NON-ASCII LOGIC
// ----------------------------------------
const asciiInput = document.getElementById('asciiInput');
const asciiResultDisplay = document.getElementById('asciiResultValue');
const asciiHighlightPreview = document.getElementById('asciiHighlightPreview');
const copyAsciiListBtn = document.getElementById('copyAsciiListBtn');
const copyCleanTextBtn = document.getElementById('copyCleanTextBtn');
const asciiCountDisplay = document.getElementById('asciiCount');

// Variabel state penyimpanan data mentah
let rawNonAsciiList = [];

asciiInput.addEventListener('input', detectNonAscii);

function detectNonAscii() {
    const text = asciiInput.value;
    if (!text) {
        asciiResultDisplay.textContent = "No non-ASCII characters found.";
        asciiHighlightPreview.innerHTML = "No text entered yet.";
        asciiCountDisplay.textContent = "0";
        copyAsciiListBtn.disabled = true;
        copyCleanTextBtn.disabled = true;
        rawNonAsciiList = [];
        return;
    }

    const escapeHtml = (str) => {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    // Menghasilkan visual preview teks dengan penandaan/highlight warna
    let highlightedHtml = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const code = char.charCodeAt(0);
        if (code > 127) {
            const hexCode = code.toString(16).toUpperCase().padStart(4, '0');
            // Bungkus karakter non-ASCII dengan highlight merah (glow) sebagai penanda atensi + kode Unicode
            highlightedHtml += `<span class="bg-red-500/25 text-red-300 font-bold px-0.5 rounded cursor-help" title="Unicode: U+${hexCode}">${escapeHtml(char)}</span>`;
        } else {
            highlightedHtml += escapeHtml(char);
        }
    }
    asciiHighlightPreview.innerHTML = highlightedHtml;

    // Cari semua karakter non-ASCII (Unicode value > 127)
    const nonAsciiMatches = text.match(/[^\x00-\x7F]/g) || [];
    if (nonAsciiMatches.length === 0) {
        asciiResultDisplay.textContent = "No non-ASCII characters found. Your text is clean!";
        asciiCountDisplay.textContent = "0";
        copyAsciiListBtn.disabled = true;
        copyCleanTextBtn.disabled = true;
        rawNonAsciiList = [];
        return;
    }

    // Analisis karakter unik dan hitung frekuensinya
    const frequencies = {};
    nonAsciiMatches.forEach(char => { frequencies[char] = (frequencies[char] || 0) + 1; });

    const uniqueList = [];
    rawNonAsciiList = [];

    for (const char in frequencies) {
        const hexCode = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
        uniqueList.push(`"${char}" (U+${hexCode}) — ${frequencies[char]}x`);
        rawNonAsciiList.push(char);
    }

    asciiResultDisplay.textContent = uniqueList.join('\n');
    asciiCountDisplay.textContent = nonAsciiMatches.length;
    copyAsciiListBtn.disabled = false;
    copyCleanTextBtn.disabled = false;
}

copyAsciiListBtn.addEventListener('click', function () {
    if (rawNonAsciiList.length === 0) return;
    handleClipboardCopy(rawNonAsciiList.join(''), copyAsciiListBtn, 'copy list', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});

copyCleanTextBtn.addEventListener('click', function () {
    const cleanedText = asciiInput.value.replace(/[^\x00-\x7F]/g, '');
    handleClipboardCopy(cleanedText, copyCleanTextBtn, 'copy cleaned', 'bg-sky-500', 'hover:bg-sky-400', 'bg-amber-400', 'hover:bg-amber-300');
});

// ----------------------------------------
// Scan file Excel/CSV: laporkan HANYA baris yang mengandung non-ASCII
// ----------------------------------------
const asciiFileInput = document.getElementById('asciiFileInput');
const asciiFileResultWrap = document.getElementById('asciiFileResultWrap');
const asciiFileSummary = document.getElementById('asciiFileSummary');
const asciiFileResultDisplay = document.getElementById('asciiFileResult');
const copyAsciiFileBtn = document.getElementById('copyAsciiFileBtn');

let asciiFileReport = '';

asciiFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            const workbook = XLSX.read(evt.target.result, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const aoa = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false });
            scanAsciiFile(aoa, file.name);
        } catch (err) {
            console.error(err);
            showAsciiFileMessage('Failed to read the file. Make sure it is a valid Excel/CSV.', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
    // Reset agar file yang sama bisa diupload ulang
    e.target.value = '';
});

function scanAsciiFile(aoa, fileName) {
    asciiFileResultWrap.classList.remove('hidden');

    if (!aoa.length) {
        showAsciiFileMessage(`"${fileName}" appears to be empty.`, 'error');
        return;
    }

    const headers = (aoa[0] || []).map(h => (h === undefined || h === null) ? '' : String(h));
    const rows = aoa.slice(1);

    const lines = [];
    const affectedRows = new Set();
    let cellCount = 0;

    rows.forEach((row, r) => {
        const excelRow = r + 2; // +1 untuk header, +1 karena baris Excel 1-based
        (row || []).forEach((cell, c) => {
            const value = (cell === undefined || cell === null) ? '' : String(cell);
            const matches = value.match(/[^\x00-\x7F]/g);
            if (matches && matches.length) {
                cellCount++;
                affectedRows.add(excelRow);
                const uniqueChars = [...new Set(matches)].map(ch => {
                    const hex = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
                    return `"${ch}" (U+${hex})`;
                }).join(', ');
                const colLabel = headers[c] ? `"${headers[c]}"` : `(col ${c + 1})`;
                lines.push(`Row ${excelRow}, col ${colLabel}: "${value}"  →  ${uniqueChars}`);
            }
        });
    });

    if (lines.length === 0) {
        // File bersih: tidak ada output baris, cukup pesan bersih
        asciiFileReport = '';
        asciiFileResultDisplay.textContent = `"${fileName}" is clean — no non-ASCII characters found.`;
        setAsciiSummary(`clean: ${rows.length} rows scanned`, 'clean');
        copyAsciiFileBtn.disabled = true;
        return;
    }

    asciiFileReport = lines.join('\n');
    asciiFileResultDisplay.textContent = asciiFileReport;
    setAsciiSummary(`${cellCount} cell(s) in ${affectedRows.size} row(s) contain non-ASCII`, 'found');
    copyAsciiFileBtn.disabled = false;
}

function setAsciiSummary(text, type) {
    asciiFileSummary.textContent = text;
    asciiFileSummary.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ' + (
        type === 'found'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    );
}

function showAsciiFileMessage(msg, type) {
    asciiFileResultWrap.classList.remove('hidden');
    asciiFileReport = '';
    asciiFileResultDisplay.textContent = msg;
    setAsciiSummary(type === 'error' ? 'error' : '-', type === 'error' ? 'found' : 'clean');
    copyAsciiFileBtn.disabled = true;
}

copyAsciiFileBtn.addEventListener('click', function () {
    if (!asciiFileReport) return;
    handleClipboardCopy(asciiFileReport, copyAsciiFileBtn, 'copy report', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});
