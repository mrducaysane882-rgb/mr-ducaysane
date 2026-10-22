/* ============================================================
   MR.ducaysane — Bogga Khayraadka / Resources Page Script
   ============================================================ */
(function () {
  "use strict";

  function boot() {
    const grid = document.getElementById("resourceGrid");
    if (!grid || typeof RESOURCES === "undefined") return;

    grid.innerHTML = RESOURCES.map(
      (r, i) => `
      <a class="card cat-card reveal reveal-delay-${i % 3}" href="${r.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">
        <div class="cat-icon">${ICONS.external}</div>
        <h3>${r.title}</h3>
        <p>${r.desc}</p>
        <span class="cat-link" style="color:var(--blue-600)">Fur bogga ${ICONS.arrowUpRight}</span>
      </a>`
    ).join("");

    if (window.MR) window.MR.hydrateIcons(grid);

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (ents) => ents.forEach((e) => e.isIntersecting && (e.target.classList.add("visible"), io.unobserve(e.target))),
        { threshold: 0.1 }
      );
      grid.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    } else {
      grid.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
