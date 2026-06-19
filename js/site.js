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

  if (window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
  }

  if (window.gsap) {
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
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

  const navId = nav.id || 'primary-navigation';
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let previouslyFocused = null;

  nav.id = navId;
  toggle.setAttribute('aria-controls', navId);

  const syncMenuAccessibility = (isOpen) => {
    const isMobile = window.innerWidth <= 992;
    toggle.setAttribute('aria-expanded', String(isOpen));
    nav.inert = isMobile && !isOpen;
    if (isMobile) {
      nav.setAttribute('aria-hidden', String(!isOpen));
    } else {
      nav.removeAttribute('aria-hidden');
    }
  };

  syncMenuAccessibility(false);

  const openMenu = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    previouslyFocused = document.activeElement;
    nav.classList.add('open');
    if (overlay) overlay.classList.add('open');
    syncMenuAccessibility(true);
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  };

  const closeMenu = (e, restoreFocus = true) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    nav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    syncMenuAccessibility(false);
    document.body.style.overflow = '';
    if (restoreFocus && previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  };

  toggle.addEventListener('click', openMenu);

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => closeMenu(null, false));
  });

  document.addEventListener('keydown', (e) => {
    if (!nav.classList.contains('open')) return;
    if (e.key === 'Escape') {
      closeMenu(e);
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = Array.from(nav.querySelectorAll(focusableSelector));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 992 && nav.classList.contains('open')) {
      closeMenu(null, false);
    } else {
      syncMenuAccessibility(nav.classList.contains('open'));
    }
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

/* ---- 5. Contact form ---- */
function initContactForm() {
  const form = document.querySelector('#enquiry-form');
  if (!form || !window.fetch) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  const defaultLabel = submitButton ? submitButton.textContent : '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }
    if (status) {
      status.textContent = 'Sending your enquiry...';
      status.className = 'form-status';
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Unable to send your enquiry.');

      form.reset();
      if (status) {
        status.textContent = result.message || 'Thank you. Your enquiry has been sent.';
        status.className = 'form-status is-success';
      }
    } catch (error) {
      if (status) {
        status.textContent = error.message || 'Unable to send right now. Please call or email us directly.';
        status.className = 'form-status is-error';
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultLabel;
      }
    }
  });
}

/* ---- 6. Hero entrance animations ---- */
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

/* ---- 7. FAQ accordion ---- */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach((item, i) => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    if (i === 0) {
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      items.forEach(it => {
        it.classList.remove('is-open');
        const b = it.querySelector('.faq-question');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

if (window.gsap && window.ScrollTrigger) {
  document.documentElement.classList.add('motion-ready');
}

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initHeader();
  initMobileNav();
  initContactForm();
  initHeroEntrance();
  initReveals();
  initFaqAccordion();
});
