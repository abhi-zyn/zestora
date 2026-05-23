/* ===== Home Page — Cinematic Animations ===== */
(function () {
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
  nav.classList.add('visible');

  // -----------------------------
  // Hero entrance
  // -----------------------------
  const heroTl = gsap.timeline({ delay: 0.2 });
  heroTl
    .from('.hero-eyebrow', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' })
    .from('.hero-title', { opacity: 0, y: 50, duration: 1.2, ease: 'power4.out' }, '-=0.4')
    .from('.hero-tagline', { opacity: 0, y: 20, duration: 0.9, ease: 'power3.out' }, '-=0.7')
    .from('.hero-cta .btn', { opacity: 0, y: 20, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, '-=0.5')
    .from('.scroll-cue', { opacity: 0, duration: 0.8 }, '-=0.3');

  // Bokeh idle drift
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

  // Hero parallax fade on scroll
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

  // -----------------------------
  // Reusable Scroll-Driven Frame Animation
  // -----------------------------
  function createFrameAnimation(config) {
    const {
      canvasId,
      framesDir,
      frameCount,
      framePrefix = 'ezgif-frame-',
      frameExt = 'jpg',
      sectionSelector,
      loaderId,
      loaderFillId,
      progressId,
      stageId,
      stageLabel = 'Chapter',
      stages,
      scrubLength = '+=250%',
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
    window.addEventListener('resize', () => {
      setSize();
      render();
    });

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
      // Cover-fit (source aspect matches frame aspect)
      const fillScale = Math.max(w / sw, h / sh);
      const drawW = sw * fillScale;
      const drawH = sh * fillScale;
      const dx = (w - drawW) / 2;
      const dy = (h - drawH) / 2;
      ctx.drawImage(img, 0, 0, sw, sh, dx, dy, drawW, drawH);

      // Soft vignette
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.55, w / 2, h / 2, Math.max(w, h) * 0.75);
      grad.addColorStop(0, 'rgba(7, 9, 10, 0)');
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

    let currentStage = -1;
    function updateStage(progress) {
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
            stageEl.innerHTML = `<span class="num">${stageLabel} ${s.num}</span>${s.label}`;
            gsap.to(stageEl, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
          }
        });
      }
    }

    if (stageEl) gsap.set(stageEl, { opacity: 1, y: 0 });

    gsap.to(anim, {
      frame: frameCount - 1,
      snap: 'frame',
      ease: 'none',
      scrollTrigger: {
        trigger: sectionSelector,
        pin: true,
        start: 'top top',
        end: scrubLength,
        scrub: 0.4,
        onUpdate: (self) => updateStage(self.progress)
      },
      onUpdate: render
    });

    return { frames, render, anim, frameCount };
  }

  // -----------------------------
  // Coffee animation
  // -----------------------------
  const coffeeAnim = createFrameAnimation({
    canvasId: 'coffee-canvas',
    framesDir: 'images/coffee',
    frameCount: 192,
    sectionSelector: '.section-coffee',
    loaderId: 'coffee-loader',
    loaderFillId: 'coffee-loader-fill',
    progressId: 'coffee-progress',
    stageId: 'coffee-stage',
    stageLabel: 'Chapter',
    stages: [
      { at: 0.0,  num: '01', label: 'The pour' },
      { at: 0.30, num: '02', label: 'The bloom' },
      { at: 0.60, num: '03', label: 'The crema' },
      { at: 0.85, num: '04', label: 'The first sip' }
    ],
    vignetteRgba: 'rgba(7, 9, 10, 0.45)'
  });

  // -----------------------------
  // Burger animation
  // -----------------------------
  createFrameAnimation({
    canvasId: 'burger-canvas',
    framesDir: 'images/burger',
    frameCount: 192,
    sectionSelector: '.section-burger',
    loaderId: 'burger-loader',
    loaderFillId: 'burger-loader-fill',
    progressId: 'burger-progress',
    stageId: 'burger-stage',
    stageLabel: 'Layer',
    stages: [
      { at: 0.0,  num: '01', label: 'The bun' },
      { at: 0.25, num: '02', label: 'The patty' },
      { at: 0.50, num: '03', label: 'The cheese' },
      { at: 0.75, num: '04', label: 'The greens' },
      { at: 0.92, num: '05', label: 'The build' }
    ],
    vignetteRgba: 'rgba(0, 0, 0, 0.35)'
  });

  // -----------------------------
  // Story section — mini canvas mirrors a coffee frame
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
    window.addEventListener('resize', () => { sizeStoryCanvas(); renderStoryFrame(); });

    function renderStoryFrame() {
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
      grad.addColorStop(0, 'rgba(7,9,10,0)');
      grad.addColorStop(1, 'rgba(7,9,10,0.5)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, w, h);
    }

    // Ambient loop (use mid-late frames where coffee is finished)
    gsap.to(storyState, {
      frame: FC - 10,
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      onUpdate: renderStoryFrame
    });

    const renderInterval = setInterval(() => {
      if (coffeeFrames[80] && coffeeFrames[80].complete) {
        renderStoryFrame();
        clearInterval(renderInterval);
      }
    }, 200);
  }

  // -----------------------------
  // Story text reveal
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
  const sections = ['.hero', '.section-coffee', '.story-section', '.section-burger', '.menu-preview', '.cta-section'];
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

  // -----------------------------
  // Mobile menu toggle
  // -----------------------------
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    mobileMenu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => mobileMenu.classList.remove('open'))
    );
  }
})();
