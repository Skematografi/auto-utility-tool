// ----------------------------------------
// TAB 9: JSON -> SQL RESTORE LOGIC
// Ubah JSON (satu object atau array of object) menjadi statement
// `insert into <table> select ... union all select ...;`
// - Head : semua field root yang BUKAN array.
// - Detail: key array/object yang ditentukan user (multiple), tiap elemen jadi 1 select.
// ----------------------------------------

// Elemen input & konfigurasi
const restoreJsonInput = document.getElementById('restoreJsonInput');
const restoreJsonFile = document.getElementById('restoreJsonFile');
const restoreHeadTable = document.getElementById('restoreHeadTable');
const restoreDetailList = document.getElementById('restoreDetailList');
const restoreAddDetailBtn = document.getElementById('restoreAddDetailBtn');
const restoreInclCols = document.getElementById('restoreInclCols');
const restoreNullifyId = document.getElementById('restoreNullifyId');
const restoreGenerateBtn = document.getElementById('restoreGenerateBtn');

// Elemen status & output
const restoreStatus = document.getElementById('restoreStatus');
const restoreOutputWrap = document.getElementById('restoreOutputWrap');
const restoreOutput = document.getElementById('restoreOutput');
const restoreCopyBtn = document.getElementById('restoreCopyBtn');
const restoreDownloadBtn = document.getElementById('restoreDownloadBtn');

// SQL hasil generate terakhir (untuk copy/download)
let restoreGeneratedSql = '';

// --- Baris detail dinamis (json key + nama tabel) ---
function createRestoreDetailRow(keyVal, tableVal) {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 restore-detail-row';
    row.innerHTML = `
        <input type="text" placeholder="json key (e.g. Details)"
            class="rd-key w-1/3 shrink-0 p-2.5 bg-black/50 border border-zinc-700 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm text-emerald-300 caret-emerald-400 placeholder:text-zinc-600 transition-all">
        <input type="text" placeholder="table name (e.g. tr_memorialjournaldetail)"
            class="rd-table flex-grow min-w-0 p-2.5 bg-black/50 border border-zinc-700 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm text-emerald-300 caret-emerald-400 placeholder:text-zinc-600 transition-all">
        <button type="button" title="Remove"
            class="rd-remove flex items-center justify-center w-10 h-10 shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;
    row.querySelector('.rd-key').value = keyVal || '';
    row.querySelector('.rd-table').value = tableVal || '';
    row.querySelector('.rd-remove').addEventListener('click', () => row.remove());
    restoreDetailList.appendChild(row);
    lucide.createIcons();
}

// --- Upload file .json -> isi ke textarea (paste tetap bisa) ---
restoreJsonFile.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        restoreJsonInput.value = ev.target.result;
        showRestoreStatus(`Loaded "${file.name}". Review the JSON below, then generate.`, 'success');
    };
    reader.onerror = function () {
        showRestoreStatus('Failed to read the file.', 'error');
    };
    reader.readAsText(file);
    // Reset agar file yang sama bisa diupload ulang
    e.target.value = '';
});

restoreAddDetailBtn.addEventListener('click', () => createRestoreDetailRow('', ''));

// Baris detail awal (contoh umum: Details)
createRestoreDetailRow('Details', '');

// Baca daftar detail -> [{ key, table }]
function readRestoreDetails() {
    const result = [];
    restoreDetailList.querySelectorAll('.restore-detail-row').forEach(row => {
        const key = row.querySelector('.rd-key').value.trim();
        const table = row.querySelector('.rd-table').value.trim();
        if (key !== '' && table !== '') {
            result.push({ key, table });
        }
    });
    return result;
}

// --- Helper format ---

// Nama kolom selalu camelCase, kecuali "ID" selalu kapital (branchID, currencyID)
function toRestoreColumnName(key) {
    if (/^id$/i.test(key)) return 'ID';
    let name = key.charAt(0).toLowerCase() + key.slice(1);
    // "...Id" -> "...ID" (jika input pakai Id, bukan ID)
    name = name.replace(/Id(?=[A-Z0-9]|$)/g, 'ID');
    return name;
}

// Format angka apa adanya, hindari notasi ilmiah untuk ukuran wajar
function formatRestoreNumber(n) {
    return String(n);
}

// Deteksi & format string tanggal ISO. Return null jika bukan tanggal.
// "...T00:00:00..." -> 'YYYY-MM-DD' ; selain itu -> 'YYYY-MM-DD HH:MM:SS'
function formatRestoreDate(s) {
    const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(s);
    if (!m) return null;
    if (!m[2] || m[2] === '00:00:00') return m[1];
    return m[1] + ' ' + m[2];
}

// Ubah sebuah nilai JSON menjadi literal SQL
function toRestoreSqlValue(key, val, nullifyId) {
    // Kolom identity "ID" di-null-kan untuk keperluan restore
    if (nullifyId && /^id$/i.test(key)) return 'null';
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'number') return formatRestoreNumber(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'string') {
        const d = formatRestoreDate(val);
        const text = d !== null ? d : val;
        return `'${text.replace(/'/g, "''")}'`;
    }
    // Array/object bersarang di dalam kolom -> simpan sebagai JSON string
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
}

// Ambil key head: field root yang bukan array, bukan object, dan bukan key detail
function getRestoreHeadKeys(obj, detailKeys) {
    return Object.keys(obj).filter(k => {
        if (detailKeys.includes(k)) return false;
        const v = obj[k];
        if (Array.isArray(v)) return false;
        if (v !== null && typeof v === 'object') return false;
        return true;
    });
}

// Bangun satu blok insert.
// - Pakai nama kolom  -> INSERT INTO t (cols) VALUES (..), (..);
// - Tanpa nama kolom  -> INSERT INTO t SELECT .. UNION ALL SELECT ..;
function buildRestoreInsert(table, colKeys, rows, inclCols, nullifyId) {
    const rowLiterals = rows.map(obj =>
        colKeys.map(k => toRestoreSqlValue(k, obj[k], nullifyId)).join(', ')
    );

    if (inclCols) {
        const cols = colKeys.map(toRestoreColumnName).join(', ');
        const valuesClause = rowLiterals.map(v => `(${v})`).join(',\n');
        return `insert into ${table} (${cols})\nvalues\n${valuesClause};`;
    }

    const selects = rowLiterals.map(v => 'select \n' + v);
    return `insert into ${table}\n` + selects.join(' union all\n') + ';';
}

// --- Generate ---
restoreGenerateBtn.addEventListener('click', function () {
    const raw = restoreJsonInput.value.trim();
    if (!raw) {
        showRestoreStatus('Please paste JSON first.', 'error');
        return;
    }

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        showRestoreStatus('Invalid JSON: ' + err.message, 'error');
        return;
    }

    // Normalkan ke daftar record object
    let records = Array.isArray(parsed) ? parsed : [parsed];
    records = records.filter(r => r && typeof r === 'object' && !Array.isArray(r));
    if (records.length === 0) {
        showRestoreStatus('JSON must be an object or an array of objects.', 'error');
        return;
    }

    const headTable = restoreHeadTable.value.trim();
    if (!headTable) {
        showRestoreStatus('Please fill in the head table name.', 'error');
        return;
    }

    const details = readRestoreDetails();
    const detailKeys = details.map(d => d.key);
    const inclCols = restoreInclCols.checked;
    const nullifyId = restoreNullifyId.checked;

    // Validasi: tiap key detail harus ada di JSON
    for (const d of details) {
        const exists = records.some(rec => Object.prototype.hasOwnProperty.call(rec, d.key));
        if (!exists) {
            showRestoreStatus(`Key "${d.key}" was not found in the JSON.`, 'error');
            return;
        }
    }

    const statements = [];

    // Head
    const headKeys = getRestoreHeadKeys(records[0], detailKeys);
    if (headKeys.length === 0) {
        showRestoreStatus('No non-array fields found for the head table.', 'error');
        return;
    }
    statements.push(buildRestoreInsert(headTable, headKeys, records, inclCols, nullifyId));

    // Detail (gabungkan elemen array dari semua record)
    const skipped = [];
    for (const d of details) {
        const detailRows = [];
        records.forEach(rec => {
            const v = rec[d.key];
            if (Array.isArray(v)) {
                v.forEach(el => { if (el && typeof el === 'object' && !Array.isArray(el)) detailRows.push(el); });
            } else if (v && typeof v === 'object') {
                detailRows.push(v);
            }
        });
        if (detailRows.length === 0) {
            skipped.push(d.key);
            continue;
        }
        const detailCols = Object.keys(detailRows[0]);
        statements.push(buildRestoreInsert(d.table, detailCols, detailRows, inclCols, nullifyId));
    }

    restoreGeneratedSql = statements.join('\n\n');
    restoreOutput.value = restoreGeneratedSql;
    restoreOutputWrap.classList.remove('hidden');

    let msg = `Generated ${statements.length} insert block(s).`;
    if (skipped.length) msg += ` Skipped empty detail key(s): ${skipped.join(', ')}.`;
    showRestoreStatus(msg, 'success');
});

// --- Copy & Download ---
restoreCopyBtn.addEventListener('click', function () {
    if (!restoreGeneratedSql) return;
    handleClipboardCopy(restoreGeneratedSql, restoreCopyBtn, 'copy sql', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});

restoreDownloadBtn.addEventListener('click', function () {
    if (!restoreGeneratedSql) return;
    const table = restoreHeadTable.value.trim() || 'restore';
    downloadTextFile(restoreGeneratedSql, `${table}_restore.sql`);
});

// --- Helper: status & download ---
function showRestoreStatus(message, type) {
    restoreStatus.textContent = message;
    restoreStatus.className = 'text-sm font-semibold px-4 py-3 rounded-md flex items-center gap-2 ' + (
        type === 'error'
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    );
    restoreStatus.classList.remove('hidden');
}

function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
