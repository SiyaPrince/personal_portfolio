/**
 * Application Constants
 * Centralized configuration and constants (browser-safe)
 */

export const ROUTES = Object.freeze({
  home: "pages/home.html",
  projects: "pages/projects.html",
  creative: "pages/creative.html",
  about: "pages/about.html",
  contact: "pages/contact.html",
});

export const PAGE_SCRIPTS = Object.freeze({
  home: "js/pages/home.js",
  projects: "js/pages/projects.js",
  creative: "js/pages/creative.js",
  about: "js/pages/about.js",
  contact: "js/pages/contact.js",
});

export const BREAKPOINTS = Object.freeze({
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
});

export const TRANSITIONS = Object.freeze({
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
});

export const STORAGE_KEYS = Object.freeze({
  APP_STATE: "portfolio_state_v1",
  DEBUG: "portfolio_debug",
});

export const SELECTORS = Object.freeze({
  MAIN: "#main-content",
  NAV_LINK: ".nav-link",
  NAV_TOGGLE: ".nav-toggle",
  NAV_MENU: ".nav-menu",
});

export const DEFAULTS = Object.freeze({
  ROUTE: "home",
});
