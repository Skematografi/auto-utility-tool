// ----------------------------------------
// TAB 8: CHARACTER COUNT LOGIC
// Hitung total karakter + estimasi ukuran penyimpanan di database:
// UTF-8 (MySQL utf8mb4 / PostgreSQL) dan UTF-16 (SQL Server NVARCHAR)
// ----------------------------------------
const charCountInput = document.getElementById('charCountInput');
const charCountTotal = document.getElementById('charCountTotal');
const charCountLines = document.getElementById('charCountLines');
const charCountWords = document.getElementById('charCountWords');
const charCountSentences = document.getElementById('charCountSentences');
const charCountParagraphs = document.getElementById('charCountParagraphs');
const charCountSpaces = document.getElementById('charCountSpaces');
const charCountUtf8 = document.getElementById('charCountUtf8');
const charCountUtf8Bytes = document.getElementById('charCountUtf8Bytes');
const charCountUtf16 = document.getElementById('charCountUtf16');
const charCountUtf16Bytes = document.getElementById('charCountUtf16Bytes');

const charCountEncoder = new TextEncoder();

charCountInput.addEventListener('input', updateCharCount);

// Format bytes menjadi satuan yang mudah dibaca (basis 1024)
function formatCharCountSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function updateCharCount() {
    const text = charCountInput.value;

    if (text === '') {
        charCountTotal.textContent = '0';
        charCountLines.textContent = '0';
        charCountWords.textContent = '0';
        charCountSentences.textContent = '0';
        charCountParagraphs.textContent = '0';
        charCountSpaces.textContent = '0';
        charCountUtf8.textContent = '0 B';
        charCountUtf8Bytes.textContent = '0 bytes';
        charCountUtf16.textContent = '0 B';
        charCountUtf16Bytes.textContent = '0 bytes';
        return;
    }

    // Hitung per code point (emoji / karakter di luar BMP tetap dihitung 1)
    const totalChars = Array.from(text).length;
    const totalLines = text.split('\n').length;

    // Kata: dipisah whitespace apa pun; kalimat: dipisah . ! ? ;
    // paragraf: blok teks yang dipisah baris kosong; spasi: karakter ' ' saja
    const totalWords = text.split(/\s+/).filter(w => w !== '').length;
    const totalSentences = text.split(/[.!?]+/).filter(s => s.trim() !== '').length;
    const totalParagraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== '').length;
    const totalSpaces = (text.match(/ /g) || []).length;

    // UTF-8: byte asli teks — sama dengan storage MySQL utf8mb4 / PostgreSQL
    const utf8Bytes = charCountEncoder.encode(text).length;
    // UTF-16: 2 byte per code unit — estimasi SQL Server NVARCHAR
    const utf16Bytes = text.length * 2;

    charCountTotal.textContent = totalChars.toLocaleString('en-US');
    charCountLines.textContent = totalLines.toLocaleString('en-US');
    charCountWords.textContent = totalWords.toLocaleString('en-US');
    charCountSentences.textContent = totalSentences.toLocaleString('en-US');
    charCountParagraphs.textContent = totalParagraphs.toLocaleString('en-US');
    charCountSpaces.textContent = totalSpaces.toLocaleString('en-US');
    charCountUtf8.textContent = formatCharCountSize(utf8Bytes);
    charCountUtf8Bytes.textContent = `${utf8Bytes.toLocaleString('en-US')} bytes`;
    charCountUtf16.textContent = formatCharCountSize(utf16Bytes);
    charCountUtf16Bytes.textContent = `${utf16Bytes.toLocaleString('en-US')} bytes`;
}
