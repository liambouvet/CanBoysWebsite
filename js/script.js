(function () {
  'use strict';

  var PHONE_NUMBER = '3104087303';
  var PRICING = { 1: 20, 2: 40, 3: 55, 4: 70, 5: 90 };
  var POWER_WASH_PRICE = 50;

  function computeTotal(cans, powerWash) {
    if (!cans || !PRICING[cans]) return null;
    var total = PRICING[cans];
    if (powerWash) total += POWER_WASH_PRICE;
    return total;
  }

  function formatPrice(value) {
    return value === null || value === undefined ? '—' : '$' + value;
  }

  function buildSmsHref(phone, body) {
    var encoded = encodeURIComponent(body);
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var separator = isIOS ? '&' : '?';
    return 'sms:' + phone + separator + 'body=' + encoded;
  }

  // Opening custom-scheme links via location.href is blocked inside
  // sandboxed iframes (e.g. the Artifact preview) unless the sandbox grants
  // top-navigation. window.open only needs "allow-popups", which sandboxed
  // previews generally grant, so try that first and fall back for browsers
  // that block or ignore it.
  function openSmsLink(href) {
    var win = null;
    try {
      win = window.open(href, '_blank');
    } catch (e) {
      win = null;
    }
    if (!win) {
      window.location.href = href;
    }
  }

  // ---- Nav scroll state + mobile toggle ----
  function initNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var mobile = document.getElementById('navMobile');
    if (!nav || !toggle || !mobile) return;

    function onScroll() {
      if (window.scrollY > 12) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    toggle.addEventListener('click', function () {
      var isOpen = mobile.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobile.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Scroll reveal animations ----
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  // ---- Before / after draggable comparison slider ----
  function initCompare() {
    var compare = document.getElementById('compare');
    var beforeWrap = document.getElementById('compareBeforeWrap');
    var handle = document.getElementById('compareHandle');
    if (!compare || !beforeWrap || !handle) return;

    var dragging = false;

    function setPosition(percent) {
      percent = Math.min(100, Math.max(0, percent));
      beforeWrap.style.width = percent + '%';
      handle.style.left = percent + '%';
      syncImageWidth();
    }

    function syncImageWidth() {
      var rect = compare.getBoundingClientRect();
      beforeWrap.style.setProperty('--compare-img-w', rect.width + 'px');
    }

    function percentFromClientX(clientX) {
      var rect = compare.getBoundingClientRect();
      var x = clientX - rect.left;
      return (x / rect.width) * 100;
    }

    function onDown(e) {
      dragging = true;
      compare.classList.add('dragging');
      move(e);
    }
    function onUp() {
      dragging = false;
      compare.classList.remove('dragging');
    }
    function move(e) {
      if (!dragging) return;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(percentFromClientX(clientX));
      e.preventDefault();
    }

    handle.addEventListener('mousedown', onDown);
    compare.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', onUp);

    handle.addEventListener('touchstart', onDown, { passive: true });
    compare.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', onUp);

    window.addEventListener('resize', syncImageWidth);

    setPosition(50);
  }

  // ---- About page: pricing calculator ----
  function initPricingCalculator() {
    var canButtons = document.getElementById('canButtons');
    var powerWashGroup = document.getElementById('calcPowerWash');
    var totalValue = document.getElementById('calcTotalValue');
    var bookNowLink = document.getElementById('calcBookNow');
    if (!canButtons || !powerWashGroup || !totalValue || !bookNowLink) return;

    var state = { cans: null, powerWash: false };

    function render() {
      totalValue.textContent = formatPrice(computeTotal(state.cans, state.powerWash));

      var params = new URLSearchParams();
      if (state.cans) params.set('cans', state.cans);
      params.set('powerwash', state.powerWash ? 'yes' : 'no');
      bookNowLink.setAttribute('href', 'book.html?' + params.toString());
    }

    canButtons.querySelectorAll('.can-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        canButtons.querySelectorAll('.can-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.cans = parseInt(btn.getAttribute('data-cans'), 10);
        render();
      });
    });

    powerWashGroup.querySelectorAll('.toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        powerWashGroup.querySelectorAll('.toggle-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.powerWash = btn.getAttribute('data-value') === 'yes';
        render();
      });
    });

    render();
  }

  // ---- Book page: trash-day weekday legend is static, no JS needed ----

  // ---- Book page: booking form (prefill, estimated total, SMS submission) ----
  function initBookingForm() {
    var form = document.getElementById('bookingForm');
    if (!form) return;

    var cansSelect = document.getElementById('cans');
    var powerWashGroup = document.getElementById('formPowerWash');
    var totalToggle = document.getElementById('estimatedTotalToggle');
    var totalDetail = document.getElementById('estimatedTotalDetail');
    var totalIcon = document.getElementById('estimatedTotalIcon');
    var totalValue = document.getElementById('estimatedTotalValue');
    var estCansLine = document.getElementById('estCansLine');
    var estPowerWashLine = document.getElementById('estPowerWashLine');

    var state = { powerWash: false };

    // Prefill from query params carried over from the About-page calculator
    var params = new URLSearchParams(window.location.search);
    var prefCans = params.get('cans');
    var prefPowerWash = params.get('powerwash');

    if (prefCans && cansSelect) {
      cansSelect.value = prefCans;
    }
    if (prefPowerWash === 'yes') {
      state.powerWash = true;
      powerWashGroup.querySelectorAll('.toggle-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-value') === 'yes');
      });
    }

    function renderEstimate() {
      var cans = cansSelect.value ? parseInt(cansSelect.value, 10) : null;
      var total = computeTotal(cans, state.powerWash);
      totalValue.textContent = formatPrice(total);
      estCansLine.textContent = cans ? (cans + (cans === 1 ? ' can' : ' cans')) : '—';
      estPowerWashLine.textContent = state.powerWash ? 'Yes (+$50)' : 'No';
    }

    cansSelect.addEventListener('change', renderEstimate);

    powerWashGroup.querySelectorAll('.toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        powerWashGroup.querySelectorAll('.toggle-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.powerWash = btn.getAttribute('data-value') === 'yes';
        renderEstimate();
      });
    });

    // Estimated total collapse/expand
    totalToggle.addEventListener('click', function () {
      var collapsed = totalDetail.classList.toggle('collapsed');
      totalToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      totalIcon.innerHTML = collapsed ? '&#43;' : '&minus;';
    });

    renderEstimate();

    // Submission: build a prefilled SMS with all the booking details
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var name = document.getElementById('name').value.trim();
      var phone = document.getElementById('phone').value.trim();
      var address = document.getElementById('address').value.trim();
      var trashDay = document.getElementById('trashDay').value;
      var cansVal = cansSelect.value;
      var notes = document.getElementById('notes').value.trim();
      var total = computeTotal(cansVal ? parseInt(cansVal, 10) : null, state.powerWash);

      var lines = [
        'Hi, I\'d like to book Can Boys.',
        'Name: ' + name,
        'Phone: ' + phone,
        'Address: ' + address,
        'Trash day: ' + trashDay,
        'Cans: ' + cansVal,
        'Driveway Power Wash: ' + (state.powerWash ? 'Yes' : 'No'),
        'Notes: ' + (notes || 'None'),
        'Estimated total: ' + formatPrice(total)
      ];

      openSmsLink(buildSmsHref(PHONE_NUMBER, lines.join('\n')));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveal();
    initCompare();
    initPricingCalculator();
    initBookingForm();
  });
})();
