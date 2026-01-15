/**
 * Helper Functions
 * Reusable utility functions (safe for SPA + modern browsers)
 */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function on(el, evt, handler, opts) {
  if (!el || !el.addEventListener) return () => {};
  el.addEventListener(evt, handler, opts);
  return () => el.removeEventListener(evt, handler, opts);
}

export function delegate(root, evt, selector, handler, opts) {
  if (!root) return () => {};
  const listener = (e) => {
    const match = e.target?.closest?.(selector);
    if (!match || !root.contains(match)) return;
    handler(e, match);
  };
  return on(root, evt, listener, opts);
}

export function debounce(func, wait = 200) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function throttle(func, limit = 200) {
  let inThrottle = false;
  let lastArgs = null;

  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          const la = lastArgs;
          lastArgs = null;
          throttled.apply(this, la);
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

export function clamp(n, min, max) {
  const num = Number(n);
  return Math.min(max, Math.max(min, Number.isFinite(num) ? num : min));
}

export function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function loadCSS(url) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error("loadCSS: url is required"));
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
    document.head.appendChild(link);
  });
}

export function injectStyles(css, { id } = {}) {
  if (id && document.getElementById(id)) return document.getElementById(id);
  const style = document.createElement("style");
  if (id) style.id = id;
  style.textContent = String(css || "");
  document.head.appendChild(style);
  return style;
}

export function escapeHtml(value) {
  const s = String(value ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}
