/* ============================================================
   MR.ducaysane — Mishiinka Imtixaanka / Quiz Engine
   Functions: renderQuiz(container, quiz, opts)
   - Su'aasha mid mid ayuu u soo bandhigayaa
   - Wuxuu xisaabiyaa natiijada
   - Wuxuu tusayaa jawaabta saxda ah oo Af-Soomaali faahfaahin leh
   ============================================================ */
(function () {
  "use strict";

  const LETTERS = ["A", "B", "C", "D"];
  const PASS_MARK = 60; // % ugu yar ee gudbidda

  /**
   * renderQuiz(container, quiz, opts)
   * @param {HTMLElement} container - meesha laga dhisayo
   * @param {Object} quiz - { title, intro, questions: [{q, options, answer, explain}] }
   * @param {Object} [opts] - { onScore(score, total, pct), showReview: true }
   */
  function renderQuiz(container, quiz, opts) {
    if (!container || !quiz || !Array.isArray(quiz.questions) || !quiz.questions.length) return;

    opts = opts || {};
    const questions = quiz.questions;
    let index = 0;
    let score = 0;
    const results = []; // {chosen, correct, q}

    container.classList.add("quiz-box");
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", quiz.title || "Imtixaan");

    /* --- --- Markup --- --- */
    container.innerHTML = `
      <div class="quiz-head">
        <h3>${esc(quiz.title || "Imtixaan")}</h3>
        <p>${esc(quiz.intro || "Xulo jawaabta saxda ah ee kasta.")}</p>
        <div class="quiz-progress" aria-hidden="true">
          <div class="quiz-progress-bar"></div>
        </div>
      </div>
      <div class="quiz-body">
        <div class="quiz-stage"></div>
        <div class="quiz-result"></div>
      </div>
    `;

    const stage = container.querySelector(".quiz-stage");
    const resultBox = container.querySelector(".quiz-result");
    const bar = container.querySelector(".quiz-progress-bar");

    renderQuestion();

    /* --- --- Su'aasha hadda --- --- */
    function renderQuestion() {
      const q = questions[index];
      const pct = (index / questions.length) * 100;
      bar.style.width = pct + "%";

      stage.innerHTML = `
        <div class="quiz-q"><span class="q-num">Su'aal ${index + 1}/${questions.length}:</span> ${q.q}</div>
        <div class="quiz-options" role="group" aria-label="Jawaabaha">
          ${q.options
            .map(
              (opt, i) => `
            <button type="button" class="quiz-option" data-i="${i}">
              <span class="opt-letter">${LETTERS[i]}</span>
              <span>${opt}</span>
            </button>`
            )
            .join("")}
        </div>
        <div class="quiz-feedback" role="status" aria-live="polite"></div>
        <div class="quiz-actions"></div>
      `;

      const feedback = stage.querySelector(".quiz-feedback");
      const actions = stage.querySelector(".quiz-actions");
      const buttons = Array.from(stage.querySelectorAll(".quiz-option"));

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const chosen = Number(btn.dataset.i);
          handleAnswer(chosen, q, buttons, feedback, actions);
        });
      });
    }

    /* --- --- Jawaab la bixiyay --- --- */
    function handleAnswer(chosen, q, buttons, feedback, actions) {
      const isCorrect = chosen === q.answer;
      if (isCorrect) score++;

      results.push({ chosen, correct: q.answer, q });

      // Ku tirajaa jawaabaha — su'aashu way dhammaatay
      buttons.forEach((b) => {
        b.disabled = true;
        const i = Number(b.dataset.i);
        if (i === q.answer) b.classList.add("correct");
        else if (i === chosen) b.classList.add("wrong");
        else b.classList.add("dim");
      });

      // Faahfaahin Af-Soomaali
      feedback.className = "quiz-feedback show " + (isCorrect ? "fb-correct" : "fb-wrong");
      feedback.innerHTML = `
        ${isCorrect ? ICONS.checkCircle : ICONS.xCircle}
        <p><strong>${isCorrect ? "Sax! Aad bay u fiican tahay." : "Khalad — jawaabta saxda waa: " + q.options[q.answer] + "."}</strong>
        ${q.explain || ""}</p>
      `;

      // Badhiga xiga / dhamaystirka
      const isLast = index === questions.length - 1;
      actions.innerHTML = isLast
        ? `<button type="button" class="btn btn-primary" data-next>${ICONS.check} Dhamayso Imtixaanka</button>`
        : `<button type="button" class="btn btn-primary" data-next>Su'aasha Xigta ${ICONS.arrowRight}</button>`;

      actions.querySelector("[data-next]").addEventListener("click", () => {
        if (isLast) showResult();
        else {
          index++;
          renderQuestion();
        }
      });

      actions.querySelector("[data-next]").focus();
    }

    /* --- --- Natiijada --- --- */
    function showResult() {
      const total = questions.length;
      const pct = Math.round((score / total) * 100);
      const passed = pct >= PASS_MARK;

      bar.style.width = "100%";
      stage.innerHTML = "";

      const title = passed
        ? pct === 100
          ? "Halyeey! Dhammaan jawaabaha waad saxday!"
          : "Hambalyo! Waad gudubtay imtixaanka!"
        : "Khasaare — mar kale isku day!";

      const msg = passed
        ? `Waad heshay ${score} ka mid ah ${total} (${pct}%). Sii wad waxbarashada!`
        : `Waad heshay ${score} ka mid ah ${total} (${pct}%). U baahan tahay ugu yaraan ${PASS_MARK}% si aad u gudubto. Akhri casharka mar kale oo isku day.`;

      resultBox.innerHTML = `
        <div class="score-ring" style="--pct:${pct}%">
          <div class="score-text">${pct}%<small>${score}/${total}</small></div>
        </div>
        <h3>${title}</h3>
        <p>${msg}</p>
        <div class="quiz-actions" style="justify-content:center">
          <button type="button" class="btn btn-outline" data-retry>${ICONS.refresh} Isku Day Mar Kale</button>
        </div>
        ${opts.showReview === false ? "" : renderReview()}
      `;
      resultBox.classList.add("show");

      // Ku dhufo natiijada — guriga u diridda haddii la codsaday
      if (typeof opts.onScore === "function") opts.onScore(score, total, pct);

      // Ku guur natiijada (scrollIntoView kuma jiro qalab qaarkood)
      if (typeof resultBox.scrollIntoView === "function") {
        resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      resultBox.querySelector("[data-retry]").addEventListener("click", () => {
        index = 0;
        score = 0;
        results.length = 0;
        resultBox.classList.remove("show");
        resultBox.innerHTML = "";
        renderQuestion();
        if (typeof container.scrollIntoView === "function") {
          container.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    function renderReview() {
      return `
        <ul class="quiz-review">
          ${results
            .map((r, i) => {
              const ok = r.chosen === r.correct;
              return `
              <li>
                ${ok ? `<span class="rv-ico rv-ok">${ICONS.checkCircle}</span>` : `<span class="rv-ico rv-no">${ICONS.xCircle}</span>`}
                <div>
                  <strong>${i + 1}. ${r.q.q}</strong>
                  <span>Jawaabta saxda: <b>${r.q.options[r.correct]}</b>${
                ok ? "" : ` — adigoo doortay: <b>${r.q.options[r.chosen]}</b>`
              }<br>${r.q.explain || ""}</span>
                </div>
              </li>`;
            })
            .join("")}
        </ul>`;
    }

    function esc(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
  }

  window.Quiz = { render: renderQuiz, PASS_MARK };
})();
