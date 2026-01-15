/**
 * App Core
 * Orchestrates Header/Footer/Router safely.
 */
console.log("📦 Loading App core...");

import { StateManager } from "./StateManager.js";

export class PortfolioApp {
  constructor() {
    this.components = {};
    this.initialized = false;

    // Global app state
    this.state = new StateManager({
      persistKeys: ["theme"], // keep theme if you ever add one
      initialState: { route: "home", loading: true, ready: false, error: null },
    });

    // Optional: convenient debugging access
    window.appState = this.state;
  }

  async init() {
    try {
      console.log("🚀 Initializing Portfolio Application...");
      this.state.set({ loading: true, ready: false, error: null });

      await this.initializeComponents();

      this.initialized = true;
      this.state.set({ loading: false, ready: true });

      console.log("✅ Portfolio application initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize app:", error);
      this.state.set({ loading: false, ready: false, error: error?.message || String(error) });
      this.showErrorToUser(error);
      throw error;
    }
  }

  async initializeComponents() {
    console.log("📦 Loading components...");

    const [{ Header }, { Footer }, { Router }] = await Promise.all([
      import("../components/Header.js"),
      import("../components/Footer.js"),
      import("../components/Router.js"),
    ]);

    this.components.header = new Header(this.state);
    await this.components.header.render();

    this.components.footer = new Footer(this.state);
    await this.components.footer.render();

    this.components.router = new Router(this.state);
    await this.components.router.init();

    console.log("🎉 All components initialized successfully");
  }

  showErrorToUser(error) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h2>Application Error</h2>
        <p>Something went wrong while loading the portfolio.</p>
        <p style="opacity:.7; font-size:.95rem;">${(error && error.message) ? error.message : ""}</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }

  isReady() {
    return this.initialized;
  }

  async navigateTo(page) {
    if (this.components.router?.navigateTo) {
      await this.components.router.navigateTo(page);
    }
  }
}
