// ----------------------------------------
// TAB 3: AUTO DETECT NON-ASCII LOGIC
// ----------------------------------------
const asciiInput = document.getElementById('asciiInput');
const asciiResultDisplay = document.getElementById('asciiResultValue');
const asciiHighlightPreview = document.getElementById('asciiHighlightPreview');
const copyAsciiListBtn = document.getElementById('copyAsciiListBtn');
const copyCleanTextBtn = document.getElementById('copyCleanTextBtn');
const asciiCountDisplay = document.getElementById('asciiCount');

// Variabel state penyimpanan data mentah
let rawNonAsciiList = [];

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
