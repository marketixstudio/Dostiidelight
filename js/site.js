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

  // mark active nav link by pathname (clean URL)
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav a[href]').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
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

  const isMobile = window.innerWidth <= 992;
  const vp = isMobile ? '92%' : '86%';
  const st = (el, start) => ({ trigger: el, start: `top ${start || vp}`, once: true });
  const handled = new Set();

  // Eyebrows: slide from left
  gsap.utils.toArray('.eyebrow.reveal').forEach(el => {
    handled.add(el);
    gsap.fromTo(el,
      { x: -28, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.65, ease: 'power3.out', scrollTrigger: st(el) }
    );
  });

  // H2 / H3: rise up with subtle scale
  gsap.utils.toArray('h2.reveal, h3.reveal').forEach(el => {
    handled.add(el);
    gsap.fromTo(el,
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.85, ease: 'power3.out', scrollTrigger: st(el) }
    );
  });

  // Lead paragraphs: fade up after heading
  gsap.utils.toArray('.lead.reveal').forEach(el => {
    handled.add(el);
    gsap.fromTo(el,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, ease: 'power2.out', delay: 0.1, scrollTrigger: st(el) }
    );
  });

  // Badges row: cascade pop-in
  document.querySelectorAll('.badges').forEach(row => {
    const badges = Array.from(row.querySelectorAll('.badge.reveal'));
    badges.forEach(b => handled.add(b));
    if (!badges.length) return;
    gsap.fromTo(badges,
      { scale: 0.72, opacity: 0, y: 10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.42, ease: 'back.out(1.8)', stagger: 0.06, scrollTrigger: st(row) }
    );
  });

  // Grid cards: stagger slide-up per parent
  document.querySelectorAll('.grid').forEach(grid => {
    const cards = Array.from(grid.querySelectorAll('.card.reveal, .range-card.reveal'));
    cards.forEach(c => handled.add(c));
    if (!cards.length) return;
    gsap.fromTo(cards,
      { y: 52, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.72, ease: 'power3.out', stagger: 0.13, scrollTrigger: st(grid) }
    );
  });

  // Stat items: scale pop in together
  const statItems = Array.from(document.querySelectorAll('.stat.reveal'));
  statItems.forEach(el => handled.add(el));
  if (statItems.length) {
    gsap.fromTo(statItems,
      { scale: 0.82, opacity: 0, y: 16 },
      { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.5)', stagger: 0.1,
        scrollTrigger: st(statItems[0]) }
    );
  }

  // FAQ items: alternating left/right slide
  gsap.utils.toArray('.faq-item.reveal').forEach((el, i) => {
    handled.add(el);
    gsap.fromTo(el,
      { x: i % 2 === 0 ? -22 : 22, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.58, ease: 'power2.out', delay: (i % 5) * 0.04,
        scrollTrigger: st(el) }
    );
  });

  // Buttons: spring scale-up
  gsap.utils.toArray('.btn.reveal').forEach(el => {
    handled.add(el);
    gsap.fromTo(el,
      { y: 18, opacity: 0, scale: 0.92 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)', scrollTrigger: st(el) }
    );
  });

  // Ingredient cards: 3D tilt-in
  gsap.utils.toArray('.ingredient-card.reveal').forEach((el, i) => {
    handled.add(el);
    gsap.fromTo(el,
      { scale: 0.78, opacity: 0, rotationY: 12 },
      { scale: 1, opacity: 1, rotationY: 0, duration: 0.65, ease: 'back.out(1.4)',
        delay: i * 0.07, scrollTrigger: st(el) }
    );
  });

  // Generic fallback for anything else
  gsap.utils.toArray('.reveal').forEach((el, i) => {
    if (handled.has(el)) return;
    gsap.fromTo(el,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        delay: isMobile ? 0 : (i % 3) * 0.07, scrollTrigger: st(el) }
    );
  });

  // Stat counters
  gsap.utils.toArray('.stat .num[data-count]').forEach(num => {
    const end = parseFloat(num.dataset.count);
    const suffix = num.dataset.suffix || '';
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: num, start: 'top 90%', once: true },
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

  // 1. Homepage Hero
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    const eyebrow = heroContent.querySelector('.eyebrow');
    const h1 = heroContent.querySelector('h1');
    const lead = heroContent.querySelector('.lead');
    const actions = heroContent.querySelector('.hero-actions');
    const fallback = heroContent.querySelector('.hero-fallback-image');

    [eyebrow, h1, lead, actions, fallback].filter(Boolean)
      .forEach(el => el.classList.remove('reveal'));

    const tl = gsap.timeline({ delay: 0.25 });

    if (eyebrow) tl.fromTo(eyebrow,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }
    );
    if (h1) tl.fromTo(h1,
      { y: 44, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' },
      '-=0.25'
    );
    if (lead) tl.fromTo(lead,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, ease: 'power2.out' },
      '-=0.5'
    );
    if (actions) tl.fromTo(actions,
      { y: 18, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)' },
      '-=0.45'
    );
    if (fallback) tl.fromTo(fallback,
      { y: 30, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    );
  }

  // 2. Inner page hero
  const pageHero = document.querySelector('.page-hero');
  if (pageHero) {
    const elements = [
      pageHero.querySelector('.eyebrow'),
      pageHero.querySelector('h1'),
      pageHero.querySelector('.lead')
    ].filter(Boolean);

    elements.forEach(el => el.classList.remove('reveal'));

    const tl = gsap.timeline({ delay: 0.1 });
    const fromVars = [
      { x: -20, opacity: 0 },
      { y: 36, opacity: 0, scale: 0.96 },
      { y: 20, opacity: 0 }
    ];
    const toVars = [
      { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
      { y: 0, opacity: 1, scale: 1, duration: 0.85, ease: 'power3.out' },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }
    ];
    elements.forEach((el, i) => {
      tl.fromTo(el, fromVars[i] || { y: 20, opacity: 0 }, toVars[i] || { y: 0, opacity: 1, duration: 0.7 }, i === 0 ? '>' : '-=0.35');
    });
  }
}

/* ---- 7. Lazy video loader ---- */
function initLazyVideos() {
  const videos = document.querySelectorAll('video[data-lazy-video]');
  if (!videos.length) return;

  if (!('IntersectionObserver' in window)) {
    // Fallback: just load and play everything
    videos.forEach(v => { v.load(); v.play().catch(() => {}); });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      video.load();
      video.play().catch(() => {});
      observer.unobserve(video);
    });
  }, { rootMargin: '150px' });

  videos.forEach(v => observer.observe(v));
}

/* ---- 8. FAQ accordion ---- */
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

/* ---- 9. Distributor enquiry form ---- */
function initDistributorForm() {
  const form = document.querySelector('#distributor-form');
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.dist-status');
  const defaultLabel = btn ? btn.textContent : '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    // Build combined message from extra fields
    const biz   = (form.querySelector('[name="business"]')?.value || '').trim();
    const city  = (form.querySelector('[name="city"]')?.value || '').trim();
    const state = (form.querySelector('[name="state"]')?.value || '').trim();
    const extra = (form.querySelector('[name="extra"]')?.value || '').trim();
    const parts = [];
    if (biz)   parts.push('Business: ' + biz);
    if (city || state) parts.push('Location: ' + [city, state].filter(Boolean).join(', '));
    if (extra) parts.push(extra);
    const msgInput = form.querySelector('[name="extra"]');
    if (msgInput) msgInput.value = '[DISTRIBUTOR ENQUIRY]\n' + parts.join('\n');

    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    if (status) { status.textContent = ''; status.className = 'dist-status'; }

    try {
      const res = await fetch('distributor.php', {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || 'Unable to send.');
      form.innerHTML = `<div class="dist-success-state">
        <svg class="dist-check-circle" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
          <circle class="dist-check-bg" cx="36" cy="36" r="36"/>
          <circle class="dist-check-ring" cx="36" cy="36" r="30" transform="rotate(-90 36 36)"/>
          <polyline class="dist-check-tick" points="20,37 30,47 52,25"/>
        </svg>
        <p class="dist-success-title">Enquiry Received!</p>
        <p class="dist-success-body">We’ll be in touch within 24 hours.</p>
      </div>`;
    } catch (err) {
      if (status) { status.textContent = err.message || 'Something went wrong. Please call us directly.'; status.className = 'dist-status is-error'; }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = defaultLabel; }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initHeader();
  initMobileNav();
  initContactForm();
  initDistributorForm();
  initHeroEntrance();
  initReveals();
  initLazyVideos();
  initFaqAccordion();
});
