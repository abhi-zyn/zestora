/* ===== Lenis + GSAP Smooth Scroll Integration ===== */
(function() {
  const isMobile = window.innerWidth < 768;

  const lenis = new Lenis({
    lerp: isMobile ? 0.12 : 0.08,
    smoothWheel: true,
    touchMultiplier: 1.6,
    wheelMultiplier: 1
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Page transitions
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.endsWith('.html') && !href.startsWith('http')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const overlay = document.querySelector('.page-transition');
        if (overlay) {
          overlay.classList.add('active');
          setTimeout(() => { window.location.href = href; }, 300);
        } else {
          window.location.href = href;
        }
      });
    }
  });

  // Hamburger menu
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  window.lenis = lenis;
})();
