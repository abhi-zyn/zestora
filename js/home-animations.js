/* ===== Home Page — Cinematic Animations ===== */
(function () {
  const SCRUB = 0.8;
  const isMobile = window.innerWidth < 768;

  // -----------------------------
  // Nav scrolled state
  // -----------------------------
  const nav = document.querySelector('.nav');
  ScrollTrigger.create({
    start: 'top -50',
    end: 99999,
    onUpdate: (self) => {
      nav.classList.toggle('scrolled', self.scroll() > 50);
    }
  });

  // -----------------------------
  // Reusable Scroll-Driven Frame Animation Stage
  // -----------------------------
  function createCanvasStage(config) {
    const {
      canvasId,
      framesDir,
      frameCount,
      framePrefix = 'ezgif-frame-',
      frameExt = 'jpg',
      sectionSelector,
      loaderId,
      loaderFillId,
      panes,           // [{ selector, in: [start,end], out:[start,end], yIn, yOut }]
      scrubLength = '+=350%',
      tintRgba,        // optional per-frame green tint overlay (for burger)
      vignetteRgba = 'rgba(7, 9, 10, 0.45)'
    } = config;

    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const frames = [];
    const anim = { frame: 0 };
    let loaded = 0;

    const loaderEl = loaderId ? document.getElementById(loaderId) : null;
    const loaderFill = loaderFillId ? document.getElementById(loaderFillId) : null;

    function setSize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const NATIVE_W = 1280, NATIVE_H = 720;
      const cssW = canvas.offsetWidth;
      const cssH = canvas.offsetHeight;
      const targetW = Math.min(cssW * dpr, NATIVE_W);
      const targetH = Math.min(cssH * dpr, NATIVE_H);
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(targetW / cssW, targetH / cssH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    setSize();
    window.addEventListener('resize', () => { setSize(); render(); });

    function imgLoaded() {
      loaded++;
      const pct = Math.round((loaded / frameCount) * 100);
      if (loaderFill) loaderFill.style.width = pct + '%';
      if (loaded === 1 || loaded === Math.floor(frameCount / 4)) render();
      if (loaded >= Math.min(40, frameCount)) {
        loaderEl && loaderEl.classList.add('hidden');
      }
    }

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.onload = imgLoaded;
      img.onerror = imgLoaded;
      img.src = `${framesDir}/${framePrefix}${String(i).padStart(3, '0')}.${frameExt}`;
      frames.push(img);
    }

    function drawFrame(img, w, h) {
      ctx.clearRect(0, 0, w, h);
      // Crop bottom 7% to remove "Veo" watermark
      const cropBottom = Math.floor(img.naturalHeight * 0.07);
      const sw = img.naturalWidth;
      const sh = img.naturalHeight - cropBottom;
      const fillScale = Math.max(w / sw, h / sh);
      const drawW = sw * fillScale;
      const drawH = sh * fillScale;
      const dx = (w - drawW) / 2;
      const dy = (h - drawH) / 2;
      ctx.drawImage(img, 0, 0, sw, sh, dx, dy, drawW, drawH);

      // Optional color tint to unify against the dark green theme
      if (tintRgba) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = tintRgba;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // Soft vignette
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.55, w / 2, h / 2, Math.max(w, h) * 0.75);
      grad.addColorStop(0, 'rgba(13, 31, 15, 0)');
      grad.addColorStop(1, vignetteRgba);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    function render() {
      const idx = Math.min(frameCount - 1, Math.max(0, Math.round(anim.frame)));
      const img = frames[idx];
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (!img || !img.complete || !img.naturalWidth) {
        let near = null;
        for (let d = 1; d < frameCount; d++) {
          const a = frames[idx - d], b = frames[idx + d];
          if (a && a.complete && a.naturalWidth) { near = a; break; }
          if (b && b.complete && b.naturalWidth) { near = b; break; }
        }
        if (!near) return;
        drawFrame(near, w, h);
        return;
      }
      drawFrame(img, w, h);
    }

    // Resolve pane DOM elements once
    const paneEls = (panes || []).map(p => ({
      ...p,
      el: document.querySelector(p.selector)
    })).filter(p => p.el);

    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(t) { return t * t * (3 - 2 * t); }

    function updatePanes(progress) {
      paneEls.forEach(p => {
        let opacity = 0;
        let y = 0;
        if (p.in && progress >= p.in[0] && progress <= p.in[1]) {
          // Fade-in within this range
          const t = smoothstep((progress - p.in[0]) / (p.in[1] - p.in[0]));
          opacity = t;
          y = (1 - t) * (p.yIn ?? 40);
        } else if (p.in && progress > p.in[1] && (!p.out || progress < p.out[0])) {
          opacity = 1; y = 0;
        }
        if (p.out && progress >= p.out[0] && progress <= p.out[1]) {
          const t = smoothstep((progress - p.out[0]) / (p.out[1] - p.out[0]));
          opacity = 1 - t;
          y = -t * (p.yOut ?? 60);
        } else if (p.out && progress > p.out[1]) {
          opacity = 0; y = -(p.yOut ?? 60);
        }
        // If only `out` defined, start visible
        if (!p.in && p.out && progress < p.out[0]) { opacity = 1; y = 0; }

        p.el.style.opacity = opacity.toFixed(3);
        p.el.style.transform = `translateY(${y}px)`;
      });
    }

    // Initial pane state — first pane visible, rest hidden
    paneEls.forEach((p, i) => {
      if (i === 0 && !p.in) { p.el.style.opacity = '1'; p.el.style.transform = 'translateY(0)'; }
      else if (!p.in) { p.el.style.opacity = '1'; p.el.style.transform = 'translateY(0)'; }
      else { p.el.style.opacity = '0'; }
    });

    gsap.to(anim, {
      frame: frameCount - 1,
      snap: 'frame',
      ease: 'none',
      scrollTrigger: {
        trigger: sectionSelector,
        pin: true,
        start: 'top top',
        end: scrubLength,
        scrub: SCRUB,
        onUpdate: (self) => updatePanes(self.progress)
      },
      onUpdate: render
    });

    return { frames, render, anim, frameCount };
  }

  // -----------------------------
  // Coffee stage (hero merges in here)
  //   Pane 1 (hero intro):  visible 0–0.10, fades out 0.10–0.40
  //   Pane 2 (hero end):    fades in 0.70–0.92
  //   Scroll cue:           visible at start, fades out 0.05–0.15
  // -----------------------------
  const coffeeAnim = createCanvasStage({
    canvasId: 'coffee-canvas',
    framesDir: 'images/coffee',
    frameCount: 192,
    sectionSelector: '.canvas-stage--hero',
    loaderId: 'coffee-loader',
    loaderFillId: 'coffee-loader-fill',
    scrubLength: '+=350%',
    panes: [
      { selector: '[data-pane="hero-intro"]', out: [0.10, 0.40], yOut: 50 },
      { selector: '[data-pane="hero-end"]',   in:  [0.70, 0.92], yIn: 40 },
      { selector: '[data-pane="scroll-cue"]', out: [0.04, 0.14], yOut: 20 }
    ],
    vignetteRgba: 'rgba(7, 18, 9, 0.5)'
  });

  // -----------------------------
  // Burger stage — same structure
  //   Pane 1 (burger intro): visible 0–0.10, fades out 0.10–0.40
  //   Pane 2 (burger end):   fades in 0.72–0.92
  //   Tint: dark green multiply to match coffee mood
  // -----------------------------
  createCanvasStage({
    canvasId: 'burger-canvas',
    framesDir: 'images/burger',
    frameCount: 192,
    sectionSelector: '.canvas-stage--burger',
    loaderId: 'burger-loader',
    loaderFillId: 'burger-loader-fill',
    scrubLength: '+=350%',
    panes: [
      { selector: '[data-pane="burger-intro"]', out: [0.10, 0.40], yOut: 50 },
      { selector: '[data-pane="burger-end"]',   in:  [0.72, 0.92], yIn: 40 }
    ],
    tintRgba: 'rgba(20, 50, 26, 0.55)',
    vignetteRgba: 'rgba(7, 18, 9, 0.55)'
  });

  // -----------------------------
  // Story-section mini canvas (uses coffee frames)
  // -----------------------------
  const storyCanvas = document.getElementById('story-canvas');
  if (storyCanvas && coffeeAnim) {
    const sctx = storyCanvas.getContext('2d');
    const storyState = { frame: 80 };
    const coffeeFrames = coffeeAnim.frames;
    const FC = coffeeAnim.frameCount;

    function sizeStoryCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      storyCanvas.width = storyCanvas.offsetWidth * dpr;
      storyCanvas.height = storyCanvas.offsetHeight * dpr;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.scale(dpr, dpr);
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = 'high';
    }
    sizeStoryCanvas();
    window.addEventListener('resize', () => { sizeStoryCanvas(); renderStory(); });

    function renderStory() {
      const idx = Math.min(FC - 1, Math.max(0, Math.round(storyState.frame)));
      const img = coffeeFrames[idx];
      const w = storyCanvas.offsetWidth;
      const h = storyCanvas.offsetHeight;
      if (!img || !img.complete || !img.naturalWidth) return;
      sctx.clearRect(0, 0, w, h);
      const cropBottom = Math.floor(img.naturalHeight * 0.07);
      const sw = img.naturalWidth;
      const sh = img.naturalHeight - cropBottom;
      const scale = Math.max(w / sw, h / sh);
      const drawW = sw * scale;
      const drawH = sh * scale;
      const dx = (w - drawW) / 2;
      const dy = (h - drawH) / 2;
      sctx.drawImage(img, 0, 0, sw, sh, dx, dy, drawW, drawH);
      const grad = sctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, 'rgba(13,31,15,0)');
      grad.addColorStop(1, 'rgba(13,31,15,0.5)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, w, h);
    }

    gsap.to(storyState, {
      frame: FC - 10,
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      onUpdate: renderStory
    });

    const renderInterval = setInterval(() => {
      if (coffeeFrames[80] && coffeeFrames[80].complete) {
        renderStory();
        clearInterval(renderInterval);
      }
    }, 200);
  }

  // -----------------------------
  // Section transitions — outgoing scale+fade, incoming translate+fade
  // Applied to non-pinned sections (story, menu, cta)
  // -----------------------------
  const transitionSections = gsap.utils.toArray('.section-transition');
  transitionSections.forEach((sec) => {
    // Incoming: translateY 60 → 0, opacity 0 → 1
    gsap.fromTo(sec,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1, ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top bottom',
          end: 'top 60%',
          scrub: 1
        }
      }
    );
    // Outgoing: scale 1 → 0.95, opacity 1 → 0
    gsap.fromTo(sec,
      { scale: 1, opacity: 1 },
      {
        scale: 0.95, opacity: 0, ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'bottom 80%',
          end: 'bottom top',
          scrub: 1
        }
      }
    );
  });

  // -----------------------------
  // Story text + visual reveal (subtle)
  // -----------------------------
  gsap.from('.story-text > *', {
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.story-section', start: 'top 70%' }
  });
  gsap.from('.story-visual', {
    opacity: 0,
    scale: 0.95,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.story-section', start: 'top 70%' }
  });

  // -----------------------------
  // Menu cards reveal
  // -----------------------------
  gsap.from('.section-head > *', {
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.menu-preview', start: 'top 75%' }
  });
  gsap.from('.menu-feature-card', {
    opacity: 0,
    y: 40,
    stagger: 0.08,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.menu-cards', start: 'top 80%' }
  });

  // -----------------------------
  // CTA reveal
  // -----------------------------
  gsap.from('.cta-section .cta-inner > *', {
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.cta-section', start: 'top 75%' }
  });

  // -----------------------------
  // Dot navigation
  // -----------------------------
  const sections = ['.canvas-stage--hero', '.story-section', '.canvas-stage--burger', '.menu-preview', '.cta-section'];
  const dots = document.querySelectorAll('.dot-nav .dot');
  sections.forEach((sel, i) => {
    ScrollTrigger.create({
      trigger: sel,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveDot(i),
      onEnterBack: () => setActiveDot(i)
    });
  });
  function setActiveDot(index) {
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = document.querySelector(dot.dataset.target);
      if (target && window.lenis) window.lenis.scrollTo(target);
      else if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // -----------------------------
  // Scroll progress bar
  // -----------------------------
  const progressBar = document.querySelector('.scroll-progress');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      gsap.to(progressBar, { scaleX: self.progress, duration: 0.1, ease: 'none' });
    }
  });
})();
