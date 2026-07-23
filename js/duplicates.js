// ----------------------------------------
// TAB 2: FIND DUPLICATES LOGIC
// ----------------------------------------
const dupInput = document.getElementById('dupInput');
const dupResultDisplay = document.getElementById('dupResultValue');
const dupCountDisplay = document.getElementById('dupCount');
const dupUniqueCountDisplay = document.getElementById('dupUniqueCount');
const dupSingleCountDisplay = document.getElementById('dupSingleCount');

const dupCopyBtn = document.getElementById('copyDupBtn');            // hanya nilai yang duplikat (distinct)
const dupCopyUniqueBtn = document.getElementById('copyDupUniqueBtn'); // semua nilai, 1 per nilai
const dupCopySingleBtn = document.getElementById('copyDupSingleBtn'); // hanya nilai tanpa duplikat

// Variabel state penyimpanan hasil
let dupDuplicateList = []; // nilai yang muncul > 1x (distinct)
let dupUniqueList = [];     // semua nilai distinct (1 per nilai)
let dupSingleList = [];     // nilai yang muncul tepat 1x

dupInput.addEventListener('input', findDuplicates);

function findDuplicates() {
    const items = dupInput.value
        .split('\n')
        .map(item => item.trim())
        .filter(item => item !== '');

    // Hitung frekuensi sambil menjaga urutan kemunculan pertama
    const order = [];
    const freq = {};
    items.forEach(item => {
        if (!(item in freq)) {
            freq[item] = 0;
            order.push(item);
        }
        freq[item]++;
    });

    dupUniqueList = order;
    dupDuplicateList = order.filter(v => freq[v] > 1);
    dupSingleList = order.filter(v => freq[v] === 1);

    // Badge counts
    dupCountDisplay.textContent = dupDuplicateList.length;
    dupUniqueCountDisplay.textContent = dupUniqueList.length;
    dupSingleCountDisplay.textContent = dupSingleList.length;

    // Tampilan daftar duplikat + jumlah kemunculan
    if (dupDuplicateList.length > 0) {
        dupResultDisplay.textContent = dupDuplicateList.map(v => `${v} (${freq[v]}x)`).join('\n');
    } else {
        dupResultDisplay.textContent = 'No duplicate items found yet.';
    }

    // Aktif/nonaktifkan tombol sesuai ketersediaan data
    dupCopyBtn.disabled = dupDuplicateList.length === 0;
    dupCopyUniqueBtn.disabled = dupUniqueList.length === 0;
    dupCopySingleBtn.disabled = dupSingleList.length === 0;
}

dupCopyBtn.addEventListener('click', function () {
    if (dupDuplicateList.length === 0) return;
    handleClipboardCopy(dupDuplicateList.join('\n'), dupCopyBtn, 'copy dupes', 'bg-emerald-600', 'hover:bg-emerald-500', 'bg-amber-400', 'hover:bg-amber-300');
});

dupCopyUniqueBtn.addEventListener('click', function () {
    if (dupUniqueList.length === 0) return;
    handleClipboardCopy(dupUniqueList.join('\n'), dupCopyUniqueBtn, 'copy unique', 'bg-sky-500', 'hover:bg-sky-400', 'bg-amber-400', 'hover:bg-amber-300');
});

dupCopySingleBtn.addEventListener('click', function () {
    if (dupSingleList.length === 0) return;
    handleClipboardCopy(dupSingleList.join('\n'), dupCopySingleBtn, 'copy non-dupes', 'bg-violet-500', 'hover:bg-violet-400', 'bg-amber-400', 'hover:bg-amber-300');
});
