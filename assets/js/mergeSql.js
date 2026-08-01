// ----------------------------------------
// TAB 11: MERGE SQL LOGIC
// Upload multiple .sql files, merge them into one, with an optional
// comment-stripping pass and a per-file boundary comment (default: filename).
// ----------------------------------------
const mergeSqlFileInput = document.getElementById('mergeSqlFileInput');
const mergeSqlFileInfo = document.getElementById('mergeSqlFileInfo');
const mergeSqlFileCount = document.getElementById('mergeSqlFileCount');
const mergeSqlFileList = document.getElementById('mergeSqlFileList');
const mergeClearComments = document.getElementById('mergeClearComments');
const mergeBoundary = document.getElementById('mergeBoundary');
const generateMergeSqlBtn = document.getElementById('generateMergeSqlBtn');
const mergeSqlStatus = document.getElementById('mergeSqlStatus');
const mergeSqlPreviewWrap = document.getElementById('mergeSqlPreviewWrap');
const mergeSqlPreview = document.getElementById('mergeSqlPreview');
const copyMergeSqlBtn = document.getElementById('copyMergeSqlBtn');

let mergedSqlResult = '';

// Show the selected files (in the order they will be merged)
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

// Remove SQL comments while preserving string literals.
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

generateMergeSqlBtn.addEventListener('click', async function () {
    const files = [...mergeSqlFileInput.files];
    if (files.length === 0) {
        showMergeSqlStatus('Please upload one or more .sql files first.', 'error');
        return;
    }

    generateMergeSqlBtn.disabled = true;
    try {
        const clear = mergeClearComments.checked;
        const template = mergeBoundary.value;

        const parts = [];
        for (const file of files) {
            let body = await file.text();
            if (clear) body = stripSqlComments(body);
            body = tidy(body);
            const boundary = resolveBoundary(template, file.name);
            // Skip files that become empty after stripping, but still keep their boundary marker
            parts.push(body === '' ? boundary : `${boundary}\n${body}`);
        }

        mergedSqlResult = parts.join('\n\n') + '\n';
        mergeSqlPreview.value = mergedSqlResult;
        mergeSqlPreviewWrap.classList.remove('hidden');
        downloadMergedSql(mergedSqlResult, 'merged.sql');
        showMergeSqlStatus(`Merged ${files.length} file(s) into one .sql and downloaded.`, 'success');
    } catch (err) {
        console.error(err);
        showMergeSqlStatus('Failed to read one of the files.', 'error');
    } finally {
        generateMergeSqlBtn.disabled = false;
    }
});

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

function downloadMergedSql(content, filename) {
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
