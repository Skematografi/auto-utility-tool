// ----------------------------------------
// TAB 4: AUTO COMPARE LOGIC
// ----------------------------------------
const compareLeft = document.getElementById('compareLeft');
const compareRight = document.getElementById('compareRight');
const compareResultContainer = document.getElementById('compareResultContainer');
const exportCompareBtn = document.getElementById('exportCompareBtn');
const exportCompareSelect = document.getElementById('exportCompareSelect');
const compareExportStatus = document.getElementById('compareExportStatus');

// Last computed compare result, kept for the export button
let compareLastResult = null;

compareLeft.addEventListener('input', handleCompare);
compareRight.addEventListener('input', handleCompare);
exportCompareBtn.addEventListener('click', handleCompareExport);

function handleCompare() {
    const text1 = compareLeft.value;
    const text2 = compareRight.value;

    // Process ONLY IF both sides have text
    if (!text1 || !text2) {
        compareResultContainer.innerHTML = '<p class="text-sm text-zinc-600 italic text-center py-6">Waiting for input on both sides...</p>';
        compareLastResult = null;
        exportCompareBtn.disabled = true;
        return;
    }

    // Split the data by line (sentence/list)
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');

    const escapeHtml = (str) => {
        if (str === undefined || str === null) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    let leftHtml = '';
    let rightHtml = '';
    let hasMismatch = false;

    // Raw values kept for the export button, split by match/no-match
    const matchLeft = [];
    const nomatchLeft = [];
    const matchRight = [];
    const nomatchRight = [];

    // Build a frequency map to check data "presence" regardless of line order
    const freq2 = {};
    lines2.forEach(l => freq2[l] = (freq2[l] || 0) + 1);

    for (let i = 0; i < lines1.length; i++) {
        const val = lines1[i];
        if (freq2[val] > 0) {
            freq2[val]--;
            leftHtml += escapeHtml(val) + '\n';
            matchLeft.push(val);
        } else {
            const content = val !== undefined ? (escapeHtml(val) || ' ') : ' ';
            leftHtml += `<span class="bg-amber-500/25 text-amber-200 font-bold px-1.5 rounded inline-block">${content}</span>\n`;
            hasMismatch = true;
            nomatchLeft.push(val);
        }
    }

    // Right side against the left data
    const freq1 = {};
    lines1.forEach(l => freq1[l] = (freq1[l] || 0) + 1);

    for (let i = 0; i < lines2.length; i++) {
        const val = lines2[i];
        if (freq1[val] > 0) {
            freq1[val]--;
            rightHtml += escapeHtml(val) + '\n';
            matchRight.push(val);
        } else {
            const content = val !== undefined ? (escapeHtml(val) || ' ') : ' ';
            rightHtml += `<span class="bg-amber-500/25 text-amber-200 font-bold px-1.5 rounded inline-block">${content}</span>\n`;
            hasMismatch = true;
            nomatchRight.push(val);
        }
    }

    // Persist for export: "match/nomatch between left vs right" = the combined
    // set from both sides (left's matched/unmatched plus right's matched/unmatched)
    compareLastResult = {
        matchLeft,
        nomatchLeft,
        matchRight,
        nomatchRight,
        matchBoth: matchLeft.concat(matchRight),
        nomatchBoth: nomatchLeft.concat(nomatchRight)
    };
    exportCompareBtn.disabled = false;

    // If the data matches 100%
    if (!hasMismatch) {
        compareResultContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-8 text-emerald-400 bg-emerald-500/10 rounded-md border border-emerald-500/30">
                        <i data-lucide="check-circle-2" class="w-12 h-12 mb-3"></i>
                        <span class="text-xl font-black uppercase tracking-widest">Data Match</span>
                    </div>
                `;
        lucide.createIcons();
        return;
    }

    // Render the result into 2 boxes identical to the input layout
    compareResultContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div class="flex flex-col space-y-2">
                        <span class="text-xs font-bold text-zinc-500">> result (left)</span>
                        <div
                            contenteditable="false"
                            class="w-full min-h-[200px] max-h-[500px] p-4 border border-zinc-800 rounded-md bg-black/60 resize-y overflow-auto text-sm text-zinc-200 whitespace-pre leading-relaxed thin-scroll"
                        >${leftHtml}</div>
                    </div>
                    <div class="flex flex-col space-y-2">
                        <span class="text-xs font-bold text-zinc-500">> result (right)</span>
                        <div
                            contenteditable="false"
                            class="w-full min-h-[200px] max-h-[500px] p-4 border border-zinc-800 rounded-md bg-black/60 resize-y overflow-auto text-sm text-zinc-200 whitespace-pre leading-relaxed thin-scroll"
                        >${rightHtml}</div>
                    </div>
                </div>
            `;
}

// ----------------------------------------
// EXPORT COMPARE RESULT
// "all" -> one .xlsx with a sheet per category; a single category -> plain .txt
// ----------------------------------------
const COMPARE_EXPORT_SHEETS = [
    ['matchLeft', 'match_left'],
    ['nomatchLeft', 'nomatch_left'],
    ['matchRight', 'match_right'],
    ['nomatchRight', 'nomatch_right'],
    ['matchBoth', 'match_both'],
    ['nomatchBoth', 'nomatch_both']
];

function handleCompareExport() {
    if (!compareLastResult) {
        showCompareExportStatus('Nothing to export yet — compare data first.', 'error');
        return;
    }

    const selected = exportCompareSelect.value;
    const timestamp = compareTimestamp();

    try {
        if (selected === 'all') {
            const wb = XLSX.utils.book_new();
            COMPARE_EXPORT_SHEETS.forEach(([key, sheetName]) => {
                const aoa = [['value'], ...compareLastResult[key].map(v => [v])];
                const worksheet = XLSX.utils.aoa_to_sheet(aoa);
                XLSX.utils.book_append_sheet(wb, worksheet, sheetName);
            });
            XLSX.writeFile(wb, `DataDev-Utilities-diff-${timestamp}.xlsx`);
            showCompareExportStatus('Exported 6 sheets (match/no-match for left, right, and both).', 'success');
        } else {
            const sheetName = COMPARE_EXPORT_SHEETS.find(([key]) => key === selected)[1];
            const values = compareLastResult[selected];
            const blob = new Blob([values.join('\n')], { type: 'text/plain;charset=utf-8' });
            compareDownloadBlob(blob, `DataDev-Utilities-diff-${sheetName}-${timestamp}.txt`);
            showCompareExportStatus(`Exported "${sheetName}" (${values.length} row(s)) as .txt.`, 'success');
        }
    } catch (err) {
        console.error(err);
        showCompareExportStatus('Failed to build the export file.', 'error');
    }
}

function compareTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

function compareDownloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showCompareExportStatus(message, type) {
    compareExportStatus.textContent = message;
    compareExportStatus.className = 'mt-4 text-sm font-semibold px-4 py-3 rounded-md ' + (
        type === 'error'
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    );
    compareExportStatus.classList.remove('hidden');
}
