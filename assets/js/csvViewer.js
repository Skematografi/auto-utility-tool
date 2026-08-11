// ----------------------------------------
// CSV VIEWER
// Paste or upload delimited data and browse it as a searchable, paginated,
// spreadsheet-style table. The first row is always treated as the header.
// Delimiter is configurable (comma / semicolon / pipe / tab / custom char);
// quoted fields (RFC4180-style: embedded delimiter/quotes/newlines) always work
// regardless of which delimiter character is chosen.
// ----------------------------------------
(function initCsvViewer() {
    const csvFileInput = document.getElementById('csvFileInput');
    const csvInput = document.getElementById('csvInput');
    if (!csvFileInput || !csvInput) return;

    const csvRowCount = document.getElementById('csvRowCount');
    const csvColCount = document.getElementById('csvColCount');
    const csvSearch = document.getElementById('csvSearch');
    const csvDelimiterPreset = document.getElementById('csvDelimiterPreset');
    const csvDelimiterCustom = document.getElementById('csvDelimiterCustom');
    const csvTableHead = document.getElementById('csvTableHead');
    const csvTableBody = document.getElementById('csvTableBody');
    const csvEmpty = document.getElementById('csvEmpty');
    const csvPager = document.getElementById('csvPager');
    const csvPageInfo = document.getElementById('csvPageInfo');
    const csvPerPage = document.getElementById('csvPerPage');
    const csvPrevBtn = document.getElementById('csvPrevBtn');
    const csvNextBtn = document.getElementById('csvNextBtn');
    const csvCopyBtn = document.getElementById('csvCopyBtn');

    const PRESET_DELIMS = { comma: ',', semicolon: ';', pipe: '|', tab: '\t' };

    let headers = [];
    let dataRows = [];
    let filtered = [];
    let columnFilters = [];
    let page = 1;
    let lastText = '';
    let searchTimer = null;

    function currentDelimiter() {
        if (csvDelimiterPreset.value === 'custom') return csvDelimiterCustom.value || ',';
        return PRESET_DELIMS[csvDelimiterPreset.value] || ',';
    }

    // --- Parsing ---------------------------------------------------

    function parseCsv(text, delim) {
        const rows = [];
        let row = [];
        let field = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inQuotes) {
                if (c === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; }
                    else inQuotes = false;
                } else {
                    field += c;
                }
            } else if (c === '"') {
                inQuotes = true;
            } else if (c === delim) {
                row.push(field);
                field = '';
            } else if (c === '\r') {
                // ignore, \n handles the line break
            } else if (c === '\n') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
            } else {
                field += c;
            }
        }
        if (field.length || row.length) {
            row.push(field);
            rows.push(row);
        }

        // Drop fully-blank trailing/interior lines from the pasted text
        return rows.filter((r) => r.length > 1 || r[0] !== '');
    }

    function csvField(value, delim) {
        const str = String(value ?? '');
        return new RegExp(`["\\n${delim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(str)
            ? '"' + str.replace(/"/g, '""') + '"'
            : str;
    }

    function toCsvText(cols, rows) {
        const delim = currentDelimiter();
        const lines = [cols.map((c) => csvField(c, delim)).join(delim)];
        rows.forEach((r) => lines.push(cols.map((_, i) => csvField(r[i], delim)).join(delim)));
        return lines.join('\n');
    }

    // --- Rendering ---------------------------------------------------

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function highlight(escaped, term) {
        if (!term) return escaped;
        const safe = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return escaped.replace(new RegExp(safe, 'gi'), (m) =>
            `<mark class="bg-amber-400/30 text-amber-200 rounded px-0.5">${m}</mark>`);
    }

    function renderHeader() {
        if (headers.length === 0) {
            csvTableHead.innerHTML = '';
            return;
        }
        const labelRow = '<tr>' +
            '<th class="px-2 py-2 border border-zinc-800 text-center w-10">#</th>' +
            headers.map((h) =>
                `<th class="px-3 py-2 font-semibold whitespace-nowrap border border-zinc-800">${escapeHtml(h || '—')}</th>`
            ).join('') + '</tr>';

        const filterRow = '<tr class="bg-zinc-900/30">' +
            '<th class="border border-zinc-800"></th>' +
            headers.map((h, i) =>
                `<th class="p-1 border border-zinc-800">
                    <input type="text" data-col-filter="${i}" placeholder="filter…"
                        class="w-full min-w-[90px] px-2 py-1 bg-black/40 border border-zinc-700 rounded text-xs font-normal text-emerald-300 caret-emerald-400 placeholder:text-zinc-600 outline-none focus:border-emerald-500">
                </th>`
            ).join('') + '</tr>';

        csvTableHead.innerHTML = labelRow + filterRow;
    }

    function renderTable() {
        const term = csvSearch.value.trim();
        const perPage = parseInt(csvPerPage.value, 10);
        const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
        if (page > totalPages) page = totalPages;
        const start = (page - 1) * perPage;
        const pageRows = filtered.slice(start, start + perPage);

        if (headers.length === 0) {
            csvTableBody.innerHTML = '';
            csvEmpty.textContent = 'Paste or upload delimited data to begin.';
            csvEmpty.classList.remove('hidden');
            csvPager.classList.add('hidden');
        } else if (filtered.length === 0) {
            csvTableBody.innerHTML = '';
            csvEmpty.textContent = dataRows.length === 0
                ? 'No data rows found (only a header row was detected).'
                : 'No rows match the current filter.';
            csvEmpty.classList.remove('hidden');
            csvPager.classList.add('hidden');
        } else {
            csvEmpty.classList.add('hidden');
            csvPager.classList.remove('hidden');
            csvTableBody.innerHTML = pageRows.map((row, i) =>
                '<tr class="hover:bg-zinc-800/40 transition-colors">' +
                `<td class="px-2 py-2 border border-zinc-800 bg-black/30 text-zinc-500 text-center">${start + i + 1}</td>` +
                headers.map((_, ci) =>
                    `<td class="px-3 py-2 border border-zinc-800 max-w-xs break-words text-zinc-300">${highlight(escapeHtml(row[ci] ?? ''), term)}</td>`
                ).join('') + '</tr>'
            ).join('');
        }

        csvPageInfo.textContent = filtered.length === 0
            ? ''
            : `page ${page} of ${totalPages} — showing ${start + 1}–${Math.min(start + perPage, filtered.length)} of ${filtered.length}`;
        csvPrevBtn.disabled = page <= 1;
        csvNextBtn.disabled = page >= totalPages;
        csvCopyBtn.disabled = filtered.length === 0;
    }

    // --- Filtering ---------------------------------------------------

    function applyFilter() {
        const term = csvSearch.value.trim().toLowerCase();

        filtered = dataRows.filter((row) => {
            if (term && !row.some((cell) => String(cell ?? '').toLowerCase().includes(term))) return false;
            for (let i = 0; i < columnFilters.length; i++) {
                const colTerm = columnFilters[i];
                if (colTerm && !String(row[i] ?? '').toLowerCase().includes(colTerm.toLowerCase())) return false;
            }
            return true;
        });
        page = 1;
        renderTable();
    }

    function loadCsv(text) {
        lastText = text;
        const rows = parseCsv(text, currentDelimiter());
        headers = rows.length ? rows[0] : [];
        dataRows = rows.slice(1);
        columnFilters = headers.map(() => '');
        csvRowCount.textContent = dataRows.length;
        csvColCount.textContent = headers.length;
        renderHeader();
        applyFilter();
    }

    // --- Events ---------------------------------------------------

    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            csvInput.value = text.length > 200000
                ? `# loaded "${file.name}" (${(file.size / 1048576).toFixed(2)} MB) — too large to preview here`
                : text;
            loadCsv(text);
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    csvInput.addEventListener('input', () => {
        if (csvInput.value.startsWith('# loaded "')) return;
        loadCsv(csvInput.value);
    });

    csvSearch.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(applyFilter, 180);
    });

    csvTableHead.addEventListener('input', (e) => {
        const input = e.target.closest('[data-col-filter]');
        if (!input) return;
        columnFilters[parseInt(input.dataset.colFilter, 10)] = input.value;
        applyFilter();
    });

    csvDelimiterPreset.addEventListener('change', () => {
        csvDelimiterCustom.classList.toggle('hidden', csvDelimiterPreset.value !== 'custom');
        if (lastText) loadCsv(lastText);
    });

    csvDelimiterCustom.addEventListener('input', () => {
        if (lastText) loadCsv(lastText);
    });

    csvPerPage.addEventListener('change', () => { page = 1; renderTable(); });
    csvPrevBtn.addEventListener('click', () => { if (page > 1) { page--; renderTable(); } });
    csvNextBtn.addEventListener('click', () => { page++; renderTable(); });
    csvCopyBtn.addEventListener('click', () => {
        if (!filtered.length) return;
        handleClipboardCopy(toCsvText(headers, filtered), csvCopyBtn, 'copy filtered');
    });
})();
