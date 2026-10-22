#!/usr/bin/env python3
"""Set (or rotate) the MR.ducaysane admin password — securely, server-side.

The password you type is NEVER written to any file in plain text and is never
shown anywhere: only a PBKDF2-HMAC-SHA256 hash (600k iterations, random salt)
is stored in the untracked `.env` file as ADMIN_PASSWORD_HASH.

Usage (from the project folder):
    python3 tools/set_admin_password.py                 # prompts for password
    python3 tools/set_admin_password.py --email you@example.com

After running it, RESTART the server (python3 server.py) and log in at
/admin/login.
"""
import argparse
import getpass
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"

sys.path.insert(0, str(ROOT))
from server import hash_password  # noqa: E402  (single source of hashing truth)


def read_env() -> dict:
    entries: dict[str, str] = {}
    order: list[str] = []
    if ENV_PATH.is_file():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)\s*=", line)
            if m and m.group(1) not in entries:
                order.append(m.group(1))
                entries[m.group(1)] = line
    return entries  # keeps raw "KEY=value" lines in original order


def upsert(entries: dict, order: list, key: str, value: str) -> None:
    line = f"{key}={value}"
    if key in entries:
        entries[key] = line
    else:
        entries[key] = line
        order.append(key)


def main() -> int:
    parser = argparse.ArgumentParser(description="Set the MR.ducaysane admin password")
    parser.add_argument("--email", help="admin email (default: current .env value)")
    args = parser.parse_args()

    entries = read_env()
    order = list(entries.keys())

    # Resolve the full env dict for detecting existing config
    current: dict[str, str] = {}
    for raw in entries.values():
        m = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$", raw)
        if m:
            current[m.group(1)] = m.group(2).strip().strip('"').strip("'")

    email = (args.email or current.get("ADMIN_EMAIL", "") or "").strip()
    if not email:
        email = input("Email-ka Maamulaha [maxamedmustafe882@gmail.com]: ").strip() \
            or "maxamedmustafe882@gmail.com"
    if "@" not in email:
        print("✕ Email-ka sax maaha.", file=sys.stderr)
        return 1

    print("Furaha sirta ah ee CUSUB (wuu qarsoon yahay — kelin kuma soo baxayo):")
    pw1 = getpass.getpass("  Password: ")
    if len(pw1) < 8:
        print("✕ Ugu yaraan 8 xaraf. Talo: 12+ xaraf oo isku dhan (EC#talo-2026).",
              file=sys.stderr)
        return 1
    pw2 = getpass.getpass("  Password (marka labaad): ")
    if pw1 != pw2:
        print("✕ Furayaashu isku mid maaha. isku day mar kale.", file=sys.stderr)
        return 1

    upsert(entries, order, "ADMIN_EMAIL", email)
    upsert(entries, order, "ADMIN_PASSWORD_HASH", hash_password(pw1))
    if "ADMIN_SESSION_TTL_MINUTES" not in entries:
        upsert(entries, order, "ADMIN_SESSION_TTL_MINUTES", "240")

    ENV_PATH.write_text(
        "# MR.ducaysane — server-side admin credentials (NEVER commit / NEVER publish)\n"
        "# Cayinta waxaa laga soo xaaqiyay tools/set_admin_password.py — qoraal furaha\n"
        "# sirta ah ma jiro faylkan, kaliya PBKDF2 hash.\n"
        + "\n".join(entries[k] for k in order) + "\n",
        encoding="utf-8",
    )
    try:
        os.chmod(ENV_PATH, 0o600)
    except OSError:
        pass

    print(f"✓ Furaha sirta ah waa la kaydiyay (hash keliya) — {ENV_PATH.name}")
    print(f"✓ Email-ka maamulaha: {email}")
    print("  Dib u bilow server-ka: python3 server.py  — kadibna ka sooo gal /admin/login")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())