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
const tabSplitBtn = document.getElementById('tabSplitBtn');
const tabWhereInBtn = document.getElementById('tabWhereInBtn');
const tabCharCountBtn = document.getElementById('tabCharCountBtn');

const calcView = document.getElementById('calcView');
const dupView = document.getElementById('dupView');
const asciiView = document.getElementById('asciiView');
const compareView = document.getElementById('compareView');
const sqlView = document.getElementById('sqlView');
const splitView = document.getElementById('splitView');
const whereInView = document.getElementById('whereInView');
const charCountView = document.getElementById('charCountView');

tabCalcBtn.addEventListener('click', () => switchTab('calc'));
tabDupBtn.addEventListener('click', () => switchTab('dup'));
tabAsciiBtn.addEventListener('click', () => switchTab('ascii'));
tabCompareBtn.addEventListener('click', () => switchTab('compare'));
tabSqlBtn.addEventListener('click', () => switchTab('sql'));
tabSplitBtn.addEventListener('click', () => switchTab('split'));
tabWhereInBtn.addEventListener('click', () => switchTab('wherein'));
tabCharCountBtn.addEventListener('click', () => switchTab('charcount'));

// Kelas dasar tab (konsisten dengan grid tab bergaya terminal di index.html)
const TAB_BASE = "tab-btn flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap";
const TAB_INACTIVE = `${TAB_BASE} text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50`;
const TAB_ACTIVE = `${TAB_BASE} bg-zinc-800 text-emerald-400 ring-1 ring-emerald-500/40`;

function switchTab(tab) {
    // Reset semua tab ke keadaan tidak aktif
    tabCalcBtn.className = TAB_INACTIVE;
    tabDupBtn.className = TAB_INACTIVE;
    tabAsciiBtn.className = TAB_INACTIVE;
    tabCompareBtn.className = TAB_INACTIVE;
    tabSqlBtn.className = TAB_INACTIVE;
    tabSplitBtn.className = TAB_INACTIVE;
    tabWhereInBtn.className = TAB_INACTIVE;
    tabCharCountBtn.className = TAB_INACTIVE;

    calcView.classList.add('hidden');
    dupView.classList.add('hidden');
    asciiView.classList.add('hidden');
    compareView.classList.add('hidden');
    sqlView.classList.add('hidden');
    splitView.classList.add('hidden');
    whereInView.classList.add('hidden');
    charCountView.classList.add('hidden');

    if (tab === 'calc') {
        tabCalcBtn.className = TAB_ACTIVE;
        calcView.classList.remove('hidden');
    } else if (tab === 'dup') {
        tabDupBtn.className = TAB_ACTIVE;
        dupView.classList.remove('hidden');
    } else if (tab === 'ascii') {
        tabAsciiBtn.className = TAB_ACTIVE;
        asciiView.classList.remove('hidden');
    } else if (tab === 'compare') {
        tabCompareBtn.className = TAB_ACTIVE;
        compareView.classList.remove('hidden');
    } else if (tab === 'sql') {
        tabSqlBtn.className = TAB_ACTIVE;
        sqlView.classList.remove('hidden');
    } else if (tab === 'split') {
        tabSplitBtn.className = TAB_ACTIVE;
        splitView.classList.remove('hidden');
    } else if (tab === 'wherein') {
        tabWhereInBtn.className = TAB_ACTIVE;
        whereInView.classList.remove('hidden');
    } else if (tab === 'charcount') {
        tabCharCountBtn.className = TAB_ACTIVE;
        charCountView.classList.remove('hidden');
    }
    lucide.createIcons();
}
