// ----------------------------------------
// THEME (dark is the default, light is optional)
// Applies the saved theme as early as possible to avoid a flash, then wires
// the toggle in the card header. Other scripts can listen for 'themechange'.
// ----------------------------------------
(function initTheme() {
    const PREF_KEY = 'datadev_theme';

    function currentTheme() {
        try {
            return localStorage.getItem(PREF_KEY) === 'light' ? 'light' : 'dark';
        } catch (e) {
            return 'dark';
        }
    }

    function applyTheme(theme) {
        document.documentElement.classList.toggle('light', theme === 'light');
    }

    // Run immediately (script sits in <head>) so the page paints in the right theme
    applyTheme(currentTheme());

    // Update the switch: the knob slides via CSS (see .theme-switch in components.css),
    // here we only set the state and the icon of the active theme.
    function updateToggle(theme) {
        const btn = document.getElementById('themeToggle');
        const knob = document.getElementById('themeToggleKnob');
        if (!btn || !knob) return;
        const isLight = theme === 'light';

        btn.setAttribute('aria-checked', isLight ? 'true' : 'false');
        btn.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';

        knob.innerHTML = `<i data-lucide="${isLight ? 'sun' : 'moon'}" class="w-3 h-3"></i>`;
        if (window.lucide) lucide.createIcons();
    }

    function setTheme(theme) {
        applyTheme(theme);
        try { localStorage.setItem(PREF_KEY, theme); } catch (e) { /* ignore */ }
        updateToggle(theme);
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    document.addEventListener('DOMContentLoaded', function () {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        updateToggle(currentTheme());
        btn.addEventListener('click', function () {
            setTheme(currentTheme() === 'light' ? 'dark' : 'light');
        });
    });
})();
