// ----------------------------------------
// TAB 10: SORT LOGIC
// Split a pasted list/sentence by a configurable separator (newlines are always
// accepted too), then show it sorted ascending and descending. Sorting is natural
// / numeric-aware, so 1, 10, 2, 5 becomes 1, 2, 5, 10 (not lexicographic).
// ----------------------------------------
const sortInput = document.getElementById('sortInput');
const sortSeparator = document.getElementById('sortSeparator');
const sortCount = document.getElementById('sortCount');
const sortAscResult = document.getElementById('sortAscResult');
const sortDescResult = document.getElementById('sortDescResult');
const copySortAscBtn = document.getElementById('copySortAscBtn');
const copySortDescBtn = document.getElementById('copySortDescBtn');

// Natural, numeric-aware comparator (e.g. "2" < "10", "item2" < "item10")
const sortCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

sortInput.addEventListener('input', runSort);
sortSeparator.addEventListener('input', runSort);

function runSort() {
    // Default to comma when the separator field is empty
    const separator = sortSeparator.value === '' ? ',' : sortSeparator.value;
    const source = sortInput.value;

    // Split by newline first, then by the chosen separator; trim and drop empties
    const items = source
        .split('\n')
        .flatMap(line => line.split(separator))
        .map(item => item.trim())
        .filter(item => item !== '');

    sortCount.textContent = items.length;

    if (items.length === 0) {
        sortAscResult.value = '';
        sortDescResult.value = '';
        copySortAscBtn.disabled = true;
        copySortDescBtn.disabled = true;
        return;
    }

    // Reassemble using a delimiter that mirrors the source, so the output keeps the
    // same shape as the input and only the order changes:
    // - a line-based list (newlines, no separator) stays one item per line
    // - "separator + space" (e.g. "1, 2") keeps the trailing space
    // - otherwise the separator is used as-is
    let glue;
    if (source.includes('\n') && !source.includes(separator)) {
        glue = '\n';
    } else if (source.includes(separator + ' ')) {
        glue = separator + ' ';
    } else {
        glue = separator;
    }

    const asc = [...items].sort(sortCollator.compare);
    const desc = [...asc].reverse();

    sortAscResult.value = asc.join(glue);
    sortDescResult.value = desc.join(glue);
    copySortAscBtn.disabled = false;
    copySortDescBtn.disabled = false;
}

copySortAscBtn.addEventListener('click', function () {
    if (!sortAscResult.value) return;
    handleClipboardCopy(sortAscResult.value, copySortAscBtn, 'copy', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});

copySortDescBtn.addEventListener('click', function () {
    if (!sortDescResult.value) return;
    handleClipboardCopy(sortDescResult.value, copySortDescBtn, 'copy', 'bg-sky-500', 'hover:bg-sky-400', 'bg-amber-400', 'hover:bg-amber-300');
});
