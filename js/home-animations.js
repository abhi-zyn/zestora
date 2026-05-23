/* ===== Home Page Animations ===== */
(function() {
  const isMobile = window.innerWidth < 768;

  // --- Hero entrance ---
  const heroTl = gsap.timeline({ delay: 0.3 });
  heroTl
    .from('.hero-title', { y: 60, opacity: 0, duration: 1, ease: 'power3.out' })
    .from('.hero-tagline', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .from('.hero-cta .btn', { y: 20, opacity: 0, stagger: 0.15, duration: 0.6 }, '-=0.4');

  // Floating ingredients entrance + idle
  const ingredients = document.querySelectorAll('.hero-ingredient');
  ingredients.forEach((el, i) => {
    const xStart = (Math.random() - 0.5) * (isMobile ? 200 : 400);
    const yStart = (Math.random() - 0.5) * (isMobile ? 200 : 400);
    gsap.fromTo(el,
      { x: xStart, y: yStart, scale: 0, opacity: 0, rotation: Math.random() * 180 - 90 },
      { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0, duration: 1.2, delay: 0.5 + i * 0.12, ease: 'back.out(1.4)' }
    );
    // Idle float
    gsap.to(el, {
      y: `+=${10 + Math.random() * 15}`,
      rotation: `+=${5 + Math.random() * 10}`,
      duration: 2.5 + Math.random() * 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1.5 + i * 0.2
    });
  });

  // --- Coffee Frame Animation ---
  const canvas = document.getElementById('coffee-canvas');
  const ctx = canvas.getContext('2d');
  const frameCount = 240;
  const coffeeFrames = [];
  const coffeeAnim = { frame: 0 };

  function resizeCoffeeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resizeCoffeeCanvas();
  window.addEventListener('resize', resizeCoffeeCanvas);

  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = `images/coffee/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
    coffeeFrames.push(img);
  }

  function renderCoffeeFrame() {
    const img = coffeeFrames[Math.round(coffeeAnim.frame)];
    if (!img || !img.complete) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  }

  coffeeFrames[0].onload = renderCoffeeFrame;

  gsap.to(coffeeAnim, {
    frame: frameCount - 1,
    snap: 'frame',
    ease: 'none',
    scrollTrigger: {
      trigger: '.section-coffee',
      pin: true,
      start: 'top top',
      end: '+=200%',
      scrub: 0.5
    },
    onUpdate: renderCoffeeFrame
  });

  gsap.from('.section-coffee .section-label', {
    opacity: 0, y: -30,
    scrollTrigger: { trigger: '.section-coffee', start: 'top 80%' }
  });

  // --- Bowl Assembly Section ---
  const bowlTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.section-bowl',
      pin: true,
      start: 'top top',
      end: '+=150%',
      scrub: 1
    }
  });

  bowlTl
    .from('.section-bowl .section-label', { opacity: 0, y: -30, duration: 0.3 })
    .from('.bowl-plate', { scale: 0, opacity: 0, duration: 0.4, ease: 'back.out(1.7)' })
    .from('.bowl-rice', { y: -200, opacity: 0, duration: 0.3, ease: 'back.out(1.4)' })
    .from('.bowl-avocado', { x: isMobile ? -150 : -300, opacity: 0, rotation: -45, duration: 0.3, ease: 'back.out(1.7)' })
    .from('.bowl-tomato', { x: isMobile ? 150 : 300, opacity: 0, rotation: 30, duration: 0.3, ease: 'back.out(1.7)' })
    .from('.bowl-greens', { y: -200, x: -100, opacity: 0, duration: 0.3, ease: 'back.out(1.4)' })
    .from('.bowl-seeds', { y: -150, opacity: 0, scale: 0.3, stagger: 0.05, duration: 0.2, ease: 'power2.out' })
    .from('.bowl-sauce', { scaleX: 0, opacity: 0, transformOrigin: 'left', duration: 0.4, ease: 'power2.out' });

  // --- Drinks Assembly Section ---
  const drinksTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.section-drinks',
      pin: true,
      start: 'top top',
      end: '+=150%',
      scrub: 1
    }
  });

  drinksTl
    .from('.section-drinks .section-label', { opacity: 0, y: -30, duration: 0.3 })
    .from('.drink-glass', { scale: 0, opacity: 0, duration: 0.4, ease: 'back.out(1.7)' })
    .from('.drink-ice', { y: -300, opacity: 0, stagger: 0.08, duration: 0.3, ease: 'bounce.out' })
    .from('.drink-liquid', { scaleY: 0, transformOrigin: 'bottom', opacity: 0, duration: 0.4, ease: 'power2.out' })
    .from('.drink-fruit', { x: () => (Math.random() > 0.5 ? 200 : -200), opacity: 0, rotation: 90, stagger: 0.1, duration: 0.3, ease: 'back.out(1.7)' })
    .from('.drink-straw', { y: -200, opacity: 0, duration: 0.3, ease: 'power2.out' })
    .from('.drink-bubbles', { opacity: 0, y: 20, stagger: 0.05, duration: 0.2 });

  // --- CTA Section entrance ---
  gsap.from('.cta-card', {
    y: 60,
    opacity: 0,
    stagger: 0.2,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.cta-section', start: 'top 80%' }
  });

  // --- Dot navigation ---
  const sections = ['.hero', '.section-coffee', '.section-bowl', '.section-drinks', '.cta-section'];
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
})();
