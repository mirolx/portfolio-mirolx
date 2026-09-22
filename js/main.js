/* ===========================
   Language / i18n
   =========================== */
const LANG_KEY = 'portfolio_lang';

function getLang() {
  return localStorage.getItem(LANG_KEY) || 'ko';
}

function applyLang(lang) {
  // Swap all text content
  document.querySelectorAll('[data-ko]').forEach(el => {
    const val = lang === 'ko' ? el.getAttribute('data-ko') : el.getAttribute('data-en');
    if (val !== null) el.innerHTML = val;
  });

  // Swap placeholder text
  document.querySelectorAll('[data-ko-placeholder]').forEach(el => {
    el.placeholder = lang === 'ko'
      ? el.getAttribute('data-ko-placeholder')
      : el.getAttribute('data-en-placeholder');
  });

  // Update toggle active state
  document.querySelectorAll('.lang-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.documentElement.lang = lang;
  localStorage.setItem(LANG_KEY, lang);
}

// Init language on load
const currentLang = getLang();
applyLang(currentLang);

// Wire toggle buttons (present on every page)
document.querySelectorAll('.lang-opt').forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

/* ===========================
   Navigation — scroll shadow
   =========================== */
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ===========================
   Mobile menu
   =========================== */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    })
  );
}

/* ===========================
   Nav pill + scroll-spy
   Sliding hover indicator; the resting position follows the section in view.
   =========================== */
const navAnchors = [...navLinks.querySelectorAll('a')];
const navPill = document.createElement('span');
navPill.className = 'nav-pill';
navPill.setAttribute('aria-hidden', 'true');
navLinks.prepend(navPill);

let activeLink = navAnchors[0];
let hovering = false;

function movePill(target, animate = true) {
  navAnchors.forEach(a => a.classList.toggle('on', a === target));
  if (!target) { navPill.style.opacity = '0'; return; }
  if (!animate) navPill.classList.remove('ready');
  navPill.style.width = target.offsetWidth + 'px';
  navPill.style.transform = `translateX(${target.offsetLeft}px)`;
  navPill.style.opacity = '1';
  if (!animate) {
    void navPill.offsetWidth; // flush so the jump isn't transitioned
    navPill.classList.add('ready');
  }
}

function setActive(link, animate = true) {
  activeLink = link;
  navAnchors.forEach(a => a.classList.toggle('active', a === link));
  if (!hovering) movePill(link, animate);
}

navAnchors.forEach(a => {
  a.addEventListener('mouseenter', () => { hovering = true; movePill(a); });
  a.addEventListener('focus', () => movePill(a));
});
navLinks.addEventListener('mouseleave', () => { hovering = false; movePill(activeLink); });
navLinks.addEventListener('focusout', () => movePill(activeLink));

// Link widths change with language and font loading — re-measure without animating
const refreshPill = () => movePill(hovering ? navAnchors.find(a => a.classList.contains('on')) : activeLink, false);
document.fonts?.ready.then(refreshPill);
window.addEventListener('resize', refreshPill);
document.querySelectorAll('.lang-opt').forEach(btn =>
  btn.addEventListener('click', () => requestAnimationFrame(refreshPill))
);

// Scroll-spy: the last section whose top has passed ~45% of the viewport is "current"
const spyTargets = navAnchors
  .map(a => ({ link: a, section: document.querySelector(a.getAttribute('href')) }))
  .filter(t => t.section);

let spyLocked = false;
let spyCurrent = null;

function runSpy(animate = true) {
  if (spyLocked) return;
  const line = window.innerHeight * 0.45;
  let current = spyTargets[0];
  spyTargets.forEach(t => { if (t.section.getBoundingClientRect().top <= line) current = t; });
  if (current === spyCurrent) return;
  spyCurrent = current;
  setActive(current.link, animate);
  const id = current.section.id;
  history.replaceState(null, '', id === 'home' ? location.pathname + location.search : '#' + id);
}
window.addEventListener('scroll', () => runSpy(), { passive: true });

// Clicking a link jumps straight to that item; ignore the sections passed on the way
navAnchors.forEach(a => a.addEventListener('click', () => {
  spyLocked = true;
  setActive(a);
  const unlock = () => { spyLocked = false; runSpy(); };
  window.addEventListener('scrollend', unlock, { once: true });
  setTimeout(unlock, 1500);
}));

// Initial state (also covers loading with a #hash or a restored scroll position)
runSpy(false);
window.addEventListener('load', () => runSpy(false));

/* ===========================
   Page transitions
   =========================== */
document.querySelectorAll('a[href]').forEach(a => {
  const href = a.getAttribute('href');
  if (href && !href.startsWith('http') && !href.startsWith('#') &&
      !href.startsWith('mailto') && href.endsWith('.html')) {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.body.classList.add('page-out');
      setTimeout(() => { location.href = href; }, 250);
    });
  }
});

/* ===========================
   Scroll reveal
   =========================== */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-s').forEach(el => observer.observe(el));

/* ===========================
   Contact form
   =========================== */
const form    = document.getElementById('contactForm');
const success = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.style.display = 'none';
    if (success) success.style.display = 'block';
  });
}


/* ===========================
   Footer — "click to copy email" pill
   =========================== */
const copyBtn  = document.getElementById('copyEmail');
const copyPill = document.getElementById('copyPill');

if (copyBtn && copyPill) {
  const finePointer = matchMedia('(pointer: fine)').matches;
  let px = 0, py = 0, tx = 0, ty = 0, raf = null, doneTimer = null;

  const place = () => copyPill.style.cssText = `--px:${px}px;--py:${py}px`;
  const loop = () => {
    px += (tx - px) * 0.22;
    py += (ty - py) * 0.22;
    place();
    raf = requestAnimationFrame(loop);
  };
  const show = () => {
    if (!raf) raf = requestAnimationFrame(loop);
    copyPill.classList.add('show');
  };
  const hide = () => {
    copyPill.classList.remove('show');
    cancelAnimationFrame(raf); raf = null;
  };

  if (finePointer) {
    copyBtn.addEventListener('pointerenter', e => {
      px = tx = e.clientX; py = ty = e.clientY;
      show();
    });
    copyBtn.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
    copyBtn.addEventListener('pointerleave', () => {
      hide();
      copyPill.classList.remove('done');
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  copyBtn.addEventListener('click', async () => {
    await copyText(copyBtn.dataset.email);
    copyPill.classList.add('done');
    if (!finePointer) {
      const r = copyBtn.getBoundingClientRect();
      px = tx = r.left + r.width / 2;
      py = ty = Math.min(Math.max(r.top + r.height / 2, 60), innerHeight - 60);
      place();
      copyPill.classList.add('show');
    }
    clearTimeout(doneTimer);
    doneTimer = setTimeout(() => {
      copyPill.classList.remove('done');
      if (!finePointer) copyPill.classList.remove('show');
    }, 1600);
  });
}

/* ===========================
   Hero name — typewriter
   =========================== */
const heroName = document.getElementById('heroName');
if (heroName) {
  const typed = heroName.querySelector('.typed');
  const full = typed.textContent;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    heroName.classList.add('done');
  } else {
    typed.textContent = '';
    let i = 0;
    const step = () => {
      typed.textContent = full.slice(0, i);
      if (i++ < full.length) {
        setTimeout(step, 95 + Math.random() * 70);
      } else {
        heroName.classList.add('done');
      }
    };
    setTimeout(step, 550); // start after the entrance fade
  }
}
