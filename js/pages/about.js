// // js/pages/about.js
// // About page: counters, bars/fills, learning journey "View Details", principle card flip a11y
// (() => {
//   "use strict";

//   const PAGE_ID = "about";
//   const INIT_FLAG = `__page_init_${PAGE_ID}`;

//   const $ = (sel, root = document) => root.querySelector(sel);
//   const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

//   const prefersReducedMotion = () =>
//     window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

//   function animateCounter(el, to, { duration = 900 } = {}) {
//     if (!el) return;

//     const finalTo = Number(to);
//     if (!Number.isFinite(finalTo)) return;

//     if (prefersReducedMotion()) {
//       el.textContent = String(finalTo);
//       return;
//     }

//     const from = Number(el.getAttribute("data-from") || el.textContent || "0");
//     const start = performance.now();

//     const step = (now) => {
//       if (!document.body.contains(el)) return;
//       const t = Math.min(1, (now - start) / duration);
//       const value = Math.round(from + (finalTo - from) * t);
//       el.textContent = value.toLocaleString();
//       if (t < 1) requestAnimationFrame(step);
//     };

//     requestAnimationFrame(step);
//   }

//   function initStatCounters(main) {
//     // IMPORTANT:
//     // Your timeline buttons also use data-target (e.g. "dev-details"),
//     // so counters MUST only target the stat elements.
//     const counters = $$(".stat-number[data-target],[data-count-to]", main);
//     if (!counters.length) return;

//     const seen = new WeakSet();
//     const io = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((e) => {
//           if (!e.isIntersecting) return;
//           const el = e.target;
//           if (seen.has(el)) return;
//           seen.add(el);

//           const raw = el.getAttribute("data-count-to") ?? el.getAttribute("data-target") ?? "0";
//           const to = Number(raw);
//           if (!Number.isFinite(to)) return;

//           animateCounter(el, to, { duration: 900 });
//         });
//       },
//       { threshold: 0.35 }
//     );

//     counters.forEach((c) => io.observe(c));
//   }

//   function initProgressBars(main) {
//     // Supports:
//     // 1) Generic: [data-progress] -> .progress-bar width
//     // 2) Tech levels: .tech-progress[data-level]
//     // 3) Balance scale fills: .scale-fill[data-percent]
//     const rm = prefersReducedMotion();

//     // (1) generic
//     const progressWraps = $$("[data-progress]", main);
//     if (progressWraps.length) {
//       const io1 = new IntersectionObserver(
//         (entries) => {
//           entries.forEach((e) => {
//             if (!e.isIntersecting) return;
//             const wrap = e.target;
//             const bar = wrap.querySelector(".progress-bar");
//             if (!bar) return;

//             const pct = Math.max(0, Math.min(100, Number(wrap.getAttribute("data-progress") || "0")));
//             bar.style.width = rm ? `${pct}%` : "0%";
//             bar.setAttribute("aria-valuenow", String(pct));

//             requestAnimationFrame(() => {
//               bar.style.transition = rm ? "none" : "width 700ms ease";
//               bar.style.width = `${pct}%`;
//             });
//           });
//         },
//         { threshold: 0.3 }
//       );

//       progressWraps.forEach((p) => io1.observe(p));
//     }

//     // (2) tech progress bars
//     const tech = $$(".tech-progress[data-level]", main);
//     if (tech.length) {
//       const io2 = new IntersectionObserver(
//         (entries) => {
//           entries.forEach((e) => {
//             if (!e.isIntersecting) return;
//             const el = e.target;
//             const pct = Math.max(0, Math.min(100, Number(el.getAttribute("data-level") || "0")));

//             el.style.width = rm ? `${pct}%` : "0%";
//             requestAnimationFrame(() => {
//               el.style.transition = rm ? "none" : "width 700ms ease";
//               el.style.width = `${pct}%`;
//             });
//           });
//         },
//         { threshold: 0.35 }
//       );
//       tech.forEach((t) => io2.observe(t));
//     }

//     // (3) balance fills
//     const fills = $$(".scale-fill[data-percent]", main);
//     if (fills.length) {
//       const io3 = new IntersectionObserver(
//         (entries) => {
//           entries.forEach((e) => {
//             if (!e.isIntersecting) return;
//             const el = e.target;
//             const pct = Math.max(0, Math.min(100, Number(el.getAttribute("data-percent") || "0")));

//             el.style.width = rm ? `${pct}%` : "0%";
//             requestAnimationFrame(() => {
//               el.style.transition = rm ? "none" : "width 700ms ease";
//               el.style.width = `${pct}%`;
//             });
//           });
//         },
//         { threshold: 0.35 }
//       );
//       fills.forEach((f) => io3.observe(f));
//     }
//   }

//   function initJourneyDetails(main) {
//     const wrap = $(".journey-section", main);
//     if (!wrap) return;

//     const buttons = $$(".timeline-expand[data-target]", wrap);
//     if (!buttons.length) return;

//     // init panel state + a11y
//     buttons.forEach((btn) => {
//       const id = btn.getAttribute("data-target");
//       if (!id) return;

//       const panel = wrap.querySelector(`#${CSS.escape(id)}`);
//       btn.setAttribute("aria-expanded", btn.getAttribute("aria-expanded") || "false");

//       if (panel) {
//         btn.setAttribute("aria-controls", panel.id);
//         if (!panel.hasAttribute("hidden")) panel.hidden = true;
//         panel.style.display = panel.hidden ? "none" : "";
//         panel.setAttribute("aria-hidden", panel.hidden ? "true" : "false");
//       }
//     });

//     const closeOthers = (keepId) => {
//       buttons.forEach((b) => {
//         const id = b.getAttribute("data-target");
//         if (!id || id === keepId) return;

//         const panel = wrap.querySelector(`#${CSS.escape(id)}`);

//         b.setAttribute("aria-expanded", "false");
//         b.classList.remove("active");
//         const item = b.closest(".timeline-item");
//         if (item) item.classList.remove("is-open");

//         if (panel) {
//           panel.hidden = true;
//           panel.style.display = "none";
//           panel.setAttribute("aria-hidden", "true");
//         }
//       });
//     };

//     wrap.addEventListener("click", (e) => {
//       const btn = e.target.closest?.(".timeline-expand[data-target]");
//       if (!btn || !wrap.contains(btn)) return;

//       e.preventDefault();

//       const id = btn.getAttribute("data-target");
//       if (!id) return;

//       const panel = wrap.querySelector(`#${CSS.escape(id)}`);
//       const item = btn.closest(".timeline-item");

//       const isOpen = btn.getAttribute("aria-expanded") === "true";
//       const nextOpen = !isOpen;

//       // accordion behavior
//       closeOthers(id);

//       btn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
//       btn.classList.toggle("active", nextOpen);
//       if (item) item.classList.toggle("is-open", nextOpen);

//       if (panel) {
//         panel.hidden = !nextOpen;
//         panel.style.display = nextOpen ? "" : "none";
//         panel.setAttribute("aria-hidden", nextOpen ? "false" : "true");
//       }
//     });
//   }

//   function initCardFlipA11y(main) {
//     const cards = $$(".principle-card,.flip-card,[data-flip-card]", main);
//     if (!cards.length) return;

//     const toggle = (card) => {
//       const flipped = !card.classList.contains("is-flipped");
//       card.classList.toggle("is-flipped", flipped);
//       card.setAttribute("aria-pressed", String(flipped));
//     };

//     cards.forEach((card) => {
//       if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
//       card.setAttribute("role", card.getAttribute("role") || "button");
//       card.setAttribute("aria-pressed", card.getAttribute("aria-pressed") || "false");
//     });

//     main.addEventListener("click", (e) => {
//       const card = e.target.closest?.(".principle-card,.flip-card,[data-flip-card]");
//       if (!card) return;
//       toggle(card);
//     });

//     main.addEventListener("keydown", (e) => {
//       const card = e.target.closest?.(".principle-card,.flip-card,[data-flip-card]");
//       if (!card) return;
//       if (e.key === "Enter" || e.key === " ") {
//         e.preventDefault();
//         toggle(card);
//       }
//     });
//   }

//   function initAbout() {
//     const main = document.querySelector("#main-content");
//     if (!main) return;

//     const isAbout =
//       main.querySelector("[data-page='about']") ||
//       main.querySelector(".page-about") ||
//       main.querySelector("#about") ||
//       location.hash === "#about";

//     if (!isAbout) return;

//     if (main[INIT_FLAG]) return;
//     main[INIT_FLAG] = true;

//     initStatCounters(main);
//     initProgressBars(main);
//     initJourneyDetails(main);
//     initCardFlipA11y(main);
//   }

//   initAbout();

//   window.addEventListener("hashchange", () => {
//     const main = document.querySelector("#main-content");
//     if (main) main[INIT_FLAG] = false;
//     initAbout();
//   });
// })();


// js/pages/about.js
// About page: counters + bars/fills + journey details + principle card flip + dynamic project count
(() => {
  "use strict";

  const PAGE_ID = "about";
  const INIT_FLAG = `__page_init_${PAGE_ID}`;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function fetchProjectCount() {
    try {
      const res = await fetch("data/projects.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.projects) ? data.projects : []);
      return list.length || 0;
    } catch {
      return null; // keep whatever is hard-coded
    }
  }

  function animateCounter(el, to, { duration = 900 } = {}) {
    if (!el) return;

    const finalTo = Number(to);
    if (!Number.isFinite(finalTo)) return;

    if (prefersReducedMotion()) {
      el.textContent = String(finalTo);
      return;
    }

    const from = Number(el.getAttribute("data-from") || el.textContent || "0");
    const start = performance.now();

    const step = (now) => {
      if (!document.body.contains(el)) return;
      const t = Math.min(1, (now - start) / duration);
      const value = Math.round(from + (finalTo - from) * t);
      el.textContent = value.toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  function initStatCounters(main) {
    // Only stat numbers — avoids touching your timeline buttons
    const counters = $$(".stat-number[data-target],[data-count-to]", main);
    if (!counters.length) return;

    const seen = new WeakSet();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          if (seen.has(el)) return;
          seen.add(el);

          const raw = el.getAttribute("data-count-to") ?? el.getAttribute("data-target") ?? "0";
          const to = Number(raw);
          if (!Number.isFinite(to)) return;

          animateCounter(el, to, { duration: 900 });
        });
      },
      { threshold: 0.35 }
    );

    counters.forEach((c) => io.observe(c));
  }

  function initProgressBars(main) {
    const rm = prefersReducedMotion();

    const tech = $$(".tech-progress[data-level]", main);
    if (tech.length) {
      const io2 = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const pct = Math.max(0, Math.min(100, Number(el.getAttribute("data-level") || "0")));

            el.style.width = rm ? `${pct}%` : "0%";
            requestAnimationFrame(() => {
              el.style.transition = rm ? "none" : "width 700ms ease";
              el.style.width = `${pct}%`;
            });
          });
        },
        { threshold: 0.35 }
      );
      tech.forEach((t) => io2.observe(t));
    }

    const fills = $$(".scale-fill[data-percent]", main);
    if (fills.length) {
      const io3 = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const pct = Math.max(0, Math.min(100, Number(el.getAttribute("data-percent") || "0")));

            el.style.width = rm ? `${pct}%` : "0%";
            requestAnimationFrame(() => {
              el.style.transition = rm ? "none" : "width 700ms ease";
              el.style.width = `${pct}%`;
            });
          });
        },
        { threshold: 0.35 }
      );
      fills.forEach((f) => io3.observe(f));
    }
  }

  function initJourneyDetails(main) {
    const wrap = $(".journey-section", main);
    if (!wrap) return;

    const buttons = $$(".timeline-expand[data-target]", wrap);
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      const id = btn.getAttribute("data-target");
      if (!id) return;

      const panel = wrap.querySelector(`#${CSS.escape(id)}`);
      btn.setAttribute("aria-expanded", btn.getAttribute("aria-expanded") || "false");

      if (panel) {
        btn.setAttribute("aria-controls", panel.id);
        if (!panel.hasAttribute("hidden")) panel.hidden = true;
        panel.style.display = panel.hidden ? "none" : "";
        panel.setAttribute("aria-hidden", panel.hidden ? "true" : "false");
      }
    });

    const closeOthers = (keepId) => {
      buttons.forEach((b) => {
        const id = b.getAttribute("data-target");
        if (!id || id === keepId) return;

        const panel = wrap.querySelector(`#${CSS.escape(id)}`);
        b.setAttribute("aria-expanded", "false");
        b.classList.remove("active");
        const item = b.closest(".timeline-item");
        if (item) item.classList.remove("is-open");

        if (panel) {
          panel.hidden = true;
          panel.style.display = "none";
          panel.setAttribute("aria-hidden", "true");
        }
      });
    };

    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest?.(".timeline-expand[data-target]");
      if (!btn || !wrap.contains(btn)) return;

      e.preventDefault();

      const id = btn.getAttribute("data-target");
      if (!id) return;

      const panel = wrap.querySelector(`#${CSS.escape(id)}`);
      const item = btn.closest(".timeline-item");

      const isOpen = btn.getAttribute("aria-expanded") === "true";
      const nextOpen = !isOpen;

      closeOthers(id);

      btn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
      btn.classList.toggle("active", nextOpen);
      if (item) item.classList.toggle("is-open", nextOpen);

      if (panel) {
        panel.hidden = !nextOpen;
        panel.style.display = nextOpen ? "" : "none";
        panel.setAttribute("aria-hidden", nextOpen ? "false" : "true");
      }
    });
  }

  function initCardFlipA11y(main) {
    const cards = $$(".principle-card,.flip-card,[data-flip-card]", main);
    if (!cards.length) return;

    const toggle = (card) => {
      const flipped = !card.classList.contains("is-flipped");
      card.classList.toggle("is-flipped", flipped);
      card.setAttribute("aria-pressed", String(flipped));
    };

    cards.forEach((card) => {
      if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
      card.setAttribute("role", card.getAttribute("role") || "button");
      card.setAttribute("aria-pressed", card.getAttribute("aria-pressed") || "false");
    });

    main.addEventListener("click", (e) => {
      const card = e.target.closest?.(".principle-card,.flip-card,[data-flip-card]");
      if (!card) return;
      toggle(card);
    });

    main.addEventListener("keydown", (e) => {
      const card = e.target.closest?.(".principle-card,.flip-card,[data-flip-card]");
      if (!card) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(card);
      }
    });
  }

  async function setProjectsBuiltStat(main) {
    // Find the stat-card whose label says "Projects Built"
    const cards = $$(".stat-card", main);
    const targetCard = cards.find((c) => {
      const label = c.querySelector(".stat-label");
      return label && /projects\s*built/i.test(label.textContent || "");
    });

    if (!targetCard) return;

    const numberEl = targetCard.querySelector(".stat-number");
    if (!numberEl) return;

    const count = await fetchProjectCount();
    if (count == null) return; // keep your current number if fetch fails

    numberEl.setAttribute("data-target", String(count));
    numberEl.textContent = "0"; // so the animation starts clean
  }

  async function initAbout() {
    const main = document.querySelector("#main-content");
    if (!main) return;

    const isAbout =
      main.querySelector("[data-page='about']") ||
      main.querySelector(".page-about") ||
      main.querySelector("#about") ||
      location.hash === "#about";

    if (!isAbout) return;

    if (main[INIT_FLAG]) return;
    main[INIT_FLAG] = true;

    await setProjectsBuiltStat(main);

    initStatCounters(main);
    initProgressBars(main);
    initJourneyDetails(main);
    initCardFlipA11y(main);
  }

  initAbout();

  window.addEventListener("hashchange", () => {
    const main = document.querySelector("#main-content");
    if (main) main[INIT_FLAG] = false;
    initAbout();
  });
})();
