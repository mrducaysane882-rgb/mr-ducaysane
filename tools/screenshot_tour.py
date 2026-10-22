#!/usr/bin/env python3
"""Screenshot tour of the live MR.ducaysane site (demo data only).

Needs: .qa-venv (playwright + chromium headless shell), the preview server
on :3000 with the mock DB on :3200. Saves artifacts/01-login.png ...
"""
import os
import secrets
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True)
BASE = "http://127.0.0.1:3000"
ADMIN_BASE = "http://127.0.0.1:3009"

from playwright.sync_api import sync_playwright  # noqa: E402


def shot(page, path, url, wait_sel=None):
    page.goto(url, wait_until="networkidle")
    if wait_sel:
        page.wait_for_selector(wait_sel, timeout=8000)
    page.wait_for_timeout(400)
    out = ART / path
    page.screenshot(path=str(out), full_page=False)
    print("saved", out.name)


def main() -> int:
    email = f"tusaale-{secrets.token_hex(3)}@example.com"
    password = "Sirta-Tijaabo-2026!"

    # second server with a KNOWN throwaway admin password, same mock DB
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
    cred = {"email": email, "password": password}
    try:
        for _ in range(30):
            try:
                urllib.request.urlopen(ADMIN_BASE + "/login", timeout=2)
                break
            except OSError:
                time.sleep(0.3)

        from playwright.sync_api import Error as PwError

        with sync_playwright() as pw:
            def run_task(label, fn, tries=3):
                last = None
                for attempt in range(1, tries + 1):
                    browser = pw.chromium.launch()
                    try:
                        page = browser.new_page(
                            viewport={"width": 1280, "height": 900})
                        fn(page)
                        return
                    except PwError as err:
                        last = err
                        print(f"retry {label} ({attempt}/{tries}): "
                              f"{type(err).__name__}")
                    finally:
                        try:
                            browser.close()
                        except PwError:
                            pass
                raise last

            def site_shot(name, url):
                def task(page):
                    shot(page, name, url)
                run_task(name, task)

            # 1-2: public auth pages
            site_shot("01-login.png", f"{BASE}/login")
            site_shot("02-register.png", f"{BASE}/register")

            # 3-4: full form flow (register + login) in ONE session
            def flow(page):
                # fresh email per attempt: a retry never hits "duplicate"
                cred["email"] = f"tusaale-{secrets.token_hex(3)}@example.com"
                page.goto(f"{BASE}/register", wait_until="networkidle")
                page.fill("#regName", "Tusaale Isticmaale")
                page.fill("#regEmail", cred["email"])
                page.fill("#regPassword", password)
                page.fill("#regConfirm", password)
                page.click("button[type=submit]")
                page.wait_for_url("**/register?i=created", timeout=8000)
                page.wait_for_timeout(300)
                page.screenshot(path=str(ART / "03-register-success.png"))
                print("saved 03-register-success.png")
                page.wait_for_url("**/login*", timeout=8000)
                page.fill("#loginEmail", cred["email"])
                page.fill("#loginPassword", password)
                page.click("button[type=submit]")
                page.wait_for_url(f"{BASE}/", timeout=8000)
                page.wait_for_load_state("networkidle")
                page.screenshot(path=str(ART / "04-home.png"))
                print("saved 04-home.png")
            run_task("03+04 flow", flow)

            # 5-7: authenticated pages (same session: reuse the cookie jar)
            def authed_shots(page):
                page.goto(f"{BASE}/login", wait_until="networkidle")
                page.fill("#loginEmail", cred["email"])
                page.fill("#loginPassword", password)
                page.click("button[type=submit]")
                page.wait_for_url(f"{BASE}/", timeout=8000)
                shot(page, "05-account.png", f"{BASE}/account")
                shot(page, "06-courses.png", f"{BASE}/casharrada.html")
                shot(page, "07-contact.png", f"{BASE}/nala-soo-xiriir.html")
            run_task("05-07 authed", authed_shots)

            # 8-9: admin area (throwaway password, same mock DB -> user visible)
            def admin_shots(page):
                shot(page, "08-admin-login.png", f"{ADMIN_BASE}/admin/login")
                page.goto(f"{ADMIN_BASE}/admin/login", wait_until="networkidle")
                page.fill("#adminEmail", "admin@tusaale.test")
                page.fill("#adminPassword", admin_pw)
                page.click("button[type=submit]")
                page.wait_for_url(f"{ADMIN_BASE}/admin", timeout=8000)
                page.wait_for_selector("#usersBody tr", timeout=8000)
                page.wait_for_timeout(500)
                page.screenshot(path=str(ART / "09-admin-dashboard.png"))
                print("saved 09-admin-dashboard.png")
            run_task("08-09 admin", admin_shots)

            # 10-11: mobile viewport (responsive proof)
            def mobile_shots(page):
                page.set_viewport_size({"width": 390, "height": 844})
                shot(page, "10-mobile-login.png", f"{BASE}/login")
                page.goto(f"{BASE}/login", wait_until="networkidle")
                page.fill("#loginEmail", cred["email"])
                page.fill("#loginPassword", password)
                page.click("button[type=submit]")
                page.wait_for_url(f"{BASE}/", timeout=8000)
                page.wait_for_load_state("networkidle")
                page.screenshot(path=str(ART / "11-mobile-home.png"))
                print("saved 11-mobile-home.png")
            run_task("10-11 mobile", mobile_shots)
        return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    raise SystemExit(main())
