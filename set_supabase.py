#!/usr/bin/env python3
"""Store the Supabase credentials for MR.ducaysane — securely, server-side.

The service-role key you paste is NEVER echoed, never written to any public
file: it goes into the untracked/chmod-600 `.env` file only, and the web
server never sends it to a browser.

Usage (from the project folder):
    python3 tools/set_supabase.py
Then RESTART the server, and run:  python3 tools/db_live_test.py
"""
import getpass
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"


def read_env() -> tuple[dict, list]:
    entries: dict[str, str] = {}
    order: list[str] = []
    if ENV_PATH.is_file():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)\s*=", line)
            if m and m.group(1) not in entries:
                order.append(m.group(1))
                entries[m.group(1)] = line
    return entries, order


def main() -> int:
    entries, order = read_env()

    print("Madaxbanaan: Supabase Project URL")
    url = input("  SUPABASE_URL [https://xxxx.supabase.co]: ").strip()
    if not re.match(r"^https?://[A-Za-z0-9.-]+(/[^\s]*)?$", url):
        print("✕ URL-ka sax maaha (tusaale: https://abcdefghijkl.supabase.co)",
              file=sys.stderr)
        return 1

    print("Service-role key (Settings → API → service_role) — qarsoodi buuxan:")
    key = getpass.getpass("  SERVICE_ROLE key: ").strip()
    if len(key) < 20:
        print("✕ Furaha dhaawac/ba' ayuu muuqdaa. ka dibna isku day mar kale.",
              file=sys.stderr)
        return 1

    for keyname, value in (("SUPABASE_URL", url),
                           ("SUPABASE_SERVICE_ROLE_KEY", key)):
        line = f"{keyname}={value}"
        if keyname in entries:
            entries[keyname] = line
        else:
            entries[keyname] = line
            order.append(keyname)

    ENV_PATH.write_text(
        "# MR.ducaysane — server-side credentials (NEVER commit / NEVER publish)\n"
        "# Wax furaha sirta ah ah faylkan kuma jiro oo aan la dirin — kaliya\n"
        "# server-ka oo kaliya ayaa akhriya (server.py blocked it from being served).\n"
        + "\n".join(entries[k] for k in order) + "\n",
        encoding="utf-8",
    )
    try:
        os.chmod(ENV_PATH, 0o600)
    except OSError:
        pass

    host = url.split("//", 1)[-1].split("/", 1)[0]
    print(f"✓ Project URL: {host}  (stored)")
    print(f"✓ Service-role key: qarsoon ({len(key)} xaraf, ma muuqanayo)  (stored in .env)")
    print("  1) Dib u bilow server-ka:  kill $(ss -ltnp | grep :3000 | grep -o 'pid=[0-9]*'"
          " | head -1 | cut -d= -f2); python3 server.py")
    print("  2) Imtixaan tooska ah:     python3 tools/db_live_test.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())