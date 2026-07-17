// ----------------------------------------
// TAB 7: WHERE IN GENERATOR LOGIC
// Ubah list (satu item per baris) menjadi nilai siap pakai
// untuk klausa SQL: WHERE col IN (...)
// ----------------------------------------
const whereInInput = document.getElementById('whereInInput');
const whereInCount = document.getElementById('whereInCount');
const whereInType = document.getElementById('whereInType');
const whereInEmpty = document.getElementById('whereInEmpty');

const whereInIntWrap = document.getElementById('whereInIntWrap');
const whereInIntResult = document.getElementById('whereInIntResult');
const copyWhereInIntBtn = document.getElementById('copyWhereInIntBtn');

const whereInStrWrap = document.getElementById('whereInStrWrap');
const whereInStrResult = document.getElementById('whereInStrResult');
const copyWhereInStrBtn = document.getElementById('copyWhereInStrBtn');

// Batas maksimal karakter per baris output sebelum pindah ke baris baru
const WHERE_IN_MAX_LINE = 200;

whereInInput.addEventListener('input', generateWhereIn);

// Gabungkan token dengan koma, pindah baris ketika panjang baris melebihi batas
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

function generateWhereIn() {
    const items = whereInInput.value
        .split('\n')
        .map(item => item.trim())
        .filter(item => item !== '');

    whereInCount.textContent = items.length;

    if (items.length === 0) {
        whereInType.textContent = '-';
        whereInIntWrap.classList.add('hidden');
        whereInStrWrap.classList.add('hidden');
        whereInEmpty.classList.remove('hidden');
        whereInIntResult.value = '';
        whereInStrResult.value = '';
        return;
    }

    whereInEmpty.classList.add('hidden');

    // Numerik: digit (boleh tanda minus), boleh desimal (500.0000, 3.5)
    const isNumericList = items.every(item => /^-?\d+(\.\d+)?$/.test(item));
    const isIntegerList = isNumericList && items.every(item => /^-?\d+$/.test(item));

    // Versi string selalu dibuat: bungkus kutip satu,
    // kutip satu di dalam data digandakan ('') agar valid dijalankan di SQL
    const stringTokens = items.map(item => `'${item.replace(/'/g, "''")}'`);
    whereInStrResult.value = wrapWhereInTokens(stringTokens);
    whereInStrWrap.classList.remove('hidden');

    if (isNumericList) {
        whereInType.textContent = isIntegerList ? 'integer' : 'numeric';
        whereInIntResult.value = wrapWhereInTokens(items.map(normalizeNumericToken));
        whereInIntWrap.classList.remove('hidden');
    } else {
        whereInType.textContent = 'string';
        whereInIntWrap.classList.add('hidden');
    }
}

// Rapikan angka desimal tanpa mengubah nilai: 500.0000 -> 500, 3.5000 -> 3.5
// Manipulasi string murni agar angka besar tidak kehilangan presisi (bukan parseFloat)
function normalizeNumericToken(item) {
    if (!item.includes('.')) return item;
    return item.replace(/0+$/, '').replace(/\.$/, '');
}

copyWhereInIntBtn.addEventListener('click', function () {
    if (!whereInIntResult.value) return;
    handleClipboardCopy(whereInIntResult.value, copyWhereInIntBtn, 'copy number', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});

copyWhereInStrBtn.addEventListener('click', function () {
    if (!whereInStrResult.value) return;
    handleClipboardCopy(whereInStrResult.value, copyWhereInStrBtn, 'copy string', 'bg-sky-500', 'hover:bg-sky-400', 'bg-amber-400', 'hover:bg-amber-300');
});
