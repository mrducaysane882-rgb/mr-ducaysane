/* Validator for data/content.js — run: node tools/validate-content.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "data", "content.js"), "utf8");
const ctx = { window: {}, console };
vm.createContext(ctx);
// const declarations stay in script scope — bridge them onto the context
vm.runInContext(
  src +
    "\n;Object.assign(globalThis, { CATEGORIES, LESSONS, GENERAL_QUIZ, SAFETY_TIPS, RESOURCES });",
  ctx
);

const { CATEGORIES, LESSONS, GENERAL_QUIZ, SAFETY_TIPS, RESOURCES } = ctx;
const errors = [];

const catIds = new Set(CATEGORIES.map((c) => c.id));
if (CATEGORIES.length !== 6) errors.push(`Expected 6 categories, got ${CATEGORIES.length}`);
if (LESSONS.length !== 18) errors.push(`Expected 18 lessons, got ${LESSONS.length}`);

const lessonIds = new Set();
LESSONS.forEach((l) => {
  if (!catIds.has(l.category)) errors.push(`${l.id}: unknown category ${l.category}`);
  if (lessonIds.has(l.id)) errors.push(`duplicate lesson id ${l.id}`);
  lessonIds.add(l.id);
  if (!l.quiz || !l.quiz.length) errors.push(`${l.id}: no quiz`);
  if (!l.content || !l.content.length) errors.push(`${l.id}: no content`);
  if (!l.title || !l.summary || !l.duration || !l.level) errors.push(`${l.id}: missing meta`);
  l.quiz.forEach((q, i) => {
    if (!q.options || q.options.length < 2) errors.push(`${l.id} q${i}: <2 options`);
    if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.options.length)
      errors.push(`${l.id} q${i}: answer index out of range`);
    if (!q.explain) errors.push(`${l.id} q${i}: no explanation`);
    if (!q.q) errors.push(`${l.id} q${i}: no question text`);
  });
});

CATEGORIES.forEach((c) => {
  const inCat = LESSONS.filter((l) => l.category === c.id);
  if (!inCat.length) errors.push(`category ${c.id} has 0 lessons`);
  console.log(
    `cat ${c.id.padEnd(10)} -> ${inCat.length} lessons, ` +
      `${inCat.reduce((a, l) => a + l.quiz.length, 0)} questions`
  );
});

if (!GENERAL_QUIZ || GENERAL_QUIZ.questions.length !== 10)
  errors.push("GENERAL_QUIZ must have 10 questions");
else {
  GENERAL_QUIZ.questions.forEach((q, i) => {
    if (typeof q.answer !== "number" || q.answer >= q.options.length) errors.push(`gen q${i}: bad answer`);
    if (!q.explain) errors.push(`gen q${i}: no explain`);
  });
}

if (!SAFETY_TIPS || SAFETY_TIPS.length < 4) errors.push("SAFETY_TIPS too few");
if (!RESOURCES || RESOURCES.length < 3) errors.push("RESOURCES too few");
RESOURCES.forEach((r, i) => {
  if (!r.url || !/^https:\/\//.test(r.url)) errors.push(`resource ${i}: bad url`);
});

const totalQ = LESSONS.reduce((a, l) => a + l.quiz.length, 0);
console.log(`GENERAL_QUIZ: ${GENERAL_QUIZ.questions.length} questions`);
console.log(`SAFETY_TIPS: ${SAFETY_TIPS.length} | RESOURCES: ${RESOURCES.length}`);
console.log(`TOTAL: ${LESSONS.length} lessons, ${totalQ} lesson questions`);

if (errors.length) {
  console.error("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("ALL DATA CHECKS PASSED");
