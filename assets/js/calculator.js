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
    // Allow commas (Indonesian-style numbers) and the operators + - * / (formulas) and spaces
    const sanitizedValue = this.value.replace(/[^\d.,\-+*/ \n]/g, '');
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

// A line is a formula when, ignoring a single leading '-' (negative sign),
// it still contains one of the operators + - * /.
// e.g. "1*5" and "10-5" are formulas; "-5" and "100.120,55" are plain numbers.
function isFormula(line) {
    const body = line[0] === '-' ? line.slice(1) : line;
    return /[+\-*/]/.test(body);
}

// Evaluate a simple arithmetic expression (+ - * /) with operator precedence.
// A small parser is used instead of eval() for safety. Numbers use '.' as the
// decimal separator (Indonesian formatting is not applied inside formulas).
// Returns NaN for anything that cannot be parsed.
function evaluateFormula(expr) {
    const s = expr.replace(/\s+/g, '');
    const output = [];
    const ops = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

    const apply = (op) => {
        const b = output.pop();
        const a = output.pop();
        if (a === undefined || b === undefined) { output.push(NaN); return; }
        if (op === '+') output.push(a + b);
        else if (op === '-') output.push(a - b);
        else if (op === '*') output.push(a * b);
        else output.push(b === 0 ? NaN : a / b);
    };

    let i = 0;
    while (i < s.length) {
        const c = s[i];
        if ((c >= '0' && c <= '9') || c === '.') {
            let num = '';
            while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) num += s[i++];
            output.push(parseFloat(num));
        } else if (c === '+' || c === '-' || c === '*' || c === '/') {
            const prev = s[i - 1];
            const isUnary = i === 0 || prev === '+' || prev === '-' || prev === '*' || prev === '/';
            if ((c === '+' || c === '-') && isUnary) {
                // Unary sign: fold it into the following number
                let sign = 1;
                while (i < s.length && (s[i] === '+' || s[i] === '-')) { if (s[i] === '-') sign = -sign; i++; }
                let num = '';
                while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) num += s[i++];
                if (num === '') return NaN;
                output.push(sign * parseFloat(num));
            } else {
                while (ops.length && precedence[ops[ops.length - 1]] >= precedence[c]) apply(ops.pop());
                ops.push(c);
                i++;
            }
        } else {
            return NaN;
        }
    }
    while (ops.length) apply(ops.pop());
    return output.length === 1 ? output[0] : NaN;
}

function calculateSum() {
    const lines = calcInput.value.split('\n');
    let sum = 0;
    let count = 0;

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') continue;

        // Formula lines are evaluated; plain numbers keep the Indonesian-format handling
        const value = isFormula(trimmed)
            ? evaluateFormula(trimmed)
            : parseFloat(normalizeNumberToken(trimmed));

        if (!isNaN(value)) {
            sum += value;
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
