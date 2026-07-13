// ----------------------------------------
// TAB 4: AUTO COMPARE LOGIC
// ----------------------------------------
const compareLeft = document.getElementById('compareLeft');
const compareRight = document.getElementById('compareRight');
const compareResultContainer = document.getElementById('compareResultContainer');

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
