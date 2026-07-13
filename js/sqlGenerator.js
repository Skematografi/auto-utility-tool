// ----------------------------------------
// TAB 5: SQL GENERATOR LOGIC
// ----------------------------------------

// Elemen Upload & Info File
const sqlFileInput = document.getElementById('sqlFileInput');
const sqlFileInfo = document.getElementById('sqlFileInfo');
const sqlFileSummary = document.getElementById('sqlFileSummary');
const sqlColumnList = document.getElementById('sqlColumnList');

// Elemen Mode Toggle
const sqlModeDeleteBtn = document.getElementById('sqlModeDeleteBtn');
const sqlModeUpdateBtn = document.getElementById('sqlModeUpdateBtn');
const sqlDeletePanel = document.getElementById('sqlDeletePanel');
const sqlUpdatePanel = document.getElementById('sqlUpdatePanel');

// Elemen Panel Delete
const deleteTableName = document.getElementById('deleteTableName');
const deleteWhereList = document.getElementById('deleteWhereList');
const deleteAddWhereBtn = document.getElementById('deleteAddWhereBtn');
const generateDeleteBtn = document.getElementById('generateDeleteBtn');

// Elemen Panel Update
const updateTableName = document.getElementById('updateTableName');
const updateSetList = document.getElementById('updateSetList');
const updateWhereList = document.getElementById('updateWhereList');
const updateAddSetBtn = document.getElementById('updateAddSetBtn');
const updateAddWhereBtn = document.getElementById('updateAddWhereBtn');
const generateUpdateBtn = document.getElementById('generateUpdateBtn');

// Elemen Status & Preview
const sqlStatus = document.getElementById('sqlStatus');
const sqlPreviewWrap = document.getElementById('sqlPreviewWrap');
const sqlPreview = document.getElementById('sqlPreview');

// State data hasil parsing file
let sqlData = { headers: [], rows: [] };

// --- Membaca file Excel / CSV ---
sqlFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            const workbook = XLSX.read(evt.target.result, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            // header:1 -> array of arrays; defval agar sel kosong tidak dilewati
            const aoa = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false });

            if (!aoa.length) {
                showSqlStatus('The uploaded file appears to be empty.', 'error');
                sqlData = { headers: [], rows: [] };
                sqlFileInfo.classList.add('hidden');
                return;
            }

            sqlData.headers = aoa[0].map(h => (h === undefined || h === null) ? '' : String(h));
            // Buang baris yang benar-benar kosong seluruhnya
            sqlData.rows = aoa.slice(1).filter(row =>
                row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')
            );

            renderColumnPreview();
            showSqlStatus(`File loaded: "${file.name}".`, 'success');
        } catch (err) {
            console.error(err);
            showSqlStatus('Failed to read the file. Make sure it is a valid Excel/CSV.', 'error');
            sqlData = { headers: [], rows: [] };
            sqlFileInfo.classList.add('hidden');
        }
    };
    reader.readAsArrayBuffer(file);
});

function renderColumnPreview() {
    sqlFileSummary.textContent = `${sqlData.headers.length} columns, ${sqlData.rows.length} data rows`;
    sqlColumnList.textContent = sqlData.headers
        .map((h, i) => `${i + 1} → ${h !== '' ? h : '(no header)'}`)
        .join('\n');
    sqlFileInfo.classList.remove('hidden');
    lucide.createIcons();
}

// --- Mode Toggle Delete / Update ---
sqlModeDeleteBtn.addEventListener('click', () => switchSqlMode('delete'));
sqlModeUpdateBtn.addEventListener('click', () => switchSqlMode('update'));

function switchSqlMode(mode) {
    const activeClass = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer bg-white text-purple-600 shadow-sm";
    const inactiveClass = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer text-gray-500 hover:text-gray-900";

    if (mode === 'delete') {
        sqlModeDeleteBtn.className = activeClass;
        sqlModeUpdateBtn.className = inactiveClass;
        sqlDeletePanel.classList.remove('hidden');
        sqlUpdatePanel.classList.add('hidden');
    } else {
        sqlModeUpdateBtn.className = activeClass;
        sqlModeDeleteBtn.className = inactiveClass;
        sqlUpdatePanel.classList.remove('hidden');
        sqlDeletePanel.classList.add('hidden');
    }
    lucide.createIcons();
}

// --- Baris kondisi dinamis (index kolom + nama kolom SQL) ---
function createConditionRow(container, placeholder) {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 condition-row';
    row.innerHTML = `
        <input type="number" min="1" placeholder="Idx"
            class="cond-index w-20 p-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none text-sm font-mono transition-all">
        <input type="text" placeholder="${placeholder}"
            class="cond-name flex-grow p-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none text-sm font-mono transition-all">
        <button type="button" title="Remove"
            class="cond-remove flex items-center justify-center w-10 h-10 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;
    row.querySelector('.cond-remove').addEventListener('click', function () {
        // Selalu sisakan minimal 1 baris
        if (container.querySelectorAll('.condition-row').length > 1) {
            row.remove();
        }
    });
    container.appendChild(row);
    lucide.createIcons();
}

// Membaca kondisi dari sebuah container -> [{ index, name }]
function readConditions(container) {
    const result = [];
    container.querySelectorAll('.condition-row').forEach(row => {
        const idx = row.querySelector('.cond-index').value.trim();
        const name = row.querySelector('.cond-name').value.trim();
        if (idx !== '' && name !== '') {
            result.push({ index: parseInt(idx, 10), name: name });
        }
    });
    return result;
}

deleteAddWhereBtn.addEventListener('click', () => createConditionRow(deleteWhereList, 'DB column name (e.g. productCode)'));
updateAddSetBtn.addEventListener('click', () => createConditionRow(updateSetList, 'DB column to SET (e.g. productCode)'));
updateAddWhereBtn.addEventListener('click', () => createConditionRow(updateWhereList, 'DB column name (e.g. productID)'));

// Inisialisasi minimal 1 baris kondisi di tiap list
createConditionRow(deleteWhereList, 'DB column name (e.g. productCode)');
createConditionRow(updateSetList, 'DB column to SET (e.g. productCode)');
createConditionRow(updateWhereList, 'DB column name (e.g. productID)');

// --- Helper format nilai SQL ---
function isNumericValue(val) {
    const s = String(val).trim();
    if (s === '') return false;
    return /^-?\d+(\.\d+)?$/.test(s);
}

// Aturan kutip:
// - default string dibungkus kutip 1
// - jika nilai mengandung kutip 1 (dan tidak ada kutip 2) -> bungkus kutip 2
// - jika nilai mengandung kutip 2 (dan tidak ada kutip 1) -> bungkus kutip 1
// - jika keduanya ada -> escape kutip 1 dengan menggandakannya, bungkus kutip 1
function formatSqlValue(val) {
    if (val === undefined || val === null || String(val).trim() === '') {
        return 'NULL';
    }
    const s = String(val).trim();
    if (isNumericValue(s)) {
        return s;
    }
    const hasSingle = s.includes("'");
    const hasDouble = s.includes('"');

    if (hasSingle && !hasDouble) {
        return '"' + s + '"';
    } else if (hasDouble && !hasSingle) {
        return "'" + s + "'";
    } else if (hasSingle && hasDouble) {
        return "'" + s.replace(/'/g, "''") + "'";
    }
    return "'" + s + "'";
}

// Ambil nilai sel berdasarkan index kolom (1-based)
function getCell(row, index) {
    return row[index - 1];
}

function isEmptyCell(val) {
    return val === undefined || val === null || String(val).trim() === '';
}

// --- Generate SQL DELETE ---
generateDeleteBtn.addEventListener('click', function () {
    if (!validateFileLoaded()) return;

    const table = deleteTableName.value.trim();
    if (!table) {
        showSqlStatus('Please fill in the table name.', 'error');
        return;
    }

    const conditions = readConditions(deleteWhereList);
    if (conditions.length === 0) {
        showSqlStatus('Please provide at least 1 complete WHERE condition (index + column name).', 'error');
        return;
    }

    const clauses = [];
    for (const cond of conditions) {
        // Kumpulkan nilai kolom, buang yang kosong, lalu dedup per kolom
        const values = sqlData.rows
            .map(r => getCell(r, cond.index))
            .filter(v => !isEmptyCell(v))
            .map(v => String(v).trim());
        const unique = [...new Set(values)];

        if (unique.length === 0) {
            showSqlStatus(`Column index ${cond.index} ("${cond.name}") has no data.`, 'error');
            return;
        }

        const formatted = unique.map(formatSqlValue);
        if (unique.length === 1) {
            clauses.push(`${cond.name} = ${formatted[0]}`);
        } else {
            clauses.push(`${cond.name} in (${formatted.join(', ')})`);
        }
    }

    const sql = `Delete from ${table} where ${clauses.join(' and ')};`;
    sqlPreview.value = sql;
    sqlPreviewWrap.classList.remove('hidden');
    downloadSqlFile(sql, `delete_${table}.sql`);
    showSqlStatus('SQL Delete generated and downloaded successfully.', 'success');
});

// --- Generate SQL UPDATE ---
generateUpdateBtn.addEventListener('click', function () {
    if (!validateFileLoaded()) return;

    const table = updateTableName.value.trim();
    if (!table) {
        showSqlStatus('Please fill in the table name.', 'error');
        return;
    }

    const setConds = readConditions(updateSetList);
    const whereConds = readConditions(updateWhereList);
    if (setConds.length === 0) {
        showSqlStatus('Please provide at least 1 complete SET column (index + column name).', 'error');
        return;
    }
    if (whereConds.length === 0) {
        showSqlStatus('Please provide at least 1 complete WHERE condition (index + column name).', 'error');
        return;
    }

    // Kelompokkan baris berdasarkan kombinasi nilai SET yang identik.
    // Baris dengan SET sama namun WHERE berbeda bisa digabung memakai IN,
    // sedangkan SET berbeda menghasilkan statement terpisah (=).
    const groups = new Map();
    sqlData.rows.forEach(row => {
        const setParts = setConds.map(c => `${c.name} = ${formatSqlValue(getCell(row, c.index))}`);
        const setClause = setParts.join(', ');
        if (!groups.has(setClause)) groups.set(setClause, []);
        groups.get(setClause).push(row);
    });

    const statements = [];
    for (const [setClause, rows] of groups) {
        if (whereConds.length === 1) {
            const c = whereConds[0];
            const values = rows
                .map(r => getCell(r, c.index))
                .filter(v => !isEmptyCell(v))
                .map(v => String(v).trim());
            const unique = [...new Set(values)];
            if (unique.length === 0) continue;

            if (unique.length === 1) {
                statements.push(`update ${table} set ${setClause} where ${c.name} = ${formatSqlValue(unique[0])};`);
            } else {
                const formatted = unique.map(formatSqlValue);
                statements.push(`update ${table} set ${setClause} where ${c.name} in (${formatted.join(', ')});`);
            }
        } else {
            // Beberapa kolom WHERE: IN tidak bisa dipakai bersih, jadi buat statement per baris (=)
            rows.forEach(row => {
                const whereParts = whereConds.map(c => `${c.name} = ${formatSqlValue(getCell(row, c.index))}`);
                statements.push(`update ${table} set ${setClause} where ${whereParts.join(' and ')};`);
            });
        }
    }

    if (statements.length === 0) {
        showSqlStatus('No valid rows found to generate the update statements.', 'error');
        return;
    }

    const sql = statements.join('\n');
    sqlPreview.value = sql;
    sqlPreviewWrap.classList.remove('hidden');
    downloadSqlFile(sql, `update_${table}.sql`);
    showSqlStatus(`SQL Update generated (${statements.length} statement(s)) and downloaded successfully.`, 'success');
});

// --- Helper: validasi & status & download ---
function validateFileLoaded() {
    if (!sqlData.rows.length) {
        showSqlStatus('Please upload an Excel/CSV file with data first.', 'error');
        return false;
    }
    return true;
}

function showSqlStatus(message, type) {
    sqlStatus.textContent = message;
    sqlStatus.className = 'text-sm font-semibold px-4 py-3 rounded-xl ' + (
        type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
    );
    sqlStatus.classList.remove('hidden');
}

function downloadSqlFile(content, filename) {
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
