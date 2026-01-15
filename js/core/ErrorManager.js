/**
 * Error Handler
 * Centralized error handling and recovery
 */
export class ErrorHandler {
  constructor(app) {
    this.app = app;
    this._onError = (e) => this.handleGlobalError(e);
    this._onRejection = (e) => this.handlePromiseRejection(e);
  }

  async init() {
    this.setupErrorHandling();
    console.log("✅ Error handler initialized");
  }

  setupErrorHandling() {
    window.addEventListener("error", this._onError);
    window.addEventListener("unhandledrejection", this._onRejection);
  }

  handleGlobalError(event) {
    console.error("🔴 Global error:", {
      error: event.error,
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    this.showErrorToast("Something went wrong. Please refresh the page.");
  }

  handlePromiseRejection(event) {
    console.error("🔴 Unhandled Promise Rejection:", event.reason);
    event.preventDefault();
    this.showErrorToast("A background operation failed.");
  }

  handleInitializationError(error) {
    console.error("💥 Application failed to initialize:", error);
    this.showFatalError();
  }

  showErrorToast(message) {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      z-index: 10000;
      max-width: 320px;
      box-shadow: 0 8px 24px rgba(0,0,0,.18);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 5000);
  }

  showFatalError() {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--color-primary);">
        <h2>😕 Something went wrong</h2>
        <p>We couldn't load the portfolio. Please refresh the page or try again later.</p>
        <button onclick="window.location.reload()" style="
          background: var(--color-accent-primary);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          margin-top: 1rem;
        ">Refresh Page</button>
      </div>
    `;
  }

  destroy() {
    window.removeEventListener("error", this._onError);
    window.removeEventListener("unhandledrejection", this._onRejection);
    console.log("✅ Error handler destroyed");
  }
}
