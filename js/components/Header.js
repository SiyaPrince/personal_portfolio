import { Component } from "./Component.js";
import { Navigation } from "./Navigation.js";

/**
 * Header Component
 * Loads header template then initializes Navigation inside it.
 */
export class Header extends Component {
  constructor() {
    super("app-header");
    this.navigation = null;
  }

  async render() {
    if (!this.element) {
      console.warn("⚠️ Header: #app-header not found.");
      return;
    }

    const template = await this.loadTemplate("components/header.html");
    if (!template) return;

    this.element.innerHTML = template;

    await this.initializeNavigation();
    this.attachEventListeners();
  }

  async initializeNavigation() {
    const navElement = this.element.querySelector("#app-navigation");
    if (!navElement) {
      console.warn("⚠️ Header: #app-navigation not found inside header.");
      return;
    }

    this.navigation = new Navigation(navElement);
    await this.navigation.render();
  }

  attachEventListeners() {
    // Header-specific listeners can go here (kept minimal)
  }

  destroy() {
    if (this.navigation?.destroy) this.navigation.destroy();
    super.destroy();
  }
}
