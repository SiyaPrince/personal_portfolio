/**
 * Basic Event Manager
 * Handles essential global events only (safe + no duplicates).
 */
console.log("📦 Loading EventManager...");

export class EventManager {
  constructor(app) {
    this.app = app;
    this._onResize = null;
  }

  init() {
    console.log("🔧 Setting up basic events...");

    const navMenu = document.querySelector(".nav-menu");

    this._onResize = () => {
      if (window.innerWidth > 768 && navMenu) {
        navMenu.classList.remove("active");
      }
    };

    window.addEventListener("resize", this._onResize);

    console.log("✅ Event manager initialized");
  }

  destroy() {
    if (this._onResize) window.removeEventListener("resize", this._onResize);
    this._onResize = null;
    console.log("✅ Event manager destroyed");
  }
}
