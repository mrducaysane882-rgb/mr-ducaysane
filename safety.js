/* ============================================================
   MR.ducaysane — Bogga Badbaadada / Safety Page Script
   - Kartada talooyinka badbaadada
   - Tijaadada cabbirka furaha sirta ah (client-side keliya)
   ============================================================ */
(function () {
  "use strict";

  /* --- 1) Talooyinka --- */
  function renderTips() {
    const grid = document.getElementById("safetyTips");
    if (!grid || typeof SAFETY_TIPS === "undefined") return;

    grid.innerHTML = SAFETY_TIPS.map(
      (tip, i) => `
      <article class="safety-tip reveal reveal-delay-${i % 3}">
        <div class="st-icon">${ICONS[tip.icon] || ICONS.shield}</div>
        <div>
          <h3>${tip.title}</h3>
          <p>${tip.desc}</p>
        </div>
      </article>`
    ).join("");
    if (window.MR) window.MR.hydrateIcons(grid);

    // Muuji qaybaha soo muuqda
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

  /* --- 2) Tijaadada furaha --- */
  function initChecker() {
    const input = document.getElementById("pwInput");
    const bar = document.getElementById("pwBar");
    const label = document.getElementById("pwLabel");
    const rulesList = document.getElementById("pwRules");
    const toggle = document.getElementById("pwToggle");
    if (!input || !bar || !label || !rulesList) return;

    const checks = {
      len: (v) => v.length >= 8,
      upper: (v) => /[A-Z]/.test(v),
      lower: (v) => /[a-z]/.test(v),
      num: (v) => /[0-9]/.test(v),
      sym: (v) => /[^A-Za-z0-9]/.test(v)
    };

    const LEVELS = [
      { min: 0, color: "#DC2626", text: "Aad u gaaban / sahashan — beddel." },
      { min: 1, color: "#DC2626", text: "Aad u daciif ah — wanaaji." },
      { min: 2, color: "#B45309", text: "Dhexdhexaad — wanaaji weli." },
      { min: 3, color: "#2563EB", text: "Wanaagsan — ku dar wax yar." },
      { min: 4, color: "#16A34A", text: "Adag — aad bay u fiican tahay!" },
      { min: 5, color: "#15803D", text: "Aad u adag — halyeey badbaado!" }
    ];

    function evaluate() {
      const v = input.value;
      let passed = 0;

      Object.keys(checks).forEach((key) => {
        const li = rulesList.querySelector(`[data-rule="${key}"]`);
        const ok = v.length > 0 && checks[key](v);
        if (ok) passed++;
        if (li) {
          li.classList.toggle("ok", ok);
          li.querySelector("[data-icon]").innerHTML = ok ? ICONS.checkCircle : ICONS.xCircle;
        }
      });

      if (v.length === 0) {
        bar.style.width = "0%";
        label.textContent = "Furaha weli lama gelin.";
        label.style.color = "var(--muted-2)";
        return;
      }

      const level = LEVELS[Math.min(passed, LEVELS.length - 1)];
      const pct = Math.round((passed / 5) * 100);
      bar.style.width = Math.max(pct, 8) + "%";
      bar.style.background = level.color;
      label.textContent = level.text;
      label.style.color = level.color;
    }

    input.addEventListener("input", evaluate);

    // Muuji / qari furaha
    if (toggle) {
      toggle.addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        toggle.setAttribute("aria-label", show ? "Qari furaha" : "Muuji furaha");
        toggle.querySelector("[data-icon]").innerHTML = show ? ICONS.eyeOff : ICONS.eye;
        input.focus();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderTips();
    initChecker();
  });
})();
