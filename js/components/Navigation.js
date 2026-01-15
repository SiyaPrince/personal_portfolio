import { Component } from "./Component.js";

/**
 * Navigation Component
 * Handles only nav UI (mobile menu open/close).
 * Routing + active links are handled by Router.
 */
export class Navigation extends Component {
  constructor(element = null) {
    super(element || "app-navigation");
    this.isMobileMenuOpen = false;

    this._boundToggle = null;
    this._boundDocClick = null;
    this._boundKeydown = null;
  }

  async render() {
    const target = this.element;
    if (!target) {
      console.warn("⚠️ Navigation: mount element not found.");
      return;
    }

    const template = await this.loadTemplate("components/navigation.html");
    if (!template) return;

    target.innerHTML = template;

    // Attach after DOM is set (no setTimeout needed)
    this.attachEventListeners();
  }

  attachEventListeners() {
    const navToggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (!navToggle || !navMenu) {
      console.warn("⚠️ Navigation: .nav-toggle or .nav-menu not found.");
      return;
    }

    // Avoid duplicate listeners if render() runs again
    this.detachEventListeners();

    navToggle.setAttribute("aria-expanded", "false");

    this._boundToggle = (e) => {
      e.preventDefault();
      this.toggleMobileMenu(navMenu, navToggle);
    };

    this._boundDocClick = (e) => {
      if (!this.isMobileMenuOpen) return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (navMenu.contains(t) || navToggle.contains(t)) return;
      this.closeMobileMenu(navMenu, navToggle);
    };

    this._boundKeydown = (e) => {
      if (e.key !== "Escape") return;
      if (!this.isMobileMenuOpen) return;
      this.closeMobileMenu(navMenu, navToggle);
    };

    navToggle.addEventListener("click", this._boundToggle);
    document.addEventListener("click", this._boundDocClick);
    document.addEventListener("keydown", this._boundKeydown);
  }

  detachEventListeners() {
    const navToggle = document.querySelector(".nav-toggle");
    if (navToggle && this._boundToggle) {
      navToggle.removeEventListener("click", this._boundToggle);
    }
    if (this._boundDocClick) document.removeEventListener("click", this._boundDocClick);
    if (this._boundKeydown) document.removeEventListener("keydown", this._boundKeydown);

    this._boundToggle = null;
    this._boundDocClick = null;
    this._boundKeydown = null;
  }

  toggleMobileMenu(navMenu, navToggle) {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    navMenu.classList.toggle("active", this.isMobileMenuOpen);
    navToggle.setAttribute("aria-expanded", String(this.isMobileMenuOpen));

    // Animate hamburger icon spans if they exist
    const spans = navToggle.querySelectorAll("span");
    if (spans.length >= 3) {
      if (this.isMobileMenuOpen) {
        spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
        spans[1].style.opacity = "0";
        spans[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
      } else {
        spans[0].style.transform = "none";
        spans[1].style.opacity = "1";
        spans[2].style.transform = "none";
      }
    }
  }

  closeMobileMenu(navMenu, navToggle) {
    this.isMobileMenuOpen = false;
    navMenu.classList.remove("active");
    navToggle.setAttribute("aria-expanded", "false");
  }

  destroy() {
    this.detachEventListeners();
    super.destroy();
  }
}
