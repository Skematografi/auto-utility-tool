// ----------------------------------------
// TAB 5: SQL GENERATOR LOGIC
// ----------------------------------------

// File upload & info elements
const sqlFileInput = document.getElementById('sqlFileInput');
const sqlFileInfo = document.getElementById('sqlFileInfo');
const sqlFileSummary = document.getElementById('sqlFileSummary');
const sqlColumnList = document.getElementById('sqlColumnList');

// Mode toggle elements
const sqlModeDeleteBtn = document.getElementById('sqlModeDeleteBtn');
const sqlModeUpdateBtn = document.getElementById('sqlModeUpdateBtn');
const sqlModeTemplateBtn = document.getElementById('sqlModeTemplateBtn');
const sqlDeletePanel = document.getElementById('sqlDeletePanel');
const sqlUpdatePanel = document.getElementById('sqlUpdatePanel');
const sqlTemplatePanel = document.getElementById('sqlTemplatePanel');

// Template panel elements
const sqlTemplateInput = document.getElementById('sqlTemplateInput');
const generateTemplateBtn = document.getElementById('generateTemplateBtn');

// Delete panel elements
const deleteTableName = document.getElementById('deleteTableName');
const deleteWhereList = document.getElementById('deleteWhereList');
const deleteAddWhereBtn = document.getElementById('deleteAddWhereBtn');
const generateDeleteBtn = document.getElementById('generateDeleteBtn');

// Update panel elements
const updateTableName = document.getElementById('updateTableName');
const updateSetList = document.getElementById('updateSetList');
const updateWhereList = document.getElementById('updateWhereList');
const updateAddSetBtn = document.getElementById('updateAddSetBtn');
const updateAddWhereBtn = document.getElementById('updateAddWhereBtn');
const generateUpdateBtn = document.getElementById('generateUpdateBtn');

// Status & preview elements
const sqlStatus = document.getElementById('sqlStatus');
const sqlPreviewWrap = document.getElementById('sqlPreviewWrap');
const sqlPreview = document.getElementById('sqlPreview');

// Parsed file data state
let sqlData = { headers: [], rows: [] };

// --- Lenient delimiter fallback for malformed/oddly-quoted CSV ---
const DELIMITER_CANDIDATES = ['|', ';', '\t', ','];

function detectDelimiter(line) {
    let best = null;
    let bestCount = 1;
    DELIMITER_CANDIDATES.forEach(d => {
        const count = line.split(d).length;
        if (count > bestCount) {
            bestCount = count;
            best = d;
        }
    });
    return best;
}

function stripOuterQuotes(field) {
    return field.replace(/^"+/, '').replace(/"+$/, '');
}

function parseLenientDelimitedText(text) {
    const lines = text.split(/\r\n|\r|\n/).filter(line => line.trim() !== '');
    if (!lines.length) return [];
    const delimiter = detectDelimiter(lines[0]);
    if (!delimiter) return lines.map(line => [stripOuterQuotes(line)]);
    return lines.map(line => line.split(delimiter).map(stripOuterQuotes));
}

// --- Read Excel / CSV file ---
sqlFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const isCsv = /\.csv$/i.test(file.name);

    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            // raw:true for CSV: SheetJS otherwise "helpfully" auto-detects date-like text
            // and reformats it through a locale/timezone-dependent guess, corrupting the
            // original value. Keeping raw text lets our own date parsing below handle it
            // correctly. Real .xlsx/.xls cells carry an explicit stored format, so leave
            // those on the default parse (needed for the date-cell detection further down).
            const workbook = XLSX.read(evt.target.result, isCsv ? { type: 'array', raw: true } : { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            // header:1 -> array of arrays; defval keeps empty cells from being skipped
            let aoa = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false });

            // Some CSV exports wrap the whole delimited line in one outer quote pair
            // (e.g. `"branchID|""name""|..."`), which is valid-but-unusual CSV quoting
            // that SheetJS reads literally as a single column. Detect that and re-split
            // the raw text leniently on the real delimiter instead.
            if (aoa.length && aoa[0].length === 1 && typeof aoa[0][0] === 'string' && detectDelimiter(aoa[0][0])) {
                const text = new TextDecoder('utf-8').decode(evt.target.result);
                aoa = parseLenientDelimitedText(text);
            }

            if (!aoa.length) {
                showSqlStatus('The uploaded file appears to be empty.', 'error');
                sqlData = { headers: [], rows: [] };
                sqlFileInfo.classList.add('hidden');
                return;
            }

            normalizeDateCells(aoa, firstSheet);

            sqlData.headers = aoa[0].map(h => (h === undefined || h === null) ? '' : String(h));
            // Drop rows that are completely empty
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

// --- Mode Toggle Delete / Update / Template ---
sqlModeDeleteBtn.addEventListener('click', () => switchSqlMode('delete'));
sqlModeUpdateBtn.addEventListener('click', () => switchSqlMode('update'));
sqlModeTemplateBtn.addEventListener('click', () => switchSqlMode('template'));

function switchSqlMode(mode) {
    const activeClass = "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer bg-zinc-800 text-emerald-400 ring-1 ring-emerald-500/40";
    const inactiveClass = "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50";

    // Reset all buttons & panels
    sqlModeDeleteBtn.className = inactiveClass;
    sqlModeUpdateBtn.className = inactiveClass;
    sqlModeTemplateBtn.className = inactiveClass;
    sqlDeletePanel.classList.add('hidden');
    sqlUpdatePanel.classList.add('hidden');
    sqlTemplatePanel.classList.add('hidden');

    if (mode === 'update') {
        sqlModeUpdateBtn.className = activeClass;
        sqlUpdatePanel.classList.remove('hidden');
    } else if (mode === 'template') {
        sqlModeTemplateBtn.className = activeClass;
        sqlTemplatePanel.classList.remove('hidden');
    } else {
        sqlModeDeleteBtn.className = activeClass;
        sqlDeletePanel.classList.remove('hidden');
    }
    lucide.createIcons();
}

// --- Dynamic condition row (column index + SQL column name) ---
function createConditionRow(container, placeholder) {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 condition-row';
    row.innerHTML = `
        <input type="number" min="1" placeholder="idx"
            class="cond-index w-16 sm:w-20 shrink-0 p-2.5 bg-black/50 border border-zinc-700 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm text-emerald-300 caret-emerald-400 placeholder:text-zinc-600 transition-all">
        <input type="text" placeholder="${placeholder}"
            class="cond-name flex-grow min-w-0 p-2.5 bg-black/50 border border-zinc-700 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm text-emerald-300 caret-emerald-400 placeholder:text-zinc-600 transition-all">
        <button type="button" title="Remove"
            class="cond-remove flex items-center justify-center w-10 h-10 shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;
    row.querySelector('.cond-remove').addEventListener('click', function () {
        // Always keep at least 1 row
        if (container.querySelectorAll('.condition-row').length > 1) {
            row.remove();
        }
    });
    container.appendChild(row);
    lucide.createIcons();
}

// Read conditions from a container -> [{ index, name }]
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

deleteAddWhereBtn.addEventListener('click', () => createConditionRow(deleteWhereList, 'db column name (e.g. product_code)'));
updateAddSetBtn.addEventListener('click', () => createConditionRow(updateSetList, 'db column to SET (e.g. product_code)'));
updateAddWhereBtn.addEventListener('click', () => createConditionRow(updateWhereList, 'db column name (e.g. productId)'));

// Initialize at least 1 condition row in each list
createConditionRow(deleteWhereList, 'db column name (e.g. product_code)');
createConditionRow(updateSetList, 'db column to SET (e.g. product_code)');
createConditionRow(updateWhereList, 'db column name (e.g. productId)');

// --- Date/datetime detection & normalization ---
// Excel cells: detected via the cell's number format (cell.z), converted from the
// serial value with SSF so precision never round-trips through a JS Date.
// CSV/plain-text cells: no format metadata, so matched against known date patterns instead.
function looksLikeDateFormat(fmt) {
    if (!fmt || fmt === 'General') return false;
    const stripped = fmt.replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"/g, '');
    return /[ymdhs]/i.test(stripped) && !/^[0#.,%\s]+$/.test(stripped);
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatDateParts(y, mo, d, H, M, S) {
    const datePart = `${String(y).padStart(4, '0')}-${pad2(mo)}-${pad2(d)}`;
    if (H || M || S) {
        return `${datePart} ${pad2(H)}:${pad2(M)}:${pad2(S)}`;
    }
    return datePart;
}

function buildDateFromParts(y, mo, d, H, M, S) {
    y = parseInt(y, 10);
    mo = parseInt(mo, 10);
    d = parseInt(d, 10);
    H = H ? parseInt(H, 10) : 0;
    M = M ? parseInt(M, 10) : 0;
    S = S ? parseInt(S, 10) : 0;
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || H > 23 || M > 59 || S > 59) return null;
    return formatDateParts(y, mo, d, H, M, S);
}

// No format metadata on plain text, so ambiguous d/m vs m/d slashes are read as day-first (ID locale).
function tryParseDateString(val) {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    if (s === '') return null;

    let m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) return buildDateFromParts(m[1], m[2], m[3], m[4], m[5], m[6]);

    m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) return buildDateFromParts(m[3], m[2], m[1], m[4], m[5], m[6]);

    return null;
}

function formatExcelSerialDate(serial) {
    const dc = XLSX.SSF.parse_date_code(Number(serial));
    if (!dc) return null;
    return formatDateParts(dc.y, dc.m, dc.d, dc.H, dc.M, Math.round(dc.S || 0));
}

function formatJsDateUtc(date) {
    return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

function normalizeDateCell(val, cell) {
    if (cell && cell.t === 'n' && looksLikeDateFormat(cell.z)) {
        return formatExcelSerialDate(cell.v);
    }
    if (cell && cell.t === 'd' && cell.v instanceof Date) {
        return formatJsDateUtc(cell.v);
    }
    return tryParseDateString(val);
}

// Mutates the array-of-arrays in place, skipping the header row (index 0).
function normalizeDateCells(aoa, sheet) {
    aoa.forEach((row, r) => {
        if (r === 0) return;
        row.forEach((val, c) => {
            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
            const normalized = normalizeDateCell(val, cell);
            if (normalized !== null) {
                row[c] = normalized;
            }
        });
    });
}

// --- SQL value formatting helper ---
function isNumericValue(val) {
    const s = String(val).trim();
    if (s === '') return false;
    return /^-?\d+(\.\d+)?$/.test(s);
}

// Quoting rules:
// - by default strings are wrapped in single quotes
// - if the value contains a single quote (and no double quote) -> wrap in double quotes
// - if the value contains a double quote (and no single quote) -> wrap in single quotes
// - if both are present -> escape single quotes by doubling them, wrap in single quotes
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

// Get a cell value by column index (1-based)
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
        // Collect column values, drop empties, then dedupe per column
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
    downloadSqlFile(sql, buildSqlFilename('delete'));
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

    // Group rows by identical SET value combinations.
    // Rows with the same SET but different WHERE can be merged using IN,
    // while different SET values produce separate statements (=).
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
            // Multiple WHERE columns: IN cannot be used cleanly, so build one statement per row (=)
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
    downloadSqlFile(sql, buildSqlFilename('update'));
    showSqlStatus(`SQL Update generated (${statements.length} statement(s)) and downloaded successfully.`, 'success');
});

// --- Generate SQL from a TEMPLATE ---
// Placeholders {ColumnName} or {index} are filled with per-row values (auto-quoted by type).
// Useful for complex SQL (e.g. updating a detail table via join) that does not fit
// the structured delete/update patterns.
generateTemplateBtn.addEventListener('click', function () {
    if (!validateFileLoaded()) return;

    const template = sqlTemplateInput.value.trim();
    if (!template) {
        showSqlStatus('Please enter an SQL template.', 'error');
        return;
    }

    const tokenRe = /\{([^{}]+)\}/g;

    // Collect unique tokens & map them to column index (1-based). Names are case-insensitive.
    const tokens = new Set();
    let match;
    while ((match = tokenRe.exec(template)) !== null) {
        tokens.add(match[1].trim());
    }
    if (tokens.size === 0) {
        showSqlStatus('No placeholders found. Use {ColumnName} or {1} in the template.', 'error');
        return;
    }

    const tokenToIndex = {};
    for (const tok of tokens) {
        let index;
        if (/^\d+$/.test(tok)) {
            index = parseInt(tok, 10);
        } else {
            const found = sqlData.headers.findIndex(h => h.toLowerCase() === tok.toLowerCase());
            index = found === -1 ? -1 : found + 1;
        }
        if (index < 1 || index > sqlData.headers.length) {
            showSqlStatus(`Placeholder {${tok}} does not match any column.`, 'error');
            return;
        }
        tokenToIndex[tok] = index;
    }

    // Fill the template per row; drop identical results to avoid duplicates.
    const seen = new Set();
    const statements = [];
    sqlData.rows.forEach(row => {
        const stmt = template.replace(tokenRe, (whole, tok) =>
            formatSqlValue(getCell(row, tokenToIndex[tok.trim()]))
        );
        if (!seen.has(stmt)) {
            seen.add(stmt);
            statements.push(stmt);
        }
    });

    if (statements.length === 0) {
        showSqlStatus('No rows to generate.', 'error');
        return;
    }

    // A ";" in the template usually means multi-statement/multi-line output per row,
    // so add a blank line between rows to keep the generated SQL readable.
    const rowSeparator = template.includes(';') ? '\n\n' : '\n';
    const sql = statements.join(rowSeparator);
    sqlPreview.value = sql;
    sqlPreviewWrap.classList.remove('hidden');
    downloadSqlFile(sql, buildSqlFilename('template'));
    showSqlStatus(`SQL Template generated (${statements.length} statement(s)) and downloaded successfully.`, 'success');
});

// --- Helpers: validation, status & download ---
function validateFileLoaded() {
    if (!sqlData.rows.length) {
        showSqlStatus('Please upload an Excel/CSV file with data first.', 'error');
        return false;
    }
    return true;
}

function showSqlStatus(message, type) {
    sqlStatus.textContent = message;
    sqlStatus.className = 'text-sm font-semibold px-4 py-3 rounded-md flex items-center gap-2 ' + (
        type === 'error'
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    );
    sqlStatus.classList.remove('hidden');
}

function buildSqlFilename(mode) {
    const now = new Date();
    const ts = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
    return `DataDev-Utilities-${mode}-${ts}.sql`;
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
