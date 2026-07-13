// ----------------------------------------
// TAB 2: FIND DUPLICATES LOGIC
// ----------------------------------------
const dupInput = document.getElementById('dupInput');
const dupResultDisplay = document.getElementById('dupResultValue');
const dupCopyBtn = document.getElementById('copyDupBtn');
const dupCountDisplay = document.getElementById('dupCount');

// Variabel state penyimpanan data mentah
let rawDuplicateList = [];

dupInput.addEventListener('input', findDuplicates);

function findDuplicates() {
    const text = dupInput.value;
    if (!text.trim()) {
        dupResultDisplay.textContent = "No duplicate items found yet.";
        dupCountDisplay.textContent = "0";
        dupCopyBtn.disabled = true;
        rawDuplicateList = [];
        return;
    }

    const items = text.split('\n').map(item => item.trim()).filter(item => item !== "");
    const frequencies = {};
    items.forEach(item => { frequencies[item] = (frequencies[item] || 0) + 1; });

    const duplicates = [];
    rawDuplicateList = [];

    for (const item in frequencies) {
        if (frequencies[item] > 1) {
            duplicates.push(`${item} (${frequencies[item]}x)`);
            rawDuplicateList.push(item);
        }
    }

    if (duplicates.length > 0) {
        dupResultDisplay.textContent = duplicates.join('\n');
        dupCountDisplay.textContent = duplicates.length;
        dupCopyBtn.disabled = false;
    } else {
        dupResultDisplay.textContent = "No duplicate items found yet.";
        dupCountDisplay.textContent = "0";
        dupCopyBtn.disabled = true;
        rawDuplicateList = [];
    }
}

dupCopyBtn.addEventListener('click', function () {
    if (rawDuplicateList.length === 0) return;
    handleClipboardCopy(rawDuplicateList.join('\n'), dupCopyBtn, 'copy list', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});
