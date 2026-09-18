/**
 * Butterscotch Web - Straight Angled Police & Hazard Barrier Tapes Background
 * 
 * Ultra-lightweight, high-performance straight tilted barrier tapes ("Pita Pembatas Lurus Miring").
 * Zero wave curvature or spline calculations for maximum 60fps performance and minimal GPU/CPU load.
 * 
 * Features:
 * - Tape 1: Tilted Straight Police Caution Marquee Tape with continuous scrolling warning text.
 * - Tape 2: Tilted Straight 45° Diagonal Hazard Stripe Tape (Belang Kuning/Hitam atau Aksen/Hitam).
 * - Tape 3: Narrow Secondary Ambient Hazard Line.
 * - Dynamic theme color syncing (Gold, Red, Sakura).
 * - Smooth scroll parallax and battery-saving lifecycle.
 */
(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let canvas = null;
    let ctx = null;
    let animationFrameId = null;
    let isRunning = false;

    let width = 0;
    let height = 0;
    let dpr = 1;

    // Scroll & Mouse parallax tracking
    let scrollY = 0;
    let targetScrollY = 0;
    let mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };

    // Dynamic theme color state with smooth lerping
    const colorState = {
        accent: { r: 245, g: 158, b: 11 },
        targetAccent: { r: 245, g: 158, b: 11 },
        dark: { r: 9, g: 10, b: 15 },
        isDark: true
    };

    function hexToRgb(hex) {
        let c = hex.replace('#', '').trim();
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        if (isNaN(num)) return { r: 245, g: 158, b: 11 };
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    function parseColor(str) {
        if (!str) return { r: 245, g: 158, b: 11 };
        str = str.trim();
        if (str.startsWith('#')) return hexToRgb(str);
        const rgbMatch = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1], 10),
                g: parseInt(rgbMatch[2], 10),
                b: parseInt(rgbMatch[3], 10)
            };
        }
        return { r: 245, g: 158, b: 11 };
    }

    function updateThemeColors() {
        const rootStyle = getComputedStyle(document.documentElement);
        const accentStr = rootStyle.getPropertyValue('--accent') || '#f59e0b';
        colorState.targetAccent = parseColor(accentStr);

        const theme = document.documentElement.getAttribute('data-theme');
        colorState.isDark = theme !== 'light';
    }

    function lerpColor(curr, target, factor) {
        curr.r += (target.r - curr.r) * factor;
        curr.g += (target.g - curr.g) * factor;
        curr.b += (target.b - curr.b) * factor;
    }

    // Straight Tilted Barrier Tapes Configuration
    const straightTapes = [
        // Tape 0: Upper Crossing Diagonal Hazard Stripes Tape (Tilted Straight)
        {
            type: 'stripes',
            yRatio: 0.18,
            angleDeg: -10.5,
            width: 44,
            stripeWidth: 26,
            scrollSpeed: 0.045,
            opacity: 0.88,
            parallax: 0.12
        },
        // Tape 1: Main Mid-Lower Crossing Diagonal Hazard Stripes Tape (Opposing Angle)
        {
            type: 'stripes',
            yRatio: 0.60,
            angleDeg: 13.0,
            width: 46,
            stripeWidth: 28,
            scrollSpeed: -0.038,
            opacity: 0.85,
            parallax: 0.18
        },
        // Tape 2: Secondary Lower Ambient Hazard Line (Tilted Straight)
        {
            type: 'stripes',
            yRatio: 0.88,
            angleDeg: -7.0,
            width: 28,
            stripeWidth: 16,
            scrollSpeed: 0.024,
            opacity: 0.70,
            parallax: 0.08
        }
    ];

    function resize() {
        if (!canvas) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (prefersReducedMotion) {
            renderFrame(0);
        }
    }

    /**
     * Renders a straight tilted hazard stripe barrier tape.
     * Uses local rotated 2D space for ultra-fast, zero-overhead drawing.
     */
    function renderStraightStripesTape(tape, time) {
        const isMobile = width <= 768;
        const tapeW = isMobile ? tape.width * 0.82 : tape.width;
        const Hw = tapeW / 2;
        const stripeW = isMobile ? tape.stripeWidth * 0.85 : tape.stripeWidth;

        // Diagonal length needed to span screen across any rotation
        const totalLen = Math.hypot(width, height) + 300;
        const halfLen = totalLen / 2;

        // Origin with parallax shift
        const cy = height * tape.yRatio - (scrollY * 0.04 * tape.parallax) + (mouse.y - 0.5) * 12;
        const cx = width / 2 + (mouse.x - 0.5) * 16;
        const angleRad = (tape.angleDeg * Math.PI) / 180;

        const cr = Math.round(colorState.accent.r);
        const cg = Math.round(colorState.accent.g);
        const cb = Math.round(colorState.accent.b);

        const op = colorState.isDark ? tape.opacity : tape.opacity * 0.75;
        const accentColor = `rgba(${cr}, ${cg}, ${cb}, ${op})`;
        const darkColor = colorState.isDark
            ? `rgba(9, 10, 15, ${op * 0.95})`
            : `rgba(15, 23, 42, ${op * 0.85})`;

        const borderColor = colorState.isDark
            ? `rgba(0, 0, 0, ${op * 0.98})`
            : `rgba(15, 23, 42, ${op * 0.90})`;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRad);

        // Ambient shadow for floating depth
        ctx.shadowColor = colorState.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.16)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 5;

        // 1. Fill base tape rectangle with Accent Color
        ctx.fillStyle = accentColor;
        ctx.fillRect(-halfLen, -Hw, totalLen, tapeW);

        // Remove shadow for inner content
        ctx.shadowColor = 'transparent';

        // 2. Draw alternating 45° diagonal dark stripes inside clipped tape region
        ctx.save();
        ctx.beginPath();
        ctx.rect(-halfLen, -Hw, totalLen, tapeW);
        ctx.clip();

        ctx.fillStyle = darkColor;
        const step = stripeW * 2;
        const scrollOffset = (time * tape.scrollSpeed) % step;

        ctx.beginPath();
        for (let x = -halfLen - step; x < halfLen + step; x += step) {
            const x0 = x + scrollOffset;
            const x1 = x0 + stripeW;

            // 45-degree slanted parallelogram
            ctx.moveTo(x0 + Hw, -Hw);
            ctx.lineTo(x1 + Hw, -Hw);
            ctx.lineTo(x1 - Hw, Hw);
            ctx.lineTo(x0 - Hw, Hw);
            ctx.closePath();
        }
        ctx.fill();
        ctx.restore();

        // 3. Top & Bottom crisp border lines
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isMobile ? 1.5 : 2;

        ctx.beginPath();
        ctx.moveTo(-halfLen, -Hw);
        ctx.lineTo(halfLen, -Hw);
        ctx.moveTo(-halfLen, Hw);
        ctx.lineTo(halfLen, Hw);
        ctx.stroke();

        ctx.restore();
    }

    function renderFrame(time) {
        if (!ctx || width === 0 || height === 0) return;

        // Smooth color interpolation
        lerpColor(colorState.accent, colorState.targetAccent, 0.04);

        // Smooth mouse & scroll lerping
        mouse.x += (mouse.targetX - mouse.x) * 0.035;
        mouse.y += (mouse.targetY - mouse.y) * 0.035;
        scrollY += (targetScrollY - scrollY) * 0.05;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Render straight tilted barrier tapes
        for (let i = 0; i < straightTapes.length; i++) {
            const tape = straightTapes[i];
            if (tape.type === 'stripes') {
                renderStraightStripesTape(tape, time);
            }
        }
    }

    function animate(now) {
        if (!isRunning) return;
        renderFrame(now);
        animationFrameId = requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (prefersReducedMotion) {
            renderFrame(0);
            return;
        }
        if (!isRunning) {
            isRunning = true;
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    function stopAnimation() {
        if (isRunning) {
            isRunning = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    }

    function initEvents() {
        window.addEventListener('resize', resize, { passive: true });

        window.addEventListener('mousemove', (e) => {
            mouse.targetX = e.clientX / Math.max(1, window.innerWidth);
            mouse.targetY = e.clientY / Math.max(1, window.innerHeight);
        }, { passive: true });

        window.addEventListener('scroll', () => {
            targetScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        }, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAnimation();
            } else {
                updateThemeColors();
                startAnimation();
            }
        });

        // Sync with dynamic theme changes
        const observer = new MutationObserver(() => {
            updateThemeColors();
        });
        observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    function init() {
        canvas = document.getElementById('ribbon-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'ribbon-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            document.body.prepend(canvas);
        }

        ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        updateThemeColors();
        resize();
        initEvents();
        startAnimation();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public hook
    window.updateRibbonTheme = updateThemeColors;
})();
