// Inisialisasi Icons saat pertama kali dimuat
lucide.createIcons();

// Elemen Navigasi Tab
const tabCalcBtn = document.getElementById('tabCalcBtn');
const tabDupBtn = document.getElementById('tabDupBtn');
const tabAsciiBtn = document.getElementById('tabAsciiBtn');
const calcView = document.getElementById('calcView');
const dupView = document.getElementById('dupView');
const asciiView = document.getElementById('asciiView');

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
const copyAsciiListBtn = document.getElementById('copyAsciiListBtn');
const copyCleanTextBtn = document.getElementById('copyCleanTextBtn');
const asciiCountDisplay = document.getElementById('asciiCount');

// Variabel global state penyimpanan data mentah
let rawSumValue = 0;
let rawDuplicateList = []; // Menyimpan teks duplikat murni tanpa counter untuk disalin
let rawNonAsciiList = []; // Menyimpan daftar karakter non-ASCII unik untuk disalin

// ----------------------------------------
// TAB SWITCHING LOGIC
// ----------------------------------------
tabCalcBtn.addEventListener('click', () => switchTab('calc'));
tabDupBtn.addEventListener('click', () => switchTab('dup'));
tabAsciiBtn.addEventListener('click', () => switchTab('ascii'));

function switchTab(tab) {
    // Reset classes
    tabCalcBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer text-gray-500 hover:text-gray-900";
    tabDupBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer text-gray-500 hover:text-gray-900";
    tabAsciiBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer text-gray-500 hover:text-gray-900";

    calcView.classList.add('hidden');
    dupView.classList.add('hidden');
    asciiView.classList.add('hidden');

    if (tab === 'calc') {
        tabCalcBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer bg-white text-blue-600 shadow-sm";
        calcView.classList.remove('hidden');
    } else if (tab === 'dup') {
        tabDupBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer bg-white text-emerald-600 shadow-sm";
        dupView.classList.remove('hidden');
    } else if (tab === 'ascii') {
        tabAsciiBtn.className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer bg-white text-indigo-600 shadow-sm";
        asciiView.classList.remove('hidden');
    }
    lucide.createIcons();
}

// ----------------------------------------
// TAB 1: AUTO CALCULATOR LOGIC
// ----------------------------------------
calcInput.addEventListener('input', function () {
    // Filter: Hanya izinkan angka, titik, minus, dan enter
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

// Fitur Copy Kalkulator
calcCopyBtn.addEventListener('click', function () {
    handleClipboardCopy(rawSumValue.toString(), calcCopyBtn, 'Copy Result');
});


// ----------------------------------------
// TAB 2: FIND DUPLICATES LOGIC
// ----------------------------------------
dupInput.addEventListener('input', function () {
    findDuplicates();
});

function findDuplicates() {
    const text = dupInput.value;
    if (!text.trim()) {
        dupResultDisplay.textContent = "No duplicate items found yet.";
        dupCountDisplay.textContent = "0";
        dupCopyBtn.disabled = true;
        rawDuplicateList = [];
        return;
    }

    // Memisahkan baris, menghilangkan whitespace di awal/akhir, dan membuang baris kosong
    const items = text.split('\n')
        .map(item => item.trim())
        .filter(item => item !== "");

    // Hitung frekuensi tiap elemen
    const frequencies = {};
    items.forEach(item => {
        frequencies[item] = (frequencies[item] || 0) + 1;
    });

    // Cari item yang frekuensinya lebih dari 1
    const duplicates = [];
    rawDuplicateList = []; // Reset list salinan murni

    for (const item in frequencies) {
        if (frequencies[item] > 1) {
            duplicates.push(`${item} (${frequencies[item]}x)`);
            rawDuplicateList.push(item);
        }
    }

    // Update UI
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

// Fitur Copy Duplikat (Hanya list datanya saja tanpa (count))
dupCopyBtn.addEventListener('click', function () {
    if (rawDuplicateList.length === 0) return;
    const textToCopy = rawDuplicateList.join('\n');
    handleClipboardCopy(textToCopy, dupCopyBtn, 'Copy List Only', 'bg-emerald-600', 'hover:bg-emerald-700', 'bg-green-500', 'hover:bg-green-600');
});


// ----------------------------------------
// TAB 3: AUTO DETECT NON-ASCII LOGIC
// ----------------------------------------
asciiInput.addEventListener('input', function () {
    detectNonAscii();
});

function detectNonAscii() {
    const text = asciiInput.value;
    if (!text) {
        asciiResultDisplay.textContent = "No non-ASCII characters found.";
        asciiCountDisplay.textContent = "0";
        copyAsciiListBtn.disabled = true;
        copyCleanTextBtn.disabled = true;
        rawNonAsciiList = [];
        return;
    }

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
    nonAsciiMatches.forEach(char => {
        frequencies[char] = (frequencies[char] || 0) + 1;
    });

    const uniqueList = [];
    rawNonAsciiList = [];

    for (const char in frequencies) {
        // Konversi karakter ke format representasi Unicode (Hex)
        const hexCode = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
        const unicodeLabel = `U+${hexCode}`;

        uniqueList.push(`"${char}" (${unicodeLabel}) — ${frequencies[char]}x`);
        rawNonAsciiList.push(char);
    }

    // Tampilkan list dan detail statistik
    asciiResultDisplay.textContent = uniqueList.join('\n');
    asciiCountDisplay.textContent = nonAsciiMatches.length;

    // Aktifkan tombol copy jika ada hasil
    copyAsciiListBtn.disabled = false;
    copyCleanTextBtn.disabled = false;
}

// Salin Karakter Non-ASCII unik yang ditemukan
copyAsciiListBtn.addEventListener('click', function () {
    if (rawNonAsciiList.length === 0) return;
    const textToCopy = rawNonAsciiList.join('');
    handleClipboardCopy(textToCopy, copyAsciiListBtn, 'Copy List Only', 'bg-indigo-600', 'hover:bg-indigo-700', 'bg-green-500', 'hover:bg-green-600');
});

// Salin Teks Asli yang telah dibersihkan dari Non-ASCII (Hanya menyisakan ASCII standard)
copyCleanTextBtn.addEventListener('click', function () {
    const originalText = asciiInput.value;
    // Bersihkan semua karakter selain range standard ASCII (\x00 - \x7F)
    const cleanedText = originalText.replace(/[^\x00-\x7F]/g, '');
    handleClipboardCopy(cleanedText, copyCleanTextBtn, 'Copy Cleaned Text', 'bg-slate-600', 'hover:bg-slate-700', 'bg-green-500', 'hover:bg-green-600');
});


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
            // Feedback Visual
            buttonElement.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i><span>Copied!</span>`;
            buttonElement.classList.remove(defaultBg, defaultHover);
            buttonElement.classList.add(activeBg, activeHover);
            lucide.createIcons();

            setTimeout(() => {
                let iconName = 'copy';
                // Sesuaikan ikon yang tepat untuk tombol "Copy Cleaned Text"
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
