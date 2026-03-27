/* global SITE_I18N, SITE_CALC_TIMELINES */

var LANG_STORAGE_KEY = 'siteLang';

function getSiteLocale() {
  try {
    var saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'ru') return saved;
  } catch (e) { /* private mode */ }
  return 'ru';
}

function t(key) {
  var lang = getSiteLocale();
  var pack = window.SITE_I18N && window.SITE_I18N[lang];
  var ru = window.SITE_I18N && window.SITE_I18N.ru;
  if (pack && pack[key] !== undefined) return pack[key];
  if (ru && ru[key] !== undefined) return ru[key];
  return key;
}

function applySiteLocale(lang) {
  if (lang !== 'en' && lang !== 'ru') return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) { /* ignore */ }
  document.documentElement.lang = lang;

  var year = new Date().getFullYear();
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (!key || !window.SITE_I18N || !window.SITE_I18N[lang]) return;
    var tx = window.SITE_I18N[lang][key];
    if (tx === undefined) return;
    el.textContent = key === 'footer.copy' ? tx.replace(/\{\{YEAR\}\}/g, String(year)) : tx;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-placeholder');
    if (key && window.SITE_I18N[lang] && window.SITE_I18N[lang][key] !== undefined) {
      el.placeholder = window.SITE_I18N[lang][key];
    }
  });

  document.querySelectorAll('[data-i18n-alt]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-alt');
    if (key && window.SITE_I18N[lang] && window.SITE_I18N[lang][key] !== undefined) {
      el.alt = window.SITE_I18N[lang][key];
    }
  });

  document.title = window.SITE_I18N[lang]['meta.title'] || document.title;
  updateLangSwitchButton();
  updateMobileMenuButtonAria();
  resetCalcResultDisplay();
  var sub = document.querySelector('#contactForm button[type="submit"]');
  if (sub && !sub.disabled) sub.textContent = t('form.submit');
}

function resetCalcResultDisplay() {
  var res = document.getElementById('calcResult');
  if (res && res.classList.contains('active')) res.classList.remove('active');
  var lang = getSiteLocale();
  var loc = lang === 'en' ? 'en-US' : 'ru-RU';
  var priceEl = document.getElementById('calcPrice');
  var tlEl = document.getElementById('calcTimeline');
  if (priceEl) {
    priceEl.textContent = t('calc.from') + ' ' + (5000).toLocaleString(loc) + ' ₽';
  }
  if (tlEl && window.SITE_CALC_TIMELINES && window.SITE_CALC_TIMELINES[lang]) {
    tlEl.textContent = t('calc.timeline') + ' ' + window.SITE_CALC_TIMELINES[lang].prompts;
  }
}

function updateLangSwitchButton() {
  var btn = document.getElementById('langSwitch');
  if (!btn) return;
  var lang = getSiteLocale();
  if (lang === 'ru') {
    btn.textContent = window.SITE_I18N.ru['lang.switchToEn'];
    btn.setAttribute('aria-label', window.SITE_I18N.ru['lang.ariaToEn']);
  } else {
    btn.textContent = window.SITE_I18N.en['lang.switchToRu'];
    btn.setAttribute('aria-label', window.SITE_I18N.en['lang.ariaToRu']);
  }
}

function updateMobileMenuButtonAria() {
  var menuBtn = document.querySelector('.mobile-menu-btn');
  if (!menuBtn) return;
  var open = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-label', open ? t('nav.menuClose') : t('nav.menuOpen'));
}

function initLangSwitch() {
  var btn = document.getElementById('langSwitch');
  if (!btn) return;
  btn.addEventListener('click', function() {
    applySiteLocale(getSiteLocale() === 'ru' ? 'en' : 'ru');
  });
}

// NAVBAR SCROLL EFFECT
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });
}

// MOBILE MENU (класс на <nav>, без inline style)
function toggleMobileMenu() {
  const navbar = document.getElementById('navbar');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  if (!navbar || !menuBtn) return;
  const willOpen = !navbar.classList.contains('nav-open');
  navbar.classList.toggle('nav-open');
  menuBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  updateMobileMenuButtonAria();
  if (willOpen) {
    const firstLink = navbar.querySelector('.nav-links a');
    if (firstLink) requestAnimationFrame(function() { firstLink.focus(); });
  } else {
    menuBtn.focus();
  }
}

function closeMobileMenu() {
  const navbar = document.getElementById('navbar');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  if (!navbar || !navbar.classList.contains('nav-open')) return;
  navbar.classList.remove('nav-open');
  if (menuBtn) {
    menuBtn.setAttribute('aria-expanded', 'false');
    updateMobileMenuButtonAria();
    menuBtn.focus();
  }
}

/** Элементы с клавиатурной фокусировкой внутри контейнера (видимые на экране) */
function getVisibleFocusables(container) {
  const candidates = container.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.prototype.filter.call(candidates, function(el) {
    if (el.getAttribute('tabindex') === '-1') return false;
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    return el.offsetParent !== null;
  });
}

/** Escape, Tab-ловушка в шапке при открытом мобильном меню, возврат фокуса внутрь при «утечке» */
function initMobileMenuA11y() {
  document.addEventListener('keydown', function(e) {
    const navbar = document.getElementById('navbar');
    if (!navbar || !navbar.classList.contains('nav-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMobileMenu();
      return;
    }

    if (e.key !== 'Tab') return;

    const list = getVisibleFocusables(navbar);
    if (list.length === 0) return;

    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !navbar.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !navbar.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('focusin', function() {
    const navbar = document.getElementById('navbar');
    if (!navbar || !navbar.classList.contains('nav-open')) return;
    requestAnimationFrame(function() {
      if (!navbar.classList.contains('nav-open')) return;
      const active = document.activeElement;
      if (navbar.contains(active)) return;
      const list = getVisibleFocusables(navbar);
      if (list.length > 0) list[0].focus();
    });
  });
}

// CALCULATOR
function calculatePrice() {
  const service = document.querySelector('input[name="service"]:checked');
  const business = document.querySelector('input[name="business"]:checked');
  const urgency = document.querySelector('input[name="urgency"]:checked');

  if (!service || !business || !urgency) {
    alert(t('calc.alert'));
    return;
  }

  const lang = getSiteLocale();
  const loc = lang === 'en' ? 'en-US' : 'ru-RU';
  const timelines = window.SITE_CALC_TIMELINES[lang];

  const prices = {
    prompts: { base: 5000 },
    website: { base: 25000 },
    complex: { base: 50000 },
    training: { base: 3000 }
  };
  const urgencyMultipliers = { normal: 1, 'two-weeks': 1.2, urgent: 1.5 };
  const businessAdjustments = { expert: 0, small: 5000, school: 10000, other: 0 };

  const basePrice = prices[service.value].base;
  const multiplier = urgencyMultipliers[urgency.value];
  const adjustment = businessAdjustments[business.value];
  const finalPrice = basePrice * multiplier + adjustment;

  document.getElementById('calcPrice').textContent =
    t('calc.from') + ' ' + finalPrice.toLocaleString(loc) + ' ₽';
  document.getElementById('calcTimeline').textContent =
    t('calc.timeline') + ' ' + timelines[service.value];
  document.getElementById('calcResult').classList.add('active');
  document.getElementById('calcResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// CONTACT FORM
// Замените YOUR_FORMSPREE_ID на реальный ID с https://formspree.io — тогда письма будут уходить с сервера (удобно на хостинге).
// Пока стоит заглушка или страница открыта как file://, используется mailto (откроется почтовый клиент).
const FORMSPREE_FORM_ID = 'YOUR_FORMSPREE_ID';
const CONTACT_EMAIL = 'strunka89@yandex.ru';

function openMailtoWithForm() {
  const name = document.getElementById('name').value.trim();
  const contact = document.getElementById('contact').value.trim();
  const message = document.getElementById('message').value.trim();
  const subject = encodeURIComponent(t('form.mailSubj') + (name || t('form.mailNoName')));
  const body = encodeURIComponent(
    t('form.mailName') + name + '\n' +
    t('form.mailContact') + contact + '\n\n' +
    message
  );
  window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
}

function submitForm(event) {
  event.preventDefault();
  const form = document.getElementById('contactForm');
  const submitBtn = form.querySelector('button[type="submit"]');
  const formspreeConfigured = FORMSPREE_FORM_ID &&
    FORMSPREE_FORM_ID !== 'YOUR_FORMSPREE_ID' &&
    !FORMSPREE_FORM_ID.includes('YOUR_FORMSPREE');

  let isSuccess = false;

  submitBtn.textContent = t('form.sending');
  submitBtn.disabled = true;

  const formData = {
    name: document.getElementById('name').value,
    contact: document.getElementById('contact').value,
    message: document.getElementById('message').value
  };

  const finishSuccess = function() {
    isSuccess = true;
    document.getElementById('formSuccess').classList.add('active');
    form.reset();
  };

  if (!formspreeConfigured) {
    openMailtoWithForm();
    finishSuccess();
    submitBtn.textContent = t('form.submit');
    submitBtn.disabled = false;
    setTimeout(function() { document.getElementById('formSuccess').classList.remove('active'); }, 8000);
    return;
  }

  fetch('https://formspree.io/f/' + FORMSPREE_FORM_ID, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(formData)
  })
    .then(function(response) {
      if (response.ok) finishSuccess();
      else throw new Error('Ошибка отправки');
    })
    .catch(function(error) {
      console.error('Error:', error);
      if (confirm(t('form.confirmMailto'))) {
        openMailtoWithForm();
        finishSuccess();
      } else {
        alert(t('form.fallback') + CONTACT_EMAIL);
      }
    })
    .finally(function() {
      submitBtn.textContent = t('form.submit');
      submitBtn.disabled = false;
      if (isSuccess) {
        setTimeout(function() { document.getElementById('formSuccess').classList.remove('active'); }, 5000);
      }
    });
}

function initSmoothScrollAndMenuClose() {
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      const target = href ? document.querySelector(href) : null;
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileMenu();
    });
  });
}

function initContactFieldHighlight() {
  document.querySelectorAll('#contactForm input, #contactForm textarea').forEach(function(input) {
    input.addEventListener('blur', function() {
      this.style.borderColor = this.value.trim() !== '' ? 'var(--mint)' : 'var(--gray-light)';
    });
  });
}

function initFadeInObserver() {
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.fade-in').forEach(function(el) { observer.observe(el); });
}

function init() {
  if (!window.SITE_I18N) return;
  applySiteLocale(getSiteLocale());

  initNavbarScroll();
  initLangSwitch();

  const menuBtn = document.querySelector('.mobile-menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', toggleMobileMenu);

  const calcBtn = document.getElementById('calcSubmitBtn');
  if (calcBtn) calcBtn.addEventListener('click', calculatePrice);

  const contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', submitForm);

  initSmoothScrollAndMenuClose();

  window.addEventListener('resize', function() {
    if (window.matchMedia('(min-width: 769px)').matches) closeMobileMenu();
  });

  initContactFieldHighlight();
  initFadeInObserver();
  initMobileMenuA11y();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
