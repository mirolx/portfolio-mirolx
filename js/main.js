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
   Active nav link
   =========================== */
const page = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === page || (page === '' && a.getAttribute('href') === 'index.html')) {
    a.classList.add('active');
  }
});

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
