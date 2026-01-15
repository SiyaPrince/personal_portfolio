/**
 * Logger Utility
 * Consistent logging throughout the application (browser-safe)
 *
 * Debug mode is enabled when ANY is true:
 * - localStorage "portfolio_debug" is "1" or "true"
 * - URL includes ?debug=1
 * - window.__DEBUG__ === true
 */
function isDebugEnabled() {
  try {
    const ls = (localStorage.getItem("portfolio_debug") || "").toLowerCase();
    if (ls === "1" || ls === "true") return true;
  } catch (_) {
    // ignore
  }

  try {
    const params = new URLSearchParams(location.search);
    if (params.get("debug") === "1" || (params.get("debug") || "").toLowerCase() === "true") return true;
  } catch (_) {
    // ignore
  }

  return window.__DEBUG__ === true;
}

function safeConsole(method, prefix, message, args) {
  const c = console;
  const fn = c && c[method] ? c[method] : c && c.log ? c.log : null;
  if (!fn) return;
  fn.call(c, `${prefix} ${message}`, ...args);
}

export class Logger {
  static info(message, ...args) {
    safeConsole("log", "ℹ️", message, args);
  }

  static warn(message, ...args) {
    safeConsole("warn", "⚠️", message, args);
  }

  static error(message, ...args) {
    safeConsole("error", "🔴", message, args);
  }

  static success(message, ...args) {
    safeConsole("log", "✅", message, args);
  }

  static debug(message, ...args) {
    if (!isDebugEnabled()) return;
    safeConsole("debug", "🐛", message, args);
  }
}
