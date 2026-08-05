// ----------------------------------------
// STICKY NOTE
// A scratchpad panel outside the main card: park values while moving between
// tabs. Hidden by default, opened from the floating button, and auto-saved to
// localStorage so the content survives reloads.
// Wrapped in an IIFE because every script here shares one global scope.
// ----------------------------------------
(function initStickyNote() {
    const NOTE_KEY = 'datadev_note';
    const NOTE_SAVE_DELAY = 300;

    const panel = document.getElementById('notePanel');
    const backdrop = document.getElementById('noteBackdrop');
    const fab = document.getElementById('noteFab');
    const input = document.getElementById('noteInput');
    const closeBtn = document.getElementById('noteCloseBtn');
    const copyBtn = document.getElementById('noteCopyBtn');
    const saveState = document.getElementById('noteSaveState');
    if (!panel || !fab || !input) return;

    let saveTimer = null;
    let stateTimer = null;

    // Restore the saved note. Reads are guarded: localStorage can be blocked on
    // file://, and the panel should still work as an in-memory scratchpad.
    try {
        input.value = localStorage.getItem(NOTE_KEY) || '';
    } catch (e) { /* ignore */ }
    updateCopyState();

    function showState(text, isError) {
        saveState.textContent = text;
        saveState.className = isError ? 'text-red-400' : '';
        clearTimeout(stateTimer);
        if (!isError) {
            stateTimer = setTimeout(function () { saveState.textContent = ''; }, 1500);
        }
    }

    function updateCopyState() {
        copyBtn.disabled = input.value === '';
    }

    function flush() {
        try {
            localStorage.setItem(NOTE_KEY, input.value);
            showState('saved', false);
        } catch (e) {
            // Quota exceeded or storage blocked — never fail silently
            showState('save failed', true);
        }
    }

    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(flush, NOTE_SAVE_DELAY);
    }

    function setOpen(open) {
        document.documentElement.classList.toggle('note-open', open);
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        fab.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
            input.focus();
        } else {
            fab.focus();
        }
    }

    fab.addEventListener('click', function () { setOpen(true); });
    closeBtn.addEventListener('click', function () { setOpen(false); });
    backdrop.addEventListener('click', function () { setOpen(false); });

    input.addEventListener('input', function () {
        updateCopyState();
        scheduleSave();
    });

    // Extra flush points so nothing is lost when the user leaves the field or the page
    input.addEventListener('blur', flush);
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) flush();
    });

    copyBtn.addEventListener('click', function () {
        if (!input.value) return;
        handleClipboardCopy(input.value, copyBtn, 'copy');
    });
})();
