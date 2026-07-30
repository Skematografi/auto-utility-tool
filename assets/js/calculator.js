// ----------------------------------------
// TAB 1: AUTO CALCULATOR LOGIC
// ----------------------------------------
const calcInput = document.getElementById('numberInput');
const calcResultDisplay = document.getElementById('resultValue');
const calcCopyBtn = document.getElementById('copyBtn');
const calcCountDisplay = document.getElementById('dataCount');

// State variable holding the raw value
let rawSumValue = 0;

calcInput.addEventListener('input', function () {
    // Allow commas so Indonesian-style thousand/decimal formats can be pasted
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

// Normalize a single number line to JS format (dot = decimal).
// - No comma: used as-is (120, 120.55) -> dot stays as the decimal.
// - Has comma: comma = decimal, dot = thousands separator.
//   example: "100,120" -> "100.120" ; "100.120,55" -> "100120.55"
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
