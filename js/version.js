// ----------------------------------------
// FOOTER VERSION
// Ambil tag rilis terbaru dari GitHub Releases API (client-side, cocok untuk GitHub Pages).
// Menampilkan fallback dulu, lalu upgrade ke tag asli + cache di localStorage
// agar tidak sering memanggil API (batas 60 req/jam untuk anonim).
// ----------------------------------------
(function initVersion() {
    const OWNER = 'Skematografi';          // ganti bila repo di-deploy di akun lain
    const REPO = 'auto-utility-tool';
    const FALLBACK_VERSION = 'v1.0.0';     // dipakai jika belum ada release / offline
    const CACHE_KEY = 'datadev_version';
    const CACHE_TTL = 6 * 60 * 60 * 1000;  // 6 jam

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

    // 1) Tampilkan fallback lebih dulu
    render(FALLBACK_VERSION, repoUrl);

    // 2) Pakai cache bila masih segar
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && cached.tag && (Date.now() - cached.ts) < CACHE_TTL) {
            render(cached.tag, cached.url);
            return;
        }
    } catch (e) { /* abaikan cache rusak */ }

    // 3) Ambil rilis terbaru dari GitHub
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
                } catch (e) { /* localStorage penuh/diblokir -> abaikan */ }
            }
        })
        .catch(() => { /* biarkan fallback yang tampil */ });
})();
