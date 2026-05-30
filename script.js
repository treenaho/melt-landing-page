/* ============================================================
   MELT — Scroll choreography
   ============================================================ */

(function () {
  'use strict';

  // Always start at top — never restore prior scroll
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP not loaded — falling back to static reveal.');
    document.querySelectorAll('.hero-bottle, .choose-bottle, .glass-card, .hero-headline .word, .hero-sub, .hero-ctas')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Palette per flavor — drives portal background morphs
  const palettes = {
    vanilla: {
      bg1: '#FDF8F2',
      bg2: '#F7EDE4',
      bg3: '#ECD8FD',
      accent: '#D8CFF5',
    },
    strawberry: {
      bg1: '#FFEAF3',
      bg2: '#FBE1EA',
      bg3: '#F7BFD5',
      accent: '#F7BFD5',
    },
    blueberry: {
      bg1: '#E9F7FF',
      bg2: '#DCE9FE',
      bg3: '#BCE6FE',
      accent: '#BBD5FE',
    },
  };

  // -----------------------------
  // HERO entrance
  // -----------------------------
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTl
    .from('.hero-logo', { opacity: 0, scale: 0.85, y: -20, duration: 1.1 })
    .to('.hero-headline .word', {
      opacity: 1, y: 0,
      duration: 1.0,
      stagger: 0.08,
    }, '-=0.7')
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
    .to('.hero-ctas', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
    .to('.hero-bottle', {
      opacity: 1, y: 0,
      duration: 1.4,
      stagger: 0.18,
      ease: 'power4.out',
    }, '-=0.9');

  // -----------------------------
  // FLAVOR PORTALS
  // -----------------------------
  const portalsSection = document.querySelector('.portals');
  const portalStage = document.querySelector('.portal-stage');
  const portalsTrack = document.querySelector('.portals-track');
  const portalBgFill = document.querySelector('.portal-bg-fill');
  const portalBlobs = document.querySelectorAll('.portal-blob');
  const portalBottles = {
    vanilla:    document.querySelector('[data-portal-bottle="vanilla"]'),
    strawberry: document.querySelector('[data-portal-bottle="strawberry"]'),
    blueberry:  document.querySelector('[data-portal-bottle="blueberry"]'),
  };
  const portalContents = {
    vanilla:    document.querySelector('[data-portal-content="vanilla"]'),
    strawberry: document.querySelector('[data-portal-content="strawberry"]'),
    blueberry:  document.querySelector('[data-portal-content="blueberry"]'),
  };
  const progressDots = document.querySelectorAll('.portal-progress-dot');

  // Set initial portal palette to vanilla
  function applyPalette(p, immediate) {
    const apply = () => {
      portalBgFill.style.background =
        `radial-gradient(circle at 50% 50%, ${p.bg1} 0%, ${p.bg2} 55%, ${p.bg3} 100%)`;
      portalBlobs[0].style.background =
        `radial-gradient(circle, ${p.accent} 0%, transparent 70%)`;
      portalBlobs[1].style.background =
        `radial-gradient(circle, ${p.bg2} 0%, transparent 70%)`;
      portalBlobs[2].style.background =
        `radial-gradient(circle, ${p.bg1} 0%, transparent 70%)`;
    };
    if (immediate) apply();
    else gsap.to({}, { duration: 0.6, onUpdate: apply });
  }
  applyPalette(palettes.vanilla, true);

  // Helper: animate a single portal content's text in (slide UP from below)
  function revealPortalContent(el) {
    const eyebrow = el.querySelector('.portal-eyebrow');
    const title = el.querySelector('.portal-title');
    const desc = el.querySelector('.portal-desc');
    const chips = el.querySelectorAll('.chip');
    gsap.set(el, { opacity: 1, pointerEvents: 'auto' });
    gsap.fromTo(eyebrow, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
    gsap.fromTo(title,   { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.08 });
    gsap.fromTo(desc,    { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.22 });
    gsap.fromTo(chips,   { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', delay: 0.35, stagger: 0.07 });
  }
  function hidePortalContent(el, dir) {
    const eyebrow = el.querySelector('.portal-eyebrow');
    const title = el.querySelector('.portal-title');
    const desc = el.querySelector('.portal-desc');
    const chips = el.querySelectorAll('.chip');
    const y = dir === 'up' ? -30 : 30;
    gsap.to([eyebrow, title, desc, ...chips], { opacity: 0, y, duration: 0.35, ease: 'power2.in', stagger: 0.02 });
    gsap.to(el, { opacity: 0, duration: 0.35, ease: 'power2.in', delay: 0.1, onComplete: () => {
      gsap.set(el, { pointerEvents: 'none' });
    }});
  }

  // Desktop: CSS anchors bottle at top:50%, right:12% — GSAP uses yPercent:-50 to center vertically.
  // Mobile (≤900px): CSS anchors at bottom + left:50% — GSAP uses xPercent:-50 to center horizontally.
  const isMobile = () => window.innerWidth <= 900;
  const baseTransform = () => isMobile()
    ? { xPercent: -50, yPercent: 0 }
    : { xPercent: 0,   yPercent: -50 };

  function setupPortalBottles() {
    const base = baseTransform();
    Object.values(portalBottles).forEach(b => {
      gsap.set(b, { ...base, opacity: 0, x: isMobile() ? 0 : 280, y: isMobile() ? 60 : 0, scale: 0.9, rotation: 60 });
    });
  }
  setupPortalBottles();

  const ACTIVE_ROTATION = 30; // 30° clockwise

  function showBottle(key, fromDir) {
    const base = baseTransform();
    const mobile = isMobile();
    Object.entries(portalBottles).forEach(([k, b]) => {
      if (k === key) {
        gsap.to(b, {
          ...base,
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotation: ACTIVE_ROTATION,
          duration: 1.1,
          ease: 'power3.out',
        });
      } else {
        const offX = mobile ? 0 : (fromDir === 'left' ? -420 : 420);
        const offY = mobile ? 80 : 0;
        const rot = fromDir === 'left' ? -10 : 70;
        gsap.to(b, {
          ...base,
          opacity: 0,
          x: offX,
          y: offY,
          scale: 0.88,
          rotation: rot,
          duration: 0.75,
          ease: 'power3.in',
        });
      }
    });
  }

  function setProgress(idx) {
    progressDots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
  }

  // Each spacer = ~100vh of scroll = one portal beat.
  // CSS `position: sticky` on .portal-stage handles pinning natively;
  // ScrollTrigger is used only for the segment callbacks.
  const portalsTotal = 3;

  let currentPortal = -1;
  function gotoPortal(key, idx, dir) {
    if (currentPortal === idx) return;
    const prevKey = ['vanilla', 'strawberry', 'blueberry'][currentPortal];
    if (prevKey && portalContents[prevKey]) {
      hidePortalContent(portalContents[prevKey], dir === 'left' ? 'down' : 'up');
    }

    applyPalette(palettes[key]);
    showBottle(key, dir);
    if (portalContents[key]) revealPortalContent(portalContents[key]);
    setProgress(idx);
    currentPortal = idx;
  }

  // Build portal scroll triggers (CSS sticky pins the stage; we just fire segment callbacks)
  if (!reduceMotion) {
    const keys = ['vanilla', 'strawberry', 'blueberry'];
    const spacers = document.querySelectorAll('.portal-spacer');
    keys.forEach((key, i) => {
      const spacer = spacers[i];
      if (!spacer) return;
      ScrollTrigger.create({
        trigger: spacer,
        start: 'top center',
        end: 'bottom center',
        invalidateOnRefresh: true,
        onEnter: () => gotoPortal(key, i, 'right'),
        onEnterBack: () => gotoPortal(key, i, 'left'),
      });
    });
  } else {
    // Reduced motion fallback: show all 3 stacked, no pinning
    portalsTrack.style.height = 'auto';
    document.querySelectorAll('.portal-spacer').forEach(s => s.style.height = 'auto');
    portalStage.style.position = 'relative';
    portalStage.style.height = 'auto';
    Object.values(portalBottles).forEach(b => gsap.set(b, { opacity: 1, x: 0, scale: 1, rotation: 0 }));
    Object.values(portalContents).forEach(c => {
      c.style.position = 'relative';
      c.style.opacity = 1;
      c.querySelectorAll('.portal-eyebrow, .portal-title, .portal-desc, .chip')
        .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    });
  }

  // -----------------------------
  // RITUAL — cards reveal
  // -----------------------------
  gsap.utils.toArray('.glass-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.9,
      ease: 'power3.out',
      delay: i * 0.08,
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
      },
    });
  });

  // -----------------------------
  // CHOOSE — bottle reunion + selector
  // -----------------------------
  gsap.to('.choose-bottle', {
    opacity: 1,
    y: 0,
    duration: 1.2,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.choose',
      start: 'top 75%',
    },
  });

  gsap.from('.selector-panel', {
    opacity: 0,
    y: 60,
    filter: 'blur(10px)',
    duration: 1.0,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.selector-panel',
      start: 'top 88%',
    },
  });

  // Selector tile interactions
  const tiles = document.querySelectorAll('.selector-tile');
  const chooseBottles = {
    vanilla:    document.querySelector('[data-choose-bottle="vanilla"]'),
    strawberry: document.querySelector('[data-choose-bottle="strawberry"]'),
    blueberry:  document.querySelector('[data-choose-bottle="blueberry"]'),
  };

  tiles.forEach(tile => {
    const key = tile.dataset.select;

    tile.addEventListener('mouseenter', () => {
      Object.entries(chooseBottles).forEach(([k, b]) => {
        b.classList.toggle('is-focus', k === key);
        b.classList.toggle('is-dim',   k !== key);
      });
    });
    tile.addEventListener('mouseleave', () => {
      Object.values(chooseBottles).forEach(b => {
        b.classList.remove('is-focus');
        b.classList.remove('is-dim');
      });
    });

    tile.addEventListener('click', (e) => {
      e.preventDefault();
      tiles.forEach(t => t.classList.remove('is-selected'));
      tile.classList.add('is-selected');

      // Confirmation pulse on selected bottle
      const bottle = chooseBottles[key];
      gsap.fromTo(bottle,
        { scale: 1.0 },
        { scale: 1.08, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 }
      );

      // Subtle pulse the primary CTA
      const primary = document.querySelector('.selector-ctas .btn-primary');
      gsap.fromTo(primary,
        { boxShadow: '0 10px 30px rgba(185, 167, 255, 0.35)' },
        {
          boxShadow: '0 18px 50px rgba(247, 191, 213, 0.7)',
          duration: 0.5, yoyo: true, repeat: 1, ease: 'power2.out',
        }
      );
    });
  });

  // -----------------------------
  // Hero microcopy fade-in
  // -----------------------------
  gsap.to('.hero-microcopy', { opacity: 1, duration: 1.0, ease: 'power2.out', delay: 1.6 });


  // Press strip logos are always visible — no entry animation needed


  // -----------------------------
  // Moment section — stat counters + bottle parallax
  // -----------------------------
  gsap.utils.toArray('.stat').forEach((el, i) => {
    const numEl = el.querySelector('.stat-num');
    const target = parseFloat(numEl.dataset.count) || 0;
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        delay: i * 0.08,
        scrollTrigger: { trigger: '.moment-stats', start: 'top 80%' },
      });
    // Count-up
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to({ v: 0 }, {
          v: target, duration: 1.6, ease: 'power3.out',
          onUpdate() { numEl.textContent = Math.round(this.targets()[0].v); },
        });
      },
    });
  });

  gsap.fromTo('.moment-title', { opacity: 0, y: 30 }, {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.moment', start: 'top 75%' },
  });
  gsap.fromTo('.moment-desc', { opacity: 0, y: 20 }, {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.15,
    scrollTrigger: { trigger: '.moment', start: 'top 75%' },
  });
  gsap.fromTo('.moment-video', { opacity: 0, x: 80, scale: 0.94 }, {
    opacity: 1, x: 0, scale: 1, duration: 1.4, ease: 'power3.out',
    scrollTrigger: { trigger: '.moment', start: 'top 70%' },
  });
  // Soft parallax on the video itself
  gsap.to('.moment-video-frame', {
    yPercent: -6,
    ease: 'none',
    scrollTrigger: {
      trigger: '.moment', start: 'top bottom', end: 'bottom top',
      scrub: true,
    },
  });


  // -----------------------------
  // How-it-works — staggered reveal
  // -----------------------------
  gsap.utils.toArray('.how-step').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 40, filter: 'blur(6px)' }, {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 0.9, ease: 'power3.out', delay: i * 0.12,
      scrollTrigger: { trigger: '.how', start: 'top 80%' },
    });
  });


  // -----------------------------
  // UGC tiles — staggered float-up
  // -----------------------------
  gsap.utils.toArray('.ugc-tile').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 60, scale: 0.92 }, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.9, ease: 'power3.out', delay: i * 0.07,
      scrollTrigger: { trigger: '.ugc-grid', start: 'top 80%' },
    });
  });
  gsap.from('.ugc-cta', {
    opacity: 0, y: 20, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.ugc-cta', start: 'top 90%' },
  });


  // -----------------------------
  // FAQ — fade in + accordion accent
  // -----------------------------
  gsap.utils.toArray('.faq-item').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: i * 0.06,
      scrollTrigger: { trigger: '.faq-list', start: 'top 85%' },
    });
  });


  // -----------------------------
  // Sticky mobile order bar — show after hero, hide near footer
  // -----------------------------
  const stickyCta = document.querySelector('.sticky-cta');
  if (stickyCta) {
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'bottom 80%',
      end: () => `${document.querySelector('.choose').offsetTop - 200}`,
      onUpdate: self => {
        stickyCta.classList.toggle('is-visible', self.progress > 0 && self.progress < 1);
      },
      onLeave: () => stickyCta.classList.remove('is-visible'),
      onLeaveBack: () => stickyCta.classList.remove('is-visible'),
    });
  }


  // Refresh ScrollTrigger after fonts/images load
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

  // Resize handler — re-pin
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  });

})();
