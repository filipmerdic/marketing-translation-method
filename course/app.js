/* Marketing Translation Method — landing page interactions
   Vanilla JS, no dependencies. Progressive enhancement only. */
(function () {
  'use strict';

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---- Reveal on scroll ----
     Only opt in to the hidden start-state when we can actually animate;
     otherwise content is left visible by CSS (no .js-reveal on <html>). */
  var reveals = document.querySelectorAll('.reveal');
  if (!reduceMotion && hasIO && reveals.length) {
    document.documentElement.classList.add('js-reveal');
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---- Sticky CTA bar ---- */
  var bar = document.getElementById('stickyCta');
  var closeBtn = document.getElementById('stickyClose');
  var hero = document.querySelector('.hero');
  var dismissed = false;
  try { dismissed = sessionStorage.getItem('mtm_cta_dismissed') === '1'; } catch (e) {}

  function showBar() { if (bar && !dismissed) bar.classList.add('show'); }
  function hideBar() { if (bar) bar.classList.remove('show'); }

  if (bar && hero && hasIO) {
    var heroObs = new IntersectionObserver(function (entries) {
      // Show the bar once the hero is no longer on screen.
      if (entries[0].isIntersecting) hideBar(); else showBar();
    }, { threshold: 0 });
    heroObs.observe(hero);
  } else if (bar) {
    window.addEventListener('scroll', function () {
      if (window.pageYOffset > 700) showBar(); else hideBar();
    }, { passive: true });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      dismissed = true;
      hideBar();
      try { sessionStorage.setItem('mtm_cta_dismissed', '1'); } catch (e) {}
    });
  }

  /* ---- FAQ: single-open accordion (enhances native <details>) ---- */
  var faqItems = document.querySelectorAll('.faq .faq-item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });
})();
