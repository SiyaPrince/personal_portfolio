// js/pages/contact.js
// Form submit handling + loading state
(() => {
  "use strict";

  const PAGE_ID = "contact";
  const INIT_FLAG = `__page_init_${PAGE_ID}`;

  const $ = (sel, root = document) => root.querySelector(sel);

  function setLoading(form, isLoading) {
    if (!form) return;
    form.classList.toggle("is-loading", isLoading);

    const submit = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submit) {
      submit.disabled = isLoading;
      const original = submit.getAttribute("data-original-text") || submit.textContent;
      if (!submit.getAttribute("data-original-text")) submit.setAttribute("data-original-text", original);
      submit.textContent = isLoading ? "Sending..." : original;
    }
  }

  function showMessage(form, type, text) {
    if (!form) return;
    let el = form.querySelector("[data-form-message]");
    if (!el) {
      el = document.createElement("div");
      el.setAttribute("data-form-message", "");
      el.style.marginTop = "12px";
      form.appendChild(el);
    }
    el.textContent = text;
    el.style.color = type === "success" ? "inherit" : "#b91c1c";
    el.style.opacity = "0.95";
  }

  async function initContact() {
    const main = $("#main-content");
    if (!main) return;

    const isContact =
      main.querySelector("[data-page='contact']") ||
      main.querySelector("#contact") ||
      location.hash === "#contact";

    if (!isContact) return;

    if (main[INIT_FLAG]) return;
    main[INIT_FLAG] = true;

    const form = main.querySelector("form#contact-form") || main.querySelector("[data-contact-form]");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      setLoading(form, true);
      showMessage(form, "info", "");

      try {
        // If you later wire a backend endpoint, set: form.action
        // For now: simulate success locally.
        const action = form.getAttribute("action") || "";
        const method = (form.getAttribute("method") || "POST").toUpperCase();

        const formData = new FormData(form);

        if (action) {
          const res = await fetch(action, { method, body: formData });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } else {
          // local simulation
          await new Promise((r) => setTimeout(r, 650));
        }

        form.reset();
        showMessage(form, "success", "Message sent! I’ll get back to you soon.");
      } catch (err) {
        showMessage(form, "error", "Sorry — something went wrong sending your message.");
        console.warn("Contact submit failed:", err?.message || err);
      } finally {
        setLoading(form, false);
      }
    });
  }

  initContact();

  window.addEventListener("hashchange", () => {
    const main = document.querySelector("#main-content");
    if (main) main[INIT_FLAG] = false;
    initContact();
  });
})();
