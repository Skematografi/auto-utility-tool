// ----------------------------------------
// UPDATE NOTIFICATION BELL
// Fetches CHANGELOG.md, shows a red dot when the newest entry is within the
// last 7 days, and lists the 10 most recent entries in a popup modal.
// Degrades gracefully when fetch is unavailable (e.g. opened via file://).
// ----------------------------------------
(function initChangelog() {
    const changelogBtn = document.getElementById('changelogBtn');
    const changelogDot = document.getElementById('changelogDot');
    const changelogModalBackdrop = document.getElementById('changelogModalBackdrop');
    const changelogModalBox = document.getElementById('changelogModalBox');
    const changelogModalList = document.getElementById('changelogModalList');
    const changelogModalStatus = document.getElementById('changelogModalStatus');
    const changelogModalCloseBtn = document.getElementById('changelogModalCloseBtn');

    const MAX_ENTRIES = 10;
    const DOT_WINDOW_DAYS = 7;

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Minimal inline markdown: **bold** and `code` only.
    function renderInline(text) {
        return escapeHtml(text)
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
            .replace(/`(.+?)`/g, '<code class="text-emerald-300">$1</code>');
    }

    // Parses "## YYYY-MM-DD" headings and their "- " bullets into
    // [{ date: 'YYYY-MM-DD', items: [string, ...] }, ...], newest first.
    function parseChangelog(markdown) {
        const entries = [];
        let current = null;

        markdown.split('\n').forEach(line => {
            const heading = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
            if (heading) {
                current = { date: heading[1], items: [] };
                entries.push(current);
                return;
            }
            const bullet = line.match(/^\s*-\s+(.+)/);
            if (bullet && current) {
                current.items.push(bullet[1].trim());
            }
        });

        entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
        return entries.filter(entry => entry.items.length > 0).slice(0, MAX_ENTRIES);
    }

    function daysSince(dateStr) {
        const then = new Date(dateStr + 'T00:00:00');
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.round((startOfToday - then) / 86400000);
    }

    function relativeLabel(days) {
        if (days <= 0) return 'today';
        if (days === 1) return 'yesterday';
        return `${days} days ago`;
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function renderEntries(entries) {
        changelogModalList.innerHTML = '';
        changelogModalStatus.classList.add('hidden');

        if (entries.length === 0) {
            changelogModalStatus.textContent = 'No updates recorded yet.';
            changelogModalStatus.classList.remove('hidden');
            return;
        }

        entries.forEach(entry => {
            const card = document.createElement('div');
            card.className = 'space-y-1.5';

            const header = document.createElement('div');
            header.className = 'flex items-baseline gap-2';
            header.innerHTML = `
                <span class="text-sm font-semibold text-emerald-400">${formatDate(entry.date)}</span>
                <span class="text-xs text-zinc-600">${relativeLabel(daysSince(entry.date))}</span>
            `;
            card.appendChild(header);

            const list = document.createElement('ul');
            list.className = 'list-disc list-inside space-y-1 text-sm text-zinc-300 leading-relaxed';
            entry.items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = renderInline(item);
                list.appendChild(li);
            });
            card.appendChild(list);

            changelogModalList.appendChild(card);
        });
    }

    function showUnavailable(message) {
        changelogModalList.innerHTML = '';
        changelogModalStatus.textContent = message;
        changelogModalStatus.classList.remove('hidden');
    }

    function openChangelogModal() {
        document.documentElement.classList.add('changelog-modal-open');
        changelogModalBox.setAttribute('aria-hidden', 'false');
        changelogModalBackdrop.setAttribute('aria-hidden', 'false');
        changelogModalCloseBtn.focus();
    }

    function closeChangelogModal() {
        document.documentElement.classList.remove('changelog-modal-open');
        changelogModalBox.setAttribute('aria-hidden', 'true');
        changelogModalBackdrop.setAttribute('aria-hidden', 'true');
    }

    changelogBtn.addEventListener('click', openChangelogModal);
    changelogModalCloseBtn.addEventListener('click', closeChangelogModal);
    changelogModalBackdrop.addEventListener('click', closeChangelogModal);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && document.documentElement.classList.contains('changelog-modal-open')) {
            closeChangelogModal();
        }
    });

    fetch('CHANGELOG.md')
        .then(response => {
            if (!response.ok) throw new Error('CHANGELOG.md not found');
            return response.text();
        })
        .then(markdown => {
            const entries = parseChangelog(markdown);
            renderEntries(entries);
            if (entries.length > 0 && daysSince(entries[0].date) < DOT_WINDOW_DAYS) {
                changelogDot.classList.remove('hidden');
            }
        })
        .catch(() => {
            showUnavailable("Can't load recent updates here — open this app via a local server or the live site to see them.");
        });
})();
