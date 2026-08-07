// ----------------------------------------
// FOOTER VERSION
// The app is in beta — shows a static label linking to the repo instead of
// tracking release tags.
// ----------------------------------------
(function initVersion() {
    const el = document.getElementById('appVersion');
    if (!el) return;

    el.textContent = '';
    const a = document.createElement('a');
    a.href = 'https://github.com/Skematografi/auto-utility-tool';
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'hover:text-emerald-400 transition-colors';
    a.textContent = 'beta';
    el.appendChild(a);
})();
