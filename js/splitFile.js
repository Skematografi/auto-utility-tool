// ----------------------------------------
// TAB 6: SPLIT FILE LOGIC
// ----------------------------------------

// Elemen Upload & Info File
const splitFileInput = document.getElementById('splitFileInput');
const splitFileInfo = document.getElementById('splitFileInfo');
const splitFileSummary = document.getElementById('splitFileSummary');
const splitColumnList = document.getElementById('splitColumnList');

// Elemen Opsi
const splitColumnName = document.getElementById('splitColumnName');
const splitMaxRows = document.getElementById('splitMaxRows');
const generateSplitBtn = document.getElementById('generateSplitBtn');
const splitStatus = document.getElementById('splitStatus');

// State data hasil parsing file (independen dari tab lain)
let splitData = { headers: [], rows: [], ext: 'csv', baseName: 'data' };

// --- Membaca file Excel / CSV ---
splitFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            const workbook = XLSX.read(evt.target.result, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const aoa = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false });

            if (!aoa.length) {
                showSplitStatus('The uploaded file appears to be empty.', 'error');
                resetSplitData();
                return;
            }

            splitData.headers = aoa[0].map(h => (h === undefined || h === null) ? '' : String(h));
            splitData.rows = aoa.slice(1).filter(row =>
                row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')
            );

            // Simpan ekstensi & nama dasar file untuk penamaan output
            const dot = file.name.lastIndexOf('.');
            splitData.ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : 'csv';
            splitData.baseName = dot >= 0 ? file.name.slice(0, dot) : file.name;

            renderSplitInfo();
            showSplitStatus(`File loaded: "${file.name}".`, 'success');
        } catch (err) {
            console.error(err);
            showSplitStatus('Failed to read the file. Make sure it is a valid Excel/CSV.', 'error');
            resetSplitData();
        }
    };
    reader.readAsArrayBuffer(file);
});

function resetSplitData() {
    splitData = { headers: [], rows: [], ext: 'csv', baseName: 'data' };
    splitFileInfo.classList.add('hidden');
}

function renderSplitInfo() {
    splitFileSummary.textContent = `${splitData.headers.length} columns, ${splitData.rows.length} data rows`;
    splitColumnList.textContent = splitData.headers
        .map((h, i) => `${i + 1} → ${h !== '' ? h : '(no header)'}`)
        .join('\n');
    splitFileInfo.classList.remove('hidden');
    lucide.createIcons();
}

// --- Generate & Download ZIP ---
generateSplitBtn.addEventListener('click', function () {
    if (!splitData.rows.length) {
        showSplitStatus('Please upload an Excel/CSV file with data first.', 'error');
        return;
    }

    const maxRows = parseInt(splitMaxRows.value, 10);
    if (!maxRows || maxRows < 1) {
        showSplitStatus('Please enter a valid max rows per file (min 1).', 'error');
        return;
    }

    // Kolom pengelompokan (opsional) — cocokkan nama kolom (case-insensitive)
    const colName = splitColumnName.value.trim();
    let colIndex = -1;
    if (colName) {
        colIndex = splitData.headers.findIndex(h => h.toLowerCase() === colName.toLowerCase());
        if (colIndex === -1) {
            showSplitStatus(`Column "${colName}" was not found in the file.`, 'error');
            return;
        }
    }

    // Bangun kumpulan baris untuk tiap file — tiap file maksimal `maxRows` baris.
    // Jumlah file dihitung otomatis.
    let buckets = [];
    if (colIndex >= 0) {
        // Kelompokkan baris per nilai kolom, LALU tiap kelompok dipecah sendiri
        // menjadi potongan maksimal `maxRows`. Satu file tidak pernah mencampur kategori.
        const groups = new Map();
        splitData.rows.forEach(row => {
            const key = String(row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(row);
        });

        for (const group of groups.values()) {
            for (let i = 0; i < group.length; i += maxRows) {
                buckets.push(group.slice(i, i + maxRows));
            }
        }
    } else {
        // Split berurutan: potong tiap `maxRows` baris
        for (let i = 0; i < splitData.rows.length; i += maxRows) {
            buckets.push(splitData.rows.slice(i, i + maxRows));
        }
    }

    if (buckets.length === 0) {
        showSplitStatus('No rows to split.', 'error');
        return;
    }

    // Format output mengikuti file yang diupload (csv -> csv, lainnya -> xlsx)
    const outExt = splitData.ext === 'csv' ? 'csv' : 'xlsx';
    const zip = new JSZip();

    // Segmen nama kolom (opsional) untuk penamaan file: [filename]_[columnName]_batch_[n]
    const colSegment = colName ? `_${sanitizeName(colName)}` : '';

    buckets.forEach((rows, i) => {
        const aoa = [splitData.headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(aoa);
        const filename = `${splitData.baseName}${colSegment}_batch_${i + 1}.${outExt}`;

        if (outExt === 'csv') {
            zip.file(filename, XLSX.utils.sheet_to_csv(worksheet));
        } else {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, worksheet, 'Sheet1');
            const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
            zip.file(filename, buffer);
        }
    });

    generateSplitBtn.disabled = true;
    zip.generateAsync({ type: 'blob' }).then(blob => {
        downloadBlob(blob, `${splitData.baseName}_split.zip`);
        showSplitStatus(`Split into ${buckets.length} file(s) and downloaded as ZIP.`, 'success');
        generateSplitBtn.disabled = false;
    }).catch(err => {
        console.error(err);
        showSplitStatus('Failed to build the ZIP file.', 'error');
        generateSplitBtn.disabled = false;
    });
});

// --- Helper: status & download ---
function showSplitStatus(message, type) {
    splitStatus.textContent = message;
    splitStatus.className = 'text-sm font-semibold px-4 py-3 rounded-md flex items-center gap-2 ' + (
        type === 'error'
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    );
    splitStatus.classList.remove('hidden');
}

// Bersihkan karakter yang tidak valid untuk nama file
function sanitizeName(name) {
    return name.trim().replace(/[\\/:*?"<>|]+/g, '_');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
