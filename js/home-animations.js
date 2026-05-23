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
  // Coffee Frame Animation (canvas)
  // -----------------------------
  const canvas = document.getElementById('coffee-canvas');
  const ctx = canvas.getContext('2d');
  const frameCount = 192;
  const coffeeFrames = [];
  const coffeeAnim = { frame: 0 };
  let loaded = 0;
  const loaderEl = document.getElementById('coffee-loader');
  const loaderFill = document.getElementById('coffee-loader-fill');
  const progressEl = document.getElementById('coffee-progress');
  const stageEl = document.getElementById('coffee-stage');

  // Stage labels — change as scroll progresses
  const stages = [
    { at: 0.0,  num: '01', label: 'The pour' },
    { at: 0.30, num: '02', label: 'The bloom' },
    { at: 0.60, num: '03', label: 'The crema' },
    { at: 0.85, num: '04', label: 'The first sip' }
  ];

  function setCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Cap internal resolution at native frame size (1280x720) to avoid pointless upscale
    const NATIVE_W = 1280, NATIVE_H = 720;
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;
    const targetW = Math.min(cssW * dpr, NATIVE_W);
    const targetH = Math.min(cssH * dpr, NATIVE_H);
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Scale drawing ops to css pixel space
    ctx.scale(targetW / cssW, targetH / cssH);
    // Higher quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  setCanvasSize();
  window.addEventListener('resize', () => {
    setCanvasSize();
    renderCoffeeFrame();
  });

  // Preload — show progress
  function imgLoaded() {
    loaded++;
    const pct = Math.round((loaded / frameCount) * 100);
    if (loaderFill) loaderFill.style.width = pct + '%';
    // Render first usable frame as soon as it arrives
    if (loaded === 1 || loaded === Math.floor(frameCount / 4)) {
      renderCoffeeFrame();
    }
    // Hide loader once enough frames are buffered
    if (loaded >= Math.min(40, frameCount)) {
      loaderEl && loaderEl.classList.add('hidden');
    }
  }

  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.onload = imgLoaded;
    img.onerror = imgLoaded;
    img.src = `images/coffee/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
    coffeeFrames.push(img);
  }

  // Render a single frame with watermark crop + cinematic vignette
  function renderCoffeeFrame() {
    const idx = Math.min(frameCount - 1, Math.max(0, Math.round(coffeeAnim.frame)));
    const img = coffeeFrames[idx];
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    if (!img || !img.complete || !img.naturalWidth) {
      // Fall back to nearest loaded frame
      let near = null;
      for (let d = 1; d < frameCount; d++) {
        const a = coffeeFrames[idx - d], b = coffeeFrames[idx + d];
        if (a && a.complete && a.naturalWidth) { near = a; break; }
        if (b && b.complete && b.naturalWidth) { near = b; break; }
      }
      if (!near) return;
      drawFrame(near, w, h);
      return;
    }
    drawFrame(img, w, h);

    // Update progress text
    if (progressEl) {
      progressEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + frameCount;
    }
  }

  function drawFrame(img, w, h) {
    ctx.clearRect(0, 0, w, h);

    // Crop bottom strip (~7%) from source to remove "Veo" watermark
    const cropBottom = Math.floor(img.naturalHeight * 0.07);
    const sw = img.naturalWidth;
    const sh = img.naturalHeight - cropBottom;

    // Frame is 16:9, source is 16:9 — scale source to fully fill (no upscale beyond native)
    const scale = Math.min(w / sw, h / sh);
    // Use cover semantics so the frame is fully filled (slight overflow is fine since aspects match)
    const fillScale = Math.max(w / sw, h / sh);
    const drawW = sw * fillScale;
    const drawH = sh * fillScale;
    const dx = (w - drawW) / 2;
    const dy = (h - drawH) / 2;

    ctx.drawImage(img, 0, 0, sw, sh, dx, dy, drawW, drawH);

    // Soft edge vignette — adds depth without hiding the image
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.55, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(7, 9, 10, 0)');
    grad.addColorStop(1, 'rgba(7, 9, 10, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Update stage label based on progress
  let currentStage = -1;
  function updateStage(progress) {
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
          stageEl.innerHTML = `<span class="num">Chapter ${s.num}</span>${s.label}`;
          gsap.to(stageEl, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
        }
      });
    }
  }

  // Initial stage visible
  gsap.set(stageEl, { opacity: 1, y: 0 });

  // Scroll-driven frame scrub
  gsap.to(coffeeAnim, {
    frame: frameCount - 1,
    snap: 'frame',
    ease: 'none',
    scrollTrigger: {
      trigger: '.section-coffee',
      pin: true,
      start: 'top top',
      end: '+=250%',
      scrub: 0.4,
      onUpdate: (self) => updateStage(self.progress)
    },
    onUpdate: renderCoffeeFrame
  });

  // -----------------------------
  // Story section — mini canvas mirrors the coffee frame
  // -----------------------------
  const storyCanvas = document.getElementById('story-canvas');
  if (storyCanvas) {
    const sctx = storyCanvas.getContext('2d');
    const storyAnim = { frame: 100 };

    function sizeStoryCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      storyCanvas.width = storyCanvas.offsetWidth * dpr;
      storyCanvas.height = storyCanvas.offsetHeight * dpr;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.scale(dpr, dpr);
    }
    sizeStoryCanvas();
    window.addEventListener('resize', () => {
      sizeStoryCanvas();
      renderStoryFrame();
    });

    function renderStoryFrame() {
      const idx = Math.min(frameCount - 1, Math.max(0, Math.round(storyAnim.frame)));
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

      // Subtle vignette
      const grad = sctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, 'rgba(7,9,10,0)');
      grad.addColorStop(1, 'rgba(7,9,10,0.5)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, w, h);
    }

    // Slow ambient loop for story canvas
    gsap.to(storyAnim, {
      frame: 220,
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      onUpdate: renderStoryFrame
    });

    // Try render once frames load
    const renderInterval = setInterval(() => {
      if (coffeeFrames[100] && coffeeFrames[100].complete) {
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
  const sections = ['.hero', '.section-coffee', '.story-section', '.menu-preview', '.cta-section'];
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
