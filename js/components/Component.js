/**
 * Base Component Class
 * Common functionality for all components.
 * Can mount by elementId OR by passing an element reference.
 */
export class Component {
  static templateCache = new Map();

  constructor(elementOrId = null) {
    /** @type {HTMLElement|null} */
    this.element = null;

    if (typeof elementOrId === "string" && elementOrId) {
      this.elementId = elementOrId;
      this.element = document.getElementById(elementOrId);
    } else {
      this.elementId = null;
      this.element = elementOrId instanceof HTMLElement ? elementOrId : null;
    }

    this.state = {};
    this._abort = null;
    this._mounted = true;
  }

  /**
   * Render method to be implemented by child classes
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this
  render() {
    throw new Error("Render method must be implemented by child class");
  }

  /**
   * Update component state and optionally re-render
   * @param {Object} newState
   * @param {{render?: boolean}} [options]
   */
  setState(newState, options = {}) {
    this.state = { ...this.state, ...newState };
    if (options.render !== false) this.render();
  }

  /**
   * Load HTML template from file with caching + abort safety
   * @param {string} path
   * @param {{cache?: boolean}} [options]
   * @returns {Promise<string>}
   */
  async loadTemplate(path, options = {}) {
    const useCache = options.cache !== false;

    if (useCache && Component.templateCache.has(path)) {
      return Component.templateCache.get(path);
    }

    // Abort any in-flight request from this component
    if (this._abort) this._abort.abort();
    this._abort = new AbortController();

    try {
      const response = await fetch(path, { signal: this._abort.signal });
      if (!response.ok) throw new Error(`Failed to load template: ${path} (HTTP ${response.status})`);

      const html = await response.text();
      if (useCache) Component.templateCache.set(path, html);
      return html;
    } catch (error) {
      if (error?.name === "AbortError") return "";
      console.error("Error loading template:", error);
      return '<div class="component-error">Error loading component</div>';
    }
  }

  /**
   * Hook for event listeners — child classes may implement
   */
  // eslint-disable-next-line class-methods-use-this
  attachEventListeners() {}

  /**
   * Cleanup hook
   */
  destroy() {
    this._mounted = false;
    if (this._abort) this._abort.abort();
  }
}
