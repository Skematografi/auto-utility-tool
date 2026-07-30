// ----------------------------------------
// FOOTER VERSION
// Fetch the latest release tag from the GitHub Releases API (client-side, suits GitHub Pages).
// Show the fallback first, then upgrade to the real tag + cache in localStorage
// to avoid calling the API too often (limit of 60 req/hour for anonymous users).
// ----------------------------------------
(function initVersion() {
    const OWNER = 'Skematografi';          // change if the repo is deployed under another account
    const REPO = 'auto-utility-tool';
    const FALLBACK_VERSION = 'v1.0.0';     // used when there is no release yet / offline
    const CACHE_KEY = 'datadev_version';
    const CACHE_TTL = 6 * 60 * 60 * 1000;  // 6 hours

    const el = document.getElementById('appVersion');
    if (!el) return;

    const repoUrl = `https://github.com/${OWNER}/${REPO}`;

    function render(tag, url) {
        el.innerHTML = '';
        const a = document.createElement('a');
        a.href = url || repoUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'hover:text-emerald-400 transition-colors';
        a.textContent = tag;
        el.appendChild(a);
    }

    // 1) Show the fallback first
    render(FALLBACK_VERSION, repoUrl);

    // 2) Use the cache if still fresh
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && cached.tag && (Date.now() - cached.ts) < CACHE_TTL) {
            render(cached.tag, cached.url);
            return;
        }
    } catch (e) { /* ignore corrupted cache */ }

    // 3) Fetch the latest release from GitHub
    fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
    })
        .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
        .then(data => {
            if (data && data.tag_name) {
                render(data.tag_name, data.html_url);
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        tag: data.tag_name,
                        url: data.html_url,
                        ts: Date.now(),
                    }));
                } catch (e) { /* localStorage full/blocked -> ignore */ }
            }
        })
        .catch(() => { /* leave the fallback showing */ });
})();
