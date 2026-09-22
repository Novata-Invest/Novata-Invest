/* ==========================================================================
   NOVATA INVEST — поведение сайта
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     НАСТРОЙКА ОТПРАВКИ ЗАЯВОК
     Укажите адрес приёмника заявок (Formspree, Tilda Webhook, свой API).
     Пока значение пустое — форма работает в демо-режиме и только показывает
     подтверждение, никуда не отправляя данные.
     ------------------------------------------------------------------ */
  var LEAD_ENDPOINT = '';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------------------- Шапка ---------------------------- */
  var header = $('#siteHeader');
  var onScrollHeader = function () {
    if (!header) return;
    header.classList.toggle('is-stuck', window.scrollY > 8);
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ------------------------ Мобильное меню ------------------------ */
  var burger = $('#burger');
  var mobileNav = $('#mobileNav');
  var openMobileNav = function (open) {
    if (!mobileNav) return;
    mobileNav.classList.toggle('is-open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (burger) burger.addEventListener('click', function () { openMobileNav(true); });
  var mobileClose = $('#mobileNavClose');
  if (mobileClose) mobileClose.addEventListener('click', function () { openMobileNav(false); });
  if (mobileNav) {
    mobileNav.addEventListener('click', function (e) {
      if (e.target === mobileNav) openMobileNav(false);
    });
    $$('.mobile-nav__panel a', mobileNav).forEach(function (a) {
      a.addEventListener('click', function () { openMobileNav(false); });
    });
  }

  /* --------------------- Активный пункт меню --------------------- */
  var navLinks = $$('.site-nav a[href^="#"]');
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var visible = [];
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var i = visible.indexOf(entry.target.id);
        if (entry.isIntersecting && i === -1) visible.push(entry.target.id);
        if (!entry.isIntersecting && i !== -1) visible.splice(i, 1);
      });
      var current = visible.length ? visible[visible.length - 1] : null;
      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', current !== null && a.getAttribute('href') === '#' + current);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ------------------------ Появление блоков ------------------------ */
  var reveals = $$('[data-reveal]');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reveals.length) { /* нечего показывать */ }
  else if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* --------------------- Плавающая кнопка (моб.) --------------------- */
  var stickyCta = $('#stickyCta');
  var formSection = $('#form');
  if (stickyCta) {
    var toggleSticky = function () {
      var past = window.scrollY > window.innerHeight * 0.55;
      var formVisible = false;
      if (formSection) {
        var r = formSection.getBoundingClientRect();
        formVisible = r.top < window.innerHeight && r.bottom > 0;
      }
      stickyCta.classList.toggle('is-visible', past && !formVisible);
    };
    toggleSticky();
    window.addEventListener('scroll', toggleSticky, { passive: true });
    window.addEventListener('resize', toggleSticky);
  }

  /* ---------------------------- Cookies ---------------------------- */
  var cookie = $('#cookie');
  if (cookie) {
    var stored = null;
    try { stored = localStorage.getItem('novata_ck'); } catch (e) { stored = '1'; }
    if (stored !== '1') {
      window.setTimeout(function () { cookie.classList.add('is-visible'); }, 1600);
    }
    var acceptCookie = function () {
      try { localStorage.setItem('novata_ck', '1'); } catch (e) { /* режим инкогнито */ }
      cookie.classList.remove('is-visible');
    };
    var cookieOk = $('#cookieOk');
    var cookieClose = $('#cookieClose');
    if (cookieOk) cookieOk.addEventListener('click', acceptCookie);
    if (cookieClose) cookieClose.addEventListener('click', acceptCookie);
  }

  /* ----------------- Юридические документы в модальном окне -----------------
     Ссылки ведут на отдельные страницы (policy.html / agreement.html) и
     продолжают работать без JS. При наличии JS документ открывается прямо
     поверх формы, чтобы пользователь не терял заполненные поля.
     --------------------------------------------------------------------- */
  var modal = $('#legalModal');
  var modalTitle = $('#legalModalTitle');
  var modalBody = $('#legalModalBody');
  var modalLink = $('#legalModalLink');
  var lastFocused = null;

  var closeModal = function () {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };

  var openModal = function (key) {
    var tpl = document.getElementById('legal-' + key);
    if (!modal || !tpl || !('content' in tpl)) return false;
    lastFocused = document.activeElement;
    modalTitle.textContent = tpl.getAttribute('data-title') || '';
    modalBody.innerHTML = '';
    modalBody.appendChild(tpl.content.cloneNode(true));
    modalBody.scrollTop = 0;
    if (modalLink) modalLink.setAttribute('href', tpl.getAttribute('data-href') || '#');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modalBody.focus();
    return true;
  };

  $$('[data-legal]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (openModal(link.getAttribute('data-legal'))) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });

  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    var modalClose = $('#legalModalClose');
    var modalOk = $('#legalModalOk');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOk) modalOk.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal && modal.classList.contains('is-open')) closeModal();
    if (mobileNav && mobileNav.classList.contains('is-open')) openMobileNav(false);
  });

  /* ------------------------- Форма заявки ------------------------- */
  var form = $('#leadForm');
  var formCard = $('#formCard');

  var phoneInput = $('#leadPhone');
  if (phoneInput) {
    var formatPhone = function (raw) {
      var digits = raw.replace(/\D/g, '');
      if (!digits) return '';
      if (digits[0] === '8') digits = '7' + digits.slice(1);
      if (digits[0] !== '7') digits = '7' + digits;
      digits = digits.slice(0, 11);
      var out = '+7';
      if (digits.length > 1) out += ' (' + digits.slice(1, 4);
      if (digits.length >= 5) out += ') ' + digits.slice(4, 7);
      if (digits.length >= 8) out += '-' + digits.slice(7, 9);
      if (digits.length >= 10) out += '-' + digits.slice(9, 11);
      return out;
    };
    phoneInput.addEventListener('input', function () {
      var atEnd = phoneInput.selectionStart === phoneInput.value.length;
      phoneInput.value = formatPhone(phoneInput.value);
      if (atEnd) {
        var end = phoneInput.value.length;
        phoneInput.setSelectionRange(end, end);
      }
    });
    phoneInput.addEventListener('focus', function () {
      if (!phoneInput.value) phoneInput.value = '+7 (';
    });
    phoneInput.addEventListener('blur', function () {
      if (phoneInput.value.replace(/\D/g, '').length <= 1) phoneInput.value = '';
    });
  }

  var setFieldState = function (control, valid) {
    var field = control.closest('[data-field]');
    if (field) field.classList.toggle('is-invalid', !valid);
    if (valid) control.removeAttribute('aria-invalid');
    else control.setAttribute('aria-invalid', 'true');
    return valid;
  };

  var validators = {
    name: function (v) { return v.trim().length >= 2; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    phone: function (v) { return v.replace(/\D/g, '').length === 11; }
  };

  var validateControl = function (control) {
    if (control.type === 'checkbox') return setFieldState(control, control.checked);
    var rule = validators[control.name];
    return setFieldState(control, rule ? rule(control.value) : control.value.trim() !== '');
  };

  if (form) {
    $$('input[required]', form).forEach(function (control) {
      var revalidate = function () {
        var field = control.closest('[data-field]');
        if (field && field.classList.contains('is-invalid')) validateControl(control);
      };
      control.addEventListener('input', revalidate);
      control.addEventListener('change', revalidate);
      control.addEventListener('blur', function () {
        if (control.type !== 'checkbox' && control.value) validateControl(control);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var controls = $$('input[required]', form);
      var firstInvalid = null;
      controls.forEach(function (control) {
        if (!validateControl(control) && !firstInvalid) firstInvalid = control;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        if (firstInvalid.scrollIntoView) firstInvalid.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }

      // honeypot: заполнено ботом — тихо показываем успех
      var honey = form.querySelector('input[name="company"]');
      if (honey && honey.value) { showSuccess(); return; }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.setAttribute('aria-busy', 'true');

      var payload = {
        name: $('#leadName').value.trim(),
        email: $('#leadEmail').value.trim(),
        phone: $('#leadPhone').value.trim(),
        agree_data: true,
        agree_policy: true,
        page: window.location.href
      };

      if (!LEAD_ENDPOINT) {
        // Демо-режим: приёмник заявок ещё не подключён.
        window.setTimeout(showSuccess, 350);
        return;
      }

      fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('Bad response');
        showSuccess();
      }).catch(function () {
        if (submitBtn) submitBtn.removeAttribute('aria-busy');
        var mail = 'mailto:info@novata-invest.ru?subject=' + encodeURIComponent('Заявка с сайта') +
          '&body=' + encodeURIComponent(payload.name + '\n' + payload.email + '\n' + payload.phone);
        window.location.href = mail;
      });
    });
  }

  function showSuccess() {
    if (!formCard) return;
    formCard.classList.add('is-sent');
    if (form) form.reset();
    var submitBtn = form && form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.removeAttribute('aria-busy');
    if (formCard.scrollIntoView) formCard.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
})();
