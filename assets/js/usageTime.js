// ----------------------------------------
// USAGE TIME
// Tracks how long each tool tab has been actively used today (visible tab +
// window focus + not idle for 60s), persisted in localStorage and reset when
// the device's local date changes. Accessible only from the command palette
// — no button/FAB anywhere else.
// Wrapped in an IIFE because every script here shares one global scope.
// ----------------------------------------
(function initUsageTime() {
    const STORAGE_KEY = 'datadev_usage';
    const IDLE_MS = 60 * 1000;
    const TICK_MS = 1000;

    // Internal tab id -> display label, in tab-grid order.
    const TAB_LABELS = [
        ['calc', 'calc'], ['sort', 'sort'], ['dup', 'dupes'], ['charcount', 'chars'],
        ['ascii', 'ascii'], ['compare', 'diff'], ['log', 'log'], ['split', 'split'],
        ['dummy', 'dummy'], ['wherein', 'in()'], ['sql', 'sql'], ['restore', 'restore'],
        ['mergesql', 'merge'], ['json', 'json'], ['csv', 'csv'], ['clean', 'clean']
    ];

    const usageModalBackdrop = document.getElementById('usageModalBackdrop');
    const usageModalBox = document.getElementById('usageModalBox');
    const usageModalCloseBtn = document.getElementById('usageModalCloseBtn');
    const usageModalList = document.getElementById('usageModalList');
    if (!usageModalBackdrop || !usageModalBox || !usageModalList) return;

    function todayLocal() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function blankTimes() {
        const times = {};
        TAB_LABELS.forEach(function (pair) { times[pair[0]] = 0; });
        return times;
    }

    function load() {
        let data = null;
        try {
            data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (e) { /* ignore — corrupt or blocked (file://) */ }
        if (!data || data.date !== todayLocal()) {
            data = { date: todayLocal(), times: blankTimes() };
        }
        // Fill in any tab missing from an older save (e.g. after adding a new tool tab).
        TAB_LABELS.forEach(function (pair) {
            if (typeof data.times[pair[0]] !== 'number') data.times[pair[0]] = 0;
        });
        return data;
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) { /* ignore — quota or blocked storage, tracking still works in-memory */ }
    }

    let state = load();
    let currentTab = 'calc'; // matches the tab that's active on page load
    let lastActivity = Date.now();

    window.onTabSwitch = function (tab) {
        currentTab = tab;
    };

    ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(function (evt) {
        document.addEventListener(evt, function () { lastActivity = Date.now(); }, { passive: true });
    });

    function isIdle() {
        return Date.now() - lastActivity > IDLE_MS;
    }

    function formatDuration(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return h + ' H ' + m + ' m ' + s + ' s';
        if (m > 0) return m + ' m ' + s + ' s';
        return s + ' s';
    }

    function renderModal() {
        usageModalList.innerHTML = '';
        TAB_LABELS.forEach(function (pair) {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between gap-3 text-zinc-300';
            li.innerHTML =
                '<span class="text-emerald-400 font-semibold">' + pair[1] + '</span>' +
                '<span class="text-zinc-400">' + formatDuration(state.times[pair[0]] || 0) + '</span>';
            usageModalList.appendChild(li);
        });
    }

    function isModalOpen() {
        return document.documentElement.classList.contains('usage-modal-open');
    }

    function openModal() {
        renderModal();
        document.documentElement.classList.add('usage-modal-open');
        usageModalBox.setAttribute('aria-hidden', 'false');
        usageModalBackdrop.setAttribute('aria-hidden', 'false');
        usageModalCloseBtn.focus();
    }

    function closeModal() {
        document.documentElement.classList.remove('usage-modal-open');
        usageModalBox.setAttribute('aria-hidden', 'true');
        usageModalBackdrop.setAttribute('aria-hidden', 'true');
    }

    usageModalCloseBtn.addEventListener('click', closeModal);
    usageModalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && isModalOpen()) closeModal();
    });

    setInterval(function () {
        const today = todayLocal();
        if (state.date !== today) {
            state = { date: today, times: blankTimes() };
        }

        if (document.visibilityState === 'visible' && document.hasFocus() && !isIdle()) {
            state.times[currentTab] = (state.times[currentTab] || 0) + 1;
            save();
            if (isModalOpen()) renderModal();
        }
    }, TICK_MS);

    // Exposed for the command palette.
    window.showUsageTime = openModal;
})();
