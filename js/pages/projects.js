// js/pages/projects.js
// Loads projects from Firebase Firestore (fallback: data/projects.json)
// Filters + modal details + URL buttons in modal
(() => {
  "use strict";

  const PAGE_ID = "projects";
  const INIT_FLAG = "__page_init_" + PAGE_ID;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    all: [],
    filtered: [],
    query: "",
    tech: new Set(),
    types: new Set(),
    minComplexity: 1,
    sort: "complexity",
  };

  function escapeHtml(s) {
    const str = String(s == null ? "" : s);
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(u) {
    const v = String(u || "").trim();
    if (!v) return "";
    // allow http(s) only for safety + consistency
    if (!/^https?:\/\//i.test(v)) return "";
    return v;
  }

  // ---------------- Firebase / Firestore loader (CDN modules) ----------------
  async function fetchProjectsFromFirestore() {
    if (!globalThis.FIREBASE_CONFIG || !globalThis.FIREBASE_CONFIG.projectId) {
      throw new Error("Missing FIREBASE_CONFIG (firebaseConfig.js not loaded / not filled).");
    }

    const SDK_VER = "10.12.5";

    const [{ initializeApp }, { getFirestore, collection, getDocs, query, orderBy }] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VER}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VER}/firebase-firestore.js`),
    ]);

    if (!globalThis.__firebaseApp) {
      globalThis.__firebaseApp = initializeApp(globalThis.FIREBASE_CONFIG);
    }
    if (!globalThis.__firestoreDb) {
      globalThis.__firestoreDb = getFirestore(globalThis.__firebaseApp);
    }

    const db = globalThis.__firestoreDb;

    let snap;
    try {
      const q = query(collection(db, "projects"), orderBy("sortOrder", "desc"));
      snap = await getDocs(q);
    } catch (_) {
      const q2 = query(collection(db, "projects"));
      snap = await getDocs(q2);
    }

    const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return raw.map(normalizeProjectRecord);
  }

  function normalizeProjectRecord(p) {
    const out = { ...(p || {}) };

    out.title = out.title || out.name || "";
    out.description = out.description || out.summary || "";

    // accept tags as synonym
    if (!Array.isArray(out.technologies) && Array.isArray(out.tags)) out.technologies = out.tags;
    if (!Array.isArray(out.technologies)) out.technologies = [];

    out.type = out.type || "";
    out.status = out.status || "";
    out.image = out.image || "✨";

    out.complexity = Number(out.complexity || 0) || 0;
    out.impact = Number(out.impact || 0) || 0;

    // year from publishedAt if needed
    if (out.year == null && out.publishedAt) {
      try {
        const d =
          typeof out.publishedAt?.toDate === "function"
            ? out.publishedAt.toDate()
            : new Date(out.publishedAt);
        if (!Number.isNaN(d.getTime())) out.year = d.getFullYear();
      } catch (_) {}
    }

    if (out.details && typeof out.details !== "object") out.details = {};
    if (!out.details) out.details = {};

    // support convenient url field
    out.url = safeUrl(out.url);
    out.liveUrl = safeUrl(out.liveUrl);
    out.repoUrl = safeUrl(out.repoUrl);

    return out;
  }

  // ---------------- JSON fallback ----------------
  async function fetchProjectsFromJson() {
    const res = await fetch("data/projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status + " loading data/projects.json");
    const data = await res.json();
    if (Array.isArray(data)) return data.map(normalizeProjectRecord);
    if (data && Array.isArray(data.projects)) return data.projects.map(normalizeProjectRecord);
    return [];
  }

  async function fetchProjects() {
    try {
      return await fetchProjectsFromFirestore();
    } catch (err) {
      console.warn("⚠️ Firestore failed, falling back to data/projects.json:", err);
      return await fetchProjectsFromJson();
    }
  }

  function normArray(a) {
    if (!Array.isArray(a)) return [];
    return a.map((x) => String(x).toLowerCase().trim()).filter(Boolean);
  }

  function blob(p) {
    const parts = [];
    parts.push(p.title || "");
    parts.push(p.description || "");
    parts.push(p.type || "");
    parts.push(p.status || "");
    parts.push(String(p.year || ""));
    normArray(p.technologies).forEach((t) => parts.push(t));
    // include urls for search convenience
    parts.push(p.url || "");
    parts.push(p.liveUrl || "");
    parts.push(p.repoUrl || "");
    return parts.join(" ").toLowerCase();
  }

  function matches(p) {
    const q = String(state.query || "").trim().toLowerCase();
    if (q && !blob(p).includes(q)) return false;

    const tech = normArray(p.technologies);
    if (state.tech.size) {
      let ok = false;
      state.tech.forEach((t) => {
        if (tech.includes(t)) ok = true;
      });
      if (!ok) return false;
    }

    const type = String(p.type || "").toLowerCase().trim();
    if (state.types.size && !state.types.has(type)) return false;

    const c = Number(p.complexity || 0);
    if (c < Number(state.minComplexity || 1)) return false;

    return true;
  }

  function sortProjects(list) {
    const k = state.sort;
    const byNumDesc = (a, b, key) => Number(b[key] || 0) - Number(a[key] || 0);
    const byAlpha = (a, b) => String(a.title || "").localeCompare(String(b.title || ""));
    const byRecent = (a, b) => Number(b.year || 0) - Number(a.year || 0);

    const copy = list.slice();
    if (k === "impact") copy.sort((a, b) => byNumDesc(a, b, "impact"));
    else if (k === "recent") copy.sort(byRecent);
    else if (k === "alphabetical") copy.sort(byAlpha);
    else copy.sort((a, b) => byNumDesc(a, b, "complexity"));
    return copy;
  }

  function getEls(main) {
    return {
      grid: $("#projects-grid", main),
      empty: $("#empty-state", main),
      reset: $("#reset-filters", main),
      active: $("#active-filters", main),

      search: $("#project-search", main),
      suggestions: $("#search-suggestions", main),

      techCount: $("#tech-count", main),
      typeCount: $("#type-count", main),

      sort: $("#sort-select", main),
      slider: $("#complexity-range", main),
      sliderValue: $("#slider-value", main),

      modal: $("#project-modal", document),
      modalBody: $("#modal-body", document),
      modalClose: $("#modal-close", document),
    };
  }

  function setEmptyUI(els, isEmpty) {
    if (els.empty) els.empty.style.display = isEmpty ? "" : "none";
  }

  function setGridLoading(els, on) {
    if (!els.grid) return;
    if (!on) return;
    els.grid.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p>Loading projects...</p>
      </div>
    `;
  }

  function renderActiveFilters(els, main) {
    if (!els.active) return;

    const chips = [];
    state.tech.forEach((t) => chips.push({ kind: "tech", value: t, label: t }));
    state.types.forEach((t) => chips.push({ kind: "type", value: t, label: t }));
    if (Number(state.minComplexity || 1) > 1) {
      chips.push({ kind: "complexity", value: String(state.minComplexity), label: `Complexity ${state.minComplexity}+` });
    }
    if (String(state.query || "").trim()) {
      chips.push({ kind: "query", value: state.query, label: `Search: "${state.query.trim()}"` });
    }

    if (!chips.length) {
      els.active.innerHTML = "";
      return;
    }

    els.active.innerHTML = chips
      .map(
        (c) =>
          `<button class="filter-chip" type="button" data-chip-kind="${escapeHtml(
            c.kind
          )}" data-chip-value="${escapeHtml(c.value)}" aria-label="Remove filter ${escapeHtml(c.label)}">
            ${escapeHtml(c.label)} <span aria-hidden="true">×</span>
          </button>`
      )
      .join("");
  }

  function renderList(els) {
    if (!els.grid) return;

    const list = state.filtered;

    if (!list.length) {
      els.grid.innerHTML = "";
      setEmptyUI(els, true);
      return;
    }

    setEmptyUI(els, false);

    let html = "";
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const title = escapeHtml(p.title || `Project ${i + 1}`);
      const desc = escapeHtml(p.description || "");
      const emoji = escapeHtml(p.image || "✨");
      const year = escapeHtml(p.year || "");
      const type = escapeHtml(p.type || "");
      const status = escapeHtml(p.status || "");
      const tech = normArray(p.technologies);

      html += `
        <article class="project-card" data-project-open="${i}" tabindex="0" role="button" aria-label="Open project ${title}">
          <div class="project-card-top">
            <div class="project-emoji" aria-hidden="true">${emoji}</div>
            <div class="project-top-meta">
              <h3>${title}</h3>
              <div class="project-mini-meta">
                ${type ? `<span class="pill pill--type">${type}</span>` : ""}
                ${status ? `<span class="pill pill--status">${status}</span>` : ""}
                ${year ? `<span class="pill pill--year">${year}</span>` : ""}
              </div>
            </div>
          </div>

          ${desc ? `<p>${desc}</p>` : ""}

          ${
            tech.length
              ? `<div class="project-tags">${tech.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>`
              : ""
          }
        </article>
      `;
    }

    els.grid.innerHTML = html;
  }

  function openModal(els, project) {
    if (!els.modal || !els.modalBody) return;

    const p = project || {};
    const title = escapeHtml(p.title || "Project");
    const desc = escapeHtml(p.description || "");
    const emoji = escapeHtml(p.image || "✨");
    const year = escapeHtml(p.year || "");
    const status = escapeHtml(p.status || "");
    const type = escapeHtml(p.type || "");
    const tech = normArray(p.technologies);

    // URL priority:
    // - Live Demo: liveUrl OR url
    // - Repo: repoUrl
    const live = safeUrl(p.liveUrl) || safeUrl(p.url);
    const repo = safeUrl(p.repoUrl);

    const details = p.details || {};
    const challenge = escapeHtml(details.challenge || "");
    const solution = escapeHtml(details.solution || "");
    const features = Array.isArray(details.features) ? details.features.map(escapeHtml) : [];
    const techNice = Array.isArray(details.technologies) ? details.technologies.map(escapeHtml) : [];

    const linksHtml =
      live || repo
        ? `
      <div class="project-links" style="display:flex; gap:.6rem; flex-wrap:wrap; margin-top:1rem;">
        ${live ? `<a class="btn btn--primary" href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ""}
        ${repo ? `<a class="btn btn--secondary" href="${escapeHtml(repo)}" target="_blank" rel="noopener noreferrer">Repository</a>` : ""}
      </div>
    `
        : "";

    els.modalBody.innerHTML = `
      <div class="project-modal-header">
        <div class="project-emoji" aria-hidden="true">${emoji}</div>
        <div>
          <h3 style="margin:0;">${title}</h3>
          <div style="margin-top:.35rem; opacity:.85;">
            ${type ? `<span class="pill pill--type">${type}</span>` : ""}
            ${status ? `<span class="pill pill--status">${status}</span>` : ""}
            ${year ? `<span class="pill pill--year">${year}</span>` : ""}
          </div>
        </div>
      </div>

      ${desc ? `<p style="margin-top:1rem;">${desc}</p>` : ""}
      ${linksHtml}
      ${tech.length ? `<p style="margin-top:1rem;"><strong>Technologies:</strong> ${escapeHtml(tech.join(", "))}</p>` : ""}

      ${challenge ? `<div class="project-detail-block"><h4>Challenge</h4><p>${challenge}</p></div>` : ""}
      ${solution ? `<div class="project-detail-block"><h4>Solution</h4><p>${solution}</p></div>` : ""}
      ${techNice.length ? `<div class="project-detail-block"><h4>Stack</h4><p>${escapeHtml(techNice.join(", "))}</p></div>` : ""}
      ${
        features.length
          ? `<div class="project-detail-block"><h4>Key Features</h4><ul>${features.map((f) => `<li>${f}</li>`).join("")}</ul></div>`
          : ""
      }
    `;

    els.modal.classList.add("is-open");
    els.modal.hidden = false;
    els.modal.setAttribute("aria-hidden", "false");

    const close = () => {
      els.modal.classList.remove("is-open");
      els.modal.hidden = true;
      els.modal.setAttribute("aria-hidden", "true");
      document.removeEventListener("keydown", onKeydown);
    };

    const onKeydown = (e) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeydown);

    if (els.modalClose) {
      els.modalClose.onclick = close;
      if (typeof els.modalClose.focus === "function") els.modalClose.focus();
    }

    els.modal.onclick = (e) => {
      if (e.target === els.modal) close();
    };
  }

  function applyAndRender(main, els) {
    const filtered = state.all.filter(matches);
    state.filtered = sortProjects(filtered);

    if (els.techCount) els.techCount.textContent = String(state.tech.size);
    if (els.typeCount) els.typeCount.textContent = String(state.types.size);

    renderActiveFilters(els, main);
    renderList(els);
  }

  function renderSuggestions(els) {
    if (!els.suggestions) return;

    const q = String(state.query || "").trim().toLowerCase();
    if (!q) {
      els.suggestions.innerHTML = "";
      return;
    }

    const titles = state.all
      .map((p) => String(p.title || ""))
      .filter(Boolean)
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 6);

    if (!titles.length) {
      els.suggestions.innerHTML = "";
      return;
    }

    els.suggestions.innerHTML = titles
      .map((t, i) => `<div class="suggestion" role="option" data-suggest="${escapeHtml(t)}" id="suggest-${i}">${escapeHtml(t)}</div>`)
      .join("");
  }

  function bindUI(main, els) {
    if (els.search) {
      els.search.addEventListener("input", () => {
        state.query = els.search.value || "";
        renderSuggestions(els);
        applyAndRender(main, els);
      });
    }

    if (els.suggestions) {
      els.suggestions.addEventListener("click", (e) => {
        const node = e.target.closest?.("[data-suggest]");
        if (!node) return;
        const v = node.getAttribute("data-suggest") || "";
        if (els.search) els.search.value = v;
        state.query = v;
        els.suggestions.innerHTML = "";
        applyAndRender(main, els);
      });
    }

    main.addEventListener("change", (e) => {
      const input = e.target;
      if (!input || input.tagName !== "INPUT" || input.type !== "checkbox") return;

      const kind = input.getAttribute("data-filter");
      const value = String(input.value || "").toLowerCase().trim();
      if (!kind || !value) return;

      if (kind === "technology") {
        if (input.checked) state.tech.add(value);
        else state.tech.delete(value);
      } else if (kind === "type") {
        if (input.checked) state.types.add(value);
        else state.types.delete(value);
      }

      applyAndRender(main, els);
    });

    if (els.slider) {
      const updateText = () => {
        const v = Number(els.slider.value || 1);
        state.minComplexity = v;

        if (els.sliderValue) {
          els.sliderValue.textContent = `Showing projects with complexity level ${v}+`;
        }

        const labels = ["Simple", "Moderate", "Complex", "Advanced", "Expert"];
        const idx = Math.max(1, Math.min(5, v)) - 1;
        els.slider.setAttribute("aria-valuetext", `Level ${v}: ${labels[idx]}`);
      };

      els.slider.addEventListener("input", () => {
        updateText();
        applyAndRender(main, els);
      });

      updateText();
    }

    if (els.sort) {
      els.sort.addEventListener("change", () => {
        state.sort = els.sort.value || "complexity";
        applyAndRender(main, els);
      });
    }

    if (els.active) {
      els.active.addEventListener("click", (e) => {
        const chip = e.target.closest?.("[data-chip-kind][data-chip-value]");
        if (!chip) return;

        const kind = chip.getAttribute("data-chip-kind");
        const value = chip.getAttribute("data-chip-value");

        if (kind === "tech") {
          state.tech.delete(value);
          const box = main.querySelector(
            `input[type="checkbox"][data-filter="technology"][value="${CSS.escape(value)}"]`
          );
          if (box) box.checked = false;
        } else if (kind === "type") {
          state.types.delete(value);
          const box = main.querySelector(
            `input[type="checkbox"][data-filter="type"][value="${CSS.escape(value)}"]`
          );
          if (box) box.checked = false;
        } else if (kind === "complexity") {
          state.minComplexity = 1;
          if (els.slider) els.slider.value = "1";
          if (els.sliderValue) els.sliderValue.textContent = "Showing projects with complexity level 1+";
        } else if (kind === "query") {
          state.query = "";
          if (els.search) els.search.value = "";
          if (els.suggestions) els.suggestions.innerHTML = "";
        }

        applyAndRender(main, els);
      });
    }

    if (els.reset) {
      els.reset.addEventListener("click", () => {
        state.query = "";
        state.tech.clear();
        state.types.clear();
        state.minComplexity = 1;
        state.sort = "complexity";

        if (els.search) els.search.value = "";
        if (els.suggestions) els.suggestions.innerHTML = "";
        if (els.slider) els.slider.value = "1";
        if (els.sort) els.sort.value = "complexity";

        $$('input[type="checkbox"][data-filter="technology"], input[type="checkbox"][data-filter="type"]', main).forEach(
          (cb) => (cb.checked = false)
        );

        if (els.sliderValue) els.sliderValue.textContent = "Showing projects with complexity level 1+";

        applyAndRender(main, els);
      });
    }

    const openFromTarget = (target) => {
      const card = target && target.closest ? target.closest("[data-project-open]") : null;
      if (!card) return;
      const idx = Number(card.getAttribute("data-project-open"));
      const project = state.filtered[idx];
      if (project) openModal(els, project);
    };

    main.addEventListener("click", (e) => openFromTarget(e.target));
    main.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target && e.target.closest ? e.target.closest("[data-project-open]") : null;
      if (!card) return;
      e.preventDefault();
      openFromTarget(e.target);
    });
  }

  async function initProjects() {
    const main = $("#main-content") || document;
    const page =
      $("#projects-grid", main) ||
      main.querySelector("[data-page='projects']") ||
      main.querySelector(".page-projects") ||
      main.querySelector("#projects");

    if (!page) return;

    if (main[INIT_FLAG]) return;
    main[INIT_FLAG] = true;

    const els = getEls(main);
    setGridLoading(els, true);

    try {
      state.all = await fetchProjects();
      state.filtered = state.all.slice();

      bindUI(main, els);
      applyAndRender(main, els);
    } catch (err) {
      console.warn("⚠️ Projects: failed to load data:", err);
      if (els.grid) els.grid.innerHTML = '<p style="color:#b91c1c;">Failed to load projects.</p>';
      setEmptyUI(els, false);
    }
  }

  initProjects();

  window.addEventListener("hashchange", () => {
    const main = document.querySelector("#main-content") || document;
    if (main) main[INIT_FLAG] = false;
    initProjects();
  });
})();
