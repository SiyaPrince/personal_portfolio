/**
 * Application Entry Point - Robust version (hardened)
 * NOTE: uses import(), so it MUST be loaded as a module:
 *   <script type="module" src="js/main.js"></script>
 */
(() => {
  "use strict";

  console.log("🚀 Starting portfolio application...");

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const safeText = (v) => (v == null ? "" : String(v));
  const setHTML = (el, html) => {
    if (!el) return false;
    el.innerHTML = html;
    return true;
  };

  const setAppState = (state) => {
    document.documentElement.classList.toggle("app-loading", state === "loading");
    document.documentElement.classList.toggle("app-ready", state === "ready");
    document.documentElement.classList.toggle("app-error", state === "error");
  };

  const injectStylesOnce = (id, css) => {
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  };

  injectStylesOnce(
    "app-global-inline-styles",
    `
    .app-loading #main-content { opacity: 0.5; }
    .app-ready #main-content { animation: fadeIn 0.5s ease-in; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `
  );

  const loadModule = async (path, fallback = null) => {
    try {
      const module = await import(path);
      console.log(`✅ Loaded: ${path}`);
      return module;
    } catch (error) {
      console.warn(`⚠️ Failed to load ${path}:`, error?.message || error);
      return fallback;
    }
  };

  // -----------------------------
  // Basic navigation fallback
  // -----------------------------
  const PAGES = {
    home: "pages/home.html",
    projects: "pages/projects.html",
    creative: "pages/creative.html",
    about: "pages/about.html",
    contact: "pages/contact.html",
  };

  let basicNavInstalled = false;
  let currentFetchController = null;

  const updateActiveNav = (page) => {
    $$(".nav-link").forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("active", href === `#${page}`);
    });
  };

  const renderNotFound = (page) => {
    const main = $("#main-content");
    setHTML(
      main,
      `
      <div class="container" style="padding: 2rem; text-align: center;">
        <h2>Page Not Found</h2>
        <p>Could not load ${safeText(page)} page.</p>
        <a href="#home">Return Home</a>
      </div>
    `
    );
  };

  const loadBasicPage = async (page) => {
    const main = $("#main-content");
    if (!main) {
      console.warn("⚠️ #main-content not found; cannot render pages.");
      return;
    }

    const key = page && PAGES[page] ? page : "home";
    const pagePath = PAGES[key];

    if (currentFetchController) currentFetchController.abort();
    currentFetchController = new AbortController();

    try {
      const response = await fetch(pagePath, { signal: currentFetchController.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status} while fetching ${pagePath}`);
      const content = await response.text();

      setHTML(main, content);
      updateActiveNav(key);

      console.log(`✅ Loaded: ${key}`);
      setAppState("ready");
    } catch (error) {
      if (error?.name === "AbortError") return;

      console.warn("⚠️ Page load failed:", error?.message || error);
      setAppState("error");
      renderNotFound(key);
    }
  };

  const getHashPage = () => {
    const raw = (location.hash || "").replace(/^#/, "").trim();
    return raw || "home";
  };

  const setupBasicNavigation = () => {
    if (basicNavInstalled) return;
    basicNavInstalled = true;

    console.log("🔧 Setting up basic navigation...");

    document.addEventListener("click", (e) => {
      const link = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const page = href.replace(/^#/, "").trim();
      if (!page) return;

      e.preventDefault();
      if (location.hash !== `#${page}`) {
        location.hash = `#${page}`;
      } else {
        loadBasicPage(page);
      }
    });

    window.addEventListener("hashchange", () => loadBasicPage(getHashPage()));

    const navToggle = $(".nav-toggle");
    const navMenu = $(".nav-menu");
    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => navMenu.classList.toggle("active"));
    }

    loadBasicPage(getHashPage());
  };

  // -----------------------------
  // Modular / simplified load
  // -----------------------------
  const loadSimplifiedApp = async () => {
    console.log("🔄 Loading simplified application...");

    const [HeaderMod, FooterMod, RouterMod] = await Promise.all([
      loadModule("./components/Header.js"),
      loadModule("./components/Footer.js"),
      loadModule("./components/Router.js"),
    ]);

    const HeaderCtor = HeaderMod?.Header;
    const FooterCtor = FooterMod?.Footer;
    const RouterCtor = RouterMod?.Router;

    if (typeof HeaderCtor === "function" && typeof FooterCtor === "function" && typeof RouterCtor === "function") {
      try {
        const header = new HeaderCtor();
        const footer = new FooterCtor();
        const router = new RouterCtor();

        if (typeof header.render === "function") await header.render();
        if (typeof footer.render === "function") await footer.render();
        if (typeof router.init === "function") await router.init();

        console.log("✅ Simplified app loaded successfully");
        setAppState("ready");
        return;
      } catch (e) {
        console.warn("⚠️ Simplified app initialization failed:", e?.message || e);
      }
    }

    setupBasicNavigation();
  };

  const initializeApp = async () => {
    setAppState("loading");
    console.log("📦 Loading application modules...");

    try {
      const appMod = await loadModule("./core/App.js");
      const PortfolioApp = appMod?.PortfolioApp;

      if (typeof PortfolioApp === "function") {
        window.portfolioApp = new PortfolioApp();

        // Subscribe to state (if present) to drive CSS classes
        if (window.portfolioApp.state?.subscribe) {
          window.portfolioApp.state.subscribe((next) => {
            if (next.error) setAppState("error");
            else if (next.loading) setAppState("loading");
            else if (next.ready) setAppState("ready");
          });
        }

        if (typeof window.portfolioApp.init === "function") {
          await window.portfolioApp.init();
        }

        console.log("✅ Modular app loaded successfully");
        return;
      }

      await loadSimplifiedApp();
    } catch (error) {
      console.error("💥 Failed to initialize app:", error);
      setAppState("error");
      await loadSimplifiedApp();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
  } else {
    initializeApp();
  }
})();
