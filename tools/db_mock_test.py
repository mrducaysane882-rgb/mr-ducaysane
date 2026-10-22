#!/usr/bin/env python3
"""LOCAL integration test: registration -> server.py -> mock Supabase (PostgREST).

Phase A proves the OUT-OF-THE-BOX local SQLite backend (no SUPABASE_* at all):
register -> login -> account must work with zero configuration, and data/users.db
must never be served. Phases B+ prove the Supabase wiring WITHOUT real
credentials: they start tools/mock_postgrest.py and server.py as subprocesses,
then drive HTTP requests through the public /register endpoint.

Exit 0 = all checks passed. Exit 1 = failures. Never prints credentials.

Run:  python3 tools/db_mock_test.py
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MOCK_PORT = 3200
APP_PORT = 3100
BASE = f"http://127.0.0.1:{APP_PORT}"

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


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Observe the 303 itself instead of following it (tests the PRG hop)."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(_NoRedirect)


def _read(resp_or_err) -> tuple[int, str]:
    try:
        return resp_or_err.status, resp_or_err.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", "replace")


def post_form_h(path: str, fields: dict, base: str = BASE,
                cookie: str | None = None,
                extra_headers: dict | None = None):
    """POST form -> (status, headers_dict, body). Cookie/headers optional."""
    data = urllib.parse.urlencode(fields).encode()
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    if cookie:
        headers["Cookie"] = cookie
    headers.update(extra_headers or {})
    req = urllib.request.Request(base + path, data=data, headers=headers)
    try:
        resp = OPENER.open(req, timeout=20)
        return resp.status, dict(resp.headers), resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        return err.code, dict(err.headers), err.read().decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as err:
        return 0, {}, str(err)


def post_json_h(path: str, payload: dict, base: str = BASE,
                cookie: str | None = None,
                extra_headers: dict | None = None):
    """POST JSON -> (status, headers_dict, body). Cookie/headers optional."""
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = cookie
    headers.update(extra_headers or {})
    req = urllib.request.Request(base + path, data=data, headers=headers)
    try:
        resp = OPENER.open(req, timeout=20)
        return resp.status, dict(resp.headers), resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        return err.code, dict(err.headers), err.read().decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as err:
        return 0, {}, str(err)


def get_h(path: str, base: str = BASE, cookie: str | None = None):
    """GET -> (status, headers_dict, body)."""
    headers = {"Cookie": cookie} if cookie else {}
    req = urllib.request.Request(base + path, headers=headers)
    try:
        resp = OPENER.open(req, timeout=20)
        return resp.status, dict(resp.headers), resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        return err.code, dict(err.headers), err.read().decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as err:
        return 0, {}, str(err)


def post_form(path: str, fields: dict, base: str = BASE) -> tuple[int, str]:
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(
        base + path, data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        return _read(OPENER.open(req, timeout=20))
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as err:
        return 0, str(err)


def get(path: str, base: str = BASE) -> tuple[int, str]:
    try:
        return _read(OPENER.open(base + path, timeout=20))
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as err:
        return 0, str(err)


def _mock_admin_hash(password: str) -> str:
    """Self-contained PBKDF2 hash so the test does not depend on .env contents
    (the real .env holds the owner's configured admin hash)."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600_000)
    return f"pbkdf2_sha256$600000${salt.hex()}${digest.hex()}"


def start(env_extra: dict, port: int) -> subprocess.Popen:
    env = {**os.environ, "PORT": str(port), **env_extra}
    env.pop("ADMIN_PASSWORD", None)
    log = (ROOT / f"tools/.test-{port}.log").open("w")
    return subprocess.Popen([sys.executable, "server.py"], cwd=ROOT, env=env,
                            stdout=log, stderr=log)


def wait_up(port: int, proc: subprocess.Popen, timeout: float = 15.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(
                    f"http://127.0.0.1:{port}/index.html", timeout=2):
                return True
        except urllib.error.HTTPError:
            return True  # server answered at all
        except OSError:
            if proc.poll() is not None:
                return False  # died during startup
            time.sleep(0.25)
    return False


def stop(proc: subprocess.Popen) -> None:
    if proc.poll() is None:
        proc.send_signal(signal.SIGTERM)
        try:
            proc.wait(timeout=8)
        except subprocess.TimeoutExpired:
            proc.kill()


def main() -> int:
    print("== LOCAL mock integration test (no real database) ==")

    mock_env = {"SUPABASE_URL": f"http://127.0.0.1:{MOCK_PORT}",
                "SUPABASE_SERVICE_ROLE_KEY": "mock-service-role-key-for-tests-000"}

    # ---------------- Phase A: database NOT configured ----------------
    # No SUPABASE_* anywhere -> the local SQLite backend must carry the whole
    # flow out of the box (register -> login -> account), and the old
    # "weli loo soo xirin" block must be gone for good.
    print("\n-- Phase A: unconfigured state -> local SQLite backend --")
    local_db = ROOT / "tools" / ".test-users-local.db"
    local_db.unlink(missing_ok=True)
    app = start({"LOCAL_USERS_DB": str(local_db)}, APP_PORT)
    try:
        if not wait_up(APP_PORT, app):
            print("server failed to start; see tools/.test-3100.log")
            return 1

        status, body = get("/register")
        check("register page reachable (200)", status == 200, f"status={status}")
        status, body = get("/login")
        check("no 'not connected' banner on /login (old 503 gone)",
              status == 200 and "weli loo soo xirin" not in body,
              f"status={status}")

        pw = "Sirta-2026!"
        status, body = post_form("/register", {
            "name": "Tijaabo Mid", "email": "local-one@example.com",
            "password": pw, "confirm": pw})
        check("local register -> 303 PRG redirect (no external DB)",
              status == 303, f"status={status}")
        check("register response leaks nothing",
              "SUPABASE" not in body and "pbkdf2" not in body)
        status, body = get("/register?i=created")
        check("success message shown after redirect",
              status == 200 and "waa la sameeyay" in body.lower())

        status, body = post_form("/register", {
            "name": "Tijaabo Mid", "email": "local-one@example.com",
            "password": pw, "confirm": pw})
        check("duplicate email rejected locally (unique constraint)",
              "horey ayuu akoon" in body.lower(), f"status={status}")

        status, body = post_form("/register", {
            "name": "Tijaabo Mid", "email": "bad-email",
            "password": pw, "confirm": pw})
        check("invalid email rejected before touching the DB",
              status == 200 and "email-ka sax maaha" in body.lower(),
              f"status={status} :: {body[:160]}")

        status, body = post_form("/register", {
            "name": "Tijaabo", "email": "local-mismatch@example.com",
            "password": pw, "confirm": "Khalad-2026!"})
        check("password mismatch rejected", "isku mid maaha" in body.lower(),
              f"status={status}")

        status, _h, body = post_form_h("/login", {
            "email": "local-one@example.com", "password": "Khalad-keliya8"})
        check("wrong password rejected locally",
              "si sax ah uma ahayn" in body.lower()
              and "user_session=" not in (_h.get("Set-Cookie") or ""),
              f"status={status}")

        status, headers, _b = post_form_h("/login", {
            "email": "local-one@example.com", "password": pw})
        cookie = (headers.get("Set-Cookie") or "").split(";")[0]
        check("local login -> 303 + user_session cookie",
              status == 303 and cookie.startswith("user_session="),
              f"status={status} cookie={bool(cookie)}")
        status, _h, body = get_h("/account", cookie=cookie)
        check("account page opens with the local session",
              status == 200 and "Tijaabo Mid" in body, f"status={status}")

        for denied in ("/data/users.db", "/data/users.db-wal",
                       "/data/users.db-shm"):
            status, body = get(denied)
            check(f"{denied} never served (404)", status == 404
                  and "pbkdf2" not in body, f"status={status}")
        status, body = get("/data/content.js")
        check("site gate holds /data/content.js for anon (redirect)",
              status in (301, 302, 303), f"status={status}")
        status, _h, body = get_h("/data/content.js", cookie=cookie)
        check("signed-in page still loads public /data/content.js",
              status == 200 and len(body) > 100, f"status={status}")
    finally:
        stop(app)
        local_db.unlink(missing_ok=True)

    # ---------------- Phase B: database configured (mock) ----------------
    print("\n-- Phase B: configured state (mock PostgREST) --")
    mock = subprocess.Popen(
        [sys.executable, "tools/mock_postgrest.py", str(MOCK_PORT)], cwd=ROOT,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    app = start({**mock_env, "ADMIN_SESSION_TTL_MINUTES": "240"}, APP_PORT)
    try:
        if not wait_up(MOCK_PORT, mock) or not wait_up(APP_PORT, app):
            print("mock or app failed to start")
            return 1

        email = f"mock-{secrets.token_hex(4)}@example.com"
        password = "Mock-Key-2026!"

        status, body = post_form("/register", {
            "name": "Tijaabo Laba", "email": email,
            "password": password, "confirm": password})
        check("registration succeeds -> 303 PRG redirect",
              status == 303, f"status={status}")
        status, body = get("/register?i=created")
        check("success message shown after redirect",
              status == 200 and "waa la sameeyay" in body.lower())
        check("no credential/hash leak in public response",
              "pbkdf2" not in body and password not in body)

        status, body = post_form("/register", {
            "name": "Tijaabo Laba", "email": email.upper(),
            "password": password, "confirm": password})
        check("duplicate email rejected (409 -> clear message)",
              "horey ayuu akoon" in body.lower(), f"status={status}")

        status, body = post_form("/register", {
            "name": "Tijaabo", "email": "not-an-email",
            "password": password, "confirm": password})
        check("invalid email rejected", status == 200
              and "email-ka sax maaha" in body.lower(), f"status={status}")

        status, body = post_form("/register", {
            "name": "A", "email": f"short-{secrets.token_hex(3)}@example.com",
            "password": "keliya8", "confirm": "keliya8"})
        check("short password rejected", "ugu yaraan 8" in body.lower(),
              f"status={status}")

        status, body = post_form("/register", {
            "name": "T" * 300, "email": f"long-{secrets.token_hex(3)}@example.com",
            "password": password, "confirm": password})
        check("over-long name rejected", "2 ilaa 100" in body.lower(),
              f"status={status}")

        status, body = post_form("/register", {}, )
        check("empty POST -> 400 bad request", status == 400, f"status={status}")

        # what the DB actually stored
        status, body = get("/__dump", base=f"http://127.0.0.1:{MOCK_PORT}")
        stored = json.loads(body).get(email, {}) if status == 200 else {}
        check("row stored with all columns",
              stored.get("email") == email and stored.get("name") == "Tijaabo Laba",
              f"stored keys={list(stored)}")
        check("stored password is PBKDF2 hash, never plaintext",
              stored.get("password_hash", "").startswith("pbkdf2_sha256$")
              and password not in json.dumps(stored))

        # secret hygiene: the .env file itself and server.py must never be served
        for blocked in ("/.env", "/server.py", "/tools/mock_postgrest.py",
                        "/data/users.db"):
            status, body = get(blocked)
            check(f"{blocked} not served", status in (403, 404)
                  and "SUPABASE_SERVICE_ROLE_KEY=" not in body)

        status, body = post_form("/register", {
            "name": "Limit Test", "email": f"limit-{secrets.token_hex(3)}@example.com",
            "password": password, "confirm": password})
        check("first request in rate-limit window ok", status in (200, 303),
              f"status={status}")

        # CSRF origin matrix — the preview panel embeds pages with an
        # OPAQUE origin (browser sends `Origin: null`); a synchronizer
        # token rendered by our own form is what tells ours from a foreign
        # page. Foreign Origins must stay blocked (CSRF not disabled).
        _st, _pg = get("/register")
        _m = re.search(r'name="csrf_token" value="([^"]+)"', _pg or "")
        csrf = _m.group(1) if _m else ""
        check("register form embeds a CSRF token",
              _st == 200 and len(csrf) >= 20, f"status={_st} token={bool(csrf)}")
        status, _h, _b = post_form_h("/register", {
            "name": "Null Origin", "email": f"null-{secrets.token_hex(4)}@example.com",
            "password": password, "confirm": password, "csrf_token": csrf},
            extra_headers={"Origin": "null"})
        check("Origin:null + valid CSRF token -> register allowed (303)",
              status == 303, f"status={status}")
        status, _h, _b = post_form_h("/register", {
            "name": "Null Bare", "email": f"nb-{secrets.token_hex(4)}@example.com",
            "password": password, "confirm": password},
            extra_headers={"Origin": "null"})
        check("Origin:null WITHOUT token -> 403 (CSRF enforced)",
              status == 403, f"status={status}")
        status, _h, _b = post_form_h("/register", {
            "name": "Evil Origin", "email": f"evil-{secrets.token_hex(4)}@example.com",
            "password": password, "confirm": password, "csrf_token": csrf},
            extra_headers={"Origin": "https://evil.example"})
        check("foreign Origin -> 403 even WITH token (CSRF enforced)",
              status == 403, f"status={status}")
    finally:
        stop(app)
        stop(mock)

    # ---------------- Phase C: user login, account, admin oversight ----------------
    print("\n-- Phase C: user login/account + admin users/messages (mock DB) --")
    mock = subprocess.Popen(
        [sys.executable, "tools/mock_postgrest.py", str(MOCK_PORT)], cwd=ROOT,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    admin_pw = "Admin-Mock-2026!"
    app = start({**mock_env,
                 "ADMIN_EMAIL": "admin@mock.test",
                 "ADMIN_PASSWORD_HASH": _mock_admin_hash(admin_pw)}, APP_PORT)
    try:
        if not wait_up(MOCK_PORT, mock) or not wait_up(APP_PORT, app):
            print("mock or app failed to start (phase C)")
            return 1

        email = f"user-{secrets.token_hex(4)}@example.com"
        password = "Isticmaale-2026!"

        # 1) registration (creates the row the login will use)
        status, _body = post_form("/register", {
            "name": "Axmed Tijaabo", "email": email,
            "password": password, "confirm": password})
        check("phase C: user registered", status == 303, f"status={status}")

        # 2) site gate + protected routes reject anonymous users
        status, _h, _b = get_h("/index.html")
        check("site gate: anonymous /index.html -> redirect /login",
              status in (301, 302, 303) and "/login" in _h.get("Location", ""),
              f"status={status} loc={_h.get('Location')}")
        status, _h, _b = get_h("/casharrada.html")
        check("site gate: anonymous /casharrada.html -> redirect /login",
              status in (301, 302, 303) and "/login" in _h.get("Location", ""),
              f"status={status} loc={_h.get('Location')}")
        status, _h, _b = get_h("/assets/css/style.css")
        check("login-page styling served without a session (200)",
              status == 200, f"status={status}")
        status, _h, _b = get_h("/account")
        check("anonymous /account -> redirect to /login",
              status in (301, 302, 303) and "/login" in _h.get("Location", ""),
              f"status={status} loc={_h.get('Location')}")
        status, _h, _b = get_h("/admin/api/users")
        check("anonymous /admin/api/users -> 401", status == 401, f"status={status}")

        # 3) wrong password: clear error, no cookie
        status, headers, body = post_form_h("/login", {
            "email": email, "password": "Khalad-Kale-77!"})
        check("user wrong password -> error + no session cookie",
              status == 200 and "si sax ah uma ahayn" in body
              and not any("user_session=" in v for v in headers.values()),
              f"status={status}")

        # 4) correct password -> 303 to the website home + HttpOnly cookie
        status, headers, body = post_form_h("/login", {
            "email": email.upper(), "password": password})
        set_cookie = ""
        for value in headers.values():
            if "user_session=" in str(value):
                set_cookie = str(value)
        check("user login (case-insensitive email) -> 303 + user_session cookie",
              status == 303 and headers.get("Location", "") == "/"
              and "HttpOnly" in set_cookie and "SameSite=Lax" in set_cookie,
              f"status={status} loc={headers.get('Location')}")
        user_cookie = set_cookie.split(";")[0] if set_cookie else ""

        # 4b) gate now opens: the signed-in user can read public pages
        status, _h, _b = get_h("/index.html", cookie=user_cookie)
        check("signed-in user opens the website (200)", status == 200,
              f"status={status}")
        status, _h, _b = get_h("/casharrada.html", cookie=user_cookie)
        check("signed-in user opens inner pages (200)", status == 200,
              f"status={status}")

        # panel-style login: opaque origin + synchronizer token
        _st, _pg = get("/login")
        _m = re.search(r'name="csrf_token" value="([^"]+)"', _pg or "")
        ltok = _m.group(1) if _m else ""
        status, headers, _b = post_form_h("/login", {
            "email": email, "password": password, "csrf_token": ltok},
            extra_headers={"Origin": "null"})
        check("panel login (Origin:null + token) -> 303 + user_session cookie",
              status == 303 and "user_session=" in str(headers.values()),
              f"status={status}")

        # 5) account page shows the user's own data
        status, headers, body = get_h("/account", cookie=user_cookie)
        check("user /account 200 + shows name & email",
              status == 200 and "Axmed Tijaabo" in body and email in body
              and "no-store" in str(headers), f"status={status}")

        # 6) user session canNOT become admin
        status, _h, _b = get_h("/admin", cookie=user_cookie)
        check("user session denied /admin (redirect)",
              status in (301, 302, 303) and "/admin/login" in _h.get("Location", ""),
              f"status={status} loc={_h.get('Location')}")
        status, _h, _b = get_h("/admin/api/users", cookie=user_cookie)
        check("user session denied /admin/api/users (401)", status == 401,
              f"status={status}")
        status, _h, _b = get_h("/admin/api/messages", cookie=user_cookie)
        check("user session denied /admin/api/messages (401)", status == 401,
              f"status={status}")

        # 7) contact form: reachable only with a signed-in session (site gate)
        status, _h, body = post_form_h("/api/contact", {
            "name": "Xiriir Tijaabo", "email": "xiriir@example.com",
            "subject": "Su'aal kooban", "message": "Waa maxay casharrada HTML?"})
        check("anonymous contact rejected (401)", status == 401,
              f"status={status} body={body[:80]}")
        status, _h, body = post_form_h("/api/contact", {
            "name": "Xiriir Tijaabo", "email": "xiriir@example.com",
            "subject": "Su'aal kooban", "message": "Waa maxay casharrada HTML?"},
            cookie=user_cookie)
        check("signed-in contact accepted (200)", status == 200 and '"ok": true' in body,
              f"status={status} body={body[:80]}")
        status, _h, body = post_form_h("/api/contact", {
            "name": "X", "email": "bad", "subject": "s", "message": "q"},
            cookie=user_cookie)
        check("invalid contact rejected (422)", status == 422, f"status={status}")
        status, _h, body = get_h("/api/csrf-token")
        check("csrf token endpoint requires a session (401)", status == 401,
              f"status={status}")
        status, _h, body = get_h("/api/csrf-token", cookie=user_cookie)
        try:
            ctok = json.loads(body).get("csrf_token", "")
        except ValueError:
            ctok = ""
        check("signed-in user gets a CSRF token (200)",
              status == 200 and len(ctok) >= 20, f"status={status}")
        status, _h, body = post_json_h("/api/contact", {
            "name": "Panel Xiriir", "email": "panel@example.com",
            "subject": "Panel su'aal", "message": "Tijaabo panel ah oo buuxa",
            "csrf_token": ctok}, cookie=user_cookie,
            extra_headers={"Origin": "null"})
        check("panel contact (Origin:null + token) -> 200",
              status == 200 and '"ok": true' in body,
              f"status={status} body={body[:80]}")
        status, _h, body = post_json_h("/api/contact", {
            "name": "Panel Xiriir", "email": "panel@example.com",
            "subject": "Panel su'aal", "message": "Tijaabo panel ah oo buuxa"},
            cookie=user_cookie, extra_headers={"Origin": "null"})
        check("panel contact WITHOUT token -> 403 (CSRF enforced)",
              status == 403, f"status={status}")
        status, _h, _b = get_h("/data/.contact_messages.json")
        check("contact store not served publicly (404)", status == 404,
              f"status={status}")

        # 8) admin login (configured via env) -> can list users, never hashes
        status, headers, _b = post_form_h("/admin/login", {
            "email": "admin@mock.test", "password": admin_pw})
        admin_cookie = ""
        for value in headers.values():
            if "admin_session=" in str(value):
                admin_cookie = str(value).split(";")[0]
        check("admin login -> 303 + admin_session cookie",
              status == 303 and bool(admin_cookie), f"status={status}")

        # 8b) panel-style admin login: opaque origin + synchronizer token
        #     (this is exactly what the preview panel's browser sends)
        _st, _pg = get("/admin/login")
        _m = re.search(r'name="csrf_token" value="([^"]+)"', _pg or "")
        atok = _m.group(1) if _m else ""
        check("admin login form embeds a CSRF token",
              _st == 200 and len(atok) >= 20, f"status={_st} token={bool(atok)}")
        status, headers, _b = post_form_h("/admin/login", {
            "email": "admin@mock.test", "password": admin_pw, "csrf_token": atok},
            extra_headers={"Origin": "null"})
        check("panel admin login (Origin:null + token) -> 303 + cookie",
              status == 303 and "admin_session=" in str(headers.values()),
              f"status={status}")
        status, _h, _b = post_form_h("/admin/login", {
            "email": "admin@mock.test", "password": admin_pw},
            extra_headers={"Origin": "null"})
        check("Origin:null WITHOUT token -> 403 (CSRF enforced on admin login)",
              status == 403, f"status={status}")
        status, _h, _b = post_form_h("/admin/login", {
            "email": "admin@mock.test", "password": admin_pw, "csrf_token": atok},
            extra_headers={"Origin": "https://evil.example"})
        check("foreign Origin + token -> 403 (CSRF still enforced)",
              status == 403, f"status={status}")

        # 8c) user management: search / sort / pagination / profile detail
        status, _b = post_form("/register", {
            "name": "Bilow A", "email": f"bilow-{secrets.token_hex(3)}@example.com",
            "password": password, "confirm": password})
        check("extra user 1 registered (pagination fixture)", status == 303,
              f"status={status}")
        status, _b = post_form("/register", {
            "name": "Cade Z", "email": f"cade-{secrets.token_hex(3)}@example.com",
            "password": password, "confirm": password})
        check("extra user 2 registered (pagination fixture)", status == 303,
              f"status={status}")

        status, _h, body = get_h("/admin/api/users?q=" + urllib.parse.quote(email),
                                 cookie=admin_cookie)
        try:
            found = json.loads(body)
        except ValueError:
            found = {}
        check("search by email finds exactly our user",
              status == 200 and found.get("total") == 1
              and found["users"][0]["email"] == email, f"body={body[:120]}")
        status, _h, body = get_h("/admin/api/users?q=zz-no-such-user",
                                 cookie=admin_cookie)
        check("search with no match -> empty page",
              status == 200 and json.loads(body).get("total") == 0,
              f"body={body[:80]}")
        status, _h, body = get_h("/admin/api/users?per=1&page=2&sort=name_asc",
                                 cookie=admin_cookie)
        try:
            page2 = json.loads(body)
        except ValueError:
            page2 = {}
        check("pagination: per=1 page=2 -> 1 row, pages>=3",
              status == 200 and page2.get("page") == 2
              and page2.get("pages", 0) >= 3 and len(page2.get("users", [])) == 1,
              f"body={body[:120]}")
        status, _h, body = get_h("/admin/api/users?per=10&sort=name_asc",
                                 cookie=admin_cookie)
        names = [u["name"] for u in json.loads(body).get("users", [])]
        check("sort by name ascending (A→Z)", names == sorted(names),
              f"names={names}")
        status, _h, body = get_h("/admin/api/users?per=10&sort=name_desc",
                                 cookie=admin_cookie)
        names_desc = [u["name"] for u in json.loads(body).get("users", [])]
        check("sort by name descending (Z→A)",
              names_desc == sorted(names, reverse=True), f"names={names_desc}")

        status, _h, body = get_h("/admin/api/users?detail=" + urllib.parse.quote(email),
                                 cookie=admin_cookie)
        try:
            detail = json.loads(body).get("user") or {}
        except ValueError:
            detail = {}
        check("profile detail: full record, id present, no secrets",
              status == 200 and detail.get("email") == email
              and detail.get("name") == "Axmed Tijaabo" and detail.get("id")
              and "password_hash" not in body and "pbkdf2" not in body,
              f"body={body[:160]}")

        # 8d) deactivate / reactivate / delete (secure + confirmed by UI)
        status, _h, _b = post_json_h("/admin/api/users", {
            "action": "deactivate", "email": email}, cookie=admin_cookie,
            extra_headers={"Origin": "null"})
        check("deactivate WITHOUT CSRF token (Origin:null) -> 403",
              status == 403, f"status={status}")

        status, _h, body = post_json_h("/admin/api/users", {
            "action": "deactivate", "email": email,
            "csrf_token": atok}, cookie=admin_cookie,
            extra_headers={"Origin": "null"})
        check("deactivate with CSRF token (panel-style) -> 200 inactive",
              status == 200 and '"ok": true' in body and '"inactive"' in body,
              f"status={status} body={body[:80]}")

        status, headers, body = post_form_h("/login", {
            "email": email, "password": password})
        check("deactivated user cannot sign in (clear message, no cookie)",
              status == 200 and "la joojiyay" in body
              and not any("user_session=" in v for v in headers.values()),
              f"status={status}")

        status, _h, body = post_json_h("/admin/api/users", {
            "action": "activate", "email": email, "csrf_token": atok},
            cookie=admin_cookie)
        check("reactivate -> 200 active again",
              status == 200 and '"active"' in body, f"body={body[:80]}")
        status, headers, _b = post_form_h("/login", {
            "email": email, "password": password})
        check("reactivated user can sign in again (303)",
              status == 303 and "user_session=" in str(headers.values()),
              f"status={status}")

        status, _h, body = post_json_h("/admin/api/users", {
            "action": "delete", "email": "ghost@example.com",
            "csrf_token": atok}, cookie=admin_cookie)
        check("delete of unknown email -> ok + found=false (no error leak)",
              status == 200 and '"found": false' in body, f"body={body[:80]}")

        delete_email = f"delete-{secrets.token_hex(3)}@example.com"
        status, _b = post_form("/register", {
            "name": "Tirtir Me", "email": delete_email,
            "password": password, "confirm": password})
        check("delete-target user registered", status == 303, f"status={status}")
        status, _h, body = post_json_h("/admin/api/users", {
            "action": "delete", "email": delete_email, "csrf_token": atok},
            cookie=admin_cookie)
        check("admin delete -> 200 found=true",
              status == 200 and '"found": true' in body, f"body={body[:80]}")
        status, _h, body = post_json_h("/admin/api/users", {
            "action": "delete", "email": delete_email, "csrf_token": atok},
            cookie=admin_cookie)
        check("second delete -> found=false (idempotent)",
              status == 200 and '"found": false' in body, f"body={body[:80]}")
        status, _h, body = post_form_h("/login", {
            "email": delete_email, "password": password})
        check("deleted user can no longer sign in",
              status == 200 and "si sax ah uma ahayn" in body,
              f"status={status}")
        status, body = get("/__dump", base=f"http://127.0.0.1:{MOCK_PORT}")
        check("deleted row is gone from the database",
              status == 200 and delete_email not in body, f"status={status}")

        status, _h, _b = post_json_h("/admin/api/users", {
            "action": "delete", "email": email}, cookie=user_cookie)
        check("normal user cannot manage accounts (401)", status == 401,
              f"status={status}")
        status, _h, _b = post_json_h("/admin/api/users", {
            "action": "delete", "email": email})
        check("anonymous cannot manage accounts (401)", status == 401,
              f"status={status}")
        status, _h, _b = post_json_h("/admin/api/users", {
            "action": "delete", "email": email, "csrf_token": atok},
            cookie=admin_cookie, extra_headers={"Origin": "https://evil.example"})
        check("foreign origin cannot manage accounts (403)", status == 403,
              f"status={status}")

        status, _h, body = get_h("/admin/api/users", cookie=admin_cookie)
        try:
            users_data = json.loads(body)
        except ValueError:
            users_data = {}
        check("admin lists users: count>=1 + our user visible",
              status == 200 and users_data.get("count", 0) >= 1
              and any(u.get("email") == email for u in users_data.get("users", [])),
              f"status={status} body={body[:120]}")
        check("users API never exposes password hashes",
              "password_hash" not in body and "pbkdf2" not in body,
              f"leak in {body[:120]}")
        check("users rows include id/name/email/joined/status keys",
              bool(users_data.get("users")) and
              all(set(u.keys()) == {"id", "name", "email", "joined", "status"}
                  for u in users_data.get("users", [])),
              f"keys={ [list(u.keys()) for u in users_data.get('users', [])[:2]] }")

        status, _h, body = get_h("/admin/api/messages", cookie=admin_cookie)
        check("admin sees stored contact message",
              status == 200 and "Su'aal kooban" in body
              and "xiriir@example.com" in body, f"status={status}")
        check("messages API never exposes password material",
              "password" not in body.lower().replace("password_hash", ""),
              f"body={body[:120]}")

        # 9) admin can delete one message, then clear all
        try:
            msg_id = json.loads(body)["messages"][0]["id"]
        except (ValueError, KeyError, IndexError):
            msg_id = ""
        status, _h, _b = post_json_h("/admin/api/messages",
                                     {"action": f"delete:{msg_id}"},
                                     cookie=admin_cookie)
        check("admin delete request accepted", status == 200, f"status={status}")
        status, _h, body = get_h("/admin/api/messages", cookie=admin_cookie)
        check("admin delete message works",
              status == 200 and msg_id not in body and msg_id != "",
              f"status={status}")

        # 10) logout kills the user session server-side
        status, headers, _b = post_form_h("/logout", {}, cookie=user_cookie)
        check("user logout -> 303 to /login",
              status == 303 and "/login" in headers.get("Location", ""),
              f"status={status} loc={headers.get('Location')}")
        status, _h, _b = get_h("/account", cookie=user_cookie)
        check("account dead after logout (redirect)",
              status in (301, 302, 303), f"status={status}")
        status, _h, _b = get_h("/index.html", cookie=user_cookie)
        check("site locked again after logout (redirect to /login)",
              status in (301, 302, 303) and "/login" in _h.get("Location", ""),
              f"status={status} loc={_h.get('Location')}")

        # 11) duplicate email, case-insensitive, rejected at registration
        status, _h, body = post_form_h("/register", {
            "name": "Isku Mid", "email": email.upper(),
            "password": password, "confirm": password})
        check("duplicate email (different case) rejected",
              "horey ayuu akoon" in body.lower(), f"status={status}")

        # 12) persistence across server restart (DB holds the rows, not RAM)
        stop(app)
        app = start({**mock_env,
                     "ADMIN_EMAIL": "admin@mock.test",
                     "ADMIN_PASSWORD_HASH": _mock_admin_hash(admin_pw)}, APP_PORT)
        if not wait_up(APP_PORT, app):
            print("app failed to restart (persistence check)")
            return 1
        status, headers, _b = post_form_h("/login", {
            "email": email, "password": password})
        check("login still works after server restart (data persisted in DB)",
              status == 303 and "user_session=" in str(headers.values()),
              f"status={status}")
    finally:
        stop(app)
        stop(mock)

    print(f"\n{passes} passed, {len(failures)} failed")
    if failures:
        for f in failures:
            print(f"  FAILED: {f}")
        return 1
    print("LOCAL INTEGRATION: registration wiring WORKS (mock database) ✅")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
