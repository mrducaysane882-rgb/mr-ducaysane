/* QA harness for MR.ducaysane — needs jsdom:
   NODE_PATH=/tmp/qa/node_modules node tools/qa-test.js
   The site is GATED: the harness first registers a throwaway account
   (qa-test@example.com) and signs in, then loads every page with that
   session — so the server must have Supabase configured (real project
   via tools/set_supabase.py, or the local tools/mock_postgrest.py).
   Loads each page with scripts executed, collects console/page errors,
   and exercises interactive flows (nav, quiz, contact form, password checker). */
const { JSDOM, VirtualConsole } = require("jsdom");
const { CookieJar } = require("tough-cookie");
const http = require("http");

const BASE = process.env.QA_BASE || "http://127.0.0.1:3000";
const pages = [
  "index.html",
  "casharrada.html",
  "cashar.html?id=computer-1",
  "cashar.html?id=html-3",
  "imtixaannada.html",
  "badbaado.html",
  "khayraadka.html",
  "nagu-saabsan.html",
  "nala-soo-xiriir.html",
  "admin/login", // public login page — must still be a clean site page
  "register", // public registration page — server-rendered form
  "login" // public user login page — server-rendered form
];

let failures = [];
const results = [];

/* Session for the gated site: one throwaway account, reused across runs. */
const sessionJar = new CookieJar();
const QA_EMAIL = "qa-test@example.com";
const QA_PASSWORD = "Qa-Siiqo-2026!";

/* Pages that must render for a signed-out visitor (the login flow itself). */
const isAuthPage = (p) => ["admin/login", "register", "login"].includes(p);

/* POST form without following redirects (needs the raw 303 + Set-Cookie). */
function postForm(path, fields) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(fields).toString();
    const req = http.request(BASE + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(data),
      },
    }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.end(data);
  });
}

function loadPage(url, opts) {
  const jar = opts && opts.anon ? new CookieJar() : sessionJar;
  return new Promise((resolve, reject) => {
    const vc = new VirtualConsole();
    const errors = [];
    vc.on("jsdomError", (e) => errors.push("jsdomError: " + e.message));
    vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
    vc.on("warn", () => {});
    vc.on("log", () => {});

    JSDOM.fromURL(url, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      virtualConsole: vc,
      cookieJar: jar
    }).then((dom) => {
      // give scripts time to boot (DOMContentLoaded + timers)
      setTimeout(() => resolve({ dom, errors }), 900);
    }, reject);
  });
}

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

(async () => {
  /* ---------- 0) Site gate: register (if needed) + sign in ---------- */
  {
    const reg = await postForm("/register", {
      name: "QA Tijaabo", email: QA_EMAIL,
      password: QA_PASSWORD, confirm: QA_PASSWORD,
    });
    const exists = (reg.body || "").includes("horey ayuu akoon"); // earlier run
    if (reg.status !== 303 && !exists) {
      console.error(`BLOCKED: /register -> ${reg.status}. The gated site needs Supabase:`);
      console.error("  -> run: python3 tools/set_supabase.py  (then restart server.py)");
      console.error("  -> or local mock: SUPABASE_URL=http://127.0.0.1:3200 \\");
      console.error("     SUPABASE_SERVICE_ROLE_KEY=mock-service-role-key-for-tests-000 \\");
      console.error("     python3 server.py   (with tools/mock_postgrest.py 3200 running)");
      process.exit(2);
    }
    const login = await postForm("/login", { email: QA_EMAIL, password: QA_PASSWORD });
    const setCookie = (login.headers["set-cookie"] || []).join(";");
    const token = (setCookie.match(/user_session=([^;]+)/) || [])[1];
    if (login.status !== 303 || !token) {
      console.error(`BLOCKED: /login -> ${login.status} (no user_session cookie).`);
      process.exit(2);
    }
    sessionJar.setCookieSync(`user_session=${token}; Path=/`, BASE + "/");
    results.push("gate: throwaway account registered/signed in (session cookie set)");
  }

  /* ---------- 1) Every page boots clean ---------- */
  for (const p of pages) {
    const { dom, errors } = await loadPage(BASE + "/" + p, { anon: isAuthPage(p) });
    const doc = dom.window.document;
    const title = doc.title;
    const navLinks = doc.querySelectorAll(".nav-menu a").length;
    const footerContact = (doc.body.innerHTML.match(/mailto:maxamedmustafe882@gmail\.com/g) || []).length;
    const footerTel = (doc.body.innerHTML.match(/tel:657155694/g) || []).length;

    assert(errors.length === 0, `${p}: console errors -> ${errors.join(" | ")}`);
    assert(navLinks >= 6, `${p}: nav links ${navLinks} < 6`);
    assert(footerContact >= 1, `${p}: mailto links ${footerContact} < 1`);
    assert(footerTel >= 1, `${p}: tel links ${footerTel} < 1`);
    assert(title.includes("MR.ducaysane"), `${p}: bad title "${title}"`);
    // no leftover template placeholders
    assert(!doc.body.innerHTML.includes("${"), `${p}: unreplaced template literal`);
    results.push(`${p}: boot OK (nav ${navLinks}, mailto ${footerContact}, tel ${footerTel})`);
    dom.window.close();
  }

  /* ---------- 2) Homepage renders categories ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/index.html");
    const doc = dom.window.document;
    const cards = doc.querySelectorAll("#categoryGrid .cat-card");
    assert(cards.length === 6, `index: expected 6 category cards, got ${cards.length}`);
    const heroH1 = doc.querySelector(".hero h1");
    assert(heroH1 && heroH1.textContent.includes("Xirfadaha Dijitaalka"), "index: hero headline missing");
    assert(doc.querySelectorAll(".hero-actions .btn").length >= 2, "index: hero buttons missing");
    const eegLinks = [...doc.querySelectorAll("#categoryGrid a.cat-link")];
    assert(eegLinks.length === 6 && eegLinks.every((a) => a.href.includes("casharrada.html#")), "index: Eeg Casharrada links broken");
    assert(doc.querySelector('a[href="mailto:maxamedmustafe882@gmail.com"]'), "index: contact card mailto missing");
    assert(doc.querySelector('a[href="tel:657155694"]'), "index: contact card tel missing");
    assert(errors.length === 0, `index runtime: ${errors.join("|")}`);
    results.push(`index: ${cards.length} category cards, hero + contact card OK`);
    dom.window.close();
  }

  /* ---------- 3) Catalog renders all lessons ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/casharrada.html");
    const doc = dom.window.document;
    const sections = doc.querySelectorAll("#catalog section[id]");
    const lessonLinks = doc.querySelectorAll('#catalog a[href^="cashar.html?id="]');
    assert(sections.length === 6, `catalog: expected 6 sections, got ${sections.length}`);
    assert(lessonLinks.length === 18, `catalog: expected 18 lesson links, got ${lessonLinks.length}`);
    assert(errors.length === 0, `catalog runtime: ${errors.join("|")}`);
    results.push(`catalog: ${sections.length} sections, ${lessonLinks.length} lesson links`);
    dom.window.close();
  }

  /* ---------- 4) Lesson page: content + full quiz flow ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/cashar.html?id=safety-1");
    const win = dom.window;
    const doc = win.document;
    const h2s = doc.querySelectorAll("#lessonContent h2");
    const callouts = doc.querySelectorAll("#lessonContent .callout");
    const sideLinks = doc.querySelectorAll("#sideList a");
    assert(h2s.length >= 2, `lesson: expected >=2 h2, got ${h2s.length}`);
    assert(callouts.length >= 1, "lesson: callouts missing");
    assert(sideLinks.length === 3, `lesson: sidebar links ${sideLinks.length} != 3`);
    assert(doc.querySelector('#sideList a[aria-current="page"]'), "lesson: active sidebar item missing");
    assert(doc.querySelector("#lessonContent .lesson-nav"), "lesson: prev/next nav missing");

    // --- run the quiz: answer correctly each time ---
    const quiz = doc.querySelector("#quizMount");
    assert(quiz && quiz.classList.contains("quiz-box"), "lesson: quiz box not mounted");

    const lesson = win.eval("LESSONS").find((l) => l.id === "safety-1");
    let answered = 0;
    for (let step = 0; step < lesson.quiz.length; step++) {
      const options = quiz.querySelectorAll(".quiz-option:not([disabled])");
      if (!options.length) break;
      const correctIdx = lesson.quiz[answered].answer;
      const correctBtn = [...quiz.querySelectorAll(".quiz-option")][correctIdx];
      correctBtn.click();
      answered++;
      const feedback = quiz.querySelector(".quiz-feedback.show");
      assert(feedback && feedback.className.includes("fb-correct"), `lesson quiz: step ${answered} no correct feedback`);
      const next = quiz.querySelector(".quiz-actions [data-next]");
      if (next) next.click();
    }

    const result = quiz.querySelector(".quiz-result.show");
    assert(result, "lesson quiz: result screen not shown");
    if (result) {
      const scoreEl = result.querySelector(".score-text");
      assert(scoreEl && scoreEl.textContent.includes("100%"), `lesson quiz: expected 100%, got "${scoreEl && scoreEl.textContent}"`);
      assert(quiz.querySelectorAll(".quiz-review li").length === lesson.quiz.length, "lesson quiz: review list missing/incorrect");
      const retry = quiz.querySelector("[data-retry]");
      assert(retry, "lesson quiz: retry button missing");
      if (retry) {
        retry.click();
        assert(quiz.querySelector(".quiz-option:not([disabled])"), "lesson quiz: retry did not restart");
      }
    }
    assert(errors.length === 0, `lesson runtime: ${errors.join("|")}`);
    results.push(`lesson: content + ${lesson.quiz.length}-question quiz scored 100%, review + retry OK`);
    dom.window.close();
  }

  /* ---------- 5) Quiz engine wrong-answer path ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/cashar.html?id=computer-1");
    const doc = dom.window.document;
    const quiz = doc.querySelector("#quizMount");
    const opts = quiz.querySelectorAll(".quiz-option");
    const wrongIdx = 1; // computer-1 q1 answer is 0, so 1 is wrong
    opts[wrongIdx].click();
    const fb = quiz.querySelector(".quiz-feedback.show");
    assert(fb && fb.className.includes("fb-wrong"), "quiz: no wrong feedback");
    assert(/sax/.test(fb.textContent), "quiz: wrong feedback lacks correct-answer text");
    assert(opts[wrongIdx].classList.contains("wrong"), "quiz: wrong option not highlighted");
    assert(opts[0].classList.contains("correct"), "quiz: correct option not highlighted");
    assert(errors.length === 0, `quiz wrong-path runtime: ${errors.join("|")}`);
    results.push("quiz: wrong-answer feedback shows correct answer + explanation");
    dom.window.close();
  }

  /* ---------- 6) Exams hub: general quiz + category quiz loading ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/imtixaannada.html");
    const doc = dom.window.document;
    const genQuiz = doc.querySelector("#generalQuizMount.quiz-box") || doc.querySelector("#generalQuizMount .quiz-head");
    assert(genQuiz, "exams: general quiz not mounted");
    assert(genQuiz && genQuiz.querySelectorAll(".quiz-option").length >= 4, "exams: general quiz options missing");

    const hubCards = doc.querySelectorAll("#quizHubGrid .quiz-hub-card");
    assert(hubCards.length === 6, `exams: expected 6 hub cards, got ${hubCards.length}`);

    const btn = doc.querySelector('#quizHubGrid [data-cat="html"]');
    btn.click();
    const stage = doc.querySelector("#categoryQuizMount .quiz-head");
    assert(stage, "exams: category quiz did not load in stage");
    assert(doc.getElementById("stageTitle").textContent.includes("HTML"), "exams: stage title not updated");
    const title = doc.getElementById("stageIntro").textContent;
    assert(title.includes("15"), `exams: stage intro should mention 15 questions, got "${title}"`);
    assert(errors.length === 0, `exams runtime: ${errors.join("|")}`);
    results.push("exams: general quiz + 6 hub cards + category quiz load (15 Qs)");
    dom.window.close();
  }

  /* ---------- 7) Safety: password checker ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/badbaado.html");
    const doc = dom.window.document;
    const tips = doc.querySelectorAll("#safetyTips .safety-tip");
    assert(tips.length === 6, `safety: expected 6 tips, got ${tips.length}`);

    const input = doc.getElementById("pwInput");
    const label = doc.getElementById("pwLabel");
    const setVal = (v) => {
      input.value = v;
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    };

    setVal("abc");
    assert(doc.getElementById("pwBar").style.width !== "0%" && label.textContent.length > 0, "safety: weak pw no feedback");
    const weakText = label.textContent;

    setVal("Saf3r-Kiilo-Ba7!");
    const okRules = doc.querySelectorAll("#pwRules li.ok").length;
    assert(okRules === 5, `safety: strong pw rules ok=${okRules} != 5`);
    assert(doc.getElementById("pwBar").style.width === "100%", `safety: strong pw bar width=${doc.getElementById("pwBar").style.width}`);

    doc.getElementById("pwToggle").click();
    assert(input.type === "text", "safety: pw toggle did not reveal");

    assert(errors.length === 0, `safety runtime: ${errors.join("|")}`);
    results.push(`safety: 6 tips, checker weak -> "${weakText.slice(0, 24)}…", strong 5/5 rules, toggle OK`);
    dom.window.close();
  }

  /* ---------- 8) Contact form validation ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/nala-soo-xiriir.html");
    const doc = dom.window.document;
    const form = doc.getElementById("contactForm");
    const status = doc.getElementById("formStatus");

    // submit empty -> error
    form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    assert(status.className.includes("error"), "contact: empty submit not flagged");
    assert(doc.querySelectorAll(".field-error.show").length === 4, `contact: expected 4 field errors, got ${doc.querySelectorAll(".field-error.show").length}`);
    assert(doc.activeElement === doc.getElementById("cfName"), "contact: focus not moved to first invalid field");

    // bad email only
    doc.getElementById("cfName").value = "Axmed";
    doc.getElementById("cfEmail").value = "not-an-email";
    doc.getElementById("cfSubject").value = "Su'aal Cashar";
    doc.getElementById("cfMessage").value = "Waan jeclaan lahaa inaan ka helayo casharka CSS.";
    form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    assert(status.className.includes("error"), "contact: bad email not flagged");
    assert(doc.getElementById("errEmail").className.includes("show"), "contact: email error not shown");

    // valid
    doc.getElementById("cfEmail").value = "axmed@example.com";
    form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    assert(status.className.includes("success"), "contact: valid submit did not succeed");
    assert(/server|backend/.test(status.textContent), "contact: success message lacks honesty about backend");
    const mailto = doc.getElementById("mailtoLink").getAttribute("href");
    assert(mailto.startsWith("mailto:maxamedmustafe882@gmail.com?"), `contact: mailto not built (${mailto.slice(0, 60)})`);
    assert(decodeURIComponent(mailto).includes("Axmed"), "contact: mailto missing name");
    assert(mailto.includes("subject="), "contact: mailto missing subject");
    assert(doc.querySelector(".form-notice").textContent.includes("ma dirayo"), "contact: honest notice missing");

    assert(errors.length === 0, `contact runtime: ${errors.join("|")}`);
    results.push("contact: empty -> 4 errors, bad email flagged, valid -> success + prefilled mailto");
    dom.window.close();
  }

  /* ---------- 9) Mobile nav toggle ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/index.html");
    const doc = dom.window.document;
    const toggle = doc.getElementById("navToggle");
    const menu = doc.getElementById("navMenu");
    assert(toggle && menu, "nav: toggle/menu missing");
    toggle.click();
    assert(toggle.getAttribute("aria-expanded") === "true" && menu.classList.contains("open"), "nav: did not open");
    toggle.click();
    assert(toggle.getAttribute("aria-expanded") === "false" && !menu.classList.contains("open"), "nav: did not close");
    assert(errors.length === 0, `nav runtime: ${errors.join("|")}`);
    results.push("nav: hamburger toggles aria-expanded + open class both ways");
    dom.window.close();
  }

  /* ---------- Site gate: injected "Ka Bax" logout button ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/index.html");
    const doc = dom.window.document;
    const btn = doc.querySelector("#navMenu .nav-logout");
    assert(btn && btn.type === "submit", "logout: .nav-logout button missing from nav");
    const form = btn && btn.closest("form");
    assert(form && form.getAttribute("action") === "/logout" && form.method === "post",
      "logout: logout form action/method wrong");
    const galLinks = [...doc.querySelectorAll('#navMenu a[href="/login"], #navMenu a[href="/register"]')];
    assert(galLinks.length >= 1 && galLinks.every((a) => a.closest("li").hidden === true),
      "logout: Gal/Isdiiwaangeli links not hidden while signed in");
    assert(errors.length === 0, `logout runtime: ${errors.join("|")}`);
    results.push("gate: nav shows working 'Ka Bax' logout button (Gal/Isdiiwaangeli hidden)");
    dom.window.close();
  }

  /* ---------- 10) Resources + about pages ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/khayraadka.html");
    const doc = dom.window.document;
    const res = doc.querySelectorAll("#resourceGrid a.card");
    assert(res.length === 5, `resources: expected 5 cards, got ${res.length}`);
    assert([...res].every((a) => a.target === "_blank" && a.rel.includes("noopener")), "resources: external links missing target/rel");
    const rows = doc.querySelectorAll("table tbody tr");
    assert(rows.length >= 18, `resources: glossary rows ${rows.length} < 18`);
    assert(errors.length === 0, `resources runtime: ${errors.join("|")}`);
    results.push(`resources: 5 external cards, ${rows.length}-row glossary`);
    dom.window.close();
  }
  {
    const { dom, errors } = await loadPage(BASE + "/nagu-saabsan.html");
    const doc = dom.window.document;
    const cards = doc.querySelectorAll("#aboutCats .cat-card");
    assert(cards.length === 6, `about: expected 6 cards, got ${cards.length}`);
    assert(/hay'ad|hayad/.test(doc.body.textContent), "about: honest disclaimer missing");
    assert(errors.length === 0, `about runtime: ${errors.join("|")}`);
    results.push("about: 6 category cards + honest disclaimer");
    dom.window.close();
  }

  /* ---------- 11) Contact buttons: WhatsApp + Email everywhere required ---------- */
  {
    // Every page footer must have both buttons with exact hrefs
    for (const p of pages) {
      const { dom, errors } = await loadPage(BASE + "/" + p, { anon: isAuthPage(p) });
      const doc = dom.window.document;
      const waLinks = [...doc.querySelectorAll('a[href="https://wa.me/252657155694"]')];
      const footerWa = [...doc.querySelectorAll(".site-footer a[href=\"https://wa.me/252657155694\"]")];
      const footerMail = [...doc.querySelectorAll(".site-footer a[href=\"mailto:maxamedmustafe882@gmail.com\"]")];
      const btnWa = [...doc.querySelectorAll(".site-footer .btn-whatsapp")];
      const btnMail = [...doc.querySelectorAll(".site-footer .btn-email")];

      assert(footerWa.length >= 1, `${p}: footer WhatsApp link missing`);
      assert(footerMail.length >= 1, `${p}: footer email link missing`);
      assert(btnWa.length >= 1 && btnMail.length >= 1, `${p}: footer action buttons missing`);
      assert(waLinks.every((a) => a.target === "_blank" && a.rel.includes("noopener")), `${p}: wa.me links missing target/rel`);
      assert(waLinks.every((a) => a.getAttribute("aria-label")), `${p}: wa.me links missing aria-label`);
      // WhatsApp icon hydrated (filled svg path present)
      const waBtn = doc.querySelector(".btn-whatsapp [data-icon]");
      assert(waBtn && waBtn.querySelector("svg"), `${p}: WhatsApp icon not hydrated`);
      assert(errors.length === 0, `${p} buttons runtime: ${errors.join("|")}`);
      dom.window.close();
    }
    results.push("buttons: WhatsApp + Email present in footer of all 8 pages, icons hydrated, links accessible");

    // Contact page: prominent pair with clear labels
    const { dom, errors } = await loadPage(BASE + "/nala-soo-xiriir.html");
    const doc = dom.window.document;
    const mainActions = doc.querySelectorAll("main .contact-actions .btn-whatsapp");
    const mainEmails = doc.querySelectorAll("main .contact-actions .btn-email");
    assert(mainActions.length >= 1, "contact: prominent WhatsApp button missing");
    assert(mainEmails.length >= 1, "contact: prominent Email button missing");
    const waText = mainActions[0] ? mainActions[0].textContent.trim() : "";
    const mailText = mainEmails[0] ? mainEmails[0].textContent.trim() : "";
    assert(/WhatsApp/.test(waText), `contact: WhatsApp label unclear ("${waText}")`);
    assert(/Email/.test(mailText), `contact: Email label unclear ("${mailText}")`);
    assert(mainActions[0].target === "_blank" && mainActions[0].rel.includes("noopener"), "contact: WhatsApp link missing target/rel");
    // phone number items include the international WhatsApp display number
    assert(doc.body.textContent.includes("+252 657155694"), "contact: international WhatsApp number not displayed");
    assert(errors.length === 0, `contact buttons runtime: ${errors.join("|")}`);
    results.push(`contact page: prominent buttons ("${waText}" / "${mailText}"), +252 number shown, accessible`);
    dom.window.close();

    // Homepage contact card pair
    const home = await loadPage(BASE + "/index.html");
    const hdoc = home.dom.window.document;
    const cardWa = hdoc.querySelector(".contact-card .btn-whatsapp");
    const cardMail = hdoc.querySelector(".contact-card .btn-email");
    assert(cardWa && cardMail, "index: contact card buttons missing");
    assert(home.errors.length === 0, `index buttons runtime: ${home.errors.join("|")}`);
    results.push("index: contact card has WhatsApp + Email buttons");
    home.dom.window.close();
  }

  /* ---------- Registration page (public form, works without JS) ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/register", { anon: true });
    const doc = dom.window.document;
    const form = doc.querySelector("#registerForm");
    assert(form && form.getAttribute("action") === "/register" && form.method === "post",
      "register: form/action missing");
    for (const id of ["regName", "regEmail", "regPassword", "regConfirm"]) {
      assert(doc.getElementById(id), `register: missing field ${id}`);
    }
    assert(doc.getElementById("regPassword").type === "password", "register: password not masked");
    assert(doc.querySelectorAll("#registerForm [required]").length >= 4,
      "register: required attributes missing");
    assert(!doc.body.innerHTML.includes("{{"), "register: unreplaced template placeholder");
    assert(errors.length === 0, `register runtime: ${errors.join("|")}`);
    results.push("register: server-rendered form, 4 fields, password masked, no-JS fallback");
    dom.window.close();
  }

  /* ---------- User login page + protected /account redirect ---------- */
  {
    const { dom, errors } = await loadPage(BASE + "/login", { anon: true });
    const doc = dom.window.document;
    const form = doc.querySelector("#userLoginForm");
    assert(form && form.getAttribute("action") === "/login" && form.method === "post",
      "login: form/action missing");
    assert(doc.getElementById("loginPassword").type === "password",
      "login: password not masked");
    assert(doc.querySelectorAll("#userLoginForm [required]").length >= 2,
      "login: required attributes missing");
    assert(!doc.body.innerHTML.includes("{{"), "login: unreplaced template placeholder");
    assert(errors.length === 0, `login runtime: ${errors.join("|")}`);
    results.push("login: server-rendered form, 2 fields, password masked");
    dom.window.close();

    // /account without a session must land on /login (server-side redirect)
    const acc = await loadPage(BASE + "/account", { anon: true });
    const accPath = acc.dom.window.location.pathname;
    assert(accPath.startsWith("/login"), `account: expected redirect to /login, got ${accPath}`);
    assert(acc.errors.length === 0, `account redirect runtime: ${acc.errors.join("|")}`);
    results.push("account: anonymous access redirected to /login (server-enforced)");
    acc.dom.window.close();
  }

  /* ---------- Nav: register + login links on every public page ---------- */
  {
    for (const p of ["index.html", "casharrada.html", "nala-soo-xiriir.html", "login"]) {
      const { dom, errors } = await loadPage(BASE + "/" + p, { anon: p === "login" });
      const doc = dom.window.document;
      assert(doc.querySelector('.nav-menu a[href="/register"]'), `${p}: nav register link missing`);
      assert(doc.querySelector('.nav-menu a[href="/login"]'), `${p}: nav login link missing`);
      assert(errors.length === 0, `${p} nav runtime: ${errors.join("|")}`);
      dom.window.close();
    }
    results.push("nav: Isdiiwaangeli + Gal links present in header nav on public pages");
  }

  /* ---------- Report ---------- */
  console.log("\n=== TEST RESULTS ===");
  results.forEach((r) => console.log("  OK  " + r));
  if (failures.length) {
    console.log("\n=== FAILURES ===");
    failures.forEach((f) => console.log("  FAIL " + f));
    process.exit(1);
  }
  console.log("\nALL " + results.length + " TEST GROUPS PASSED");
})().catch((e) => {
  console.error("HARNESS ERROR:", e);
  process.exit(1);
});
