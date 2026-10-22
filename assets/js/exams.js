/* ============================================================
   MR.ducaysane — Bogga Imtixaannada / Exams Hub Script
   - Imtixaan guud (isku-dhafan)
   - Kartada imtixaannada qaybeed
   - Soo dejinta imtixaanka la doortay goobta imtixaanka
   ============================================================ */
(function () {
  "use strict";

  function bestScore(id) {
    try { return Number(localStorage.getItem("mr_best_" + id) || 0); } catch (e) { return 0; }
  }

  /* Qayb kasta: dhammaan su'aalaha casharradeeda isku-dhafan */
  function categoryQuiz(cat) {
    const lessons = LESSONS.filter((l) => l.category === cat.id);
    const questions = [];
    lessons.forEach((l) => {
      l.quiz.forEach((q) => questions.push(q));
    });
    return {
      title: `Imtixaan: ${cat.title}`,
      intro: `${questions.length} su'aal oo ka yimid ${lessons.length} cashar oo qaybtan ah.`,
      questions,
      lessons
    };
  }

  function bestForCategory(cat) {
    const lessons = LESSONS.filter((l) => l.category === cat.id);
    if (!lessons.length) return 0;
    const scores = lessons.map((l) => bestScore(l.id));
    const done = scores.filter((s) => s > 0);
    if (!done.length) return 0;
    return Math.round(done.reduce((a, b) => a + b, 0) / done.length);
  }

  function boot() {
    if (typeof CATEGORIES === "undefined" || typeof LESSONS === "undefined") return;

    /* --- 1) Imtixaan guud --- */
    const generalMount = document.getElementById("generalQuizMount");
    if (generalMount && typeof GENERAL_QUIZ !== "undefined") {
      window.Quiz.render(generalMount, GENERAL_QUIZ, {
        onScore(score, total, pct) {
          try {
            const old = Number(localStorage.getItem("mr_best_general") || 0);
            if (pct > old) localStorage.setItem("mr_best_general", String(pct));
          } catch (e) {}
        }
      });
      if (window.MR) window.MR.hydrateIcons(generalMount);
    }

    /* --- 2) Kartada imtixaannada qaybeed --- */
    const grid = document.getElementById("quizHubGrid");
    if (grid) {
      grid.innerHTML = CATEGORIES.map((cat) => {
        const qz = categoryQuiz(cat);
        const best = bestForCategory(cat);
        return `
          <article class="card quiz-hub-card reveal">
            <div class="qh-top">
              <div class="qh-icon" style="background:linear-gradient(135deg, ${cat.color}, #38BDF8)">${ICONS[cat.icon] || ICONS.book}</div>
              <div>
                <h3 style="margin:0;font-size:1.1rem">${cat.title}</h3>
                <div class="qh-meta" style="margin:.3rem 0 0">
                  <span>${ICONS.target} ${qz.questions.length} su'aal</span>
                </div>
              </div>
            </div>
            <p>${cat.desc}</p>
            <div class="qh-meta">
              <span>${ICONS.star} Qiimaha ugu fiican: ${best > 0 ? best + "%" : "— "}</span>
            </div>
            <button type="button" class="btn btn-primary btn-sm" data-cat="${cat.id}" style="align-self:flex-start">
              Bilow Imtixaanka ${ICONS.arrowRight}
            </button>
          </article>`;
      }).join("");

      if (window.MR) window.MR.hydrateIcons(grid);

      grid.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-cat]");
        if (!btn) return;
        startCategory(btn.dataset.cat);
      });
    }

    /* --- 3) Soo dejin imtixaan qaybeed --- */
    const stageMount = document.getElementById("categoryQuizMount");
    const stageTitle = document.getElementById("stageTitle");
    const stageIntro = document.getElementById("stageIntro");

    function startCategory(catId) {
      const cat = CATEGORIES.find((c) => c.id === catId);
      if (!cat || !stageMount) return;
      const qz = categoryQuiz(cat);

      stageTitle.textContent = qz.title;
      stageIntro.textContent = qz.intro;

      stageMount.innerHTML = "";
      window.Quiz.render(stageMount, qz, {
        onScore(score, total, pct) {
          // Kaydi celceliska qiimaha qaybta
          try {
            const lessons = LESSONS.filter((l) => l.category === catId);
            lessons.forEach((l) => {
              const key = "mr_best_" + l.id;
              const old = Number(localStorage.getItem(key) || 0);
              if (pct > old) localStorage.setItem(key, String(pct));
            });
          } catch (e) {}
          // Cusboonaysii qiimaha ugu fiican ee kartada
          const best = bestForCategory(cat);
          const cards = grid ? grid.querySelectorAll(".qh-meta span") : [];
          // (kartada imtixaannada waa la cusboonaysiiyaa marka la soo celiyo)
        }
      });
      if (window.MR) window.MR.hydrateIcons(stageMount);

      document.getElementById("quizStage").scrollIntoView?.({ behavior: "smooth", block: "start" });
    }

    // Haddii URL leeyahay #qayb (tusaale imtixaannada.html#html), bilow imtixaanka qaybtaas
    if (location.hash) {
      const id = location.hash.slice(1);
      if (CATEGORIES.some((c) => c.id === id)) setTimeout(() => startCategory(id), 300);
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
