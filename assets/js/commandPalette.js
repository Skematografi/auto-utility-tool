// ----------------------------------------
// COMMAND PALETTE
// Ctrl+K / Cmd+K overlay: fuzzy-jump to any tab or run a quick action
// (toggle theme, toggle background, open sticky note) without the mouse.
// Wrapped in an IIFE because every script here shares one global scope.
// ----------------------------------------
(function initCommandPalette() {
    const backdrop = document.getElementById('paletteBackdrop');
    const box = document.getElementById('paletteBox');
    const input = document.getElementById('paletteInput');
    const list = document.getElementById('paletteList');
    const empty = document.getElementById('paletteEmpty');
    const openBtn = document.getElementById('paletteBtn');
    if (!backdrop || !box || !input || !list) return;

    const COMMANDS = [
        { label: 'calc — sum a list of numbers', icon: 'calculator', run: () => switchTab('calc') },
        { label: 'sort — sort a list ascending / descending', icon: 'arrow-down-up', run: () => switchTab('sort') },
        { label: 'dupes — find duplicate entries', icon: 'copy-check', run: () => switchTab('dup') },
        { label: 'chars — character & byte counts', icon: 'ruler', run: () => switchTab('charcount') },
        { label: 'ascii — detect non-ASCII characters', icon: 'file-warning', run: () => switchTab('ascii') },
        { label: 'diff — compare two texts', icon: 'arrow-left-right', run: () => switchTab('compare') },
        { label: 'log — search a log file as a table', icon: 'scroll-text', run: () => switchTab('log') },
        { label: 'split — split Excel/CSV into a ZIP', icon: 'scissors', run: () => switchTab('split') },
        { label: 'dummy — generate a blank test file', icon: 'file-plus', run: () => switchTab('dummy') },
        { label: 'in() — build a WHERE IN(...) list', icon: 'brackets', run: () => switchTab('wherein') },
        { label: 'sql — generate SQL from Excel/CSV', icon: 'database', run: () => switchTab('sql') },
        { label: 'restore — JSON to SQL INSERT', icon: 'database-backup', run: () => switchTab('restore') },
        { label: 'merge — combine SQL files', icon: 'git-merge', run: () => switchTab('mergesql') },
        { label: 'toggle theme (light / dark)', icon: 'sun-moon', run: () => document.getElementById('themeToggle')?.click() },
        { label: 'toggle background animation', icon: 'sparkles', run: () => document.getElementById('bgToggle')?.click() },
        { label: 'open sticky note', icon: 'sticky-note', run: () => document.getElementById('noteFab')?.click() },
        { label: 'toggle focus mode (hide hero & floating buttons)', icon: 'maximize-2', run: () => toggleFocusMode() },
    ];

    let matches = COMMANDS;
    let activeIndex = 0;

    function render() {
        list.innerHTML = '';
        matches.forEach((cmd, i) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'palette-item' + (i === activeIndex ? ' is-active' : '');
            item.innerHTML = `<i data-lucide="${cmd.icon}"></i><span>${cmd.label}</span>`;
            item.addEventListener('click', () => runCommand(i));
            item.addEventListener('mousemove', () => {
                if (activeIndex !== i) { activeIndex = i; render(); }
            });
            list.appendChild(item);
        });
        empty.classList.toggle('hidden', matches.length > 0);
        lucide.createIcons();
        const activeEl = list.children[activeIndex];
        if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }

    function filter() {
        const q = input.value.trim().toLowerCase();
        matches = q === '' ? COMMANDS : COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(q));
        activeIndex = 0;
        render();
    }

    function runCommand(i) {
        const cmd = matches[i];
        if (!cmd) return;
        close();
        cmd.run();
    }

    function isOpen() {
        return document.documentElement.classList.contains('palette-open');
    }

    function open() {
        input.value = '';
        filter();
        document.documentElement.classList.add('palette-open');
        backdrop.setAttribute('aria-hidden', 'false');
        box.setAttribute('aria-hidden', 'false');
        input.focus();
    }

    function close() {
        document.documentElement.classList.remove('palette-open');
        backdrop.setAttribute('aria-hidden', 'true');
        box.setAttribute('aria-hidden', 'true');
    }

    if (openBtn) openBtn.addEventListener('click', open);
    backdrop.addEventListener('click', close);
    input.addEventListener('input', filter);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = matches.length ? (activeIndex + 1) % matches.length : 0;
            render();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = matches.length ? (activeIndex - 1 + matches.length) % matches.length : 0;
            render();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            runCommand(activeIndex);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    });

    // Global: Ctrl+K / Cmd+K toggles the palette from anywhere, even while
    // typing in another tab's input — preventDefault stops the browser's
    // own Ctrl+K binding from stealing focus.
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            isOpen() ? close() : open();
        } else if (e.key === 'Escape' && isOpen()) {
            close();
        }
    });
})();
