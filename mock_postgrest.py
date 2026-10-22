#!/usr/bin/env python3
"""Mock Supabase PostgREST endpoint for LOCAL integration testing only.

Implements exactly what the real /rest/v1/users interface does for our flow:
  GET    /rest/v1/users  -> filters (eq.), order, limit, select
  POST   /rest/v1/users  -> 201 on new row, 409 {"code":"23505"} on duplicate
                            email; applies the real table's defaults
                            (id, is_active=true, created_at)
  PATCH  /rest/v1/users  -> UPDATE ... WHERE email=eq.X (activate/deactivate)
  DELETE /rest/v1/users  -> DELETE ... WHERE email=eq.X (admin delete)
All requests require the `apikey` header. Runs on 127.0.0.1 with in-memory
state: never a real database, never public.

Usage: python3 tools/mock_postgrest.py [port]
"""
import json
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

USERS: dict[str, dict] = {}
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3200


class MockHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        # Local debug hook for tests only: lets db_mock_test.py verify what
        # was actually stored (hash format, no plaintext password).
        if self.path == "/__dump":
            return self._send(200, USERS)
        if self.path.startswith("/rest/v1/users"):
            if not self.headers.get("apikey"):
                return self._send(401, {"message": "missing apikey"})
            parsed = urllib.parse.urlsplit(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            rows = list(USERS.values())
            # eq.<value> filters (PostgREST syntax, only what server.py uses)
            for key, values in params.items():
                if key in ("select", "order", "limit"):
                    continue
                value = values[0]
                if value.startswith("eq."):
                    want = value[3:].lower()
                    rows = [r for r in rows if str(r.get(key, "")).lower() == want]
            order = (params.get("order") or [""])[0]
            if order:
                field = order.split(".")[0]
                reverse = "desc" in order
                rows.sort(key=lambda r: str(r.get(field, "")), reverse=reverse)
            limit = (params.get("limit") or [""])[0]
            if limit.isdigit():
                rows = rows[:int(limit)]
            select = (params.get("select") or [""])[0]
            if select and select != "*":
                keep = [s.strip() for s in select.split(",")]
                rows = [{k: r.get(k) for k in keep if k in r} for r in rows]
            return self._send(200, rows)
        return self._send(404, {"message": "not found"})

    def do_DELETE(self):
        if not self.path.startswith("/rest/v1/users"):
            return self._send(404, {"message": "not found"})
        if not self.headers.get("apikey"):
            return self._send(401, {"message": "missing apikey"})
        params = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
        email = ((params.get("email") or [""])[0]).lower()
        if email.startswith("eq."):
            email = email[3:].lower()
        removed = [USERS.pop(email)] if email in USERS else []
        return self._send(200, removed)

    def do_PATCH(self):
        """UPDATE ... WHERE email=eq.X — used by admin activate/deactivate."""
        if not self.path.startswith("/rest/v1/users"):
            return self._send(404, {"message": "not found"})
        if not self.headers.get("apikey"):
            return self._send(401, {"message": "missing apikey"})
        params = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
        email = ((params.get("email") or [""])[0]).lower()
        if email.startswith("eq."):
            email = email[3:].lower()
        if email not in USERS:
            return self._send(200, [])  # representation of zero updated rows
        try:
            length = int(self.headers.get("Content-Length") or 0)
            patch = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, AttributeError):
            return self._send(400, {"message": "bad json"})
        USERS[email].update(patch)
        return self._send(200, [{k: USERS[email].get(k)
                                 for k in ("id", "name", "email",
                                           "is_active", "created_at")
                                 if k in USERS[email]}])

    def do_POST(self):
        if not self.path.startswith("/rest/v1/users"):
            return self._send(404, {"message": "not found"})
        if not self.headers.get("apikey"):
            return self._send(401, {"message": "missing apikey"})
        try:
            length = int(self.headers.get("Content-Length") or 0)
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, AttributeError):
            return self._send(400, {"message": "bad json"})
        email = str(data.get("email", "")).lower()
        if email in USERS:
            return self._send(409, {"code": "23505",
                                    "message": "duplicate key value violates unique constraint"})
        # Emulate the real table's defaults (gen_random_uuid + now() + true)
        data.setdefault("id", f"mock-{len(USERS) + 1:04d}")
        data.setdefault("is_active", True)
        data.setdefault("created_at", "2026-10-20T00:00:00+00:00")
        USERS[email] = data
        return self._send(201, {"id": data["id"]})

    def log_message(self, *args):  # quiet
        pass


if __name__ == "__main__":
    print(f"mock PostgREST listening on 127.0.0.1:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), MockHandler).serve_forever()