// Inisialisasi Icons saat pertama kali dimuat
lucide.createIcons();

// ----------------------------------------
// TAB SWITCHING LOGIC (navigasi antar tab)
// ----------------------------------------
const tabCalcBtn = document.getElementById('tabCalcBtn');
const tabDupBtn = document.getElementById('tabDupBtn');
const tabAsciiBtn = document.getElementById('tabAsciiBtn');
const tabCompareBtn = document.getElementById('tabCompareBtn');
const tabSqlBtn = document.getElementById('tabSqlBtn');

const calcView = document.getElementById('calcView');
const dupView = document.getElementById('dupView');
const asciiView = document.getElementById('asciiView');
const compareView = document.getElementById('compareView');
const sqlView = document.getElementById('sqlView');

tabCalcBtn.addEventListener('click', () => switchTab('calc'));
tabDupBtn.addEventListener('click', () => switchTab('dup'));
tabAsciiBtn.addEventListener('click', () => switchTab('ascii'));
tabCompareBtn.addEventListener('click', () => switchTab('compare'));
tabSqlBtn.addEventListener('click', () => switchTab('sql'));

function switchTab(tab) {
    // Reset classes
    const defaultTabClass = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer text-gray-500 hover:text-gray-900";
    tabCalcBtn.className = defaultTabClass;
    tabDupBtn.className = defaultTabClass;
    tabAsciiBtn.className = defaultTabClass;
    tabCompareBtn.className = defaultTabClass;
    tabSqlBtn.className = defaultTabClass;

    calcView.classList.add('hidden');
    dupView.classList.add('hidden');
    asciiView.classList.add('hidden');
    compareView.classList.add('hidden');
    sqlView.classList.add('hidden');

    if (tab === 'calc') {
        tabCalcBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer bg-white text-blue-600 shadow-sm";
        calcView.classList.remove('hidden');
    } else if (tab === 'dup') {
        tabDupBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer bg-white text-emerald-600 shadow-sm";
        dupView.classList.remove('hidden');
    } else if (tab === 'ascii') {
        tabAsciiBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer bg-white text-indigo-600 shadow-sm";
        asciiView.classList.remove('hidden');
    } else if (tab === 'compare') {
        // Tema Orange khusus untuk Compare Tab
        tabCompareBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer bg-white text-orange-600 shadow-sm";
        compareView.classList.remove('hidden');
    } else if (tab === 'sql') {
        // Tema Purple khusus untuk SQL Generator Tab
        tabSqlBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer bg-white text-purple-600 shadow-sm";
        sqlView.classList.remove('hidden');
    }
    lucide.createIcons();
}
