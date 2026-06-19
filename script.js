// Inisialisasi Icons saat pertama kali dimuat
lucide.createIcons();

// Elemen Navigasi Tab
const tabCalcBtn = document.getElementById('tabCalcBtn');
const tabDupBtn = document.getElementById('tabDupBtn');
const tabAsciiBtn = document.getElementById('tabAsciiBtn');
const tabCompareBtn = document.getElementById('tabCompareBtn');

const calcView = document.getElementById('calcView');
const dupView = document.getElementById('dupView');
const asciiView = document.getElementById('asciiView');
const compareView = document.getElementById('compareView');

// Elemen Auto Calculator
const calcInput = document.getElementById('numberInput');
const calcResultDisplay = document.getElementById('resultValue');
const calcCopyBtn = document.getElementById('copyBtn');
const calcCountDisplay = document.getElementById('dataCount');

// Elemen Find Duplicates
const dupInput = document.getElementById('dupInput');
const dupResultDisplay = document.getElementById('dupResultValue');
const dupCopyBtn = document.getElementById('copyDupBtn');
const dupCountDisplay = document.getElementById('dupCount');

// Elemen Auto Detect Non-ASCII
const asciiInput = document.getElementById('asciiInput');
const asciiResultDisplay = document.getElementById('asciiResultValue');
const asciiHighlightPreview = document.getElementById('asciiHighlightPreview');
const copyAsciiListBtn = document.getElementById('copyAsciiListBtn');
const copyCleanTextBtn = document.getElementById('copyCleanTextBtn');
const asciiCountDisplay = document.getElementById('asciiCount');

// Elemen Auto Compare
const compareLeft = document.getElementById('compareLeft');
const compareRight = document.getElementById('compareRight');
const compareResultContainer = document.getElementById('compareResultContainer');

// Variabel global state penyimpanan data mentah
let rawSumValue = 0;
let rawDuplicateList = [];
let rawNonAsciiList = [];

// ----------------------------------------
// TAB SWITCHING LOGIC
// ----------------------------------------
tabCalcBtn.addEventListener('click', () => switchTab('calc'));
tabDupBtn.addEventListener('click', () => switchTab('dup'));
tabAsciiBtn.addEventListener('click', () => switchTab('ascii'));
tabCompareBtn.addEventListener('click', () => switchTab('compare'));

function switchTab(tab) {
    // Reset classes
    const defaultTabClass = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer text-gray-500 hover:text-gray-900";
    tabCalcBtn.className = defaultTabClass;
    tabDupBtn.className = defaultTabClass;
    tabAsciiBtn.className = defaultTabClass;
    tabCompareBtn.className = defaultTabClass;

    calcView.classList.add('hidden');
    dupView.classList.add('hidden');
    asciiView.classList.add('hidden');
    compareView.classList.add('hidden');

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
    }
    lucide.createIcons();
}

// ----------------------------------------
// TAB 1: AUTO CALCULATOR LOGIC
// ----------------------------------------
calcInput.addEventListener('input', function () {
    const sanitizedValue = this.value.replace(/[^\d.\-\n]/g, '');
    if (this.value !== sanitizedValue) {
        this.value = sanitizedValue;
    }
    calculateSum();
});

function formatToIndonesian(num) {
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(',');
}

function calculateSum() {
    const lines = calcInput.value.split('\n');
    let sum = 0;
    let count = 0;

    for (let line of lines) {
        const num = parseFloat(line);
        if (!isNaN(num)) {
            sum += num;
            count++;
        }
    }

    sum = Math.round(sum * 1000000) / 1000000;
    rawSumValue = sum;
    calcResultDisplay.textContent = formatToIndonesian(sum);
    calcCountDisplay.textContent = count;
}

calcCopyBtn.addEventListener('click', function () {
    handleClipboardCopy(rawSumValue.toString(), calcCopyBtn, 'Copy Result');
});

// ----------------------------------------
// TAB 2: FIND DUPLICATES LOGIC
// ----------------------------------------
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
    handleClipboardCopy(rawDuplicateList.join('\n'), dupCopyBtn, 'Copy List Only', 'bg-emerald-600', 'hover:bg-emerald-700', 'bg-green-500', 'hover:bg-green-600');
});

// ----------------------------------------
// TAB 3: AUTO DETECT NON-ASCII LOGIC
// ----------------------------------------
asciiInput.addEventListener('input', detectNonAscii);

function detectNonAscii() {
    const text = asciiInput.value;
    if (!text) {
        asciiResultDisplay.textContent = "No non-ASCII characters found.";
        asciiHighlightPreview.innerHTML = "No text entered yet.";
        asciiCountDisplay.textContent = "0";
        copyAsciiListBtn.disabled = true;
        copyCleanTextBtn.disabled = true;
        rawNonAsciiList = [];
        return;
    }

    const escapeHtml = (str) => {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    // Menghasilkan visual preview teks dengan penandaan/highlight warna
    let highlightedHtml = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const code = char.charCodeAt(0);
        if (code > 127) {
            const hexCode = code.toString(16).toUpperCase().padStart(4, '0');
            // Bungkus karakter non-ASCII dengan class background orange menyala dan penunjuk kode Unicode
            highlightedHtml += `<span class="bg-amber-200 text-red-700 font-bold px-0.5 rounded cursor-help" title="Unicode: U+${hexCode}">${escapeHtml(char)}</span>`;
        } else {
            highlightedHtml += escapeHtml(char);
        }
    }
    asciiHighlightPreview.innerHTML = highlightedHtml;

    // Cari semua karakter non-ASCII (Unicode value > 127)
    const nonAsciiMatches = text.match(/[^\x00-\x7F]/g) || [];
    if (nonAsciiMatches.length === 0) {
        asciiResultDisplay.textContent = "No non-ASCII characters found. Your text is clean!";
        asciiCountDisplay.textContent = "0";
        copyAsciiListBtn.disabled = true;
        copyCleanTextBtn.disabled = true;
        rawNonAsciiList = [];
        return;
    }

    // Analisis karakter unik dan hitung frekuensinya
    const frequencies = {};
    nonAsciiMatches.forEach(char => { frequencies[char] = (frequencies[char] || 0) + 1; });

    const uniqueList = [];
    rawNonAsciiList = [];

    for (const char in frequencies) {
        const hexCode = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
        uniqueList.push(`"${char}" (U+${hexCode}) — ${frequencies[char]}x`);
        rawNonAsciiList.push(char);
    }

    asciiResultDisplay.textContent = uniqueList.join('\n');
    asciiCountDisplay.textContent = nonAsciiMatches.length;
    copyAsciiListBtn.disabled = false;
    copyCleanTextBtn.disabled = false;
}

copyAsciiListBtn.addEventListener('click', function () {
    if (rawNonAsciiList.length === 0) return;
    handleClipboardCopy(rawNonAsciiList.join(''), copyAsciiListBtn, 'Copy List Only', 'bg-indigo-600', 'hover:bg-indigo-700', 'bg-green-500', 'hover:bg-green-600');
});

copyCleanTextBtn.addEventListener('click', function () {
    const cleanedText = asciiInput.value.replace(/[^\x00-\x7F]/g, '');
    handleClipboardCopy(cleanedText, copyCleanTextBtn, 'Copy Cleaned Text', 'bg-slate-600', 'hover:bg-slate-700', 'bg-green-500', 'hover:bg-green-600');
});

// ----------------------------------------
// TAB 4: AUTO COMPARE LOGIC
// ----------------------------------------
compareLeft.addEventListener('input', handleCompare);
compareRight.addEventListener('input', handleCompare);

function handleCompare() {
    const text1 = compareLeft.value;
    const text2 = compareRight.value;

    // Proses HANYI JIKA kedua sisi telah terisi teks
    if (!text1 || !text2) {
        compareResultContainer.innerHTML = '<p class="text-sm text-orange-600/80 italic text-center py-6">Waiting for input on both sides...</p>';
        return;
    }

    // Split data per baris (kalimat/list)
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');

    const escapeHtml = (str) => {
        if (str === undefined || str === null) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    let leftHtml = '';
    let rightHtml = '';
    let hasMismatch = false;

    // Buat frequency map untuk mengecek "keberadaan" data tanpa peduli urutan baris
    const freq2 = {};
    lines2.forEach(l => freq2[l] = (freq2[l] || 0) + 1);

    for (let i = 0; i < lines1.length; i++) {
        const val = lines1[i];
        if (freq2[val] > 0) {
            freq2[val]--;
            leftHtml += escapeHtml(val) + '\n';
        } else {
            const content = val !== undefined ? (escapeHtml(val) || ' ') : ' ';
            leftHtml += `<span class="bg-orange-200 text-orange-900 font-bold px-1.5 rounded inline-block">${content}</span>\n`;
            hasMismatch = true;
        }
    }

    // Sisi kanan terhadap data kiri
    const freq1 = {};
    lines1.forEach(l => freq1[l] = (freq1[l] || 0) + 1);

    for (let i = 0; i < lines2.length; i++) {
        const val = lines2[i];
        if (freq1[val] > 0) {
            freq1[val]--;
            rightHtml += escapeHtml(val) + '\n';
        } else {
            const content = val !== undefined ? (escapeHtml(val) || ' ') : ' ';
            rightHtml += `<span class="bg-orange-200 text-orange-900 font-bold px-1.5 rounded inline-block">${content}</span>\n`;
            hasMismatch = true;
        }
    }

    // Jika data match 100%
    if (!hasMismatch) {
        compareResultContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-8 text-green-600 bg-green-50 rounded-xl border border-green-200">
                        <i data-lucide="check-circle-2" class="w-12 h-12 mb-3"></i>
                        <span class="text-xl font-black uppercase tracking-widest">Data Match</span>
                    </div>
                `;
        lucide.createIcons();
        return;
    }

    // Render hasil ke 2 box yang identik seperti layout input
    compareResultContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div class="flex flex-col space-y-2">
                        <span class="text-xs font-bold text-orange-500 uppercase tracking-wider">Result (Left)</span>
                        <div 
                            contenteditable="false"
                            class="w-full min-h-[200px] max-h-[500px] p-4 border-2 border-orange-200 rounded-xl bg-white resize-y overflow-auto text-sm font-mono whitespace-pre leading-relaxed"
                        >${leftHtml}</div>
                    </div>
                    <div class="flex flex-col space-y-2">
                        <span class="text-xs font-bold text-orange-500 uppercase tracking-wider">Result (Right)</span>
                        <div 
                            contenteditable="false"
                            class="w-full min-h-[200px] max-h-[500px] p-4 border-2 border-orange-200 rounded-xl bg-white resize-y overflow-auto text-sm font-mono whitespace-pre leading-relaxed"
                        >${rightHtml}</div>
                    </div>
                </div>
            `;
}

// ----------------------------------------
// HELPER: UNIVERSAL CLIPBOARD COPY
// ----------------------------------------
function handleClipboardCopy(text, buttonElement, originalText, defaultBg = 'bg-blue-600', defaultHover = 'hover:bg-blue-700', activeBg = 'bg-green-500', activeHover = 'hover:bg-green-600') {
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
                    buttonElement.innerHTML = `<i data-lucide="file-check" class="w-4 h-4 group-hover:scale-110 transition-transform"></i><span>${originalText}</span>`;
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
