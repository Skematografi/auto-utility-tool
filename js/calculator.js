// ----------------------------------------
// TAB 1: AUTO CALCULATOR LOGIC
// ----------------------------------------
const calcInput = document.getElementById('numberInput');
const calcResultDisplay = document.getElementById('resultValue');
const calcCopyBtn = document.getElementById('copyBtn');
const calcCountDisplay = document.getElementById('dataCount');

// Variabel state penyimpanan nilai mentah
let rawSumValue = 0;

calcInput.addEventListener('input', function () {
    // Izinkan koma agar format ribuan/desimal ala Indonesia bisa dipaste
    const sanitizedValue = this.value.replace(/[^\d.,\-\n]/g, '');
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

// Normalisasi satu baris angka ke format JS (titik = desimal).
// - Tanpa koma: dipakai apa adanya (120, 120.55) -> titik tetap desimal.
// - Ada koma: koma = desimal, titik = pemisah ribuan.
//   contoh: "100,120" -> "100.120" ; "100.120,55" -> "100120.55"
function normalizeNumberToken(line) {
    const s = line.trim();
    if (s.indexOf(',') === -1) return s;
    return s.replace(/\./g, '').replace(/,/g, '.');
}

function calculateSum() {
    const lines = calcInput.value.split('\n');
    let sum = 0;
    let count = 0;

    for (let line of lines) {
        const num = parseFloat(normalizeNumberToken(line));
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
    handleClipboardCopy(rawSumValue.toString(), calcCopyBtn, 'copy result');
});
