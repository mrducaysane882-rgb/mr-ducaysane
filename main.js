/* ============================================================
   MR.ducaysane — App-ka Guud / Main Application Script
   Navigation, animations, helpers, iyo qabyo-qoraalka faylalka.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- Navigation ---------- */
  function initNav() {
    const toggle = $("#navToggle");
    const menu = $("#navMenu");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-label", open ? "Xir liiska" : "Fur liiska");
    };

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Xir liiska marka link la gujiyo
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });

    // Xir liiska marka Esc la qabto
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    // Xir liiska marka dibadda la gujiyo
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  function initHeader() {
    const header = $("#siteHeader");
    if (!header) return;
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal on scroll animations ---------- */
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Active nav link (by current page) ---------- */
  function initActiveLink() {
    const page = location.pathname.split("/").pop() || "index.html";
    $$("#navMenu ul a, .footer-col a").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("#")[0];
      if (href === page || (page === "" && href === "index.html")) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------- Ogeysiiska maamulaha (data/announcement.json) ---------- */
  function initAnnouncement() {
    const box = $("#siteAnnouncement");
    const text = $("#siteAnnouncementText");
    if (!box || !text || typeof fetch !== "function") return;
    fetch("data/announcement.json", { cache: "no-store" })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((data) => {
        const value = data && typeof data.text === "string" ? data.text.trim() : "";
        if (value) {
          text.textContent = value; // keyboard-safe: qoraal kaliya
          box.hidden = false;
        }
      })
      .catch(() => {}); // bogga dadweynaha isaga sii shaqaynaya
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    $$("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Site gate: nav "Ka Bax" (logout) on signed-in pages ----------
     Public pages only render after a successful /login, so swap the
     nav's "Gal / Isdiiwaangeli" links for a working logout action.
     Auth pages (login/register/account/admin) keep their own controls. */
  function initSessionMenu() {
    if (document.body.classList.contains("auth-body")) return;
    $$("#navMenu ul.nav-menu").forEach((ul) => {
      $$('a[href="/login"], a[href="/login.html"], a[href="/register"], a[href="/register.html"]',
         ul).forEach((a) => {
        const li = a.closest("li");
        if (li) li.hidden = true;
      });
      const item = document.createElement("li");
      item.className = "nav-session";
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/logout";
      const btn = document.createElement("button");
      btn.type = "submit";
      btn.className = "nav-logout";
      btn.textContent = "Ka Bax";
      btn.title = "Ka bax akoonkaaga";
      form.appendChild(btn);
      item.appendChild(form);
      ul.appendChild(item);
    });
  }

  /* ---------- Smooth anchor offset for sticky header ---------- */
  function initAnchors() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const header = $("#siteHeader");
        const offset = header ? header.offsetHeight + 12 : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
        history.pushState(null, "", id);
      });
    });
  }

  /* ---------- Hydrate icon placeholders: <span data-icon="shield"></span> ---------- */
  function hydrateIcons(root) {
    $$("[data-icon]", root).forEach((el) => {
      if (el.dataset.iconDone) return;
      el.innerHTML = ICONS[el.dataset.icon] || ICONS.info;
      el.dataset.iconDone = "1";
      el.setAttribute("aria-hidden", "true");
    });
  }

  /* ---------- Toast / status message helper ---------- */
  window.showStatus = function (el, type, message) {
    if (!el) return;
    el.className = "form-status show " + type;
    const ico = type === "success" ? ICONS.checkCircle : ICONS.alert;
    el.innerHTML = ico + "<p>" + message + "</p>";
  };

  /* ---------- Expose utils globally for page scripts ---------- */
  window.MR = { $, $$, hydrateIcons };

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    hydrateIcons(document);
    initNav();
    initHeader();
    initActiveLink();
    initReveal();
    initYear();
    initAnchors();
    initAnnouncement();
    initSessionMenu();
  });
})();
