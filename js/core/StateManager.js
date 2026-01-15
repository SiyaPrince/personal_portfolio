/**
 * StateManager (tiny global store)
 * - Single source of truth for app state
 * - Subscribe to changes (pub/sub)
 * - Optional persistence (theme by default)
 */
export class StateManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || "portfolio_state_v1";
    this.persistKeys = new Set(options.persistKeys || ["theme"]);
    this.listeners = new Set();

    this.state = {
      route: "home",
      loading: false,
      ready: false,
      error: null,
      theme: "light",
      mobileMenuOpen: false,
      ...(options.initialState || {}),
      ...this._loadPersisted(),
    };
  }

  getState() {
    return { ...this.state };
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const patch = typeof key === "string" ? { [key]: value } : (key || {});
    const prev = this.state;

    // No-op if nothing changes
    let changed = false;
    for (const k of Object.keys(patch)) {
      if (prev[k] !== patch[k]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;

    this.state = { ...prev, ...patch };
    this._persist();
    this._emit(this.getState(), { ...prev });
  }

  subscribe(fn) {
    if (typeof fn !== "function") return () => {};
    this.listeners.add(fn);
    // immediate sync call
    fn(this.getState(), null);
    return () => this.listeners.delete(fn);
  }

  _emit(next, prev) {
    for (const fn of this.listeners) {
      try {
        fn(next, prev);
      } catch (e) {
        console.warn("State subscriber error:", e);
      }
    }
  }

  _loadPersisted() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  _persist() {
    try {
      const data = {};
      for (const k of this.persistKeys) data[k] = this.state[k];
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // ignore storage failures
    }
  }
}
