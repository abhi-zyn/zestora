/* ===== Page Loader — wait for all images ===== */
(function () {
  const loader = document.getElementById('page-loader');
  const fill = document.getElementById('page-loader-fill');
  if (!loader) return;

  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    if (fill) fill.style.width = '100%';
    setTimeout(() => loader.classList.add('hidden'), 300);
  }

  // Track progress from canvas frame loaders via custom event
  window.__pageLoaderProgress = function (pct) {
    if (fill && !dismissed) fill.style.width = Math.round(pct) + '%';
    if (pct >= 100) dismiss();
  };

  // Also dismiss on window load (all static resources)
  window.addEventListener('load', dismiss);

  // Fallback: dismiss after 8s regardless
  setTimeout(dismiss, 8000);
})();

/* ===== Home Page — Responsive Cinematic Animations ===== */
(function () {
  const isDesktop = window.matchMedia('(min-width: 769px)').matches;
  const isMobile = !isDesktop;
  const SCRUB = isDesktop ? 0.8 : 1.2;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  // Desktop hero entrance + idle bokeh + parallax
  // -----------------------------
  if (isDesktop) {
    const heroTl = gsap.timeline({ delay: 0.2 });
    heroTl
      .from('.hero-eyebrow', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' })
      .from('.hero-title', { opacity: 0, y: 50, duration: 1.2, ease: 'power4.out' }, '-=0.4')
      .from('.hero-tagline', { opacity: 0, y: 20, duration: 0.9, ease: 'power3.out' }, '-=0.7')
      .from('.hero-cta .btn', { opacity: 0, y: 20, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, '-=0.5')
      .from('.hero .scroll-cue', { opacity: 0, duration: 0.8 }, '-=0.3');

    gsap.utils.toArray('.hero-bokeh').forEach((el, i) => {
      gsap.to(el, {
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
        duration: 8 + Math.random() * 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.5
      });
    });

    gsap.to('.hero-content', {
      y: -80,
      opacity: 0,
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });
  }

  // -----------------------------
  // Reusable Canvas Stage
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
      progressId,         // desktop progress text
      stageId,            // desktop chapter label container
      stageLabelText = 'Chapter',
      stages,             // [{ at, num, label }] desktop chapter milestones
      panes,              // [{ selector, in, out, yIn, yOut }] mobile overlay panes
      scrubLength = '+=300%',
      tintRgba,
      vignetteRgba = 'rgba(7, 18, 9, 0.5)'
    } = config;

    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const frames = [];
    const anim = { frame: 0 };
    let loaded = 0;

    const loaderEl = loaderId ? document.getElementById(loaderId) : null;
    const loaderFill = loaderFillId ? document.getElementById(loaderFillId) : null;
    const progressEl = progressId ? document.getElementById(progressId) : null;
    const stageEl = stageId ? document.getElementById(stageId) : null;

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

    // Debounced resize (200ms) for mobile
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { setSize(); render(); }, 200);
    });

    function imgLoaded() {
      loaded++;
      const pct = Math.round((loaded / frameCount) * 100);
      if (loaderFill) loaderFill.style.width = pct + '%';
      if (loaded === 1 || loaded === Math.floor(frameCount / 4)) render();
      if (loaded >= Math.min(40, frameCount)) {
        loaderEl && loaderEl.classList.add('hidden');
      }
      // Report to page loader (first canvas drives it)
      if (window.__pageLoaderProgress && canvasId === 'coffee-canvas') {
        window.__pageLoaderProgress(pct);
      }
      maybeLoadSecondBatch();
    }

    // Lazy load: mobile loads first 20 frames, then rest after first batch finishes
    const initialBatch = isMobile ? Math.min(20, frameCount) : frameCount;
    let secondBatchStarted = false;
    function maybeLoadSecondBatch() {
      if (secondBatchStarted || loaded < initialBatch || initialBatch >= frameCount) return;
      secondBatchStarted = true;
      loadFrames(initialBatch + 1, frameCount);
    }
    function loadFrames(start, end) {
      for (let i = start; i <= end; i++) {
        const img = new Image();
        img.onload = imgLoaded;
        img.onerror = imgLoaded;
        img.src = `${framesDir}/${framePrefix}${String(i).padStart(3, '0')}.${frameExt}`;
        frames[i - 1] = img;
      }
    }
    loadFrames(1, initialBatch);

    function drawFrame(img, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cropBottom = Math.floor(img.naturalHeight * 0.07);
      const sw = img.naturalWidth;
      const sh = img.naturalHeight - cropBottom;
      const fillScale = Math.max(w / sw, h / sh);
      const drawW = sw * fillScale;
      const drawH = sh * fillScale;
      const dx = (w - drawW) / 2;
      const dy = (h - drawH) / 2;
      ctx.drawImage(img, 0, 0, sw, sh, dx, dy, drawW, drawH);

      // Optional tint to unify (used for burger to match dark green)
      if (tintRgba) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = tintRgba;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

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

      if (progressEl) {
        progressEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + frameCount;
      }
    }

    // Desktop chapter label updates
    let currentStage = -1;
    function updateStageLabel(progress) {
      if (!stageEl || !stages) return;
      let next = 0;
      for (let i = stages.length - 1; i >= 0; i--) {
        if (progress >= stages[i].at) { next = i; break; }
      }
      if (next !== currentStage) {
        currentStage = next;
        const s = stages[next];
        gsap.to(stageEl, {
          opacity: 0, y: 10, duration: 0.3, ease: 'power2.in',
          onComplete: () => {
            stageEl.innerHTML = `<span class="num">${stageLabelText} ${s.num}</span>${s.label}`;
            gsap.to(stageEl, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
          }
        });
      }
    }
    if (stageEl) gsap.set(stageEl, { opacity: 1, y: 0 });

    // Mobile overlay pane updates
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
        if (!p.in && p.out && progress < p.out[0]) { opacity = 1; y = 0; }

        p.el.style.opacity = opacity.toFixed(3);
        p.el.style.transform = `translateY(${y}px)`;
      });
    }

    paneEls.forEach((p) => {
      if (!p.in) { p.el.style.opacity = '1'; p.el.style.transform = 'translateY(0)'; }
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
        onUpdate: (self) => {
          updateStageLabel(self.progress);
          updatePanes(self.progress);
        }
      },
      onUpdate: render
    });

    return { frames, render, anim, frameCount };
  }

  // -----------------------------
  // Coffee canvas
  // -----------------------------
  const coffeeAnim = createCanvasStage({
    canvasId: 'coffee-canvas',
    framesDir: 'images/coffee',
    frameCount: 192,
    sectionSelector: '.canvas-stage--hero',
    loaderId: 'coffee-loader',
    loaderFillId: 'coffee-loader-fill',
    progressId: 'coffee-progress',
    stageId: 'coffee-stage',
    stageLabelText: 'Chapter',
    stages: [
      { at: 0.0,  num: '01', label: 'The pour' },
      { at: 0.30, num: '02', label: 'The bloom' },
      { at: 0.60, num: '03', label: 'The crema' },
      { at: 0.85, num: '04', label: 'The first sip' }
    ],
    panes: [
      // intro stays through 0–10%, fades out 10–18%
      { selector: '[data-pane="coffee-intro"]', out: [0.10, 0.18], yOut: 30 },
      // pour: 18–22% in, 30–38% out
      { selector: '[data-pane="coffee-pour"]',  in: [0.18, 0.24], out: [0.30, 0.38], yIn: 30, yOut: 30 },
      // bloom: 40–46% in, 52–58% out
      { selector: '[data-pane="coffee-bloom"]', in: [0.40, 0.46], out: [0.52, 0.58], yIn: 30, yOut: 30 },
      // crema: 60–66% in, 72–78% out
      { selector: '[data-pane="coffee-crema"]', in: [0.60, 0.66], out: [0.72, 0.78], yIn: 30, yOut: 30 },
      // sip: 80–86% in, stays till end
      { selector: '[data-pane="coffee-sip"]',   in: [0.80, 0.86], yIn: 30 },
      // scroll cue fades out early
      { selector: '[data-pane="scroll-cue"]',   out: [0.04, 0.14], yOut: 20 }
    ],
    scrubLength: isDesktop ? '+=250%' : '+=150%',
    vignetteRgba: 'rgba(7, 18, 9, 0.5)'
  });

  // -----------------------------
  // Burger canvas
  // -----------------------------
  createCanvasStage({
    canvasId: 'burger-canvas',
    framesDir: 'images/burger',
    frameCount: 192,
    sectionSelector: '.canvas-stage--burger',
    loaderId: 'burger-loader',
    loaderFillId: 'burger-loader-fill',
    progressId: 'burger-progress',
    stageId: 'burger-stage',
    stageLabelText: 'Layer',
    stages: [
      { at: 0.0,  num: '01', label: 'The bun' },
      { at: 0.25, num: '02', label: 'The patty' },
      { at: 0.50, num: '03', label: 'The cheese' },
      { at: 0.75, num: '04', label: 'The greens' },
      { at: 0.92, num: '05', label: 'The build' }
    ],
    panes: [
      { selector: '[data-pane="burger-intro"]',  out: [0.08, 0.15], yOut: 30 },
      { selector: '[data-pane="burger-bun"]',    in: [0.15, 0.20], out: [0.27, 0.33], yIn: 30, yOut: 30 },
      { selector: '[data-pane="burger-patty"]',  in: [0.34, 0.40], out: [0.46, 0.52], yIn: 30, yOut: 30 },
      { selector: '[data-pane="burger-cheese"]', in: [0.53, 0.59], out: [0.64, 0.70], yIn: 30, yOut: 30 },
      { selector: '[data-pane="burger-greens"]', in: [0.71, 0.77], out: [0.82, 0.88], yIn: 30, yOut: 30 },
      { selector: '[data-pane="burger-build"]',  in: [0.89, 0.94], yIn: 30 }
    ],
    scrubLength: isDesktop ? '+=250%' : '+=120%',
    // Burger frames have a light gray studio bg.
    // Mobile contained frame: keep tint subtle so colors remain vibrant in the small player.
    // Desktop: keep original — looks like an intentional studio shot inside the framed widescreen.
    tintRgba: isDesktop ? null : 'rgba(20, 50, 26, 0.30)',
    vignetteRgba: isDesktop ? 'rgba(0, 0, 0, 0.35)' : 'rgba(7, 18, 9, 0.45)'
  });

  // -----------------------------
  // Story-section mini canvas
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
  // Section transitions
  //   Desktop: GSAP scroll-based reveals (handled below)
  //   Mobile:  IntersectionObserver — translateY(40)→0 + fade, 0.6s ease-out, stagger 0.1s
  // -----------------------------
  if (isMobile && !prefersReducedMotion) {
    const revealTargets = [
      ...document.querySelectorAll('.story-text > *'),
      ...document.querySelectorAll('.story-visual'),
      ...document.querySelectorAll('.story-stats > div'),
      ...document.querySelectorAll('.section-head > *'),
      ...document.querySelectorAll('.menu-feature-card'),
      ...document.querySelectorAll('.cta-section .cta-inner > *')
    ];
    revealTargets.forEach(el => el.classList.add('reveal-on-scroll'));

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    revealTargets.forEach(el => io.observe(el));
  }

  if (!isMobile) {
    gsap.utils.toArray('.section-transition').forEach((sec) => {
      gsap.fromTo(sec,
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1, ease: 'none',
          scrollTrigger: {
            trigger: sec, start: 'top bottom', end: 'top 60%', scrub: 1
          }
        }
      );
      gsap.fromTo(sec,
        { scale: 1, opacity: 1 },
        {
          scale: 0.95, opacity: 0, ease: 'none',
          scrollTrigger: {
            trigger: sec, start: 'bottom 80%', end: 'bottom top', scrub: 1
          }
        }
      );
    });
  }

  // -----------------------------
  // Story / Menu / CTA reveals (desktop only — mobile uses IntersectionObserver above)
  // -----------------------------
  if (isDesktop) {
    gsap.from('.story-text > *', {
      opacity: 0, y: 30, stagger: 0.1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.story-section', start: 'top 70%' }
    });
    gsap.from('.story-visual', {
      opacity: 0, scale: 0.95, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.story-section', start: 'top 70%' }
    });
    gsap.from('.section-head > *', {
      opacity: 0, y: 30, stagger: 0.1, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.menu-preview', start: 'top 75%' }
    });
    gsap.from('.menu-feature-card', {
      opacity: 0, y: 40, stagger: 0.08, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.menu-cards', start: 'top 80%' }
    });
    gsap.from('.cta-section .cta-inner > *', {
      opacity: 0, y: 30, stagger: 0.1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.cta-section', start: 'top 75%' }
    });
  }

  // -----------------------------
  // Dot navigation
  // -----------------------------
  const sectionList = isDesktop
    ? ['.hero', '.canvas-stage--hero', '.story-section', '.canvas-stage--burger', '.menu-preview', '.cta-section']
    : ['.canvas-stage--hero', '.story-section', '.canvas-stage--burger', '.menu-preview', '.cta-section'];

  const allDots = document.querySelectorAll('.dot-nav .dot');
  const visibleDots = isDesktop
    ? Array.from(allDots)
    : Array.from(allDots).filter(d => !d.classList.contains('desktop-only'));

  sectionList.forEach((sel, i) => {
    ScrollTrigger.create({
      trigger: sel,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveDot(i),
      onEnterBack: () => setActiveDot(i)
    });
  });
  function setActiveDot(index) {
    visibleDots.forEach((d, i) => d.classList.toggle('active', i === index));
  }
  allDots.forEach((dot) => {
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
