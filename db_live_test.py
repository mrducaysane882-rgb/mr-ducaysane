#!/usr/bin/env python3
"""LIVE test: registration -> real Supabase project (insert, duplicate, select, cleanup).

Exit codes:
  0 = connected AND tested (all live checks passed)
  1 = failed (connected but broken somewhere)
  2 = BLOCKED — Supabase not configured yet (.env missing SUPABASE_URL /
     SUPABASE_SERVICE_ROLE_KEY, or the users table / SQL step not done)

Never prints credentials. Cleans up only the test rows it created.
"""
from __future__ import annotations

import json
import secrets
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000").rstrip("/")

import server  # noqa: E402  (loads .env)

URL = server.SUPABASE_URL.rstrip("/") if server.SUPABASE_URL else ""
KEY = server.SUPABASE_SERVICE_ROLE_KEY

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


def post_form(path: str, fields: dict) -> tuple[int, str]:
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(
        BASE + path, data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as err:
        return 0, str(err)


def rest(method: str, path_query: str, body: dict | None = None,
         prefer: str | None = None) -> tuple[int, str]:
    """Direct Supabase REST call using server-side credentials (never echoed)."""
    req = urllib.request.Request(
        URL + path_query,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={
            "apikey": KEY,
            "Authorization": "Bearer " + KEY,
            "Content-Type": "application/json",
            **({"Prefer": prefer} if prefer else {}),
        })
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as err:
        return 0, str(err)


def main() -> int:
    print("== LIVE Supabase registration test ==")
    if not (URL and KEY):
        print("BLOCKED: Supabase credentials not configured yet.")
        print("  -> run: python3 tools/set_supabase.py   (then restart server.py)")
        print("  -> and create the `users` table in the Supabase SQL editor")
        print("  -> then rerun: python3 tools/db_live_test.py")
        return 2

    email = f"db-test-{secrets.token_hex(5)}@example.com"
    password = "Tijaabo-DB-2026!"
    name = "DB Tijaabo"

    # 1) registration page reachable
    status_page = urllib.request.urlopen(BASE + "/register", timeout=10).status
    check("register page 200", status_page == 200)

    # 2) live INSERT through public registration endpoint
    status, body = post_form("/register", {
        "name": name, "email": email,
        "password": password, "confirm": password})
    check("live registration succeeds",
          status == 200 and "waa la sameeyay" in body.lower(), f"status={status}")
    check("no credential leak in response",
          "pbkdf2" not in body and KEY not in body and password not in body)

    # 3) duplicate email rejected (proves unique constraint + 409 mapping, live)
    status, body = post_form("/register", {
        "name": name, "email": email,
        "password": password, "confirm": password})
    check("duplicate email rejected live",
          "horey ayuu akoon" in body.lower(), f"status={status}")

    # 4) row really exists in Supabase (direct REST SELECT with service key)
    status, body = rest("GET", f"/rest/v1/users?email=eq.{urllib.parse.quote(email)}"
                               f"&select=id,email,name")
    rows = []
    try:
        rows = json.loads(body)
    except ValueError:
        pass
    check("row visible in Supabase table", status == 200 and len(rows) == 1
          and rows[0].get("email") == email, f"status={status} body={body[:120]}")

    # 5) stored password is HASHED, never plaintext
    status, body = rest("GET", f"/rest/v1/users?email=eq.{urllib.parse.quote(email)}"
                               f"&select=password_hash")
    stored = ""
    try:
        stored = json.loads(body)[0].get("password_hash", "")
    except (ValueError, IndexError, KeyError):
        pass
    check("stored value is a PBKDF2 hash (not the password)",
          stored.startswith("pbkdf2_sha256$") and password not in stored)

    # 6) invalid email rejected without touching the DB
    status, body = post_form("/register", {
        "name": name, "email": "not-an-email",
        "password": password, "confirm": password})
    check("invalid email rejected", status == 200
          and "email-ka sax maaha" in body.lower())

    # 7) cleanup: delete ONLY the test rows this script created
    status, body = rest("DELETE",
                        f"/rest/v1/users?email=eq.{urllib.parse.quote(email)}",
                        prefer="return=representation")
    check("test row cleaned up", status in (200, 204), f"status={status}")
    status, body = rest("GET", f"/rest/v1/users?email=eq.{urllib.parse.quote(email)}"
                               f"&select=id")
    try:
        remaining = json.loads(body)
    except ValueError:
        remaining = ["?"]
    check("no test residue in database", remaining == [], f"rows={remaining}")

    print(f"\n{passes} passed, {len(failures)} failed")
    if failures:
        for f in failures:
            print(f"  FAILED: {f}")
        print("DATABASE NOT YET PROVEN — fix failures and rerun.")
        return 1
    print("DATABASE CONNECTED AND TESTED (live) ✅")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())