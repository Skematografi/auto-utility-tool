// ----------------------------------------
// FOCUS MODE
// For screen-sharing/demos: hides the hero text and the floating sticky-note
// / command-palette triggers (see html.focus-mode in components.css),
// leaving just the title bar, tab grid, and the active tool. Off by default;
// persisted like the theme/background toggles (localStorage sentinel value).
// toggleFocusMode() stays a plain global (not wrapped in the IIFE below) so
// the command palette can call it directly, the same way it calls switchTab().
// ----------------------------------------
function toggleFocusMode() {
    const toggleBtn = document.getElementById('focusToggle');
    if (toggleBtn) toggleBtn.click();
}

(function initFocusMode() {
    const toggleBtn = document.getElementById('focusToggle');
    if (!toggleBtn) return;

    const PREF_KEY = 'datadev_focus';
    let enabled = localStorage.getItem(PREF_KEY) === 'on';

    function apply() {
        document.documentElement.classList.toggle('focus-mode', enabled);
        toggleBtn.classList.toggle('text-emerald-400', enabled);
        toggleBtn.classList.toggle('text-zinc-600', !enabled);
        toggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        toggleBtn.title = enabled ? 'Focus mode: on (click to turn off)' : 'Focus mode: off (click to turn on)';
    }

    toggleBtn.addEventListener('click', function () {
        enabled = !enabled;
        try { localStorage.setItem(PREF_KEY, enabled ? 'on' : 'off'); } catch (e) { /* ignore */ }
        apply();
    });

    apply();
})();
