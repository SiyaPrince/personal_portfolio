// js/components/Router.js

export class Router {
  constructor(appState = null) {
    this.state = appState;

    this.mainSelector = "#main-content";
    this.navLinkSelector = ".nav-link";

    this.routes = {
      home: "pages/home.html",
      projects: "pages/projects.html",
      creative: "pages/creative.html",
      about: "pages/about.html",
      contact: "pages/contact.html",
    };

    // Page-level scripts to auto-load (Option A)
    this.pageScripts = {
      home: "js/pages/home.js",
      about: "js/pages/about.js",
      creative: "js/pages/creative.js",
      projects: "js/pages/projects.js",
      contact: "js/pages/contact.js",
    };

    this.currentPage = "home";

    this._abort = null;
    this._onHashChange = () => {
      const page = this.getCurrentPageFromHash();
      // hash already changed, so don't re-set it
      this.navigateTo(page, { updateUrl: false });
    };
    this._onClick = (event) => this.handleNavClick(event);
  }

  get main() {
    return document.querySelector(this.mainSelector);
  }

  async init() {
    console.log("🔄 Router initializing...");

    window.addEventListener("hashchange", this._onHashChange);
    document.addEventListener("click", this._onClick);

    const initial = this.getCurrentPageFromHash();
    await this.navigateTo(initial, { updateUrl: false });

    console.log("✅ Router initialized");
  }

  destroy() {
    window.removeEventListener("hashchange", this._onHashChange);
    document.removeEventListener("click", this._onClick);
    if (this._abort) this._abort.abort();
  }

  handleNavClick(event) {
    const link = event.target?.closest?.('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute("href") || "";
    const page = href.replace(/^#/, "").trim();
    if (!page) return;

    // Only intercept our known routes
    if (!this.routes[page]) return;

    event.preventDefault();
    this.navigateTo(page, { updateUrl: true });
  }

  getCurrentPageFromHash() {
    const hash = (window.location.hash || "").replace(/^#/, "").trim();
    return this.routes[hash] ? hash : "home";
  }

  async navigateTo(page, { updateUrl = true } = {}) {
    if (!this.routes[page]) {
      console.warn(`⚠️ Page "${page}" not found, redirecting to home`);
      page = "home";
    }

    // Avoid unnecessary reload if already on page and updateUrl requested
    if (this.currentPage === page && updateUrl && window.location.hash === `#${page}`) {
      return;
    }

    this.currentPage = page;

    // state hooks (optional)
    if (this.state?.set) this.state.set({ route: page, loading: true, error: null });

    try {
      if (updateUrl) {
        if (window.location.hash !== `#${page}`) {
          window.location.hash = `#${page}`;
          // hashchange will call navigateTo(updateUrl:false), so stop here
          return;
        }
      }

      await this.loadPage(page);
      this.updateActiveNavLink(page);

      // Auto-load the page script AFTER HTML is injected
      await this.loadPageScript(page);

      if (this.state?.set) this.state.set({ loading: false, ready: true });

      console.log(`✅ Navigated to: ${page}`);
    } catch (error) {
      console.error(`❌ Failed to navigate to ${page}:`, error);
      if (this.state?.set) this.state.set({ loading: false, ready: false, error: error?.message || String(error) });

      // fallback to home
      if (page !== "home") {
        await this.navigateTo("home", { updateUrl: true });
      } else {
        this.renderError(page);
      }
    }
  }

  async loadPage(page) {
    const main = this.main;
    if (!main) {
      console.warn("⚠️ Router: #main-content not found.");
      return;
    }

    const pagePath = this.routes[page];

    if (this._abort) this._abort.abort();
    this._abort = new AbortController();

    const response = await fetch(pagePath, { signal: this._abort.signal });
    if (!response.ok) throw new Error(`Failed to load ${pagePath} (HTTP ${response.status})`);

    const content = await response.text();

    // small fade
    main.style.transition = "opacity 200ms ease";
    main.style.opacity = "0";

    await new Promise((r) => setTimeout(r, 120));

    main.innerHTML = content;
    main.style.opacity = "1";
  }

  updateActiveNavLink(page) {
    const links = document.querySelectorAll(this.navLinkSelector);
    links.forEach((link) => {
      const linkPage = (link.getAttribute("href") || "").replace(/^#/, "");
      link.classList.toggle("active", linkPage === page);
    });
  }

  async loadPageScript(page) {
    const src = this.pageScripts[page];
    if (!src) return;

    // If already loaded once, do not load again.
    // Each page script is written to re-init on hashchange anyway.
    if (document.querySelector(`script[data-page-script="${page}"]`)) return;

    await new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.dataset.pageScript = page;

      s.onload = () => resolve();
      s.onerror = () => {
        console.warn(`⚠️ Router: failed to load page script: ${src}`);
        resolve();
      };

      document.body.appendChild(s);
    });
  }

  renderError(page) {
    const main = this.main;
    if (!main) return;

    main.innerHTML = `
      <div class="container" style="padding:2rem;text-align:center;">
        <h2>Page Not Found</h2>
        <p>Could not load <strong>${page}</strong>.</p>
        <a href="#home">Return Home</a>
      </div>
    `;
  }
}
