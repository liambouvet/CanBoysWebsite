(function () {
  'use strict';

  // ---- Configuration ----
  var PHONE_NUMBER = 'PUT_PHONE_NUMBER_HERE'; // e.g. "+13105550123"
  var SMS_MESSAGE = "Hi, I'd like to book Can Boys. My address is [address], my trash day is [day], and I have [number] cans.";

  function buildSmsHref() {
    var body = encodeURIComponent(SMS_MESSAGE);
    // iOS uses "&body=", most Android clients use "?body="
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var separator = isIOS ? '&' : '?';
    return 'sms:' + PHONE_NUMBER + separator + 'body=' + body;
  }

  function wireBookButtons() {
    var href = buildSmsHref();
    document.querySelectorAll('[data-book]').forEach(function (el) {
      el.setAttribute('href', href);
    });
  }

  // ---- Nav scroll state + mobile toggle ----
  function initNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var mobile = document.getElementById('navMobile');

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

    setPosition(55);
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireBookButtons();
    initNav();
    initReveal();
    initCompare();
  });
})();
