/* =========================================================
   DOSTII DELIGHT — shared site behaviour
   Requires (loaded via CDN in each page):
     - Lenis  (smooth scroll)
     - gsap + ScrollTrigger  (animations)
   ========================================================= */

/* ---- 1. Smooth scrolling (Lenis) ---- */
let lenis;
function initLenis() {
  if (!window.Lenis) return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  if (window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

/* ---- 2. Header: shrink on scroll + active link ---- */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mark active nav link by filename
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

/* ---- 3. Mobile nav toggle ---- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const closeBtn = document.querySelector('.nav-close');
  const overlay = document.querySelector('.nav-overlay');
  const nav = document.querySelector('.nav');
  
  if (!toggle || !nav) return;

  const openMenu = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    nav.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    nav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', openMenu);
  toggle.addEventListener('touchstart', openMenu, { passive: false });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
    closeBtn.addEventListener('touchstart', closeMenu, { passive: false });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
    overlay.addEventListener('touchstart', closeMenu, { passive: false });
  }

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
    a.addEventListener('touchstart', () => {
      nav.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }, { passive: true });
  });
}

/* ---- 4. Scroll-reveal animations ---- */
function initReveals() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('.reveal').forEach((el, i) => {
    const isMobile = window.innerWidth <= 992;
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: isMobile ? 0.6 : 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: isMobile ? 'top 92%' : 'top 85%'
      },
      delay: isMobile ? 0 : (el.dataset.delay ? parseFloat(el.dataset.delay) : (i % 3) * 0.08)
    });
  });

  // animated stat counters
  gsap.utils.toArray('.stat .num[data-count]').forEach(num => {
    const end = parseFloat(num.dataset.count);
    const suffix = num.dataset.suffix || '';
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: num, start: 'top 90%' },
      onUpdate: () => { num.textContent = Math.round(obj.v) + suffix; }
    });
  });
}

/* ---- 5. Hero entrance animations ---- */
function initHeroEntrance() {
  if (!window.gsap) return;

  // 1. Homepage Hero Entrance
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    const elements = [
      heroContent.querySelector('.eyebrow'),
      heroContent.querySelector('h1'),
      heroContent.querySelector('.lead'),
      heroContent.querySelector('.hero-actions')
    ].filter(Boolean);

    // Remove reveal class from these to prevent GSAP conflicts
    elements.forEach(el => el.classList.remove('reveal'));

    gsap.set(elements, { opacity: 0, y: 24 });
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.3
    });
  }

  // 2. Inner Pages Hero Entrance
  const pageHero = document.querySelector('.page-hero');
  if (pageHero) {
    const elements = [
      pageHero.querySelector('.eyebrow'),
      pageHero.querySelector('h1'),
      pageHero.querySelector('.lead')
    ].filter(Boolean);

    // Remove reveal class from these to prevent GSAP conflicts
    elements.forEach(el => el.classList.remove('reveal'));

    gsap.set(elements, { opacity: 0, y: 20 });
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.15
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initHeader();
  initMobileNav();
  initHeroEntrance();
  initReveals();
});
