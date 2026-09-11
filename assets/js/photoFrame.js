// ----------------------------------------
// PHOTO REFERENCE
// A left-docked, Instagram-story-style panel outside the main card: pin up
// to 10 images for visual reference while working (screenshots, diagrams,
// ERDs). They auto-shuffle every 5s (pausing on hover), with left/right tap
// zones for manual navigation. Unlike the sticky note, nothing here is
// persisted — photos live only in memory for the current page session and
// are gone on reload.
// Wrapped in an IIFE because every script here shares one global scope.
// ----------------------------------------
(function initPhotoFrame() {
    const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per photo
    const MAX_PHOTOS = 10;
    const SLIDE_INTERVAL = 5000;

    const panel = document.getElementById('photoPanel');
    const backdrop = document.getElementById('photoBackdrop');
    const fab = document.getElementById('photoFab');
    const closeBtn = document.getElementById('photoCloseBtn');
    const stage = document.getElementById('photoStage');
    const dropzone = document.getElementById('photoDropzone');
    const fileInput = document.getElementById('photoFileInput');
    const previewWrap = document.getElementById('photoPreviewWrap');
    const previewImg = document.getElementById('photoPreviewImg');
    const progress = document.getElementById('photoProgress');
    const addBtn = document.getElementById('photoAddBtn');
    const deleteBtn = document.getElementById('photoDeleteBtn');
    const prevZone = document.getElementById('photoPrevZone');
    const nextZone = document.getElementById('photoNextZone');
    const countLabel = document.getElementById('photoCountLabel');
    const clearAllBtn = document.getElementById('photoClearAllBtn');
    const status = document.getElementById('photoStatus');
    if (!panel || !fab || !fileInput) return;

    let photos = []; // [{ url, name }] — in-memory only, never written to storage
    let currentIndex = 0;
    let slideTimer = null;

    function showStatus(message, type) {
        status.textContent = message;
        status.className = 'absolute bottom-2 left-1/2 -translate-x-1/2 z-20 text-xs font-semibold px-3 py-1.5 rounded-md whitespace-nowrap ' + (
            type === 'error' ? 'bg-red-500/80 text-white' : 'bg-emerald-500/80 text-white'
        );
        clearTimeout(status._hideTimer);
        status._hideTimer = setTimeout(function () { status.classList.add('hidden'); }, 2500);
    }

    function render() {
        const hasPhotos = photos.length > 0;
        dropzone.classList.toggle('hidden', hasPhotos);
        previewWrap.classList.toggle('hidden', !hasPhotos);
        if (!hasPhotos) return;

        if (currentIndex >= photos.length) currentIndex = photos.length - 1;
        previewImg.src = photos[currentIndex].url;
        countLabel.textContent = (currentIndex + 1) + ' / ' + photos.length;

        progress.innerHTML = '';
        photos.forEach(function (_, i) {
            const bar = document.createElement('div');
            bar.className = 'flex-1 h-[3px] rounded-full ' + (i === currentIndex ? 'bg-white' : 'bg-white/30');
            progress.appendChild(bar);
        });
    }

    function showAt(index) {
        currentIndex = ((index % photos.length) + photos.length) % photos.length;
        render();
    }

    function showRandom() {
        if (photos.length < 2) return;
        let next;
        do {
            next = Math.floor(Math.random() * photos.length);
        } while (next === currentIndex);
        showAt(next);
    }

    function startSlideshow() {
        stopSlideshow();
        if (photos.length > 1 && document.documentElement.classList.contains('photo-open')) {
            slideTimer = setInterval(showRandom, SLIDE_INTERVAL);
        }
    }

    function stopSlideshow() {
        clearTimeout(slideTimer);
        clearInterval(slideTimer);
        slideTimer = null;
    }

    function attachFiles(fileList) {
        const files = Array.from(fileList || []);
        let added = 0;
        let rejected = false;

        for (const file of files) {
            if (photos.length >= MAX_PHOTOS) {
                rejected = true;
                break;
            }
            if (!file.type.startsWith('image/')) {
                rejected = true;
                continue;
            }
            if (file.size > MAX_BYTES) {
                rejected = true;
                continue;
            }
            photos.push({ url: URL.createObjectURL(file), name: file.name });
            added++;
        }

        if (added > 0) {
            currentIndex = photos.length - 1; // jump to the newest addition
            render();
            startSlideshow();
        }
        if (rejected) {
            showStatus(
                photos.length >= MAX_PHOTOS
                    ? 'max ' + MAX_PHOTOS + ' photos'
                    : 'skipped a file — images only, max 8 MB each',
                'error'
            );
        }
    }

    function removeCurrent() {
        if (photos.length === 0) return;
        URL.revokeObjectURL(photos[currentIndex].url);
        photos.splice(currentIndex, 1);
        if (currentIndex >= photos.length) currentIndex = Math.max(0, photos.length - 1);
        render();
        startSlideshow();
    }

    function clearAll() {
        photos.forEach(function (p) { URL.revokeObjectURL(p.url); });
        photos = [];
        currentIndex = 0;
        stopSlideshow();
        render();
        fileInput.value = '';
    }

    function setOpen(open) {
        document.documentElement.classList.toggle('photo-open', open);
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        fab.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
            closeBtn.focus();
            startSlideshow();
        } else {
            fab.focus();
            stopSlideshow();
        }
    }

    fab.addEventListener('click', function () { setOpen(true); });
    closeBtn.addEventListener('click', function () { setOpen(false); });
    backdrop.addEventListener('click', function () { setOpen(false); });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && document.documentElement.classList.contains('photo-open')) {
            setOpen(false);
        }
    });

    fileInput.addEventListener('change', function () {
        attachFiles(fileInput.files);
    });
    addBtn.addEventListener('click', function () { fileInput.click(); });
    deleteBtn.addEventListener('click', removeCurrent);
    clearAllBtn.addEventListener('click', clearAll);
    prevZone.addEventListener('click', function () { showAt(currentIndex - 1); startSlideshow(); });
    nextZone.addEventListener('click', function () { showAt(currentIndex + 1); startSlideshow(); });

    // Drag-and-drop works on the whole stage, not just the empty-state dropzone,
    // so more photos can be added while some are already attached.
    stage.addEventListener('dragover', function (event) {
        event.preventDefault();
        dropzone.classList.add('bg-white/10');
    });
    stage.addEventListener('dragleave', function () {
        dropzone.classList.remove('bg-white/10');
    });
    stage.addEventListener('drop', function (event) {
        event.preventDefault();
        dropzone.classList.remove('bg-white/10');
        attachFiles(event.dataTransfer.files);
    });

    // Only act while the panel is open, so pasting elsewhere on the page is untouched.
    document.addEventListener('paste', function (event) {
        if (!document.documentElement.classList.contains('photo-open')) return;
        const items = event.clipboardData ? event.clipboardData.items : [];
        const imageFiles = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) imageFiles.push(items[i].getAsFile());
        }
        if (imageFiles.length > 0) attachFiles(imageFiles);
    });

    // Pause the shuffle while the user is looking closely.
    stage.addEventListener('mouseenter', stopSlideshow);
    stage.addEventListener('mouseleave', startSlideshow);

    // Exposed for the command palette — same real-DOM-state check as
    // window.toggleNote, since a synthetic click can't be blocked by the
    // FAB's own pointer-events:none while the panel is open.
    window.togglePhotoFrame = function () {
        setOpen(!document.documentElement.classList.contains('photo-open'));
    };
})();
