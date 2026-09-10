// ----------------------------------------
// TAB: CLEAN TEXT
// Generic whitespace cleanup for pasted text/SQL/lists — not tied to any format.
// ----------------------------------------
const cleanInput = document.getElementById('cleanInput');
const cleanOutput = document.getElementById('cleanOutput');

const cleanRemoveBlank = document.getElementById('cleanRemoveBlank');
const cleanTrimTrailing = document.getElementById('cleanTrimTrailing');
const cleanTrimLeading = document.getElementById('cleanTrimLeading');
const cleanCollapseSpaces = document.getElementById('cleanCollapseSpaces');

const cleanLineBefore = document.getElementById('cleanLineBefore');
const cleanLineAfter = document.getElementById('cleanLineAfter');
const cleanRemovedCount = document.getElementById('cleanRemovedCount');
const cleanCopyBtn = document.getElementById('cleanCopyBtn');

let cleanResult = '';

function runClean() {
    const raw = cleanInput.value.replace(/\r\n?/g, '\n');

    if (!raw) {
        cleanLineBefore.textContent = '0';
        cleanLineAfter.textContent = '0';
        cleanRemovedCount.textContent = '0';
        cleanOutput.value = '';
        cleanResult = '';
        cleanCopyBtn.disabled = true;
        return;
    }

    let lines = raw.split('\n');
    const linesBefore = lines.length;

    lines = lines.map(line => {
        if (cleanTrimLeading.checked) line = line.replace(/^[ \t]+/, '');
        if (cleanTrimTrailing.checked) line = line.replace(/[ \t]+$/, '');
        if (cleanCollapseSpaces.checked) line = line.replace(/ {2,}/g, ' ');
        return line;
    });

    if (cleanRemoveBlank.checked) {
        lines = lines.filter(line => line.trim() !== '');
    }

    cleanResult = lines.join('\n');

    cleanLineBefore.textContent = String(linesBefore);
    cleanLineAfter.textContent = String(lines.length);
    cleanRemovedCount.textContent = String(linesBefore - lines.length);
    cleanOutput.value = cleanResult;
    cleanCopyBtn.disabled = cleanResult === '';
}

cleanInput.addEventListener('input', runClean);
cleanRemoveBlank.addEventListener('change', runClean);
cleanTrimTrailing.addEventListener('change', runClean);
cleanTrimLeading.addEventListener('change', runClean);
cleanCollapseSpaces.addEventListener('change', runClean);

cleanCopyBtn.addEventListener('click', function () {
    if (!cleanResult) return;
    handleClipboardCopy(cleanResult, cleanCopyBtn, 'copy cleaned');
});
