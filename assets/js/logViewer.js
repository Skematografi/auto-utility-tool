// ----------------------------------------
// TAB 13: LOG VIEWER LOGIC
// Parse application logs into a searchable table.
// Expected line shape (extra bracket fields are tolerated):
//   2026-07-25 11:06:39 [ip][user][session][level][category] message
// A line that does not start with a timestamp is treated as a continuation of
// the previous entry, so multi-line dumps stay attached to their entry.
// ----------------------------------------
const logFileInput = document.getElementById('logFileInput');
const logInput = document.getElementById('logInput');
const logSearch = document.getElementById('logSearch');
const logLevel = document.getElementById('logLevel');
const logTotal = document.getElementById('logTotal');
const logShown = document.getElementById('logShown');
const logLevelCounts = document.getElementById('logLevelCounts');
const logTableBody = document.getElementById('logTableBody');
const logEmpty = document.getElementById('logEmpty');
const logPager = document.getElementById('logPager');
const logPageInfo = document.getElementById('logPageInfo');
const logPerPage = document.getElementById('logPerPage');
const logPrevBtn = document.getElementById('logPrevBtn');
const logNextBtn = document.getElementById('logNextBtn');

// Entry start: timestamp followed by bracketed fields
const LOG_ENTRY_RE = /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2})\s*((?:\[[^\]]*\])+)\s?([\s\S]*)$/;
const LOG_PREVIEW_CHARS = 160;

let logEntries = [];      // every parsed entry
let logFiltered = [];     // entries matching the current search/level
let logPage = 1;
let logSearchTimer = null;

// --- Parsing -------------------------------------------------

function parseLog(text) {
    const lines = text.split(/\r?\n/);
    const entries = [];
    let current = null;

    for (const line of lines) {
        const match = LOG_ENTRY_RE.exec(line);
        if (match) {
            if (current) entries.push(current);
            // Bracketed fields: the last two are level + category, the first is the IP
            const fields = match[2].slice(1, -1).split('][');
            const level = fields.length >= 2 ? fields[fields.length - 2] : '';
            const category = fields.length >= 1 ? fields[fields.length - 1] : '';
            const ip = fields.length >= 3 ? fields[0] : '';
            const user = fields.length >= 4 ? fields[1] : '';
            current = {
                time: match[1],
                ip: ip,
                user: user,
                level: level.toLowerCase(),
                category: category,
                message: match[3] || '',
            };
        } else if (current) {
            current.message += '\n' + line;
        } else if (line.trim() !== '') {
            // Text before the first timestamp: keep it as an untyped entry
            current = { time: '', ip: '', user: '', level: '', category: '', message: line };
        }
    }
    if (current) entries.push(current);

    // Pre-compute a lowercase haystack so searching stays fast on large files
    entries.forEach(function (e) {
        e.message = e.message.replace(/\s+$/, '');
        e.search = (e.time + ' ' + e.ip + ' ' + e.user + ' ' + e.level + ' ' +
            e.category + ' ' + e.message).toLowerCase();
    });
    return entries;
}

// --- Rendering -----------------------------------------------

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Highlight the search term inside already-escaped text
function highlight(escaped, term) {
    if (!term) return escaped;
    const safe = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(safe, 'gi'), function (m) {
        return `<mark class="bg-amber-400/30 text-amber-200 rounded px-0.5">${m}</mark>`;
    });
}

const LEVEL_STYLES = {
    error: 'bg-red-500/15 text-red-400 border-red-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    trace: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

function levelBadge(level) {
    const style = LEVEL_STYLES[level] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    return `<span class="inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold ${style}">${escapeHtml(level || '—')}</span>`;
}

function renderTable() {
    const term = logSearch.value.trim();
    const perPage = parseInt(logPerPage.value, 10);
    const totalPages = Math.max(1, Math.ceil(logFiltered.length / perPage));
    if (logPage > totalPages) logPage = totalPages;

    const start = (logPage - 1) * perPage;
    const pageRows = logFiltered.slice(start, start + perPage);

    if (logFiltered.length === 0) {
        logTableBody.innerHTML = '';
        logEmpty.textContent = logEntries.length === 0
            ? 'Upload or paste a log to begin.'
            : 'No entries match the current search.';
        logEmpty.classList.remove('hidden');
        logPager.classList.add('hidden');
    } else {
        logEmpty.classList.add('hidden');
        logPager.classList.remove('hidden');

        logTableBody.innerHTML = pageRows.map(function (e, i) {
            const full = e.message;
            const isLong = full.length > LOG_PREVIEW_CHARS || full.indexOf('\n') !== -1;
            const preview = isLong
                ? full.slice(0, LOG_PREVIEW_CHARS).replace(/\n/g, ' ') + '…'
                : full;
            const index = start + i;
            return `<tr class="align-top hover:bg-zinc-800/40 transition-colors">
                <td class="px-3 py-2 whitespace-nowrap text-zinc-400">${highlight(escapeHtml(e.time), term)}</td>
                <td class="px-3 py-2 whitespace-nowrap">${levelBadge(e.level)}</td>
                <td class="px-3 py-2 whitespace-nowrap text-zinc-300">${highlight(escapeHtml(e.user || '—'), term)}</td>
                <td class="px-3 py-2 whitespace-nowrap text-zinc-500">${highlight(escapeHtml(e.ip || '—'), term)}</td>
                <td class="px-3 py-2 whitespace-nowrap text-zinc-400">${highlight(escapeHtml(e.category || '—'), term)}</td>
                <td class="px-3 py-2 text-zinc-300 break-all">
                    <span class="log-preview">${highlight(escapeHtml(preview), term)}</span>
                    ${isLong ? `<button type="button" data-log-index="${index}"
                        class="log-toggle ml-2 text-emerald-400 hover:text-emerald-300 text-xs font-bold cursor-pointer">show more</button>` : ''}
                </td>
            </tr>`;
        }).join('');
    }

    logShown.textContent = logFiltered.length;
    logPageInfo.textContent = logFiltered.length === 0
        ? ''
        : `page ${logPage} of ${totalPages} — showing ${start + 1}–${Math.min(start + perPage, logFiltered.length)} of ${logFiltered.length}`;
    logPrevBtn.disabled = logPage <= 1;
    logNextBtn.disabled = logPage >= totalPages;
    lucide.createIcons();
}

// Expand or collapse the full message of a row
logTableBody.addEventListener('click', function (event) {
    const btn = event.target.closest('.log-toggle');
    if (!btn) return;
    const entry = logFiltered[parseInt(btn.dataset.logIndex, 10)];
    if (!entry) return;

    const cell = btn.parentElement;
    const span = cell.querySelector('.log-preview');
    const expanded = btn.dataset.expanded === 'true';
    const term = logSearch.value.trim();

    if (expanded) {
        const preview = entry.message.slice(0, LOG_PREVIEW_CHARS).replace(/\n/g, ' ') + '…';
        span.innerHTML = highlight(escapeHtml(preview), term);
        btn.textContent = 'show more';
        btn.dataset.expanded = 'false';
    } else {
        span.innerHTML = `<pre class="whitespace-pre-wrap break-all text-xs leading-relaxed mt-1">${highlight(escapeHtml(entry.message), term)}</pre>`;
        btn.textContent = 'show less';
        btn.dataset.expanded = 'true';
    }
});

// --- Filtering -----------------------------------------------

function applyFilter() {
    const term = logSearch.value.trim().toLowerCase();
    const level = logLevel.value;

    logFiltered = logEntries.filter(function (e) {
        if (level && e.level !== level) return false;
        if (term && e.search.indexOf(term) === -1) return false;
        return true;
    });
    logPage = 1;
    renderTable();
}

function rebuildLevelFilter() {
    const counts = {};
    logEntries.forEach(function (e) {
        const key = e.level || '—';
        counts[key] = (counts[key] || 0) + 1;
    });

    // Level dropdown
    const previous = logLevel.value;
    logLevel.innerHTML = '<option value="">all levels</option>' +
        Object.keys(counts).sort().map(function (level) {
            const value = level === '—' ? '' : level;
            return `<option value="${escapeHtml(value)}">${escapeHtml(level)} (${counts[level]})</option>`;
        }).join('');
    if (previous) logLevel.value = previous;

    // Count badges
    logLevelCounts.innerHTML = Object.keys(counts).sort().map(function (level) {
        const style = LEVEL_STYLES[level] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
        return `<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${style}">
            <span class="text-xs font-semibold">${escapeHtml(level)}:</span>
            <span class="font-extrabold text-sm">${counts[level]}</span>
        </div>`;
    }).join('');
}

function loadLog(text) {
    logEntries = parseLog(text);
    logTotal.textContent = logEntries.length;
    rebuildLevelFilter();
    applyFilter();
}

// --- Events --------------------------------------------------

logFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        // Keep the textarea light: very large files are parsed without being pasted back
        const text = ev.target.result;
        logInput.value = text.length > 200000
            ? `# loaded "${file.name}" (${(file.size / 1048576).toFixed(2)} MB) — too large to preview here`
            : text;
        loadLog(text);
    };
    reader.readAsText(file);
    e.target.value = '';
});

logInput.addEventListener('input', function () {
    // Ignore the placeholder note shown for large uploads
    if (logInput.value.startsWith('# loaded "')) return;
    loadLog(logInput.value);
});

logSearch.addEventListener('input', function () {
    clearTimeout(logSearchTimer);
    logSearchTimer = setTimeout(applyFilter, 180);
});

logLevel.addEventListener('change', applyFilter);
logPerPage.addEventListener('change', function () { logPage = 1; renderTable(); });
logPrevBtn.addEventListener('click', function () { if (logPage > 1) { logPage--; renderTable(); } });
logNextBtn.addEventListener('click', function () { logPage++; renderTable(); });
