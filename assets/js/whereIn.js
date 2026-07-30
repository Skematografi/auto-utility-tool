// ----------------------------------------
// TAB 7: WHERE IN GENERATOR LOGIC
// Convert a list (one item per line) into ready-to-use values
// for an SQL clause: WHERE col IN (...)
// ----------------------------------------
const whereInInput = document.getElementById('whereInInput');
const whereInTemplate = document.getElementById('whereInTemplate');
const whereInCount = document.getElementById('whereInCount');
const whereInType = document.getElementById('whereInType');
const whereInEmpty = document.getElementById('whereInEmpty');
const whereInChunkBadge = document.getElementById('whereInChunkBadge');
const whereInChunks = document.getElementById('whereInChunks');

const whereInIntWrap = document.getElementById('whereInIntWrap');
const whereInIntResult = document.getElementById('whereInIntResult');
const copyWhereInIntBtn = document.getElementById('copyWhereInIntBtn');

const copyWhereInIntChunkBtn = document.getElementById('copyWhereInIntChunkBtn');

const whereInStrWrap = document.getElementById('whereInStrWrap');
const whereInStrResult = document.getElementById('whereInStrResult');
const copyWhereInStrBtn = document.getElementById('copyWhereInStrBtn');
const copyWhereInStrChunkBtn = document.getElementById('copyWhereInStrChunkBtn');

// Maximum characters per output line before wrapping to a new line
const WHERE_IN_MAX_LINE = 200;
// Chunking: show the chunked version when items exceed 1000; max 500 values per IN
const WHERE_IN_CHUNK_THRESHOLD = 1000;
const WHERE_IN_CHUNK_SIZE = 500;

// Store both versions (full & chunked) for their respective copy buttons
let whereInIntFull = '';
let whereInIntChunked = '';
let whereInStrFull = '';
let whereInStrChunked = '';

whereInInput.addEventListener('input', generateWhereIn);
whereInTemplate.addEventListener('input', generateWhereIn);

// Join tokens with commas, wrapping to a new line when the line length exceeds the limit
function wrapWhereInTokens(tokens) {
    const lines = [];
    let current = '';

    tokens.forEach((token, index) => {
        const piece = token + (index < tokens.length - 1 ? ',' : '');
        if (current !== '' && current.length + piece.length > WHERE_IN_MAX_LINE) {
            lines.push(current);
            current = piece;
        } else {
            current += piece;
        }
    });

    if (current !== '') lines.push(current);
    return lines.join('\n');
}

// Split tokens into groups of at most WHERE_IN_CHUNK_SIZE values
function splitIntoChunks(tokens) {
    const chunks = [];
    for (let i = 0; i < tokens.length; i += WHERE_IN_CHUNK_SIZE) {
        chunks.push(tokens.slice(i, i + WHERE_IN_CHUNK_SIZE));
    }
    return chunks;
}

// Build output from tokens, applying a template (optional).
// - doChunk=false -> all values in a single block/statement.
// - doChunk=true  -> split into max 500 values; with a template each chunk becomes one
//   statement, without a template each chunk gets a comment header when there is more than one.
function buildWhereIn(tokens, template, doChunk) {
    const chunks = doChunk ? splitIntoChunks(tokens) : [tokens];
    const tpl = template.trim();

    if (tpl) {
        const hasPlaceholder = tpl.includes('{values}');
        return chunks
            .map(chunk => {
                const list = wrapWhereInTokens(chunk);
                return hasPlaceholder ? tpl.replace(/\{values\}/g, list) : `${tpl}\n${list}`;
            })
            .join('\n\n');
    }

    if (chunks.length === 1) return wrapWhereInTokens(chunks[0]);
    return chunks
        .map((chunk, i) => `-- chunk ${i + 1}/${chunks.length} (${chunk.length} values)\n${wrapWhereInTokens(chunk)}`)
        .join('\n\n');
}

function generateWhereIn() {
    const items = whereInInput.value
        .split('\n')
        .map(item => item.trim())
        .filter(item => item !== '');

    whereInCount.textContent = items.length;

    // Number of chunks the "copy chunked" button will produce (max 500/IN)
    const chunkCount = Math.ceil(items.length / WHERE_IN_CHUNK_SIZE);
    if (items.length > 0 && chunkCount > 1) {
        whereInChunks.textContent = chunkCount;
        whereInChunkBadge.classList.remove('hidden');
        whereInChunkBadge.classList.add('flex');
    } else {
        whereInChunkBadge.classList.add('hidden');
        whereInChunkBadge.classList.remove('flex');
    }

    if (items.length === 0) {
        whereInType.textContent = '-';
        whereInIntWrap.classList.add('hidden');
        whereInStrWrap.classList.add('hidden');
        whereInEmpty.classList.remove('hidden');
        whereInIntResult.value = '';
        whereInStrResult.value = '';
        whereInIntFull = whereInIntChunked = whereInStrFull = whereInStrChunked = '';
        return;
    }

    whereInEmpty.classList.add('hidden');

    const template = whereInTemplate.value;
    // The chunked version is shown in the textarea when items exceed the threshold
    const showChunked = items.length > WHERE_IN_CHUNK_THRESHOLD;

    // Numeric: digits (optional minus sign), optional decimals (500.0000, 3.5)
    const isNumericList = items.every(item => /^-?\d+(\.\d+)?$/.test(item));
    const isIntegerList = isNumericList && items.every(item => /^-?\d+$/.test(item));

    // The string version is always built: wrap in single quotes,
    // single quotes inside the data are doubled ('') so it is valid to run in SQL
    const stringTokens = items.map(item => `'${item.replace(/'/g, "''")}'`);
    whereInStrFull = buildWhereIn(stringTokens, template, false);
    whereInStrChunked = buildWhereIn(stringTokens, template, true);
    whereInStrResult.value = showChunked ? whereInStrChunked : whereInStrFull;
    whereInStrWrap.classList.remove('hidden');

    if (isNumericList) {
        whereInType.textContent = isIntegerList ? 'integer' : 'numeric';
        const numberTokens = items.map(normalizeNumericToken);
        whereInIntFull = buildWhereIn(numberTokens, template, false);
        whereInIntChunked = buildWhereIn(numberTokens, template, true);
        whereInIntResult.value = showChunked ? whereInIntChunked : whereInIntFull;
        whereInIntWrap.classList.remove('hidden');
    } else {
        whereInType.textContent = 'string';
        whereInIntWrap.classList.add('hidden');
        whereInIntFull = whereInIntChunked = '';
    }
}

// Tidy up decimal numbers without changing the value: 500.0000 -> 500, 3.5000 -> 3.5
// Pure string manipulation so large numbers do not lose precision (not parseFloat)
function normalizeNumericToken(item) {
    if (!item.includes('.')) return item;
    return item.replace(/0+$/, '').replace(/\.$/, '');
}

copyWhereInIntBtn.addEventListener('click', function () {
    if (!whereInIntFull) return;
    handleClipboardCopy(whereInIntFull, copyWhereInIntBtn, 'copy', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});

copyWhereInIntChunkBtn.addEventListener('click', function () {
    if (!whereInIntChunked) return;
    handleClipboardCopy(whereInIntChunked, copyWhereInIntChunkBtn, 'copy chunked', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});

copyWhereInStrBtn.addEventListener('click', function () {
    if (!whereInStrFull) return;
    handleClipboardCopy(whereInStrFull, copyWhereInStrBtn, 'copy', 'bg-sky-500', 'hover:bg-sky-400', 'bg-amber-400', 'hover:bg-amber-300');
});

copyWhereInStrChunkBtn.addEventListener('click', function () {
    if (!whereInStrChunked) return;
    handleClipboardCopy(whereInStrChunked, copyWhereInStrChunkBtn, 'copy chunked', 'bg-sky-500', 'hover:bg-sky-400', 'bg-amber-400', 'hover:bg-amber-300');
});
