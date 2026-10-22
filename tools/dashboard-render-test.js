/* Browser-level check for the Admin Dashboard: load the REAL /admin HTML with
   its real scripts (icons.js, main.js, admin-dashboard.js), point window.fetch
   at the LIVE server with the admin session cookie, then assert that every
   registered user from SQLite is rendered as a row in #usersBody.

   Run:
     node tools/dashboard-render-test.js http://127.0.0.1:3000 <cookie-file> <dashboard.html>
   Exit 0 = all checks passed. */
const fs = require("fs");
const http = require("http");
const { JSDOM, requestInterceptor } = require("jsdom");

const BASE = process.argv[2] || "http://127.0.0.1:3000";
const COOKIE_FILE = process.argv[3] || "/tmp/zjar2.txt";
const HTML_FILE = process.argv[4] || "/tmp/dash.html";

// session cookie from the curl cookie jar (name=value only)
function loadCookie() {
  const raw = fs.readFileSync(COOKIE_FILE, "utf8");
  for (let line of raw.split("\n")) {
    if (!line.trim()) continue;
    // curl prefixes HttpOnly cookies with "#HttpOnly_" — still a real cookie
    if (line.startsWith("#HttpOnly_")) line = line.slice("#HttpOnly_".length);
    else if (line.startsWith("#")) continue;
    const p = line.split("\t");
    if (p.length >= 7 && p[5] && p[6]) return `${p[5]}=${p[6]}`;
  }
  throw new Error("no session cookie in " + COOKIE_FILE);
}
const COOKIE = loadCookie();

function nodeFetch(url, opts) {
  return new Promise((resolve, reject) => {
    const u = new URL(url, BASE);
    const req = http.request(
      {
        host: u.hostname,
        port: u.port || 80,
        path: u.pathname + u.search,
        method: (opts && opts.method) || "GET",
        headers: Object.assign(
          { Cookie: COOKIE, Origin: BASE, Referer: BASE + "/admin" },
          (opts && opts.headers) || {}
        ),
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            json: () => Promise.resolve(JSON.parse(body)),
            text: () => Promise.resolve(body),
          })
        );
      }
    );
    req.on("error", reject);
    if (opts && opts.body) req.write(opts.body);
    req.end();
  });
}

// Serve /assets/* scripts from the project on disk (no network round-trip).
const localAssets = requestInterceptor((request) => {
  const u = new URL(request.url);
  if (u.origin !== new URL(BASE).origin) return; // app has no external resources
  try {
    const data = fs.readFileSync("." + u.pathname);
    const type = u.pathname.endsWith(".js") ? "text/javascript"
      : u.pathname.endsWith(".css") ? "text/css" : "text/html";
    return new Response(data, { status: 200, headers: { "Content-Type": type } });
  } catch (e) {
    return new Response("not found", { status: 404 });
  }
});

const failures = [];
let passes = 0;
function check(name, cond, detail) {
  if (cond) {
    passes++;
    console.log("  PASS  " + name);
  } else {
    failures.push(name);
    console.log("  FAIL  " + name + (detail ? "  :: " + detail : ""));
  }
}

(async function main() {
  const html = fs.readFileSync(HTML_FILE, "utf8");
  const api = await nodeFetch(BASE + "/admin/api/users?per=100").then((r) => r.json());
  check("live API returns users", api.ok === true && Array.isArray(api.users), JSON.stringify(api).slice(0, 120));

  const dom = new JSDOM(html, {
    url: BASE + "/admin",
    runScripts: "dangerously",
    resources: { interceptors: [localAssets] },
    pretendToBeVisual: true,
    beforeParse(window) {
      window.fetch = nodeFetch;
      window.fetchPolyfilled = true;
    },
  });
  const { window } = dom;
  await new Promise((res) => {
    window.addEventListener("load", res);
    setTimeout(res, 3000);
  });
  await new Promise((res) => setTimeout(res, 600)); // let the async load() settle

  const doc = window.document;
  check("admin-dashboard.js executed (fetch wired)", window.fetchPolyfilled === true &&
        doc.getElementById("adminCsrf") && doc.getElementById("adminCsrf").value !== "{{CSRF_TOKEN}}",
        "csrf slot substituted: " + (doc.getElementById("adminCsrf") || {}).value);

  const tbody = doc.getElementById("usersBody");
  const rows = tbody ? tbody.querySelectorAll("tr") : [];
  check("table rendered (" + api.users.length + " users from API)",
        rows.length === api.users.length && rows.length >= 1,
        "rows=" + rows.length + " api=" + api.users.length);

  const tableText = tbody ? tbody.textContent : "";
  const missing = (api.users || []).filter((u) => tableText.indexOf(u.email) === -1)
    .map((u) => u.email);
  check("every registered user's email appears in a row", missing.length === 0,
        "missing: " + missing.join(", "));

  const summary = doc.getElementById("usersSummary");
  const sumText = summary ? summary.textContent : "";
  check("summary shows total (" + api.total + ")", sumText.indexOf(String(api.total)) !== -1,
        "summary=" + sumText.slice(0, 90));

  const table = doc.getElementById("usersTable");
  check("table un-hidden after data arrives", table && !table.hasAttribute("hidden"));

  check("no password hash rendered anywhere",
        !/pbkdf2|\$[0-9a-f]{32}\$/.test(doc.body.textContent));

  // action buttons present per row (jooji/tirtir) — management UI wired
  const actionBtns = tbody ? tbody.querySelectorAll("td:last-child button") : [];
  check("per-row management buttons rendered", actionBtns.length >= rows.length,
        "buttons=" + actionBtns.length);

  window.close();
  console.log("\n" + passes + " passed, " + failures.length + " failed");
  if (failures.length) {
    failures.forEach((f) => console.log("  FAILED: " + f));
    process.exit(1);
  }
  console.log("DASHBOARD RENDER: ALL CHECKS PASSED");
  process.exit(0);
})().catch((e) => {
  console.error("FATAL:", e && e.stack || e);
  process.exit(1);
});
