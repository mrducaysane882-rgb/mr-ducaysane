/* ============================================================
   MR.ducaysane — Bogga Nagu Saabsan / About Page Script
   ============================================================ */
(function () {
  "use strict";

  function boot() {
    const grid = document.getElementById("aboutCats");
    if (!grid || typeof CATEGORIES === "undefined") return;

    grid.innerHTML = CATEGORIES.map((cat) => {
      const count = LESSONS.filter((l) => l.category === cat.id).length;
      return `
        <article class="card cat-card reveal">
          <div class="cat-icon" style="background:linear-gradient(135deg, ${cat.color}, #38BDF8)">${ICONS[cat.icon] || ICONS.book}</div>
          <h3>${cat.title}</h3>
          <p>${cat.desc}</p>
          <div class="cat-meta"><span>${ICONS.book} ${count} cashar</span></div>
          <a class="cat-link" href="casharrada.html#${cat.id}">Eeg Casharrada ${ICONS.arrowRight}</a>
        </article>`;
    }).join("");

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
