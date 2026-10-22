#!/usr/bin/env python3
"""MR.ducaysane — website server + secure admin (maamule) login.

- SITE GATE: every public page requires a sign-in — anonymous visitors are
  redirected to /login (email + password) before seeing any content.
  Only /login, /register, /logout and /assets/ (page styling) stay public;
  /admin* keeps its own separate admin login.
- /login      : user sign-in page (local SQLite or Supabase-backed accounts).
- /register   : account creation page.
- /admin/login : public admin login page.
- /admin       : protected admin dashboard (server-side session required).
- Passwords verified with PBKDF2-HMAC-SHA256 (600k iterations, 16-byte salt).
- Sessions live server-side; cookie is HttpOnly + SameSite=Lax and expires.

Configuration comes ONLY from server-side environment variables or the
untracked `.env` file (never from HTML/CSS/frontend JS/public source files):

    ADMIN_EMAIL               admin email address (required)
    ADMIN_PASSWORD_HASH       preferred: pbkdf2 hash from tools/set_admin_password.py
    ADMIN_PASSWORD            optional fallback: plaintext, hashed in memory at startup
    ADMIN_SESSION_TTL_MINUTES session lifetime, default 240 (fractional allowed for tests)

User accounts work out of the box via a local SQLite database
(data/users.db — never served statically). Optional cloud upgrade:

    SUPABASE_URL               Supabase project URL (tools/set_supabase.py)
    SUPABASE_SERVICE_ROLE_KEY  service-role key — when both are set,
                               Supabase takes precedence over the local DB

Run:  python3 server.py     (default port 3000, override with PORT env var)
"""
from __future__ import annotations

import hashlib
import hmac
import html
import http.cookies
import json
import mimetypes
import os
import posixpath
import re
import secrets
import sqlite3
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LOCK_FILE = ROOT / "data" / "announcement.json"

PBKDF2_ITERATIONS = 600_000
DENY_DIRS = {"tools"}
DENY_FILES = {"server.py", "server.log"}
SESSION_COOKIE = "admin_session"
USER_SESSION_COOKIE = "user_session"
MAX_POST_BYTES = 64 * 1024
MAX_LOGIN_FAILURES = 5
LOCK_SECONDS = 300
FAIL_DELAY = 0.3

# Content-Security-Policy for every HTML page. script-src is strict
# ('self' only — all page logic lives in /assets/js/*.js). The stylesheet
# allowance includes 'unsafe-inline' because the existing design uses
# inline style= attributes; scripts stay fully blocked inline.
CSP_POLICY = ("default-src 'self'; script-src 'self'; "
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
              "font-src https://fonts.gstatic.com; img-src 'self' data:; "
              "connect-src 'self'; object-src 'none'; base-uri 'none'; "
              "form-action 'self'; frame-ancestors 'none'")

# Loopback spellings of THIS machine — treated as one site (same port still
# required) so 'localhost' vs '127.0.0.1' never produces a bogus origin 403.
LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1", "[::1]"}


# --------------------------------------------------------------------------
# Configuration (env vars first, then untracked .env file)
# --------------------------------------------------------------------------
def load_dotenv() -> None:
    path = ROOT / ".env"
    if not path.is_file():
        return
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
    except OSError:
        pass


load_dotenv()

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").strip()
ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", "").strip()
SESSION_TTL_SECONDS = float(os.environ.get("ADMIN_SESSION_TTL_MINUTES", "240")) * 60

# Supabase (user-registration database) — server-side ONLY, never sent to browsers.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

# Local users database (SQLite, stdlib) — the DEFAULT backend, so
# registration and sign-in work out of the box with no external service.
# Supabase (when configured) always takes precedence. The file lives in
# data/ next to the public site files (content.js, announcement.json);
# the static handler below DENIES serving users.db and any *.db / *.tmp
# (password hashes must never reach a browser).
# LOCAL_USERS_DB overrides the path (tests use it for isolation).
LOCAL_DB_FILE = Path(os.environ.get("LOCAL_USERS_DB", "").strip()
                     or (ROOT / "data" / "users.db"))


def hash_password(password: str, iterations: int = PBKDF2_ITERATIONS) -> str:
    """PBKDF2-HMAC-SHA256 hash, encoded as pbkdf2_sha256$iters$salt$hash."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_hex, digest_hex = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iters)
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def credentials_configured() -> bool:
    return bool(ADMIN_EMAIL and ADMIN_PASSWORD_HASH)


# Fix: recompute plain-password fallback now that helpers exist.
if not ADMIN_PASSWORD_HASH and os.environ.get("ADMIN_PASSWORD"):
    ADMIN_PASSWORD_HASH = hash_password(os.environ["ADMIN_PASSWORD"])


# --------------------------------------------------------------------------
# Sessions (server-side; cookie only stores a random token)
# --------------------------------------------------------------------------
SESSIONS: dict[str, dict] = {}
SESSIONS_LOCK = threading.Lock()


def _purge_expired() -> None:
    now = time.time()
    for token in [t for t, s in SESSIONS.items() if s["expires"] < now]:
        SESSIONS.pop(token, None)


def create_session(email: str, kind: str = "admin", **extra) -> str:
    """kind: 'admin' sessions unlock /admin; 'user' sessions unlock /account only."""
    token = secrets.token_urlsafe(32)
    with SESSIONS_LOCK:
        _purge_expired()
        SESSIONS[token] = {"kind": kind, "email": email,
                           "expires": time.time() + SESSION_TTL_SECONDS, **extra}
    return token


def get_session(token: str | None, kind: str | None = None) -> dict | None:
    if not token:
        return None
    with SESSIONS_LOCK:
        _purge_expired()
        session = SESSIONS.get(token)
        if session is None or session["expires"] < time.time():
            SESSIONS.pop(token, None)
            return None
        if kind and session.get("kind", "admin") != kind:
            return None
        return session


def destroy_session(token: str | None) -> None:
    if token:
        with SESSIONS_LOCK:
            SESSIONS.pop(token, None)


def session_token_from_headers(headers, cookie_name: str = SESSION_COOKIE) -> str | None:
    raw = headers.get("Cookie")
    if not raw:
        return None
    try:
        jar = http.cookies.SimpleCookie()
        jar.load(raw)
        morsel = jar.get(cookie_name)
        return morsel.value if morsel else None
    except http.cookies.CookieError:
        return None


# --------------------------------------------------------------------------
# CSRF synchronizer tokens (register/login forms)
# The preview panel renders pages with an OPAQUE origin (the browser sends
# `Origin: null`), so the Origin header alone cannot tell our own form from
# a foreign page. A token minted by this server and embedded in the rendered
# form can: a foreign page can neither read our HTML nor guess the token.
# The Origin check and SameSite=Lax cookies stay in force for every other
# request — this strengthens, never removes, the CSRF guard.
# --------------------------------------------------------------------------
CSRF_TOKENS: dict[str, float] = {}
CSRF_LOCK = threading.Lock()
CSRF_TTL_SECONDS = 1800
CSRF_MAX = 5000


def new_csrf_token() -> str:
    token = secrets.token_urlsafe(32)
    with CSRF_LOCK:
        now = time.time()
        for stale in [t for t, exp in CSRF_TOKENS.items() if exp < now]:
            CSRF_TOKENS.pop(stale, None)
        while len(CSRF_TOKENS) >= CSRF_MAX:
            CSRF_TOKENS.pop(next(iter(CSRF_TOKENS)), None)
        CSRF_TOKENS[token] = now + CSRF_TTL_SECONDS
    return token


def csrf_token_valid(token: str | None) -> bool:
    """True while the token was issued by this server and has not expired."""
    if not token:
        return False
    with CSRF_LOCK:
        exp = CSRF_TOKENS.get(token)
        if exp is None or exp < time.time():
            CSRF_TOKENS.pop(token, None)
            return False
        return True


def csrf_token_from_body(raw: bytes, ctype_header: str | None) -> str | None:
    """Pull `csrf_token` out of an urlencoded form or JSON body.
    Tolerates a JSON body sent with a wrong/missing Content-Type (some
    clients): if urlencoded parsing finds nothing and the body looks like
    JSON, parse it as JSON too — the token still has to be VALID, so this
    only widens recovery, never trust."""
    if not raw:
        return None
    text = raw.decode("utf-8", "replace")
    is_json = (ctype_header or "").split(";")[0].strip() == "application/json"
    if is_json or text.lstrip().startswith("{"):
        try:
            value = json.loads(text).get("csrf_token")
            if value:
                return str(value)
        except (ValueError, AttributeError):
            if is_json:
                return None
    form = urllib.parse.parse_qs(text, keep_blank_values=True)
    value = form.get("csrf_token", [""])[0]
    return value or None


# --------------------------------------------------------------------------
# Login attempt rate limiting (per client IP)
# --------------------------------------------------------------------------
ATTEMPTS: dict[str, dict] = {}
ATTEMPTS_LOCK = threading.Lock()


def attempt_state(ip: str) -> dict:
    with ATTEMPTS_LOCK:
        state = ATTEMPTS.setdefault(ip, {"fails": 0, "lock_until": 0.0})
        if state["lock_until"] and state["lock_until"] < time.time():
            state.update(fails=0, lock_until=0.0)
        return state


def record_failure(ip: str) -> bool:
    """Returns True when the client is now locked out."""
    state = attempt_state(ip)
    state["fails"] += 1
    if state["fails"] >= MAX_LOGIN_FAILURES:
        state["lock_until"] = time.time() + LOCK_SECONDS
        return True
    return False


def clear_failures(ip: str) -> None:
    with ATTEMPTS_LOCK:
        ATTEMPTS.pop(ip, None)


# --------------------------------------------------------------------------
# Registration rate limiting (per client IP, separate from login lockout)
# --------------------------------------------------------------------------
REG_ATTEMPTS: dict[str, dict] = {}
REG_WINDOW_SECONDS = 600
REG_MAX = 15


def registration_limited(ip: str) -> int:
    """Counts this attempt; returns remaining lock seconds (0 = allowed)."""
    now = time.time()
    with ATTEMPTS_LOCK:
        state = REG_ATTEMPTS.setdefault(
            ip, {"count": 0, "reset": now + REG_WINDOW_SECONDS})
        if now > state["reset"]:
            state.update(count=0, reset=now + REG_WINDOW_SECONDS)
        if state["count"] >= REG_MAX:
            return max(1, int(state["reset"] - now))
        state["count"] += 1
        return 0


# --------------------------------------------------------------------------
# Login messages (Somali first, English second — clear and non-revealing)
# --------------------------------------------------------------------------
CSRF_STALE_MSG = (
    "Koodhka amniga (CSRF) wuu dhacay — server-ku wuu dib u bilaabay ama 30 daqiiqo ayaa dhaafay. "
    "Fadlan ku soo dir mar kale (foomka hoose ayaa koodh cusub leh).",
    "The security token expired (server restart or 30-minute timeout) — "
    "please submit the form again; the new one already carries a fresh token.")

ERRORS = {
    "bad": ("Email-ka ama furaha sirta ah si sax ah uma ahayn. Isku day mar kale.",
            "Email or password is incorrect. Please try again."),
    "cfg": ("Furaha sirta ah ee maamulaha weli ma la cayimin. Ku qor terminal-ka: python3 tools/set_admin_password.py",
            "The admin password is not set yet. Run: python3 tools/set_admin_password.py"),
    "limit": ("Isku gaar ah! Isku dayada badan bay dhaceen. Sug 5 daqiiqo oo isku day mar kale.",
              "Too many failed attempts. Wait 5 minutes and try again."),
    "csrf": CSRF_STALE_MSG,
}
INFOS = {
    "out": ("Waad ka baxday si guul leh.", "You have been signed out successfully."),
    "expired": ("Wakhtigaaga soo-galida (session) wuu dhacay. Fadlan soo gal mar Kale.",
                "Your session has expired. Please sign in again."),
}

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")

REG_ERRORS = {
    "bad": ("Codsiga ma sax ahaa — fadlan form-ka dib u buuxi.",
            "The request was invalid - please refill the form."),
    "csrf": CSRF_STALE_MSG,
    "cfg": ("Database-ka isdiiwaangelinta weli loo soo xirin — waqtigaan ka soo dhaqaaq.",
            "The registration database is not connected yet - please try again later."),
    "name": ("Magaca waa inuu ahaadaa 2 ilaa 100 xaraf.",
             "Name must be 2-100 characters long."),
    "email": ("Email-ka sax maaha.", "The email address is invalid."),
    "password": ("Furaha sirta ah waa inuu ugu yaraan ahaadaa 8 xaraf.",
                 "Password must be at least 8 characters long."),
    "confirm": ("Furayaashu isku mid maaha.", "Passwords do not match."),
    "email_exists": ("Email-kan horey ayuu akoon u leeyahay — mid kale isticmaal.",
                     "This email is already registered - use another one."),
    "table": ("Jadwalka 'users' lama helin — SQL-ka ku fidi Supabase SQL Editor-ka.",
              "Could not find the 'users' table - run the SQL script in the Supabase SQL Editor."),
    "authkey": ("Furaha API-ga Supabase waa la diiday — .env dib u eeg: tools/set_supabase.py",
                "Supabase rejected the API key - review .env via tools/set_supabase.py"),
    "unavailable": ("Database-ku ma jawaabo hadda — fadlan isku day daqiiqad danbe.",
                    "The database is not responding right now - please try again in a moment."),
    "limit": ("Isku-day badan — 10 daqiiqo sug oo isku day mar kale.",
              "Too many attempts - wait 10 minutes and try again."),
}
REG_INFOS = {
    "created": ("Akoonka waa la sameeyay — soo dhawoow!",
                "Your account has been created - welcome!"),
}

USER_ERRORS = {
    "bad": ("Email-ka ama furaha sirta ah si sax ah uma ahayn. Isku day mar kale.",
            "Email or password is incorrect. Please try again."),
    "csrf": CSRF_STALE_MSG,
    "disabled": ("Akoonka waa la joojiyay (deactivated) — fadlan la xiriir maamulaha.",
                 "This account has been deactivated - please contact the administrator."),
    "cfg": ("Database-ka isticmaalayaasha weli loo soo xirin — waqtigaan ka soo dhaqaaq.",
            "The users database is not connected yet - please try again later."),
    "limit": ("Isku-day badan! Sug 5 daqiiqo oo isku day mar kale.",
              "Too many failed attempts. Wait 5 minutes and try again."),
    "unavailable": ("Database-ku ma jawaabo hadda — fadlan isku day daqiiqad danbe.",
                    "The database is not responding right now - please try again shortly."),
}
USER_INFOS = {
    "created": ("Akoonka waa la sameeyay — hadda soo gal!",
                "Your account has been created - sign in now!"),
    "out": ("Waad ka baxday akoonkaaga si guul leh.",
            "You have been signed out successfully."),
    "expired": ("Wakhtigaaga soo-galida (session) wuu dhacay. Fadlan soo gal mar kale.",
                "Your session has expired. Please sign in again."),
    "gate": ("Website-ka galihiisa waa inaad soo gashaa — email-ka iyo password-ka fudud ku buuxi.",
             "This website requires sign in — enter your email and password to continue."),
    "cfg": ("Database-ka isticmaalayaasha weli loo soo xirin — waqtigaan website-ka gali ma karto. Fadlan la xiriir maamulaha.",
            "The users database is not connected yet - you cannot sign in right now. Please contact the site owner."),
}


def render_snippet(store: dict, code: str | None, kind: str) -> str:
    if not code or code not in store:
        return ""
    so, en = store[code]
    cls = "form-alert error" if kind == "error" else "form-alert info"
    return (f'<div class="{cls}" role="{"alert" if kind == "error" else "status"}">'
            f"<p>{html.escape(so)}</p><p class=\"en\">{html.escape(en)}</p></div>")


# --------------------------------------------------------------------------
# Admin templates
# --------------------------------------------------------------------------
def read_text(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def login_page(err: str | None = None, info: str | None = None, status: int = 200):
    page = read_text("admin/login.html")
    block = render_snippet(ERRORS, err, "error") + render_snippet(INFOS, info, "info")
    page = page.replace("{{LOGIN_MESSAGE}}", block)
    page = page.replace("{{CSRF_TOKEN}}", new_csrf_token())
    return status, "text/html", page.encode("utf-8")


def dashboard_page(session: dict) -> bytes:
    page = read_text("admin/dashboard.html")
    ttl_min = int(SESSION_TTL_SECONDS // 60)
    page = page.replace("{{ADMIN_EMAIL}}", html.escape(session["email"] or ADMIN_EMAIL))
    page = page.replace("{{SESSION_TTL}}", str(ttl_min))
    page = page.replace("{{ANNOUNCEMENT_TEXT}}", html.escape(read_announcement()))
    page = page.replace("{{CSRF_TOKEN}}", new_csrf_token())
    return page.encode("utf-8")


def read_announcement() -> str:
    try:
        data = json.loads(LOCK_FILE.read_text(encoding="utf-8"))
        return str(data.get("text", ""))[:500]
    except (OSError, ValueError):
        return ""


def write_announcement(text: str) -> None:
    payload = {"text": text, "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    tmp = LOCK_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, LOCK_FILE)


# Contact messages from the public contact form — server-side only.
# Dotfile name => the static handler refuses to serve it (path starts with '.').
CONTACT_FILE = ROOT / "data" / ".contact_messages.json"
CONTACT_WINDOW_SECONDS = 600
CONTACT_MAX_PER_WINDOW = 10
CONTACT_STORE_MAX = 200
CONTACT_ATTEMPTS: dict[str, dict] = {}


def contact_limited(ip: str) -> bool:
    now = time.time()
    with ATTEMPTS_LOCK:
        state = CONTACT_ATTEMPTS.setdefault(
            ip, {"count": 0, "reset": now + CONTACT_WINDOW_SECONDS})
        if now > state["reset"]:
            state.update(count=0, reset=now + CONTACT_WINDOW_SECONDS)
        if state["count"] >= CONTACT_MAX_PER_WINDOW:
            return True
        state["count"] += 1
        return False


def read_messages() -> list[dict]:
    try:
        data = json.loads(CONTACT_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, ValueError):
        return []


def append_message(msg: dict) -> None:
    msgs = (read_messages() + [msg])[-CONTACT_STORE_MAX:]
    tmp = CONTACT_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(msgs, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    os.replace(tmp, CONTACT_FILE)


def format_date(value) -> str:
    """ISO timestamp -> 'YYYY-MM-DD HH:MM' (UTC), safe for any input."""
    text = str(value or "")
    return text[:10] + " " + text[11:16] if len(text) >= 16 else text[:16]


# The users table gained an `is_active` column (tools/supabase_users.sql).
# None = not probed yet; False = the deployed table predates the migration.
IS_ACTIVE_COLUMN: bool | None = None


def _supabase_users_get(select: str, extra: str = ""):
    req = urllib.request.Request(
        SUPABASE_URL.rstrip("/") + "/rest/v1/users?select=" + select + extra,
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
        })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return "ok", json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        sys.stderr.write(f"supabase select -> HTTP {err.code}\n")
        if err.code in (401, 403):
            return "auth", None
        if err.code == 404:
            return "table", None
        if err.code == 400:
            return "columns", None
        return "unavailable", None
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as err:
        sys.stderr.write(f"supabase select -> {type(err).__name__}\n")
        return "unavailable", None


def supabase_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


def validate_registration(name: str, email: str, password: str,
                          confirm: str) -> str | None:
    if not 2 <= len(name) <= 100:
        return "name"
    if not EMAIL_RE.fullmatch(email):
        return "email"
    if not 8 <= len(password) <= 200:
        return "password"
    if password != confirm:
        return "confirm"
    return None


def supabase_get_user(email: str):
    """Look up one user by (lowercased) email. Returns (status, row|None).
    status: 'ok' | 'auth' | 'table' | 'columns' | 'unavailable'."""
    global IS_ACTIVE_COLUMN
    quoted = urllib.parse.quote(email)
    with_active = "" if IS_ACTIVE_COLUMN is False else ",is_active"
    status, rows = _supabase_users_get(
        "name,email,password_hash,created_at" + with_active,
        f"&email=eq.{quoted}&limit=1")
    if status == "columns" and IS_ACTIVE_COLUMN is not False:
        # Older `users` table without the is_active column — retry once.
        IS_ACTIVE_COLUMN = False
        status, rows = _supabase_users_get(
            "name,email,password_hash,created_at", f"&email=eq.{quoted}&limit=1")
    if status != "ok":
        return status, None
    if with_active:
        IS_ACTIVE_COLUMN = True
    return "ok", (rows[0] if rows else None)


def supabase_list_users():
    """All users, newest first, with id + account status. Returns
    (status, rows|None). Password material never leaves this function."""
    global IS_ACTIVE_COLUMN
    with_active = "" if IS_ACTIVE_COLUMN is False else ",is_active"
    status, rows = _supabase_users_get(
        "id,name,email,created_at" + with_active,
        "&order=created_at.desc&limit=1000")
    if status == "columns" and IS_ACTIVE_COLUMN is not False:
        IS_ACTIVE_COLUMN = False
        status, rows = _supabase_users_get(
            "id,name,email,created_at", "&order=created_at.desc&limit=1000")
    if status != "ok":
        return status, None
    if with_active:
        IS_ACTIVE_COLUMN = True
    clean = [{"id": str(r.get("id", ""))[:64],
              "name": str(r.get("name", ""))[:100],
              "email": str(r.get("email", ""))[:254],
              "joined": format_date(r.get("created_at")),
              "status": "inactive" if r.get("is_active") is False else "active"}
             for r in rows]
    return "ok", clean


def supabase_update_user_active(email: str, active: bool) -> tuple[str, bool]:
    """Set a user's is_active flag. Returns (status, found_any_row)."""
    global IS_ACTIVE_COLUMN
    if IS_ACTIVE_COLUMN is False:
        return "columns", False
    req = urllib.request.Request(
        SUPABASE_URL.rstrip("/") + "/rest/v1/users?email=eq."
        + urllib.parse.quote(email),
        data=json.dumps({"is_active": active}).encode("utf-8"),
        method="PATCH",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            rows = json.loads(resp.read().decode("utf-8") or "[]")
        IS_ACTIVE_COLUMN = True
        return "ok", bool(rows)
    except urllib.error.HTTPError as err:
        # Log status only — never the response body or credentials.
        sys.stderr.write(f"supabase patch -> HTTP {err.code}\n")
        if err.code == 400:
            IS_ACTIVE_COLUMN = False
            return "columns", False
        if err.code in (401, 403):
            return "auth", False
        if err.code == 404:
            return "table", False
        return "unavailable", False
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as err:
        sys.stderr.write(f"supabase patch -> {type(err).__name__}\n")
        return "unavailable", False


def supabase_delete_user(email: str) -> tuple[str, bool]:
    """Delete one user row by email. Returns (status, found_any_row)."""
    req = urllib.request.Request(
        SUPABASE_URL.rstrip("/") + "/rest/v1/users?email=eq."
        + urllib.parse.quote(email),
        method="DELETE",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
            "Prefer": "return=representation",
        })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            rows = json.loads(resp.read().decode("utf-8") or "[]")
        return "ok", bool(rows)
    except urllib.error.HTTPError as err:
        sys.stderr.write(f"supabase delete -> HTTP {err.code}\n")
        if err.code in (401, 403):
            return "auth", False
        if err.code == 404:
            return "table", False
        return "unavailable", False
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as err:
        sys.stderr.write(f"supabase delete -> {type(err).__name__}\n")
        return "unavailable", False


def supabase_create_user(name: str, email: str, password: str):
    """Insert one registered user. Plain password never leaves this function —
    only its PBKDF2 hash goes to the database."""
    payload = {"name": name, "email": email, "password_hash": hash_password(password)}
    req = urllib.request.Request(
        SUPABASE_URL.rstrip("/") + "/rest/v1/users",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        })
    try:
        with urllib.request.urlopen(req, timeout=15):
            return "ok", 201
    except urllib.error.HTTPError as err:
        # Log status only — never the response body or credentials.
        sys.stderr.write(f"supabase insert -> HTTP {err.code}\n")
        if err.code == 409:
            return "exists", err.code
        if err.code in (401, 403):
            return "auth", err.code
        if err.code == 404:
            return "table", err.code
        return "unavailable", err.code
    except (urllib.error.URLError, TimeoutError, OSError) as err:
        sys.stderr.write(f"supabase insert -> {type(err).__name__}\n")
        return "unavailable", type(err).__name__


# --------------------------------------------------------------------------
# Local users database (SQLite) — default backend when Supabase is not
# configured, so the site works out of the box. Same statuses and row
# shapes as the supabase_* functions above; same PBKDF2 password hashes;
# same schema as tools/supabase_users.sql (minus the UUID id).
# --------------------------------------------------------------------------
_LOCAL_DB_LOCK = threading.Lock()


def _local_db():
    """Open the SQLite users DB (one connection per call), creating the
    table on first use. Serialised by a lock so concurrent requests never
    race the CREATE TABLE."""
    LOCAL_DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    with _LOCAL_DB_LOCK:
        conn = sqlite3.connect(LOCAL_DB_FILE, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users ("
            " id            INTEGER PRIMARY KEY AUTOINCREMENT,"
            " name          TEXT    NOT NULL,"
            " email         TEXT    NOT NULL UNIQUE,"
            " password_hash TEXT    NOT NULL,"
            " created_at    TEXT    NOT NULL,"
            " is_active     INTEGER NOT NULL DEFAULT 1)")
        conn.commit()
    return conn


def local_get_user(email: str):
    """Look up one user by (lowercased) email. Returns (status, row|None).
    status: 'ok' | 'unavailable'."""
    try:
        conn = _local_db()
        try:
            row = conn.execute(
                "SELECT name, email, password_hash, created_at, is_active"
                " FROM users WHERE email = ? LIMIT 1", (email,)).fetchone()
        finally:
            conn.close()
        if row is None:
            return "ok", None
        return "ok", {"name": row["name"], "email": row["email"],
                      "password_hash": row["password_hash"],
                      "created_at": row["created_at"],
                      "is_active": bool(row["is_active"])}
    except (sqlite3.Error, OSError) as err:
        sys.stderr.write(f"local users db select -> {type(err).__name__}\n")
        return "unavailable", None


def local_list_users():
    """All users, newest first, with id + account status. Returns
    (status, rows|None). Password material never leaves this function."""
    try:
        conn = _local_db()
        try:
            rows = conn.execute(
                "SELECT id, name, email, created_at, is_active FROM users"
                " ORDER BY created_at DESC, id DESC LIMIT 1000").fetchall()
        finally:
            conn.close()
    except (sqlite3.Error, OSError) as err:
        sys.stderr.write(f"local users db list -> {type(err).__name__}\n")
        return "unavailable", None
    clean = [{"id": str(r["id"]),
              "name": str(r["name"] or "")[:100],
              "email": str(r["email"] or "")[:254],
              "joined": format_date(r["created_at"]),
              "status": "inactive" if r["is_active"] == 0 else "active"}
             for r in rows]
    return "ok", clean


def local_create_user(name: str, email: str, password: str):
    """Insert one registered user. Plain password never leaves this
    function — only its PBKDF2 hash is stored."""
    stored_hash = hash_password(password)
    created = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    try:
        conn = _local_db()
        try:
            conn.execute(
                "INSERT INTO users (name, email, password_hash,"
                " created_at, is_active) VALUES (?, ?, ?, ?, 1)",
                (name, email, stored_hash, created))
            conn.commit()
        finally:
            conn.close()
        return "ok", 201
    except sqlite3.IntegrityError:
        return "exists", 409  # UNIQUE(email) — duplicate registration
    except (sqlite3.Error, OSError) as err:
        sys.stderr.write(f"local users db insert -> {type(err).__name__}\n")
        return "unavailable", type(err).__name__


def local_update_user_active(email: str, active: bool) -> tuple[str, bool]:
    """Set a user's is_active flag. Returns (status, found_any_row)."""
    try:
        conn = _local_db()
        try:
            cur = conn.execute("UPDATE users SET is_active = ? WHERE email = ?",
                               (1 if active else 0, email))
            conn.commit()
            found = cur.rowcount > 0
        finally:
            conn.close()
        return "ok", found
    except (sqlite3.Error, OSError) as err:
        sys.stderr.write(f"local users db update -> {type(err).__name__}\n")
        return "unavailable", False


def local_delete_user(email: str) -> tuple[str, bool]:
    """Delete one user row by email. Returns (status, found_any_row)."""
    try:
        conn = _local_db()
        try:
            cur = conn.execute("DELETE FROM users WHERE email = ?", (email,))
            conn.commit()
            found = cur.rowcount > 0
        finally:
            conn.close()
        return "ok", found
    except (sqlite3.Error, OSError) as err:
        sys.stderr.write(f"local users db delete -> {type(err).__name__}\n")
        return "unavailable", False


# --------------------------------------------------------------------------
# Backend dispatch — Supabase when configured, otherwise local SQLite.
# HTTP handlers call only these db_* entry points.
# --------------------------------------------------------------------------
def db_get_user(email: str):
    return supabase_get_user(email) if supabase_configured() else local_get_user(email)


def db_list_users():
    return supabase_list_users() if supabase_configured() else local_list_users()


def db_create_user(name: str, email: str, password: str):
    return (supabase_create_user(name, email, password)
            if supabase_configured() else local_create_user(name, email, password))


def db_update_user_active(email: str, active: bool) -> tuple[str, bool]:
    return (supabase_update_user_active(email, active)
            if supabase_configured() else local_update_user_active(email, active))


def db_delete_user(email: str) -> tuple[str, bool]:
    return supabase_delete_user(email) if supabase_configured() else local_delete_user(email)


def register_page(err: str | None = None, info: str | None = None,
                  name: str = "", email: str = "", status: int = 200):
    page = read_text("register.html")
    block = (render_snippet(REG_ERRORS, err, "error")
             + render_snippet(REG_INFOS, info, "info"))
    page = page.replace("{{REGISTER_MESSAGE}}", block)
    if info == "created":
        # After a successful signup the visitor is sent to the login page.
        page = page.replace("</title>",
                            '</title><meta http-equiv="refresh" '
                            'content="4;url=/login?i=created">', 1)
    page = page.replace("{{FILL_NAME}}", html.escape(name))
    page = page.replace("{{FILL_EMAIL}}", html.escape(email))
    page = page.replace("{{CSRF_TOKEN}}", new_csrf_token())
    return status, "text/html; charset=utf-8", page.encode("utf-8")


def user_login_page(err: str | None = None, info: str | None = None,
                    email: str = "", status: int = 200):
    page = read_text("login.html")
    block = render_snippet(USER_ERRORS, err, "error") + render_snippet(USER_INFOS, info, "info")
    page = page.replace("{{USER_MESSAGE}}", block)
    page = page.replace("{{FILL_EMAIL}}", html.escape(email))
    page = page.replace("{{CSRF_TOKEN}}", new_csrf_token())
    return status, "text/html; charset=utf-8", page.encode("utf-8")


def account_page(session: dict) -> bytes:
    page = read_text("account.html")
    ttl_min = int(SESSION_TTL_SECONDS // 60)
    page = page.replace("{{USER_NAME}}", html.escape(session.get("name") or ""))
    page = page.replace("{{USER_EMAIL}}", html.escape(session.get("email") or ""))
    page = page.replace("{{USER_JOINED}}", html.escape(session.get("joined") or "—"))
    page = page.replace("{{SESSION_TTL}}", str(ttl_min))
    return page.encode("utf-8")


# --------------------------------------------------------------------------
# Request handler
# --------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "MR.ducaysane/1.0"

    # -- response helpers ---------------------------------------------------
    def _send(self, status: int, ctype: str, body: bytes, extra: dict | None = None,
              cache: bool = True) -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Permissions-Policy",
                         "camera=(), microphone=(), geolocation=(), payment=()")
        if ctype.startswith("text/html"):
            self.send_header("Content-Security-Policy", CSP_POLICY)
        if (self.headers.get("X-Forwarded-Proto") or "").lower() == "https":
            self.send_header("Strict-Transport-Security", "max-age=31536000")
        if not cache:
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("Referrer-Policy", "no-referrer")
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _redirect(self, location: str, extra: dict | None = None) -> None:
        headers = {"Location": location, "Cache-Control": "no-store"}
        headers.update(extra or {})
        self._send(303 if self.command == "POST" else 302, "text/html",
                   f'<a href="{html.escape(location)}">{html.escape(location)}</a>'.encode(),
                   headers)

    def _json(self, status: int, payload: dict) -> None:
        self._send(status, "application/json; charset=utf-8",
                   json.dumps(payload, ensure_ascii=False).encode("utf-8"), cache=False)

    def _plain(self, status: int, text: str) -> None:
        self._send(status, "text/plain; charset=utf-8", text.encode("utf-8"), cache=False)

    def _cookie(self, name: str, value: str, max_age: int) -> str:
        """Session cookie: HttpOnly + SameSite=Lax always; Secure whenever the
        request arrived over HTTPS (directly or via X-Forwarded-Proto)."""
        secure = ("; Secure"
                  if (self.headers.get("X-Forwarded-Proto") or "").lower() == "https"
                  else "")
        return (f"{name}={value}; Path=/; Max-Age={max_age}; "
                f"HttpOnly; SameSite=Lax{secure}")

    # -- request guards -----------------------------------------------------
    @staticmethod
    def _normalize_host(value: str) -> str:
        """Canonical host[:port] for comparison: lowercase, no scheme/path,
        default ports (:80/:443) stripped — reverse proxies often append them,
        which must not make a legitimate same-site Origin look foreign."""
        value = (value or "").strip().lower()
        if "://" in value:
            value = urllib.parse.urlsplit(value).netloc
        value = value.split("/", 1)[0].strip().rstrip(".")
        if value.endswith(":80") or value.endswith(":443"):
            value = value.rsplit(":", 1)[0]
        return value

    @staticmethod
    def _split_host(value: str) -> tuple[str, str]:
        """(host, port) from a normalized host[:port] — port '' when absent.
        Handles the IPv6 literal form '[::1]:3000'."""
        if value.startswith("["):
            host, sep, port = value.partition("]:")
            return (host + "]", port if sep else "")
        host, sep, port = value.rpartition(":")
        if sep and port.isdigit():
            return host, port
        return value, ""

    def _same_origin(self) -> tuple[bool, str]:
        """CSRF guard: a browser POST must come from this site (not a foreign
        page). Trusted targets = the Host the request arrived under + names a
        reverse proxy forwards (X-Forwarded-Host) + operator-declared origins
        (TRUSTED_ORIGINS env, comma-separated) + the SAME loopback machine
        spelled differently (localhost ≡ 127.0.0.1 ≡ [::1], same port — the
        classic local-dev pitfall; still same-machine, never remote).
        Foreign Origins are still rejected with 403 — this only fixes WHAT
        counts as 'same site'.

        Returns (ok, reason):
          'ok' | 'no-origin' | 'logout' | 'csrf' | 'host' | 'loopback' — accepted
          'stale_csrf' — opaque origin, OUR form, but the token expired/was
                         replaced (server restart): rejected, yet recoverable
                         with a friendly re-render instead of a dead-end 403
          'opaque' | 'foreign' — rejected with the origin-mismatch 403"""
        origin = (self.headers.get("Origin") or self.headers.get("Referer") or "").strip()
        if not origin:
            return True, "no-origin"  # non-browser clients (curl) send neither
        target = origin if "://" in origin else "http://" + origin
        origin_host = self._normalize_host(urllib.parse.urlsplit(target).netloc)
        if not origin_host:
            sys.stderr.write(f"origin rejected: unparsable {origin!r}\n")
            return False, "foreign"
        if origin.lower() == "null":
            # Opaque origin (sandboxed preview embed): the header proves
            # nothing by itself. Accept ONLY with a synchronizer token that
            # was rendered by our own login/register form — a foreign page
            # can neither read our HTML nor forge the token. Logout stays
            # exempt (logging someone out is a nuisance, not a data risk,
            # and the nav "Ka Bax" button has no token slot).
            path = posixpath.normpath(urllib.parse.urlsplit(self.path).path)
            if path in ("/logout", "/admin/logout"):
                return True, "logout"
            token = csrf_token_from_body(
                getattr(self, "_body", b""), self.headers.get("Content-Type"))
            if csrf_token_valid(token):
                return True, "csrf"
            if token:
                # A token was submitted but is unknown or expired — this is
                # OUR stale form (server restart / 30-min TTL), not a foreign
                # origin. The POST is still rejected; do_POST re-renders the
                # form with a fresh token instead of a misleading 403.
                return False, "stale_csrf"
            sys.stderr.write(
                "origin rejected: opaque 'null' origin without CSRF token\n")
            return False, "opaque"
        trusted = {self._normalize_host(self.headers.get("Host", ""))}
        # What a reverse proxy forwards when it rewrites Host:
        for header in ("X-Forwarded-Host", "X-Forwarded-Server"):
            for part in (self.headers.get(header) or "").split(","):
                if part.strip():
                    trusted.add(self._normalize_host(part))
        # Operator-declared public origin(s), e.g. the preview/production URL:
        for part in (os.environ.get("TRUSTED_ORIGINS") or "").split(","):
            if part.strip():
                trusted.add(self._normalize_host(part))
        if origin_host in trusted:
            return True, "host"
        # Same local machine, different loopback spelling — e.g. the page was
        # opened via localhost but the form posted to 127.0.0.1 (or vice
        # versa). Port must still match, so another local service is not
        # silently trusted.
        o_host, o_port = self._split_host(origin_host)
        if o_host in LOOPBACK_HOSTS:
            for other in trusted:
                t_host, t_port = self._split_host(other)
                if t_host in LOOPBACK_HOSTS and o_port == t_port:
                    return True, "loopback"
        sys.stderr.write(
            f"origin mismatch: origin={origin!r} host={self.headers.get('Host')!r} "
            f"x-forwarded-host={self.headers.get('X-Forwarded-Host')!r}\n")
        return False, "foreign"

    def _authed(self) -> dict | None:
        return get_session(session_token_from_headers(self.headers), kind="admin")

    def _user_authed(self) -> dict | None:
        return get_session(
            session_token_from_headers(self.headers, USER_SESSION_COOKIE),
            kind="user")

    def _site_authed(self) -> dict | None:
        """Site gate: a signed-in user (or the admin) unlocks the public pages."""
        session = self._user_authed()
        if session is not None:
            return session
        return get_session(session_token_from_headers(self.headers), kind="admin")

    def log_message(self, fmt, *args):  # keep server.log readable
        # header evidence makes reverse-proxy / CSRF rejections diagnosable
        cookie = self.headers.get("Cookie") or ""
        if USER_SESSION_COOKIE in cookie and SESSION_COOKIE in cookie:
            sess = "user+admin"
        elif USER_SESSION_COOKIE in cookie:
            sess = "user"
        elif SESSION_COOKIE in cookie:
            sess = "admin"
        else:
            sess = "none"
        sys.stderr.write(
            "%s - %s (host=%r xfh=%r proto=%r origin=%r cl=%r te=%r sess=%s)\n" % (
                self.log_date_time_string(), fmt % args,
                self.headers.get("Host"), self.headers.get("X-Forwarded-Host"),
                self.headers.get("X-Forwarded-Proto"),
                self.headers.get("Origin"),
                self.headers.get("Content-Length"),
                self.headers.get("Transfer-Encoding"), sess))

    # -- GET ----------------------------------------------------------------
    def do_GET(self):
        self._route("GET")

    def do_HEAD(self):
        self._route("HEAD")

    def do_POST(self):
        self._body = self._read_body()  # once; handlers reuse it
        ok, reason = self._same_origin()
        if not ok:
            if reason == "stale_csrf":
                return self._csrf_stale_response()
            self._plain(403, "Origin-ka uma dhigma boggan.\n")
            return
        self._route("POST")

    def _csrf_stale_response(self) -> None:
        """Opaque-origin POST whose synchronizer token is unknown — the server
        restarted (in-memory tokens wiped) or the 30-minute TTL lapsed while
        the form sat open. The POST is still REJECTED (no login attempt, no
        state change); we re-render OUR OWN form with a fresh token and a
        clear message so the visitor can simply resubmit, instead of the
        misleading 'Origin-ka uma dhigma boggan' dead end."""
        path = posixpath.normpath(urllib.parse.urlsplit(self.path).path)
        sys.stderr.write(f"csrf stale token: re-render form for {path}\n")
        if path == "/admin/login":
            return self._send(*login_page(err="csrf", status=419))
        if path in ("/login", "/login.html"):
            return self._send(*user_login_page(err="csrf", status=419))
        if path in ("/register", "/register.html"):
            return self._send(*register_page(err="csrf", status=419))
        return self._plain(
            419, "Koodhka amniga wuu dhacay — bogga dib u soo shub.\n"
                 "The security token expired — reload the page and try again.\n")

    def _read_body(self) -> bytes:
        """Read the full POST body via Content-Length OR chunked transfer
        encoding — some reverse proxies forward POSTs chunked (no
        Content-Length), which used to make every login look like an empty
        body (400). Oversized bodies close the connection instead of
        buffering unbounded data."""
        te = (self.headers.get("Transfer-Encoding") or "").lower()
        if "chunked" in te:
            out = bytearray()
            while True:
                head = self.rfile.readline(0x10001).split(b";", 1)[0].strip()
                try:
                    size = int(head, 16)
                except ValueError:
                    self.close_connection = True  # unreadable framing
                    break
                if size == 0:
                    # drain optional trailer headers up to the blank line
                    while self.rfile.readline(0x10001) not in (b"\r\n", b"\n", b""):
                        pass
                    break
                if len(out) + size > MAX_POST_BYTES:
                    self.close_connection = True
                    break
                out += self.rfile.read(size)
                self.rfile.read(2)  # CRLF after each chunk
            return bytes(out)
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0:
            return b""
        if length > MAX_POST_BYTES:
            self.close_connection = True
            return b""
        return self.rfile.read(length)

    def _route(self, method: str) -> None:
        raw_path = urllib.parse.urlsplit(self.path).path
        try:
            path = urllib.parse.unquote(raw_path, errors="strict")
        except (UnicodeDecodeError, ValueError):
            self._plain(400, "Bad request\n")
            return
        path = posixpath.normpath(path)
        if not path.startswith("/"):
            path = "/" + path

        # ---------------- Source ZIP — tap-to-download, AGAAJIN LA'aan -------------
        # Waa faylka source-ka oo dhan (`.env`, `users.db`, log-yo kuma jiraan)
        # sidaas darteed gelitaan (site gate) looma baahna: link-ka la taabto
        # si toos ah ayuu u soo dejiyaa (Content-Disposition: attachment).
        if path in ("/mr-ducaysane-source.zip", "/download/source.zip"):
            if method not in ("GET", "HEAD"):
                return self._plain(405, "Method not allowed\n")
            zpath = ROOT / "mr-ducaysane-source.zip"
            if not zpath.is_file():
                return self._plain(404, "Not found\n")
            return self._send(200, "application/zip", zpath.read_bytes(), {
                "Content-Disposition":
                    'attachment; filename="mr-ducaysane-source.zip"',
                "Cache-Control": "no-store",
            })

        # ---------------- Admin area ----------------
        if path == "/admin/login" or path == "/admin/login.html":
            if method in ("GET", "HEAD"):
                if self._authed():
                    return self._redirect("/admin")
                params = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
                info = params.get("i", [None])[0]
                if info is None:
                    token = session_token_from_headers(self.headers)
                    if token and get_session(token) is None:
                        info = "expired"
                status, ctype, body = login_page(
                    err=params.get("e", [None])[0], info=info
                )
                return self._send(status, ctype, body, cache=False)
            if method == "POST":
                return self._handle_login()
            return self._plain(405, "Method not allowed\n")

        if path == "/admin/logout" and method == "POST":
            destroy_session(session_token_from_headers(self.headers))
            return self._redirect("/admin/login?i=out",
                                  {"Set-Cookie": self._cookie(SESSION_COOKIE, "", 0)})

        if path.startswith("/admin/api/announcement"):
            session = self._authed()
            if session is None:
                return self._json(401, {"ok": False, "error": "unauthorized"})
            if method == "GET":
                return self._json(200, {"ok": True, "text": read_announcement()})
            if method == "POST":
                return self._handle_announcement_save()
            return self._plain(405, "Method not allowed\n")

        if path == "/admin/api/users" or path == "/admin/api/messages":
            if self._authed() is None:
                return self._json(401, {"ok": False, "error": "unauthorized"})
            if path.endswith("/users") and method == "GET":
                status, rows = db_list_users()
                if rows is None:
                    return self._json(503, {"ok": False, "error": status})
                # password_hash never included (db_list_users strips it)
                return self._json(200, self._users_payload(rows))
            if path.endswith("/users") and method == "POST":
                return self._handle_users_admin()
            if path.endswith("/messages") and method == "GET":
                return self._json(200, {"ok": True, "messages": read_messages()})
            if path.endswith("/messages") and method == "POST":
                return self._handle_messages_admin()
            return self._plain(405, "Method not allowed\n")

        if path == "/admin" or path == "/admin/" or path.startswith("/admin/"):
            if method not in ("GET", "HEAD"):
                return self._plain(405, "Method not allowed\n")
            params = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
            if self._authed() is None:
                token = session_token_from_headers(self.headers)
                stale = bool(token) and get_session(token) is None
                expired = stale or params.get("e", [""])[0] == "expired"
                return self._redirect("/admin/login?i=expired" if expired
                                      else "/admin/login")
            session = self._authed()
            return self._send(200, "text/html; charset=utf-8",
                              dashboard_page(session), cache=False)

        # ---------------- User account area (Supabase-backed) ----------------
        if path in ("/login", "/login.html"):
            if method in ("GET", "HEAD"):
                if self._user_authed():
                    return self._redirect("/")
                params = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
                info = params.get("i", [None])[0]
                if info is None:
                    token = session_token_from_headers(self.headers, USER_SESSION_COOKIE)
                    if token and get_session(token, kind="user") is None:
                        info = "expired"
                return self._send(*user_login_page(
                    err=params.get("e", [None])[0], info=info))
            if method == "POST":
                return self._handle_user_login()
            return self._plain(405, "Method not allowed\n")

        if path in ("/account", "/account.html"):
            if method not in ("GET", "HEAD"):
                return self._plain(405, "Method not allowed\n")
            session = self._user_authed()
            if session is None:
                token = session_token_from_headers(self.headers, USER_SESSION_COOKIE)
                stale = bool(token) and get_session(token, kind="user") is None
                return self._redirect("/login?i=expired" if stale else "/login")
            return self._send(200, "text/html; charset=utf-8",
                              account_page(session), cache=False)

        if path == "/logout" and method == "POST":
            destroy_session(
                session_token_from_headers(self.headers, USER_SESSION_COOKIE))
            return self._redirect("/login?i=out",
                                  {"Set-Cookie": self._cookie(USER_SESSION_COOKIE, "", 0)})

        if path == "/api/csrf-token" and method == "GET":
            # Lets an authenticated page's JS fetch a synchronizer token
            # (the contact form posts JSON from /assets/js/contact.js).
            if self._site_authed() is None:
                return self._json(401, {"ok": False, "error": "unauthorized"})
            return self._json(200, {"ok": True, "csrf_token": new_csrf_token()})

        if path == "/api/contact" and method == "POST":
            if self._site_authed() is None:
                return self._json(401, {"ok": False, "error": "unauthorized"})
            return self._handle_contact()

        # ---------------- User registration (Supabase-backed) ----------------
        if path in ("/register", "/register.html"):
            if method in ("GET", "HEAD"):
                params = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
                status, ctype, body = register_page(
                    err=params.get("e", [None])[0],
                    info=params.get("i", [None])[0],
                )
                return self._send(status, ctype, body, cache=False)
            if method == "POST":
                return self._handle_register()
            return self._plain(405, "Method not allowed\n")

        # ---------------- Public static files ----------------
        rel = path.lstrip("/")
        if not rel:
            rel = "index.html"
        parts = [p for p in rel.split("/") if p not in ("", ".")]
        if any(p.startswith(".") for p in parts) or parts[0] in DENY_DIRS \
                or parts[0] in DENY_FILES:
            return self._plain(404, "Not found\n")
        # data/ serves the public site files (content.js, announcement.json)
        # but NEVER the local users database or temp writes (password hashes).
        if len(parts) >= 2 and parts[0] == "data" and (
                parts[1].startswith("users.db")
                or parts[1].endswith((".db", ".db-wal", ".db-shm", ".tmp"))):
            return self._plain(404, "Not found\n")

        # ---------------- Site gate ----------------
        # Everything else needs a sign-in (user OR admin session).
        # /assets/ stays public so the login/register pages render styled.
        if parts[0] != "assets" and self._site_authed() is None:
            return self._redirect("/login?i=gate")

        target = (ROOT / "/".join(parts)).resolve()
        try:
            target.relative_to(ROOT)
        except ValueError:
            return self._plain(404, "Not found\n")
        if target.is_dir():
            target = target / "index.html"
        if not target.is_file():
            return self._plain(404, "Not found\n")

        ctype, _ = mimetypes.guess_type(str(target))
        if ctype is None:
            ctype = "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"
        if target.suffix == ".js":
            ctype = "text/javascript; charset=utf-8"
        if target.suffix == ".svg":
            ctype = "image/svg+xml"
        body = target.read_bytes()
        self._send(200, ctype, body)

    # -- POST handlers ------------------------------------------------------
    def _handle_login(self) -> None:
        if not self._body:
            return self._send(*login_page(err="bad"))
        form = urllib.parse.parse_qs(self._body.decode("utf-8", "replace"))
        email = (form.get("email", [""])[0] or "").strip()
        password = form.get("password", [""])[0] or ""
        ip = self.client_address[0]

        state = attempt_state(ip)
        if state["lock_until"] > time.time():
            return self._send(*login_page(err="limit", status=429))

        if not credentials_configured():
            return self._send(*login_page(err="cfg"))
        if not email or not password:
            return self._send(*login_page(err="bad"))

        email_ok = hmac.compare_digest(email.casefold(), ADMIN_EMAIL.casefold())
        password_ok = verify_password(password, ADMIN_PASSWORD_HASH)
        if not (email_ok and password_ok):
            locked = record_failure(ip)
            time.sleep(FAIL_DELAY)
            return self._send(*login_page(err="limit" if locked else "bad",
                                          status=429 if locked else 200))

        clear_failures(ip)
        # Session fixation guard: retire any pre-login token, mint a fresh one.
        destroy_session(session_token_from_headers(self.headers))
        token = create_session(ADMIN_EMAIL)
        cookie = self._cookie(SESSION_COOKIE, token, int(SESSION_TTL_SECONDS))
        return self._redirect("/admin", {"Set-Cookie": cookie})

    def _handle_register(self) -> None:
        if not self._body or len(self._body) > 16 * 1024:
            return self._send(*register_page(err="bad", status=400))
        form = urllib.parse.parse_qs(
            self._body.decode("utf-8", "replace"),
            keep_blank_values=True)
        get = lambda key: (form.get(key, [""])[0] or "")  # noqa: E731
        name, email = get("name").strip(), get("email").strip().lower()
        password, confirm = get("password"), get("confirm")
        ip = self.client_address[0]

        locked_for = registration_limited(ip)
        if locked_for:
            return self._send(*register_page(err="limit", status=429,
                                             name=name, email=email))
        bad = validate_registration(name, email, password, confirm)
        if bad:
            return self._send(*register_page(err=bad, name=name, email=email))
        outcome, detail = db_create_user(name, email, password)
        if outcome == "ok":
            return self._redirect("/register?i=created")  # PRG: no resubmits
        code = {"exists": "email_exists", "auth": "authkey",
                "table": "table"}.get(outcome, "unavailable")
        status = 503 if outcome == "unavailable" else 200
        return self._send(*register_page(err=code, name=name, email=email,
                                         status=status))

    def _handle_user_login(self) -> None:
        if not self._body or len(self._body) > 16 * 1024:
            return self._send(*user_login_page(err="bad", status=400))
        form = urllib.parse.parse_qs(
            self._body.decode("utf-8", "replace"),
            keep_blank_values=True)
        get = lambda key: (form.get(key, [""])[0] or "")  # noqa: E731
        email, password = get("email").strip().lower(), get("password")
        ip = "user:" + self.client_address[0]  # separate lockout from admin

        state = attempt_state(ip)
        if state["lock_until"] > time.time():
            return self._send(*user_login_page(err="limit", status=429,
                                               email=email))
        if not EMAIL_RE.fullmatch(email) or not password:
            return self._send(*user_login_page(err="bad", email=email))

        db_status, row = db_get_user(email)
        if row is None:
            if db_status != "ok":
                return self._send(*user_login_page(err="unavailable", email=email,
                                                   status=503))
            # Same generic error for unknown email vs wrong password.
            record_failure(ip)
            time.sleep(FAIL_DELAY)
            return self._send(*user_login_page(err="bad", email=email))
        if not verify_password(password, row.get("password_hash", "")):
            locked = record_failure(ip)
            time.sleep(FAIL_DELAY)
            return self._send(*user_login_page(
                err="limit" if locked else "bad", email=email,
                status=429 if locked else 200))

        clear_failures(ip)
        if row.get("is_active") is False:
            # Deactivated by the administrator: the credentials were correct,
            # so this is not a failed attempt — but no session is issued.
            return self._send(*user_login_page(err="disabled", email=email))
        # Session fixation guard: retire any pre-login token, mint a fresh one.
        destroy_session(session_token_from_headers(self.headers, USER_SESSION_COOKIE))
        token = create_session(row.get("email") or email, kind="user",
                               name=row.get("name") or "",
                               joined=format_date(row.get("created_at")))
        cookie = self._cookie(USER_SESSION_COOKIE, token, int(SESSION_TTL_SECONDS))
        # Gate passed -> straight into the website (home page).
        return self._redirect("/", {"Set-Cookie": cookie})

    def _handle_contact(self) -> None:
        if not self._body or len(self._body) > 16 * 1024:
            return self._json(400, {"ok": False, "error": "bad_request"})
        raw = self._body.decode("utf-8", "replace")
        ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip()
        try:
            if ctype == "application/json":
                data = json.loads(raw)
                get = lambda k: str(data.get(k, "") or "")  # noqa: E731
            else:
                form = urllib.parse.parse_qs(raw, keep_blank_values=True)
                get = lambda k: (form.get(k, [""])[0] or "")  # noqa: E731
        except (ValueError, AttributeError):
            return self._json(400, {"ok": False, "error": "bad_request"})

        name = get("name").strip()[:100]
        email = get("email").strip().lower()[:254]
        subject = get("subject").strip()[:200]
        message = get("message").strip()[:2000]
        if (len(name) < 2 or not EMAIL_RE.fullmatch(email)
                or len(subject) < 3 or len(message) < 10):
            return self._json(422, {"ok": False, "error": "validation"})
        if contact_limited(self.client_address[0]):
            return self._json(429, {"ok": False, "error": "limit"})

        append_message({
            "id": secrets.token_hex(8),
            "name": name, "email": email, "subject": subject,
            "message": message,
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })
        return self._json(200, {"ok": True})

    def _users_payload(self, rows: list[dict]) -> dict:
        """Server-side detail/search/sort/pagination over the user list.
        Filtering happens in Python — user input never becomes a query
        language, and rows already exclude every secret field."""
        params = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)

        def one(key: str, default: str = "") -> str:
            return (params.get(key, [default])[0] or default).strip()

        detail = one("detail").lower()[:254]
        if detail:
            match = [r for r in rows if r["email"].lower() == detail]
            return {"ok": True, "user": (match[0] if match else None)}
        query = one("q").lower()[:100]
        if query:
            rows = [r for r in rows
                    if query in r["name"].lower() or query in r["email"].lower()]
        sorts = {
            "joined_desc": (lambda r: r["joined"], True),
            "joined_asc": (lambda r: r["joined"], False),
            "name_asc": (lambda r: r["name"].lower(), False),
            "name_desc": (lambda r: r["name"].lower(), True),
            "email_asc": (lambda r: r["email"].lower(), False),
        }
        key_fn, reverse = sorts.get(one("sort", "joined_desc"),
                                    sorts["joined_desc"])
        rows = sorted(rows, key=key_fn, reverse=reverse)
        try:
            per = max(1, min(100, int(one("per", "10"))))
        except ValueError:
            per = 10
        try:
            page_no = max(1, int(one("page", "1")))
        except ValueError:
            page_no = 1
        total = len(rows)
        pages = max(1, -(-total // per))
        page_no = min(page_no, pages)
        start = (page_no - 1) * per
        return {"ok": True, "count": total, "total": total, "page": page_no,
                "pages": pages, "per": per, "users": rows[start:start + per]}

    def _handle_users_admin(self) -> None:
        """Admin account management: activate / deactivate / delete a user.
        Admin session + same-origin/CSRF guard already enforced upstream."""
        if self._authed() is None:
            return self._json(401, {"ok": False, "error": "unauthorized"})
        if not self._body or len(self._body) > 4 * 1024:
            return self._json(400, {"ok": False, "error": "bad_request"})
        try:
            data = json.loads(self._body.decode("utf-8"))
            action = str(data.get("action") or "")
            email = str(data.get("email") or "").strip().lower()
        except (ValueError, AttributeError):
            return self._json(400, {"ok": False, "error": "bad_request"})
        if not EMAIL_RE.fullmatch(email):
            return self._json(400, {"ok": False, "error": "bad_email"})
        if action in ("activate", "deactivate"):
            outcome, found = db_update_user_active(email, action == "activate")
            if outcome == "ok":
                return self._json(200, {"ok": True, "found": found,
                                        "status": "active" if action == "activate"
                                        else "inactive"})
            if outcome == "columns":
                return self._json(409, {"ok": False, "error": "status_unsupported"})
            return self._json(503, {"ok": False, "error": outcome})
        if action == "delete":
            outcome, found = db_delete_user(email)
            if outcome == "ok":
                return self._json(200, {"ok": True, "found": found})
            return self._json(503, {"ok": False, "error": outcome})
        return self._json(400, {"ok": False, "error": "bad_action"})

    def _handle_messages_admin(self) -> None:
        if not self._body or len(self._body) > 4 * 1024:
            return self._json(400, {"ok": False, "error": "bad_request"})
        try:
            action = json.loads(self._body.decode("utf-8")).get("action")
        except (ValueError, AttributeError):
            return self._json(400, {"ok": False, "error": "bad_request"})
        if action == "clear":
            tmp = CONTACT_FILE.with_suffix(".json.tmp")
            tmp.write_text("[]\n", encoding="utf-8")
            os.replace(tmp, CONTACT_FILE)
            return self._json(200, {"ok": True})
        if action and str(action).startswith("delete:"):
            target = str(action).split(":", 1)[1]
            kept = [m for m in read_messages() if m.get("id") != target]
            if len(kept) != len(read_messages()):
                tmp = CONTACT_FILE.with_suffix(".json.tmp")
                tmp.write_text(json.dumps(kept, ensure_ascii=False, indent=2)
                               + "\n", encoding="utf-8")
                os.replace(tmp, CONTACT_FILE)
            return self._json(200, {"ok": True})
        return self._json(400, {"ok": False, "error": "bad_action"})

    def _handle_announcement_save(self) -> None:
        session = self._authed()
        if session is None:
            return self._json(401, {"ok": False, "error": "unauthorized"})
        if not self._body or len(self._body) > 8 * 1024:
            return self._json(400, {"ok": False, "error": "bad_request"})
        raw = self._body.decode("utf-8", "replace")
        ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip()
        try:
            if ctype == "application/json":
                text = json.loads(raw).get("text", "")
            else:
                text = urllib.parse.parse_qs(raw).get("text", [""])[0]
        except (ValueError, AttributeError):
            return self._json(400, {"ok": False, "error": "bad_request"})
        text = str(text).strip()
        if len(text) > 500:
            return self._json(400, {"ok": False, "error": "too_long"})
        write_announcement(text)
        self._json(200, {"ok": True, "text": text})


def main() -> None:
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "3000"))
    if not credentials_configured():
        print("WARNING: admin credentials not configured yet — login will show "
              "'cfg' message. Run: python3 tools/set_admin_password.py", file=sys.stderr)
    print(f"MR.ducaysane serving on http://{host}:{port} "
          f"(site gated: /login · admin: /admin/login · register: /register)")
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    main()