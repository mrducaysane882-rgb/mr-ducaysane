#!/usr/bin/env python3
"""Rebuild `mr-ducaysane-source.zip` — the downloadable source bundle.

Sir kuma jiro ZIP-ka: `.env`, `data/users.db*`, `server.log`, faylasha
imtixaanka (`.test-*`), `__pycache__`, `.git`, `artifacts/` iyo ZIP-ka la
sameynayo qudhiisa waa laga saaraa. `.env.example` waa lagu darayaa —
README-gu wuxuu ku leeyahay `copy .env.example .env`.

Isticmaal (folder-ka project-ka):
    python3 tools/build_zip.py
"""
from __future__ import annotations

import hashlib
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIP_PATH = ROOT / "mr-ducaysane-source.zip"

# Waxyaabaha waligood lama darin (sir / faylal maxali ah / binaries)
EXCLUDE_FILES = {
    ".env", "server.log", ZIP_PATH.name, ".zip-link.txt",
    "users.db", "users.db-wal", "users.db-shm",
}
EXCLUDE_DIRS = {
    ".git", "__pycache__", ".qa-venv", "node_modules", "artifacts", "data/tmp",
}
EXCLUDE_SUFFIXES = {".pyc", ".db", ".db-wal", ".db-shm", ".log", ".tmp"}


def included(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    parts = rel.parts
    if any(part in EXCLUDE_DIRS for part in parts):
        return False
    if any(part.startswith(".test-") for part in parts):
        return False
    if path.name in EXCLUDE_FILES:
        return False
    if path.suffix in EXCLUDE_SUFFIXES:
        return False
    if path.name.startswith(".") and path.name not in (".env.example", ".gitignore"):
        return False
    return path.is_file()


def main() -> int:
    files = sorted(p for p in ROOT.rglob("*") if included(p))
    assert (ROOT / ".env.example").is_file(), ".env.example maqan"

    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            zf.write(path, path.relative_to(ROOT).as_posix())

    digest = hashlib.md5(ZIP_PATH.read_bytes()).hexdigest()
    size = ZIP_PATH.stat().st_size
    print(f"{len(files)} fayl · {size:,} B · md5 {digest}")
    for path in files:
        print("  " + path.relative_to(ROOT).as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
