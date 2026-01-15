// js/pages/home.js
// Home page behaviors: typing subtitle, metric animations, scroll reveal
(() => {
  "use strict";

  const PAGE_ID = "home";
  const INIT_FLAG = `__page_init_${PAGE_ID}`;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function typeText(el, text, { speed = 45, startDelay = 300, loop = false } = {}) {
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = text;
      return;
    }

    let i = 0;
    el.textContent = "";

    const tick = () => {
      if (!document.body.contains(el)) return; // page swapped away
      el.textContent = text.slice(0, i++);
      if (i <= text.length) {
        setTimeout(tick, speed);
      } else if (loop) {
        setTimeout(() => {
          i = 0;
          el.textContent = "";
          tick();
        }, 1200);
      }
    };

    setTimeout(tick, startDelay);
  }

  function animateNumber(el, to, { duration = 900 } = {}) {
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = String(to);
      return;
    }

    const from = Number(el.getAttribute("data-from") || "0");
    const start = performance.now();

    const step = (now) => {
      if (!document.body.contains(el)) return;
      const t = Math.min(1, (now - start) / duration);
      const value = Math.round(from + (to - from) * t);
      el.textContent = value.toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  function initMetrics() {
    // Metrics: elements with [data-metric] (number target)
    const metrics = $$("[data-metric]");
    if (!metrics.length) return;

    const seen = new WeakSet();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target;
          if (seen.has(el)) continue;
          seen.add(el);

          const to = Number(el.getAttribute("data-metric") || "0");
          animateNumber(el, to, { duration: 900 });
        }
      },
      { threshold: 0.35 }
    );

    metrics.forEach((m) => io.observe(m));
  }

  function initScrollReveal() {
    // Simple reveal: add class "is-visible" to [data-reveal]
    const items = $$("[data-reveal]");
    if (!items.length) return;

    if (prefersReducedMotion()) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.15 }
    );

    items.forEach((el) => io.observe(el));
  }

  function initTyping() {
    // Looks for an element like: <span data-typing="Your text here"></span>
    // or element with id="subtitle" and data-typing-text.
    const target =
      $("[data-typing]") ||
      $("#subtitle") ||
      $(".subtitle") ||
      $(".hero-subtitle");

    if (!target) return;

    const text =
      target.getAttribute("data-typing") ||
      target.getAttribute("data-typing-text") ||
      target.textContent?.trim() ||
      "";

    if (!text) return;

    typeText(target, text, { speed: 40, startDelay: 300, loop: false });
  }

  function initHome() {
    // Avoid double init within same DOM instance
    const main = $("#main-content");
    if (!main) return;

    // If the content isn't home, do nothing.
    const isHome =
      main.querySelector("[data-page='home']") ||
      main.querySelector("#home") ||
      location.hash === "#home" ||
      location.hash === "" ||
      location.hash === "#";

    if (!isHome) return;

    // Prevent re-init on same injected content
    if (main[INIT_FLAG]) return;
    main[INIT_FLAG] = true;

    initTyping();
    initMetrics();
    initScrollReveal();
  }

  // Run now (router injects content before page script may load)
  initHome();

  // Also run after any future navigation if this script is loaded globally
  window.addEventListener("hashchange", () => {
    // reset init flag so home can re-init after injection
    const main = document.querySelector("#main-content");
    if (main) main[INIT_FLAG] = false;
    initHome();
  });
})();
