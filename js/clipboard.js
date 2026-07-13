// ----------------------------------------
// HELPER: UNIVERSAL CLIPBOARD COPY
// Dipakai bersama oleh beberapa tab (Calculator, Duplicates, Non-ASCII).
// ----------------------------------------
function handleClipboardCopy(text, buttonElement, originalText, defaultBg = 'bg-emerald-600', defaultHover = 'hover:bg-emerald-500', activeBg = 'bg-amber-400', activeHover = 'hover:bg-amber-300') {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            buttonElement.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i><span>Copied!</span>`;
            buttonElement.classList.remove(defaultBg, defaultHover);
            buttonElement.classList.add(activeBg, activeHover);
            lucide.createIcons();

            setTimeout(() => {
                if (buttonElement.id === 'copyCleanTextBtn') {
                    buttonElement.innerHTML = `<i data-lucide="eraser" class="w-4 h-4 group-hover:scale-110 transition-transform"></i><span>${originalText}</span>`;
                } else {
                    buttonElement.innerHTML = `<i data-lucide="copy" class="w-5 h-5 group-hover:scale-110 transition-transform"></i><span>${originalText}</span>`;
                }
                buttonElement.classList.add(defaultBg, defaultHover);
                buttonElement.classList.remove(activeBg, activeHover);
                lucide.createIcons();
            }, 2000);
        }
    } catch (err) {
        console.error('Failed to copy text', err);
    }

    document.body.removeChild(textArea);
}
