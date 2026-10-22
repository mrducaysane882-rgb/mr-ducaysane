/* ============================================================
   MR.ducaysane — Kaydka Casharrada / Catalog Script
   Wuxuu dhisaa qaybaha iyo kartada casharrada bogga casharrada.
   ============================================================ */
(function () {
  "use strict";

  function boot() {
    const root = document.getElementById("catalog");
    if (!root || typeof CATEGORIES === "undefined" || typeof LESSONS === "undefined") return;

    const totalQuestions = LESSONS.reduce((n, l) => n + l.quiz.length, 0);

    const head = `
      <div class="section-head left reveal" style="margin-bottom:2rem">
        <span class="badge">${ICONS.layers} ${CATEGORIES.length} qayb · ${LESSONS.length} cashar · ${totalQuestions} su'aal</span>
        <h2>Dhammaan qaybaha</h2>
        <p>Riix qayb kasta si aad u aragto casharradeeda. Mid kasta wuxuu leeyahay cashar iyo imtixaan firfircoon.</p>
      </div>`;

    const sections = CATEGORIES.map((cat) => {
      const lessons = LESSONS.filter((l) => l.category === cat.id);
      const questions = lessons.reduce((n, l) => n + l.quiz.length, 0);
      return `
        <section id="${cat.id}" style="scroll-margin-top:100px" class="mb-2">
          <div class="reveal" style="display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.4rem">
            <div class="cat-icon" style="background:linear-gradient(135deg, ${cat.color}, #38BDF8);margin-bottom:0">${ICONS[cat.icon] || ICONS.book}</div>
            <div>
              <h2 style="margin-bottom:.2rem">${cat.title}</h2>
              <p class="muted mb-0" style="max-width:56ch">${cat.desc}</p>
              <div class="cat-meta" style="margin:.5rem 0 0">
                <span>${ICONS.book} ${lessons.length} cashar</span>
                <span>${ICONS.target} ${questions} su'aal</span>
                <span>${ICONS.clock} Bilaash</span>
              </div>
            </div>
          </div>
          <div class="grid grid-3">
            ${lessons
              .map(
                (l, i) => `
              <article class="card lesson-card reveal reveal-delay-${i % 3}">
                <div class="lc-head">
                  <span class="lc-cat">Cashar ${i + 1} · ${cat.title}</span>
                  <h3>${l.title}</h3>
                </div>
                <div class="lc-body">
                  <div class="lc-tags">
                    <span class="lc-tag">${ICONS.clock} ${l.duration}</span>
                    <span class="lc-tag">${ICONS.target} ${l.quiz.length} su'aal</span>
                    <span class="lc-tag">${ICONS.star} ${l.level}</span>
                  </div>
                  <p>${l.summary}</p>
                  <a class="btn btn-primary btn-sm" href="cashar.html?id=${l.id}" style="align-self:flex-start">Bilow Casharka ${ICONS.arrowRight}</a>
                </div>
              </article>`
              )
              .join("")}
          </div>
        </section>`;
    }).join("");

    root.innerHTML = head + sections;
    if (window.MR) window.MR.hydrateIcons(root);

    // Qaab-dhismeedka reveal-ka cusub
    if (window.MR) {
      requestAnimationFrame(() => {
        root.querySelectorAll(".reveal").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight) el.classList.add("visible");
          else if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver(
              (ents) => ents.forEach((e) => e.isIntersecting && (e.target.classList.add("visible"), io.unobserve(e.target))),
              { threshold: 0.1 }
            );
            io.observe(el);
          }
        });
      });
    }

    // U guur qaybta hash-ga (tusaale casharrada.html#html)
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
