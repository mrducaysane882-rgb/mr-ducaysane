/* ============================================================
   MR.ducaysane — Bogga Casharka / Lesson Page Script
   - Akhritaa ?id= URL-ka
   - Wuxuu dhisaa nuxurka casharka (content blocks)
   - Wuxuu dhisaa sidebar-ka iyo links-ka hore/xafiga
   - Wuxuu sameeyaa imtixaanka firfircoon
   ============================================================ */
(function () {
  "use strict";

  /* --- Content block renderer --- */
  function block(b) {
    switch (b.t) {
      case "h2":
        return `<h2>${b.x}</h2>`;
      case "h3":
        return `<h3>${b.x}</h3>`;
      case "p":
        return `<p>${b.x}</p>`;
      case "ul":
        return `<ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
      case "ol":
        return `<ol>${b.items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
      case "code":
        return `<div class="code-block"><span class="cb-label">${b.label || b.lang || "Code"}</span><code>${escapeHtml(
          b.code
        ).replace(/\n/g, "<br>")}</code></div>`;
      case "tip":
        return `<div class="callout callout-tip">${ICONS.bulb}<div><strong>${b.title || "Tilmaam"}</strong><p>${b.x}</p></div></div>`;
      case "warn":
        return `<div class="callout callout-warn">${ICONS.alert}<div><strong>${b.title || "Digniin"}</strong><p>${b.x}</p></div></div>`;
      case "safe":
        return `<div class="callout callout-safe">${ICONS.shield}<div><strong>${b.title || "Badbaado"}</strong><p>${b.x}</p></div></div>`;
      case "example":
        if (b.code) {
          return `<div class="example-box"><div class="ex-label">${ICONS.zap} ${b.title || "Tusaale"}</div><div class="code-block" style="margin:0"><code>${escapeHtml(
            b.code
          ).replace(/\n/g, "<br>")}</code></div></div>`;
        }
        return `<div class="example-box"><div class="ex-label">${ICONS.zap} ${b.title || "Tusaale"}</div><p>${b.x.replace(
          /\n/g,
          "<br>"
        )}</p></div>`;
      case "table": {
        const head = (b.head || [])
          .map((h) => `<th>${h}</th>`)
          .join("");
        const rows = (b.rows || [])
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
          .join("");
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
      }
      default:
        return b.x ? `<p>${b.x}</p>` : "";
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function boot() {
    if (typeof LESSONS === "undefined" || typeof CATEGORIES === "undefined") return;

    const params = new URLSearchParams(location.search);
    const id = params.get("id") || LESSONS[0].id;
    const lesson = LESSONS.find((l) => l.id === id) || LESSONS[0];
    const cat = CATEGORIES.find((c) => c.id === lesson.category) || CATEGORIES[0];

    // Sibling lessons in same category
    const siblings = LESSONS.filter((l) => l.category === lesson.category);
    const pos = siblings.findIndex((l) => l.id === lesson.id);
    const prev = siblings[pos - 1];
    const next = siblings[pos + 1];

    /* --- Header / meta --- */
    document.title = `${lesson.title} — MR.ducaysane`;
    const crumbCat = document.getElementById("crumbCat");
    if (crumbCat) crumbCat.textContent = cat.title;
    document.getElementById("lessonTitle").textContent = lesson.title;
    document.getElementById("lessonSummary").textContent = lesson.summary;
    document.getElementById("lessonMeta").innerHTML = `
      <span>${ICONS.clock} ${lesson.duration}</span>
      <span>${ICONS.target} ${lesson.quiz.length} su'aal</span>
      <span>${ICONS.star} Heer: ${lesson.level}</span>
      <span>${ICONS.book} Cashar ${pos + 1} / ${siblings.length}</span>
    `;
    const badge = document.getElementById("lessonBadge");
    if (badge) badge.innerHTML = `${ICONS[cat.icon] || ICONS.book} ${cat.title}`;

    /* --- Sidebar --- */
    document.getElementById("sideList").innerHTML = siblings
      .map(
        (l, i) => `
      <li>
        <a href="cashar.html?id=${l.id}" class="${l.id === lesson.id ? "active" : ""}" ${
          l.id === lesson.id ? 'aria-current="page"' : ""
        }>
          <span class="side-num">${i + 1}</span>
          <span>${l.title}</span>
        </a>
      </li>`
      )
      .join("");

    /* --- Content --- */
    const root = document.getElementById("lessonContent");
    root.innerHTML = `
      <article>
        <span class="badge">${ICONS.book} Cashar</span>
        <h2 style="margin-top:.8rem">${lesson.title}</h2>
        <p class="lead">${lesson.summary}</p>
        ${lesson.content.map(block).join("")}
      </article>

      <div id="quizMount" aria-label="Imtixaan"></div>

      <nav class="lesson-nav" aria-label="Liiska casharrada">
        <div>${
          prev
            ? `<a class="btn btn-outline" href="cashar.html?id=${prev.id}">${ICONS.arrowLeft} ${prev.title}</a>`
            : `<a class="btn btn-outline" href="casharrada.html">${ICONS.arrowLeft} Dhammaan casharrada</a>`
        }</div>
        <div>${
          next
            ? `<a class="btn btn-primary" href="cashar.html?id=${next.id}">${next.title} ${ICONS.arrowRight}</a>`
            : `<a class="btn btn-primary" href="imtixaannada.html">Imtixaan Guud ${ICONS.arrowRight}</a>`
        }</div>
      </nav>
    `;

    if (window.MR) window.MR.hydrateIcons(root);

    /* --- Quiz --- */
    const mount = document.getElementById("quizMount");
    const quiz = {
      title: `Imtixaan: ${lesson.title}`,
      intro: `Dhammeeyo ${lesson.quiz.length} su'aal — jawaabta saxda ah iyo faahfaahinta dib ayaa la arki karaa.`,
      questions: lesson.quiz
    };
    window.Quiz.render(mount, quiz, {
      onScore(score, total, pct) {
        // Kaydi natiijada ugu fiican (localStorage) si bogga imtixaannada u muujiyo
        try {
          const key = "mr_best_" + lesson.id;
          const old = Number(localStorage.getItem(key) || 0);
          if (pct > old) localStorage.setItem(key, String(pct));
        } catch (e) { /* storage may be disabled */ }
      }
    });
    if (window.MR) window.MR.hydrateIcons(mount);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
