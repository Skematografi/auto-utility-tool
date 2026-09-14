// ----------------------------------------
// TAB 11: MERGE FILES LOGIC
// Pick a file type (sql / csv-txt / excel), upload, and merge into one file.
// - sql & csv/txt: concatenate text files, optional comment-stripping,
//   per-file boundary comment, optional dedupe (csv/txt only).
// - excel: merge sheet (1 file, all sheets combined) or merge file
//   (multiple files, first sheet of each combined) — columns must match.
// ----------------------------------------
const mergeExtBtns = [...document.querySelectorAll('.merge-ext-btn')];
const mergeTextFields = document.getElementById('mergeTextFields');
const mergeExcelFields = document.getElementById('mergeExcelFields');

const mergeTextFilesLabel = document.getElementById('mergeTextFilesLabel');
const mergeTextUploadLabel = document.getElementById('mergeTextUploadLabel');
const mergeTextGenerateLabel = document.getElementById('mergeTextGenerateLabel');
const mergeUniqWrap = document.getElementById('mergeUniqWrap');
const mergeUniqOnly = document.getElementById('mergeUniqOnly');

const mergeSqlFileInput = document.getElementById('mergeSqlFileInput');
const mergeSqlFileInfo = document.getElementById('mergeSqlFileInfo');
const mergeSqlFileCount = document.getElementById('mergeSqlFileCount');
const mergeSqlFileList = document.getElementById('mergeSqlFileList');
const mergeClearComments = document.getElementById('mergeClearComments');
const mergeBoundary = document.getElementById('mergeBoundary');
const generateMergeSqlBtn = document.getElementById('generateMergeSqlBtn');

const mergeExcelModeBtns = [...document.querySelectorAll('.merge-excel-mode-btn')];
const mergeExcelModeHint = document.getElementById('mergeExcelModeHint');
const mergeExcelFilesLabel = document.getElementById('mergeExcelFilesLabel');
const mergeExcelUploadLabel = document.getElementById('mergeExcelUploadLabel');
const mergeExcelUploadSub = document.getElementById('mergeExcelUploadSub');
const mergeExcelFileInput = document.getElementById('mergeExcelFileInput');
const mergeExcelFileInfo = document.getElementById('mergeExcelFileInfo');
const mergeExcelFileCount = document.getElementById('mergeExcelFileCount');
const mergeExcelFileList = document.getElementById('mergeExcelFileList');
const mergeExcelUniqOnly = document.getElementById('mergeExcelUniqOnly');
const generateMergeExcelBtn = document.getElementById('generateMergeExcelBtn');

const mergeSqlStatus = document.getElementById('mergeSqlStatus');
const mergeSqlPreviewWrap = document.getElementById('mergeSqlPreviewWrap');
const mergeSqlPreview = document.getElementById('mergeSqlPreview');
const copyMergeSqlBtn = document.getElementById('copyMergeSqlBtn');

const MERGE_TOGGLE_ACTIVE = 'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer bg-zinc-800 text-emerald-400 ring-1 ring-emerald-500/40';
const MERGE_TOGGLE_INACTIVE = 'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50';

let mergeExt = 'sql'; // 'sql' | 'csv' | 'excel'
let mergeExcelMode = 'sheet'; // 'sheet' | 'file'
let mergedSqlResult = '';

// --- File type switch ---
mergeExtBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        setMergeExt(btn.dataset.ext);
    });
});

function setMergeExt(ext) {
    mergeExt = ext;
    mergeExtBtns.forEach(btn => {
        btn.className = 'merge-ext-btn ' + (btn.dataset.ext === ext ? MERGE_TOGGLE_ACTIVE : MERGE_TOGGLE_INACTIVE);
    });

    mergeTextFields.classList.toggle('hidden', ext === 'excel');
    mergeExcelFields.classList.toggle('hidden', ext !== 'excel');

    if (ext === 'sql') {
        mergeTextFilesLabel.textContent = 'sql_files (multiple)';
        mergeTextUploadLabel.textContent = 'click to upload one or more .sql files';
        mergeTextGenerateLabel.textContent = 'merge & download .sql';
        mergeSqlFileInput.accept = '.sql,text/plain';
        mergeUniqWrap.classList.add('hidden');
        mergeUniqWrap.classList.remove('flex');
    } else if (ext === 'csv') {
        mergeTextFilesLabel.textContent = 'csv_txt_files (multiple)';
        mergeTextUploadLabel.textContent = 'click to upload one or more .csv/.txt files';
        mergeTextGenerateLabel.textContent = 'merge & download';
        mergeSqlFileInput.accept = '.csv,.txt,text/csv,text/plain';
        mergeUniqWrap.classList.remove('hidden');
        mergeUniqWrap.classList.add('flex');
    }

    resetMergeUi();
}

// --- Excel sub-mode switch ---
mergeExcelModeBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        setMergeExcelMode(btn.dataset.mode);
    });
});

function setMergeExcelMode(mode) {
    mergeExcelMode = mode;
    mergeExcelModeBtns.forEach(btn => {
        btn.className = 'merge-excel-mode-btn ' + (btn.dataset.mode === mode ? MERGE_TOGGLE_ACTIVE : MERGE_TOGGLE_INACTIVE);
    });

    if (mode === 'sheet') {
        mergeExcelFileInput.removeAttribute('multiple');
        mergeExcelFilesLabel.textContent = 'excel_file';
        mergeExcelUploadLabel.textContent = 'click to upload an Excel file';
        mergeExcelUploadSub.textContent = "every sheet's columns must match — header taken from the first sheet";
        mergeExcelModeHint.textContent = '1 file, every sheet merged into one — all sheets must have the same column count & titles.';
    } else {
        mergeExcelFileInput.setAttribute('multiple', 'multiple');
        mergeExcelFilesLabel.textContent = 'excel_files (multiple)';
        mergeExcelUploadLabel.textContent = 'click to upload one or more Excel files';
        mergeExcelUploadSub.textContent = "each file's first sheet is used — columns must match, header taken from the first file";
        mergeExcelModeHint.textContent = 'multiple files, first sheet of each merged into one — columns must match across files.';
    }

    resetMergeUi();
}

function resetMergeUi() {
    mergeSqlFileInput.value = '';
    mergeSqlFileInfo.classList.add('hidden');
    mergeExcelFileInput.value = '';
    mergeExcelFileInfo.classList.add('hidden');
    mergeSqlStatus.classList.add('hidden');
    mergeSqlPreviewWrap.classList.add('hidden');
    mergedSqlResult = '';
}

// Show the selected text files (in the order they will be merged)
mergeSqlFileInput.addEventListener('change', function () {
    const files = [...mergeSqlFileInput.files];
    if (files.length === 0) {
        mergeSqlFileInfo.classList.add('hidden');
        return;
    }
    mergeSqlFileCount.textContent = files.length;
    mergeSqlFileList.textContent = files.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
    mergeSqlFileInfo.classList.remove('hidden');
    lucide.createIcons();
});

// Show the selected excel file(s)
mergeExcelFileInput.addEventListener('change', function () {
    const files = [...mergeExcelFileInput.files];
    if (files.length === 0) {
        mergeExcelFileInfo.classList.add('hidden');
        return;
    }
    mergeExcelFileCount.textContent = files.length;
    mergeExcelFileList.textContent = files.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
    mergeExcelFileInfo.classList.remove('hidden');
    lucide.createIcons();
});

// Remove SQL-style comments while preserving string literals.
// Handles line comments (-- and #) and block comments (/* ... */).
function stripSqlComments(sql) {
    let out = '';
    const n = sql.length;
    let i = 0;
    while (i < n) {
        const c = sql[i];
        const c2 = sql[i + 1];

        // String literal: copy verbatim (respect doubled-quote escaping)
        if (c === "'" || c === '"') {
            const quote = c;
            out += c;
            i++;
            while (i < n) {
                out += sql[i];
                if (sql[i] === quote) {
                    if (sql[i + 1] === quote) { out += sql[i + 1]; i += 2; continue; }
                    i++;
                    break;
                }
                i++;
            }
            continue;
        }

        // Line comment: -- ... or # ...  (keep the newline)
        if ((c === '-' && c2 === '-') || c === '#') {
            while (i < n && sql[i] !== '\n') i++;
            continue;
        }

        // Block comment: /* ... */
        if (c === '/' && c2 === '*') {
            i += 2;
            while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
            i += 2;
            continue;
        }

        out += c;
        i++;
    }
    return out;
}

// Tidy up whitespace left behind (trailing spaces, excess blank lines)
function tidy(sql) {
    return sql
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// Build the boundary comment for a file.
// - empty template     -> "-- <filename>"
// - "{filename}" token  -> replaced with the actual filename
// - if the text is not already a comment, it is prefixed with "-- "
function resolveBoundary(template, filename) {
    const t = (template || '').trim();
    if (t === '') return `-- ${filename}`;
    let text = t.replace(/\{filename\}/g, filename);
    if (!/^\s*(--|#|\/\*)/.test(text)) text = '-- ' + text;
    return text;
}

function fileExt(filename) {
    const dot = filename.lastIndexOf('.');
    return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : '';
}

// --- SQL / CSV-TXT merge ---
generateMergeSqlBtn.addEventListener('click', async function () {
    const files = [...mergeSqlFileInput.files];
    if (files.length === 0) {
        showMergeSqlStatus('Please upload one or more files first.', 'error');
        return;
    }

    generateMergeSqlBtn.disabled = true;
    try {
        const clear = mergeClearComments.checked;
        const template = mergeBoundary.value;
        const uniq = mergeExt === 'csv' && mergeUniqOnly.checked;

        const fileBodies = [];
        for (const file of files) {
            let body = await file.text();
            if (clear) body = stripSqlComments(body);
            body = tidy(body);
            fileBodies.push({ name: file.name, body });
        }

        // Global dedupe across all files' lines, keeping first occurrence order
        if (uniq) {
            const seen = new Set();
            for (const entry of fileBodies) {
                if (entry.body === '') continue;
                const keptLines = entry.body.split('\n').filter(line => {
                    const key = line.trim();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                entry.body = keptLines.join('\n');
            }
        }

        const parts = fileBodies.map(entry => {
            const boundary = resolveBoundary(template, entry.name);
            return entry.body === '' ? boundary : `${boundary}\n${entry.body}`;
        });

        mergedSqlResult = parts.join('\n\n') + '\n';
        mergeSqlPreview.value = mergedSqlResult;
        mergeSqlPreviewWrap.classList.remove('hidden');

        const outExt = mergeExt === 'sql' ? 'sql' : (fileExt(files[0].name) || 'txt');
        const timestamp = mergeTimestamp();
        downloadMergeBlob(new Blob([mergedSqlResult], { type: 'text/plain;charset=utf-8' }), `DataDev-Utilities-merge-${timestamp}.${outExt}`);
        showMergeSqlStatus(`Merged ${files.length} file(s) into one .${outExt} and downloaded.`, 'success');
    } catch (err) {
        console.error(err);
        showMergeSqlStatus('Failed to read one of the files.', 'error');
    } finally {
        generateMergeSqlBtn.disabled = false;
    }
});

// --- Excel merge ---
generateMergeExcelBtn.addEventListener('click', async function () {
    const files = [...mergeExcelFileInput.files];
    if (files.length === 0) {
        showMergeSqlStatus(mergeExcelMode === 'sheet' ? 'Please upload an Excel file first.' : 'Please upload one or more Excel files first.', 'error');
        return;
    }
    if (mergeExcelMode === 'sheet' && files.length > 1) {
        showMergeSqlStatus('Merge sheet mode takes exactly one Excel file.', 'error');
        return;
    }

    generateMergeExcelBtn.disabled = true;
    try {
        const sources = mergeExcelMode === 'sheet'
            ? await readWorkbookSheets(files[0])
            : await readFirstSheetPerFile(files);

        if (sources.error) {
            showMergeSqlStatus(sources.error, 'error');
            return;
        }
        if (sources.list.length === 0) {
            showMergeSqlStatus('No sheet data found in the uploaded file(s).', 'error');
            return;
        }

        const header = sources.list[0].header;
        for (let i = 1; i < sources.list.length; i++) {
            const other = sources.list[i];
            if (!headersMatch(header, other.header)) {
                const noun = mergeExcelMode === 'sheet' ? 'Sheet' : 'File';
                showMergeSqlStatus(`${noun} "${other.name}" columns don't match "${sources.list[0].name}" — check column count & titles.`, 'error');
                return;
            }
        }

        let rows = [];
        sources.list.forEach(entry => rows.push(...entry.rows));

        if (mergeExcelUniqOnly.checked) {
            const seen = new Set();
            rows = rows.filter(row => {
                const key = row.join('');
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

        mergeSqlPreviewWrap.classList.add('hidden');
        const timestamp = mergeTimestamp();
        downloadMergeBlob(new Blob([buffer], { type: 'application/octet-stream' }), `DataDev-Utilities-merge-${timestamp}.xlsx`);
        const noun = mergeExcelMode === 'sheet' ? `${sources.list.length} sheet(s)` : `${sources.list.length} file(s)`;
        showMergeSqlStatus(`Merged ${noun} into one .xlsx (${rows.length} row(s)) and downloaded.`, 'success');
    } catch (err) {
        console.error(err);
        showMergeSqlStatus('Failed to read one of the Excel files.', 'error');
    } finally {
        generateMergeExcelBtn.disabled = false;
    }
});

// Read every sheet of a single workbook file -> [{ name, header, rows }]
function readWorkbookSheets(file) {
    return readAsWorkbook(file).then(workbook => {
        const list = workbook.SheetNames.map(name => sheetToTable(workbook.Sheets[name], name));
        return { list };
    }).catch(() => ({ error: `Failed to read "${file.name}".` }));
}

// Read only the first sheet of each uploaded file -> [{ name, header, rows }]
async function readFirstSheetPerFile(files) {
    const list = [];
    for (const file of files) {
        try {
            const workbook = await readAsWorkbook(file);
            const firstSheetName = workbook.SheetNames[0];
            list.push(sheetToTable(workbook.Sheets[firstSheetName], file.name));
        } catch {
            return { error: `Failed to read "${file.name}".` };
        }
    }
    return { list };
}

function readAsWorkbook(file) {
    return file.arrayBuffer().then(buf => XLSX.read(buf, { type: 'array' }));
}

// Convert a worksheet into { name, header, rows } — rows are padded to the header length
function sheetToTable(sheet, name) {
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    const header = (aoa[0] || []).map(h => (h === undefined || h === null) ? '' : String(h));
    const rows = aoa.slice(1)
        .filter(row => row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''))
        .map(row => padRow(row, header.length));
    return { name, header, rows };
}

function padRow(row, length) {
    const out = row.slice(0, length).map(cell => (cell === undefined || cell === null) ? '' : cell);
    while (out.length < length) out.push('');
    return out;
}

function headersMatch(a, b) {
    if (a.length !== b.length) return false;
    return a.every((h, i) => h.trim() === b[i].trim());
}

copyMergeSqlBtn.addEventListener('click', function () {
    if (!mergedSqlResult) return;
    handleClipboardCopy(mergedSqlResult, copyMergeSqlBtn, 'copy', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});

function showMergeSqlStatus(message, type) {
    mergeSqlStatus.textContent = message;
    mergeSqlStatus.className = 'text-sm font-semibold px-4 py-3 rounded-md flex items-center gap-2 ' + (
        type === 'error'
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    );
    mergeSqlStatus.classList.remove('hidden');
}

function mergeTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

function downloadMergeBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
