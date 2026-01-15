// js/pages/creative.js
// Creative Works filtering for creative.html (robust against CSS overriding [hidden])
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setAriaSelected(btn, isSelected) {
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
  }

  function showItem(el) {
    el.hidden = false;          // semantic
    el.style.display = "";      // visual (lets CSS decide)
    el.classList.remove("is-hidden");
    el.setAttribute("aria-hidden", "false");
  }

  function hideItem(el) {
    el.hidden = true;           // semantic
    el.style.display = "none";  // visual (wins even if CSS breaks [hidden])
    el.classList.add("is-hidden");
    el.setAttribute("aria-hidden", "true");
  }

  function applyFilter(filter, items) {
    const key = (filter || "all").toLowerCase().trim();

    items.forEach((item) => {
      const cat = (item.getAttribute("data-category") || "").toLowerCase().trim();
      const shouldShow = key === "all" || cat === key;

      if (shouldShow) showItem(item);
      else hideItem(item);
    });
  }

  function initCreativeFilters(root = document) {
    const filters = $(".creative-filters", root);
    if (!filters) return;

    const buttons = $$(".filter-btn[data-filter]", filters);
    const items = $$(".works-grid .work-item[data-category]", root);

    if (buttons.length === 0 || items.length === 0) return;

    // Prevent double-binding
    if (filters.__creativeFiltersInit) return;
    filters.__creativeFiltersInit = true;

    const setActive = (activeBtn) => {
      buttons.forEach((btn) => {
        const isActive = btn === activeBtn;
        btn.classList.toggle("active", isActive);
        setAriaSelected(btn, isActive);
      });
    };

    const defaultBtn =
      buttons.find((b) => (b.getAttribute("data-filter") || "").toLowerCase() === "all") ||
      buttons[0];

    // Event delegation
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn[data-filter]");
      if (!btn || !filters.contains(btn)) return;

      e.preventDefault();

      const filter = btn.getAttribute("data-filter") || "all";
      setActive(btn);
      applyFilter(filter, items);
    });

    // Default state
    setActive(defaultBtn);
    applyFilter(defaultBtn.getAttribute("data-filter"), items);
  }

  // Initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initCreativeFilters(document));
  } else {
    initCreativeFilters(document);
  }

  // If your app swaps pages with hash routing, safely re-init
  window.addEventListener("hashchange", () => {
    const filters = document.querySelector(".creative-filters");
    if (filters) filters.__creativeFiltersInit = false;
    initCreativeFilters(document);
  });
})();
