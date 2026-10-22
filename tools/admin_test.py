#!/usr/bin/env python3
"""Security + flow tests for the MR.ducaysane admin login system.

Covers (all read-only server-side checks, restores state afterwards):
  * public site is GATED (anonymous -> /login); admin sign-in unlocks it;
    /admin and /admin/dashboard.html redirect when signed out
  * .env / server.py / tools/ are never served
  * wrong credentials -> clear generic error, no session cookie
  * correct credentials -> HttpOnly session cookie, dashboard renders
  * admin API: 401 without session, works with session, content restored
  * logout kills the session; Origin mismatch rejected (CSRF guard)
  * session expires after ADMIN_SESSION_TTL_MINUTES (2nd instance, frac allowed)
  * repeated failures trigger lockout (429)
  * password hashing present (PBKDF2), no plaintext password anywhere served

Run:  TEST_ADMIN_PASSWORD=<pw> python3 tools/admin_test.py
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

BASE = os.environ.get("TEST_BASE", "http://127.0.0.1:3000").rstrip("/")
PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "")
EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "maxamedmustafe882@gmail.com")
ANN_FILE = ROOT / "data" / "announcement.json"

failures: list[str] = []
passes = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    global passes
    if cond:
        passes += 1
        print(f"  PASS  {name}")
    else:
        failures.append(name)
        print(f"  FAIL  {name}" + (f"  :: {detail}" if detail else ""))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


def call(path: str, *, data=None, json_body=None, cookie: str | None = None,
         origin: str | None = None, base: str = BASE, method: str | None = None):
    headers: dict[str, str] = {"User-Agent": "admin-test"}
    body = None
    if json_body is not None:
        body = json.dumps(json_body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif data is not None:
        body = urllib.parse.urlencode(data).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    if cookie:
        headers["Cookie"] = cookie
    if origin:
        headers["Origin"] = origin
    req = urllib.request.Request(base + path, data=body, headers=headers,
                                 method=method or ("POST" if body is not None else "GET"))
    try:
        resp = OPENER.open(req, timeout=10)
        return resp.status, dict(resp.headers), resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        return err.code, dict(err.headers), err.read().decode("utf-8", "replace")
    except (urllib.error.URLError, TimeoutError, OSError) as err:
        return 0, {}, f"connection error: {err}"


def set_cookie_from(headers: dict) -> str:
    raw = headers.get("Set-Cookie") or headers.get("set-cookie") or ""
    return raw.split(";")[0]


def session_cookie(headers: dict) -> str:
    sc = set_cookie_from(headers)
    lower = (headers.get("Set-Cookie") or headers.get("set-cookie") or "").lower()
    ok = "httponly" in lower and "samesite" in lower
    check("login sets HttpOnly + SameSite session cookie", bool(sc) and ok,
          f"Set-Cookie={raw_safe(headers)}")
    return sc


def raw_safe(headers: dict) -> str:
    return (headers.get("Set-Cookie") or headers.get("set-cookie") or "")[:60] + "..."


def announce_text() -> str:
    try:
        return json.loads(ANN_FILE.read_text(encoding="utf-8")).get("text", "")
    except (OSError, ValueError):
        return "<unreadable>"


def main() -> int:
    if not PASSWORD:
        print("TEST_ADMIN_PASSWORD env var required (throwaway test password)")
        return 2

    print(f"== Admin auth tests against {BASE} ==")

    # --- 1) site gate: homepage blocked, secrets blocked ------------------
    code, headers, _ = call("/index.html")
    check("anonymous homepage gated (redirect to /login)", code in (302, 303)
          and (headers.get("Location") or "").startswith("/login"), f"status={code}")
    code, _, body = call("/login")
    check("login page itself reachable (200)", code == 200 and "MR.ducaysane" in body,
          f"status={code}")
    code, _, body = call("/assets/css/style.css")
    check("login styling reachable (200)", code == 200, f"status={code}")
    for blocked in ("/.env", "/server.py", "/server.log", "/tools/set_admin_password.py",
                    "/tools/admin_test.py", "/tools/qa-test.js", "/.git"):
        code, _, body = call(blocked)
        check(f"{blocked} not served", code in (403, 404) and "ADMIN_PASSWORD" not in body
              and "hash_password" not in body, f"status={code}")

    # --- 2) protected routes redirect when signed out ---------------------
    code, headers, _ = call("/admin")
    check("/admin redirects when unauthenticated", code in (302, 303)
          and (headers.get("Location") or "").startswith("/admin/login"), f"status={code}")
    code, headers, _ = call("/admin/dashboard.html")
    check("/admin/dashboard.html redirects when unauthenticated", code in (302, 303),
          f"status={code}")
    code, headers, _ = call("/admin/api/announcement")
    check("admin API returns 401 when unauthenticated", code == 401, f"status={code}")

    before = announce_text()
    code, _, _ = call("/admin/api/announcement", json_body={"text": "HACKED"})
    check("admin API POST rejected when unauthenticated (401)", code == 401, f"status={code}")
    check("announcement file unchanged after unauth POST", announce_text() == before)

    code, _, body = call("/admin/api/announcement", json_body={"text": "x"}, method="PUT")
    check("admin API rejects unsupported methods", code in (401, 405, 501), f"status={code}")

    # --- 3) login page itself ----------------------------------------------
    code, _, body = call("/admin/login")
    check("login page 200 + form present", code == 200 and 'id="loginForm"' in body
          and 'type="password"' in body, f"status={code}")
    check("login page contains no secret material",
          "pbkdf2" not in body and PASSWORD not in body and "ADMIN_PASSWORD" not in body)
    check("login page has noindex", "noindex" in body)
    check("server-rendered message slot is substituted (no raw placeholder)",
          "{{LOGIN_MESSAGE}}" not in body)
    check("server-rendered CSRF slot is substituted (no raw placeholder)",
          "{{CSRF_TOKEN}}" not in body)

    # --- 3b) login CSRF matrix (the preview panel embed pages opaque) -----
    m = re.search(r'name="csrf_token" value="([^"]+)"', body or "")
    atok = m.group(1) if m else ""
    check("admin login form embeds a CSRF token", len(atok) >= 20,
          f"token={bool(atok)}")

    # --- 4) wrong credentials ----------------------------------------------
    code, headers, body = call("/admin/login",
                               data={"email": EMAIL, "password": PASSWORD + "-wrong"})
    check("wrong password -> error, no session", code == 200
          and "si sax ah uma ahayn" in body and "Set-Cookie" not in headers,
          f"status={code}")
    code, headers, body = call("/admin/login",
                               data={"email": "nobody@example.com", "password": "nope"})
    check("wrong email -> same generic error (no user enumeration)",
          code == 200 and "si sax ah uma ahayn" in body and "Set-Cookie" not in headers,
          f"status={code}")
    code, headers, _ = call("/admin", cookie="admin_session=forged-token-value")
    check("forged session cookie rejected", code in (302, 303), f"status={code}")

    # --- 5) correct credentials --------------------------------------------
    code, headers, body = call("/admin/login", data={"email": EMAIL, "password": PASSWORD})
    check("correct credentials -> redirect to dashboard", code in (302, 303)
          and (headers.get("Location") or "") in ("/admin", "/admin/login"), f"status={code}")
    cookie = session_cookie(headers) if "Set-Cookie" in headers else ""
    check("cookie value is a random token (no password/email inside)",
          bool(cookie) and PASSWORD not in cookie and "@" not in cookie,
          f"cookie={raw_safe(headers)}")

    # panel-style login: opaque origin + synchronizer token
    code, headers, _ = call("/admin/login",
                            data={"email": EMAIL, "password": PASSWORD,
                                  "csrf_token": atok}, origin="null")
    check("panel admin login (Origin:null + token) -> dashboard redirect",
          code in (302, 303) and "admin_session=" in (headers.get("Set-Cookie") or ""),
          f"status={code}")
    code, _, _ = call("/admin/login",
                      data={"email": EMAIL, "password": PASSWORD}, origin="null")
    check("Origin:null WITHOUT token -> 403 (CSRF enforced on admin login)",
          code == 403, f"status={code}")
    code, _, _ = call("/admin/login",
                      data={"email": EMAIL, "password": PASSWORD,
                            "csrf_token": atok}, origin="http://evil.example")
    check("foreign Origin + token -> 403 (CSRF still enforced)",
          code == 403, f"status={code}")

    code, headers, body = call("/index.html", cookie=cookie)
    check("admin session opens the gated homepage (200)", code == 200
          and "MR.ducaysane" in body, f"status={code}")
    code, headers, body = call("/admin", cookie=cookie)
    check("dashboard 200 with valid session", code == 200 and "Dashboard" in body,
          f"status={code}")
    check("dashboard shows configured admin email", EMAIL in body)
    check("dashboard has no secret material",
          "pbkdf2" not in body and PASSWORD not in body)
    check("dashboard is no-store", "no-store" in (headers.get("Cache-Control") or ""))
    csp = (headers.get("Content-Security-Policy")
           or headers.get("content-security-policy") or "")
    check("dashboard sends a strict Content-Security-Policy",
          "script-src 'self'" in csp and "frame-ancestors 'none'" in csp,
          f"csp={csp[:60]}")
    check("dashboard loads external admin JS (CSP-safe, no inline script)",
          'src="/assets/js/admin-dashboard.js"' in body and "<script>\n" not in body)
    code, _, _ = call("/assets/js/admin-dashboard.js")
    check("admin dashboard JS is served (200)", code == 200, f"status={code}")
    code, _, body = call("/admin", cookie=cookie)
    check("dashboard embeds a CSRF token for admin actions",
          'id="adminCsrf"' in body and "{{CSRF_TOKEN}}" not in body)
    code, _, _ = call("/admin/login", cookie=cookie)
    check("already signed in: login page redirects to /admin", code in (302, 303),
          f"status={code}")

    # --- 6) protected admin action ----------------------------------------
    marker = "Ogeysiis tijaabo " + str(int(time.time()))
    code, _, body = call("/admin/api/announcement", json_body={"text": marker}, cookie=cookie)
    check("admin can save protected content", code == 200 and '"ok": true' in body.replace("True", "true"),
          f"status={code} body={body[:80]}")
    check("saved content visible in public data file", announce_text() == marker)
    code, _, _ = call("/admin/api/announcement", json_body={"text": "x" * 600}, cookie=cookie)
    check("over-long content rejected (400)", code == 400, f"status={code}")

    # --- 7) CSRF origin guard ----------------------------------------------
    code, _, _ = call("/admin/api/announcement", json_body={"text": "evil"},
                      cookie=cookie, origin="http://evil.example")
    check("foreign Origin rejected (403)", code == 403, f"status={code}")

    # restore public content
    code, _, _ = call("/admin/api/announcement", json_body={"text": ""}, cookie=cookie)
    check("announcement restored to empty", code == 200 and announce_text() == "")

    # --- 8) logout ----------------------------------------------------------
    code, headers, _ = call("/admin/logout", data={"x": "1"}, cookie=cookie)
    check("logout redirects to login", code in (302, 303)
          and (headers.get("Location") or "").startswith("/admin/login"), f"status={code}")
    code, _, _ = call("/admin", cookie=cookie)
    check("session dead after logout", code in (302, 303), f"status={code}")
    code, _, body = call("/admin/api/announcement", json_body={"text": "post-logout"},
                         cookie=cookie)
    check("admin API 401 after logout", code == 401, f"status={code}")

    # --- 9) second instance: session expiry + lockout -----------------------
    print("== Second instance (TTL=0.05 min = 3s, hash from env) ==")
    import server as server_mod
    env = dict(os.environ)
    env.update({
        "PORT": "3100", "HOST": "127.0.0.1",
        "ADMIN_EMAIL": EMAIL,
        "ADMIN_PASSWORD_HASH": server_mod.hash_password(PASSWORD),
        "ADMIN_SESSION_TTL_MINUTES": "0.05",
    })
    env.pop("ADMIN_PASSWORD", None)  # force the ADMIN_PASSWORD_HASH path
    proc = subprocess.Popen([sys.executable, str(ROOT / "server.py")], env=env,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    b2 = "http://127.0.0.1:3100"
    try:
        ready = False
        for _ in range(40):
            time.sleep(0.25)
            c, _, _ = call("/index.html", base=b2)
            if c in (200, 302, 303):  # 200 = signed in, 302 = gate answered
                ready = True
                break
        check("second instance starts", ready)
        if ready:
            code, headers, body = call("/admin/login", data={"email": EMAIL,
                                                             "password": PASSWORD}, base=b2)
            cookie2 = set_cookie_from(headers) if code in (302, 303) else ""
            check("login works via ADMIN_PASSWORD_HASH env path",
                  code in (302, 303) and bool(cookie2), f"status={code}")
            code, _, _ = call("/admin", cookie=cookie2, base=b2)
            check("dashboard reachable before expiry", code == 200, f"status={code}")
            time.sleep(4)  # > 3s TTL
            code, headers, _ = call("/admin", cookie=cookie2, base=b2)
            check("session expires after TTL (redirect)",
                  code in (302, 303), f"status={code}")
            code, _, body = call("/admin/login", cookie=cookie2, base=b2)
            check("expired session shows clear 'session expired' message",
                  code == 200 and "session has expired" in body, f"status={code}")

            # lockout: repeated failures
            last = None
            for i in range(6):
                last = call("/admin/login",
                            data={"email": EMAIL, "password": f"wrong-{i}"}, base=b2)
                if last[0] == 429:
                    break
            check("repeated failed logins trigger 429 lockout",
                  last is not None and last[0] == 429
                  and "Too many failed attempts" in last[2],
                  f"status={last[0] if last else None}")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()

    # --- 10) hashing sanity -------------------------------------------------
    from server import hash_password, verify_password, PBKDF2_ITERATIONS
    h = hash_password("Saf3r-Tijaabo-2026!")
    check("hash format pbkdf2_sha256$iters$salt$digest",
          re.fullmatch(r"pbkdf2_sha256\$\d+\$[0-9a-f]{32}\$[0-9a-f]+", h) is not None)
    check("iterations >= 600000", PBKDF2_ITERATIONS >= 600_000)
    check("verify accepts right / rejects wrong password",
          verify_password("Saf3r-Tijaabo-2026!", h) and not verify_password("x", h))
    check("hash is salted per call", hash_password("a") != hash_password("a"))

    print(f"\n{passes} passed, {len(failures)} failed")
    if failures:
        for f in failures:
            print(f"  FAILED: {f}")
        return 1
    print("ALL ADMIN SECURITY TESTS PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())