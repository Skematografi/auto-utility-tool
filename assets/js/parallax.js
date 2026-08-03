// ----------------------------------------
// BACKGROUND PARALLAX
// Dark theme: deep-space starfield in 3 depth layers (far = small, dim, slow →
// near = large, bright, fast). Light theme: soft clouds drifting slowly across a blue sky.
// Guard: respect prefers-reduced-motion (render static), pause when the tab is inactive,
// and can be turned off via the footer toggle (preference stored in localStorage).
// ----------------------------------------
(function initParallax() {
    const canvas = document.getElementById('bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const toggleBtn = document.getElementById('bgToggle');

    const PREF_KEY = 'datadev_bg';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Depth layers (share = proportion of the count, speed = px/second)
    const LAYERS = [
        { r: [0.4, 0.8], speed: 4, share: 0.58, alpha: [0.20, 0.45], em: 0.05, halo: false },
        { r: [0.8, 1.3], speed: 9, share: 0.30, alpha: [0.35, 0.65], em: 0.10, halo: false },
        { r: [1.4, 2.2], speed: 17, share: 0.12, alpha: [0.55, 0.95], em: 0.20, halo: true },
    ];

    // Cloud layers for the light theme (speed = px/second, drifting sideways)
    const CLOUD_LAYERS = [
        { scale: [1.1, 1.6], speed: 5, share: 0.45, alpha: [0.30, 0.50] },
        { scale: [1.8, 2.5], speed: 9, share: 0.35, alpha: [0.45, 0.70] },
        { scale: [2.8, 3.8], speed: 15, share: 0.20, alpha: [0.65, 0.90] },
    ];

    let stars = [], clouds = [], raf = null, lastT = 0;
    let enabled = (localStorage.getItem(PREF_KEY) || 'on') !== 'off';

    function isLight() { return document.documentElement.classList.contains('light'); }

    function rand(a, b) { return a + Math.random() * (b - a); }

    function initClouds() {
        const total = Math.max(4, Math.min(10, Math.floor(innerWidth / 260)));
        clouds = [];
        for (const L of CLOUD_LAYERS) {
            const n = Math.max(1, Math.round(total * L.share));
            for (let i = 0; i < n; i++) {
                const scale = rand(L.scale[0], L.scale[1]);
                clouds.push({
                    x: Math.random() * innerWidth,
                    y: Math.random() * innerHeight * 0.85,
                    scale,
                    speed: L.speed,
                    a: rand(L.alpha[0], L.alpha[1]),
                    // Each cloud is a small cluster of overlapping puffs
                    puffs: Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => ({
                        dx: rand(-55, 55),
                        dy: rand(-12, 12),
                        r: rand(22, 46),
                    })),
                });
            }
        }
    }

    function drawCloud(c) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        for (const p of c.puffs) {
            const grad = ctx.createRadialGradient(p.dx, p.dy, 0, p.dx, p.dy, p.r);
            grad.addColorStop(0, 'rgba(255,255,255,' + c.a + ')');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.dx, p.dy, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function initStars() {
        const total = Math.min(520, Math.floor((innerWidth * innerHeight) / 4200));
        stars = [];
        for (const L of LAYERS) {
            const n = Math.round(total * L.share);
            for (let i = 0; i < n; i++) {
                stars.push({
                    x: Math.random() * innerWidth,
                    y: Math.random() * innerHeight,
                    r: rand(L.r[0], L.r[1]),
                    a: rand(L.alpha[0], L.alpha[1]),
                    speed: L.speed,
                    halo: L.halo,
                    tw: Math.random() * Math.PI * 2,
                    em: Math.random() < L.em,
                });
            }
        }
    }

    function clear() { ctx.clearRect(0, 0, innerWidth, innerHeight); }

    function drawStar(s, t, animate) {
        let alpha = s.a;
        if (animate) alpha += Math.sin(t * 0.0009 + s.tw) * 0.12;
        alpha = Math.max(0, Math.min(0.97, alpha));
        const rgb = s.em ? '110,231,183' : '226,232,240';
        if (s.halo) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + rgb + ',' + (alpha * 0.10) + ')';
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ',' + alpha + ')';
        ctx.fill();
    }

    function drawStatic() {
        clear();
        if (isLight()) { for (const c of clouds) drawCloud(c); return; }
        for (const s of stars) drawStar(s, 0, false);
    }

    function frame(t) {
        if (!lastT) lastT = t;
        let dt = (t - lastT) / 1000; lastT = t;
        if (dt > 0.05) dt = 0.05; // prevent a jump after a pause
        clear();

        if (isLight()) {
            // Clouds drift slowly to the right and wrap around
            for (const c of clouds) {
                c.x += c.speed * dt;
                const margin = 160 * c.scale;
                if (c.x - margin > innerWidth) {
                    c.x = -margin;
                    c.y = Math.random() * innerHeight * 0.85;
                }
                drawCloud(c);
            }
        } else {
            for (const s of stars) {
                s.y -= s.speed * dt;          // move upward (sense of flying forward)
                if (s.y < -3) { s.y = innerHeight + 3; s.x = Math.random() * innerWidth; }
                drawStar(s, t, true);
            }
        }
        raf = requestAnimationFrame(frame);
    }

    function start() { stop(); lastT = 0; raf = requestAnimationFrame(frame); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    function apply() {
        stop();
        if (!enabled) { clear(); return; }
        if (reduce) { drawStatic(); return; }
        start();
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = innerWidth * dpr;
        canvas.height = innerHeight * dpr;
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initStars();
        initClouds();
        apply();
    }

    function updateToggle() {
        if (!toggleBtn) return;
        toggleBtn.classList.toggle('text-emerald-400', enabled);
        toggleBtn.classList.toggle('text-zinc-600', !enabled);
        // (the emerald class is repainted blue by the light-mode stylesheet)
        toggleBtn.title = enabled ? 'Background: on (click to turn off)' : 'Background: off (click to turn on)';
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            enabled = !enabled;
            try { localStorage.setItem(PREF_KEY, enabled ? 'on' : 'off'); } catch (e) { /* ignore */ }
            updateToggle();
            apply();
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (enabled && !reduce) start();
    });
    addEventListener('resize', resize);

    // Repaint with the other backdrop (stars <-> clouds) when the theme changes
    document.addEventListener('themechange', apply);

    updateToggle();
    resize();
})();
