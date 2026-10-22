/* ============================================================
   MR.ducaysane — Bogga Hore / Homepage Script
   Wuxuu dhisaa kartada qaybaha waxbarashada.
   ============================================================ */
(function () {
  "use strict";

  function boot() {
    const grid = document.getElementById("categoryGrid");
    if (!grid || typeof CATEGORIES === "undefined") return;

    grid.innerHTML = CATEGORIES.map((cat) => {
      const count = LESSONS.filter((l) => l.category === cat.id).length;
      const questions = LESSONS.filter((l) => l.category === cat.id)
        .reduce((n, l) => n + l.quiz.length, 0);
      return `
        <article class="card cat-card reveal">
          <div class="cat-icon">${ICONS[cat.icon] || ICONS.book}</div>
          <h3>${cat.title}</h3>
          <p>${cat.desc}</p>
          <div class="cat-meta">
            <span>${ICONS.book} ${count} cashar</span>
            <span>${ICONS.target} ${questions} su'aal</span>
          </div>
          <a class="cat-link" href="casharrada.html#${cat.id}">Eeg Casharrada ${ICONS.arrowRight}</a>
        </article>`;
    }).join("");

    // Dhis sawirada yaryar (icons) ee HTML-ka cusub
    if (window.MR) window.MR.hydrateIcons(grid);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
