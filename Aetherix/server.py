"""
Aetherix Server — One2lv Master Terminal
Port: 9003
  GET  /           — serves index.html
  GET  /health     — health check
  POST /memory     — store kernel memory state
  GET  /memory     — retrieve kernel memory
  POST /sanctuary  — update active sanctuary role
"""

import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from datetime import datetime

BASE = Path(__file__).parent
_memory = {}
_sanctuary = {"active": "Architect", "cycle": 0, "updated_at": None}


class AetherixHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # suppress access logs

    def _send(self, code, body, ctype="application/json"):
        data = body.encode() if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", len(data))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            html = (BASE / "index.html").read_bytes()
            self._send(200, html, "text/html")
        elif self.path == "/health":
            self._send(200, json.dumps({"status": "ok", "system": "Aetherix",
                                        "sanctuary": _sanctuary}))
        elif self.path == "/memory":
            self._send(200, json.dumps(_memory))
        else:
            self._send(404, json.dumps({"error": "not found"}))

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw)
        except Exception:
            body = {}

        if self.path == "/memory":
            _memory.update(body)
            _memory["updated_at"] = datetime.utcnow().isoformat() + "Z"
            self._send(200, json.dumps({"stored": True, "keys": list(_memory.keys())}))
        elif self.path == "/sanctuary":
            role = body.get("role")
            if role:
                _sanctuary["active"] = role
                _sanctuary["cycle"] = body.get("cycle", _sanctuary["cycle"])
                _sanctuary["updated_at"] = datetime.utcnow().isoformat() + "Z"
            self._send(200, json.dumps(_sanctuary))
        else:
            self._send(404, json.dumps({"error": "not found"}))


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 9003), AetherixHandler)
    print("[Aetherix] One2lv Master Terminal — http://localhost:9003")
    server.serve_forever()
