// js/components/Footer.js
import { Component } from "./Component.js";

/**
 * Footer Component
 * - Renders footer template
 * - Enhances technology tags with learning links
 * - Wires connect/social links
 */
export class Footer extends Component {
  constructor(state = null) {
    super("app-footer");
    this.state = state;
  }

  async render() {
    if (!this.element) {
      console.warn("⚠️ Footer: #app-footer not found.");
      return;
    }

    const template = await this.loadTemplate("components/footer.html");
    if (!template) return;

    this.element.innerHTML = template;

    this.updateYear();
    this.enhanceTechnologies();
    this.enhanceConnectLinks();
  }

  updateYear() {
    const yearEl = this.element.querySelector("#footer-year");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  enhanceTechnologies() {
    const TECH_LINKS = {
      "Python": "https://docs.python.org/3/",
      "JavaScript": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      "Java": "https://docs.oracle.com/javase/tutorial/",
      "C/C++": "https://en.cppreference.com/w/",
      "OpenGL/GLSL": "https://www.khronos.org/opengl/",
      "React.js": "https://react.dev/learn",
      "Vue.js": "https://vuejs.org/guide/introduction.html",
      "Next.js": "https://nextjs.org/docs",
      "Node.js": "https://nodejs.org/en/learn",
      "Flutter": "https://docs.flutter.dev/",
      "HTML/CSS": "https://developer.mozilla.org/en-US/docs/Learn",
    };

    const tags = this.element.querySelectorAll(".tech-tag");
    if (!tags.length) return;

    tags.forEach((tag) => {
      const label = tag.textContent.trim();
      const url = TECH_LINKS[label];
      if (!url) return;

      // Accessibility + affordance
      tag.setAttribute("role", "link");
      tag.setAttribute("tabindex", "0");
      tag.setAttribute("aria-label", `Learn more about ${label}`);
      tag.classList.add("is-clickable");

      const open = () => window.open(url, "_blank", "noopener");

      tag.addEventListener("click", open);
      tag.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  enhanceConnectLinks() {
    const CONNECT_LINKS = {
      GitHub: "https://github.com/",         // replace with your profile later
      LinkedIn: "https://www.linkedin.com/", // replace later
      Email: "#contact",
    };

    const links = this.element.querySelectorAll(".social-link");
    if (!links.length) return;

    links.forEach((link) => {
      const label = link.textContent.trim();
      const href = CONNECT_LINKS[label];
      if (!href) return;

      link.setAttribute("href", href);

      if (href.startsWith("http")) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
      }
    });
  }
}
