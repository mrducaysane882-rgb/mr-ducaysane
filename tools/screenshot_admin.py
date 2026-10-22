#!/usr/bin/env python3
"""Remaining tour shots (admin dashboard + mobile) with per-shot retries.

Shares the preview mock DB on :3200; starts its own admin server on :3009
with a throwaway password. Run with:
  LD_LIBRARY_PATH=$HOME/chromium-libs/usr/lib/x86_64-linux-gnu .qa-venv/bin/python ...
"""
import os
import secrets
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True)
BASE = "http://127.0.0.1:3000"
ADMIN_BASE = "http://127.0.0.1:3009"

from playwright.sync_api import sync_playwright, Error as PwError  # noqa: E402


def main() -> int:
    import server
    admin_pw = "Admin-Tijaabo-2026!"
    proc = subprocess.Popen(
        [sys.executable, "server.py"], cwd=ROOT,
        env={**os.environ,
             "PORT": "3009", "HOST": "127.0.0.1",
             "SUPABASE_URL": "http://127.0.0.1:3200",
             "SUPABASE_SERVICE_ROLE_KEY": "mock-service-role-key-for-tests-000",
             "ADMIN_EMAIL": "admin@tusaale.test",
             "ADMIN_PASSWORD_HASH": server.hash_password(admin_pw)},
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(30):
            try:
                urllib.request.urlopen(ADMIN_BASE + "/login", timeout=2)
                break
            except OSError:
                time.sleep(0.3)

        # make sure the demo user exists in the shared mock DB
        import re
        email, password = "tusaale-demo@example.com", "Sirta-Tijaabo-2026!"
        page_html = urllib.request.urlopen(BASE + "/register", timeout=5).read().decode()
        tok = re.search(r'name="csrf_token" value="([^"]+)"', page_html).group(1)
        body = urllib.parse.urlencode({
            "name": "Tusaale Demo", "email": email,
            "password": password, "confirm": password,
            "csrf_token": tok}).encode()
        req = urllib.request.Request(
            BASE + "/register", data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded",
                     "Origin": "null"})
        try:
            urllib.request.urlopen(req, timeout=5)
        except urllib.error.HTTPError:
            pass  # duplicate = already registered from a previous run
        print("demo account ready")
        ok = {"08-admin-login.png": False, "09-admin-dashboard.png": False,
              "10-mobile-login.png": False, "11-mobile-home.png": False}

        with sync_playwright() as pw:
            def attempt(fn, tries=4):
                last = None
                for i in range(1, tries + 1):
                    b = pw.chromium.launch()
                    try:
                        page = b.new_page(viewport={"width": 1280, "height": 900})
                        fn(page)
                        return True
                    except PwError as err:
                        last = err
                        print(f"  retry ({i}/{tries}): {type(err).__name__}")
                    finally:
                        try:
                            b.close()
                        except PwError:
                            pass
                print("  gave up:", type(last).__name__ if last else "?")
                return False

            def admin_login_shot(page):
                page.goto(f"{ADMIN_BASE}/admin/login", wait_until="load")
                page.wait_for_timeout(600)
                page.screenshot(path=str(ART / "08-admin-login.png"))
                print("saved 08-admin-login.png")

            def admin_dash_shot(page):
                page.goto(f"{ADMIN_BASE}/admin/login", wait_until="load")
                # headless-shell keyboard insertion is flaky in this VM;
                # set the values directly, then submit the REAL form.
                page.evaluate("""(() => {
                  document.querySelector('#adminEmail').value = 'admin@tusaale.test';
                  document.querySelector('#adminPassword').value = 'Admin-Tijaabo-2026!';
                  document.querySelector('#loginForm').submit();
                })()""")
                page.wait_for_url(f"{ADMIN_BASE}/admin", timeout=8000)
                page.wait_for_selector("#usersBody tr", timeout=8000)
                page.wait_for_timeout(500)
                page.screenshot(path=str(ART / "09-admin-dashboard.png"))
                print("saved 09-admin-dashboard.png")

            def mobile_login_shot(page):
                page.set_viewport_size({"width": 390, "height": 844})
                page.goto(f"{BASE}/login", wait_until="load")
                page.wait_for_timeout(600)
                page.screenshot(path=str(ART / "10-mobile-login.png"))
                print("saved 10-mobile-login.png")

            def mobile_home_shot(page):
                page.set_viewport_size({"width": 390, "height": 844})
                page.goto(f"{BASE}/login", wait_until="load")
                page.evaluate("""(() => {
                  document.querySelector('#loginEmail').value = %s;
                  document.querySelector('#loginPassword').value = %s;
                  document.querySelector('#userLoginForm').submit();
                })()""" % (repr(email), repr(password)))
                page.wait_for_url(f"{BASE}/", timeout=8000)
                page.wait_for_load_state("load")
                page.wait_for_timeout(500)
                page.screenshot(path=str(ART / "11-mobile-home.png"))
                print("saved 11-mobile-home.png")

            ok["08-admin-login.png"] = attempt(admin_login_shot)
            ok["09-admin-dashboard.png"] = attempt(admin_dash_shot)
            ok["10-mobile-login.png"] = attempt(mobile_login_shot)
            ok["11-mobile-home.png"] = attempt(mobile_home_shot)

        print("RESULT:", ok)
        return 0 if all(ok.values()) else 1
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    raise SystemExit(main())
