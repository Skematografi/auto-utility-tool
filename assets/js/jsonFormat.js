// ----------------------------------------
// JSON FORMATTER
// Live-formats pasted JSON as either indented code or an expandable tree
// (built with <details>/<summary> so expand/collapse needs no extra JS).
// ----------------------------------------
(function initJsonFormat() {
    const jsonInput = document.getElementById('jsonInput');
    if (!jsonInput) return;

    const jsonModeCodeBtn = document.getElementById('jsonModeCodeBtn');
    const jsonModeTreeBtn = document.getElementById('jsonModeTreeBtn');
    const jsonCodeOutput = document.getElementById('jsonCodeOutput');
    const jsonTreeOutput = document.getElementById('jsonTreeOutput');
    const jsonStatus = document.getElementById('jsonStatus');
    const jsonKeyCount = document.getElementById('jsonKeyCount');
    const jsonError = document.getElementById('jsonError');
    const jsonCopyBtn = document.getElementById('jsonCopyBtn');

    const MODE_ACTIVE = "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer bg-zinc-800 text-emerald-400 ring-1 ring-emerald-500/40";
    const MODE_INACTIVE = "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50";

    let mode = 'code';
    let lastValid;
    let hasValid = false;

    function countKeys(value) {
        if (Array.isArray(value)) return value.reduce((sum, item) => sum + countKeys(item), 0);
        if (value !== null && typeof value === 'object') {
            return Object.keys(value).length + Object.values(value).reduce((sum, v) => sum + countKeys(v), 0);
        }
        return 0;
    }

    function valueClass(value) {
        if (value === null) return 'text-zinc-500 italic';
        switch (typeof value) {
            case 'string': return 'text-emerald-300';
            case 'number': return 'text-sky-300';
            case 'boolean': return 'text-violet-300';
            default: return 'text-zinc-300';
        }
    }

    function valueLabel(value) {
        if (value === null) return 'null';
        if (typeof value === 'string') return JSON.stringify(value);
        return String(value);
    }

    // Builds one <li> per key/value pair; objects and arrays nest inside a
    // <details> so the browser handles expand/collapse natively.
    function buildTreeNode(key, value) {
        const li = document.createElement('li');

        if (value !== null && typeof value === 'object') {
            const isArray = Array.isArray(value);
            const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);

            const details = document.createElement('details');
            details.open = true;

            const summary = document.createElement('summary');
            summary.className = 'cursor-pointer select-none';
            if (key !== null) {
                const keySpan = document.createElement('span');
                keySpan.className = 'text-zinc-300 font-semibold';
                keySpan.textContent = key + ': ';
                summary.appendChild(keySpan);
            }
            const hint = document.createElement('span');
            hint.className = 'text-zinc-600';
            hint.textContent = isArray ? `[${entries.length}]` : `{${entries.length}}`;
            summary.appendChild(hint);
            details.appendChild(summary);

            const ul = document.createElement('ul');
            ul.className = 'pl-5 border-l border-zinc-800 ml-1.5 mt-1 space-y-0.5';
            entries.forEach(([k, v]) => ul.appendChild(buildTreeNode(k, v)));
            details.appendChild(ul);

            li.appendChild(details);
        } else {
            if (key !== null) {
                const keySpan = document.createElement('span');
                keySpan.className = 'text-zinc-300 font-semibold';
                keySpan.textContent = key + ': ';
                li.appendChild(keySpan);
            }
            const valSpan = document.createElement('span');
            valSpan.className = valueClass(value);
            valSpan.textContent = valueLabel(value);
            li.appendChild(valSpan);
        }
        return li;
    }

    function renderTree(value) {
        jsonTreeOutput.innerHTML = '';
        const root = document.createElement('ul');
        root.className = 'space-y-0.5';
        root.appendChild(buildTreeNode(null, value));
        jsonTreeOutput.appendChild(root);
    }

    function setMode(next) {
        mode = next;
        jsonModeCodeBtn.className = mode === 'code' ? MODE_ACTIVE : MODE_INACTIVE;
        jsonModeTreeBtn.className = mode === 'tree' ? MODE_ACTIVE : MODE_INACTIVE;
        jsonCodeOutput.classList.toggle('hidden', mode !== 'code');
        jsonTreeOutput.classList.toggle('hidden', mode !== 'tree');
    }

    function clearOutput(statusText, statusClass) {
        jsonStatus.textContent = statusText;
        jsonStatus.className = `font-extrabold ${statusClass} text-sm`;
        jsonKeyCount.textContent = '0';
        jsonCodeOutput.textContent = '';
        jsonTreeOutput.innerHTML = '';
        jsonError.classList.add('hidden');
        jsonCopyBtn.disabled = true;
        hasValid = false;
    }

    function format() {
        const raw = jsonInput.value.trim();
        if (!raw) {
            clearOutput('waiting', 'text-zinc-400');
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            lastValid = parsed;
            hasValid = true;

            jsonStatus.textContent = 'valid';
            jsonStatus.className = 'font-extrabold text-emerald-300 text-sm';
            jsonKeyCount.textContent = String(countKeys(parsed));
            jsonError.classList.add('hidden');
            jsonCopyBtn.disabled = false;

            jsonCodeOutput.textContent = JSON.stringify(parsed, null, 2);
            renderTree(parsed);
        } catch (err) {
            clearOutput('invalid', 'text-red-400');
            jsonError.textContent = err.message;
            jsonError.classList.remove('hidden');
        }
    }

    jsonInput.addEventListener('input', format);
    jsonModeCodeBtn.addEventListener('click', () => setMode('code'));
    jsonModeTreeBtn.addEventListener('click', () => setMode('tree'));
    jsonCopyBtn.addEventListener('click', () => {
        if (!hasValid) return;
        handleClipboardCopy(JSON.stringify(lastValid, null, 2), jsonCopyBtn, 'copy');
    });

    setMode('code');
})();
