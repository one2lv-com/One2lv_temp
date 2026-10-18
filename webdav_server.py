#!/usr/bin/env python3
"""
One2lvOS WebDAV Server
Runs a WebDAV server on port 8090.
Root: /home/vercel-sandbox/One2lvos-build/webdav_root
"""

import os
from pathlib import Path
from wsgidav.wsgidav_app import WsgiDAVApp
from wsgidav.dc.simple_dc import SimpleDomainController
from cheroot import wsgi

PORT = int(os.environ.get("WEBDAV_PORT", 8090))
WEBDAV_ROOT = os.environ.get("WEBDAV_ROOT", str(Path(__file__).parent / "webdav_root"))
WEBDAV_USER = os.environ.get("WEBDAV_USER", "one2lv")
WEBDAV_PASS = os.environ.get("WEBDAV_PASS", "sovereign")

Path(WEBDAV_ROOT).mkdir(parents=True, exist_ok=True)

# Drop a welcome file if empty
welcome = Path(WEBDAV_ROOT) / "WELCOME.txt"
if not welcome.exists():
    welcome.write_text(
        "ONE2LVOS WEBDAV SERVER\n"
        "======================\n"
        "Sovereign distributed filesystem. Welcome.\n"
    )

config = {
    "host": "0.0.0.0",
    "port": PORT,
    "provider_mapping": {
        "/": WEBDAV_ROOT,
    },
    "simple_dc": {
        "user_mapping": {
            "*": {
                WEBDAV_USER: {
                    "password": WEBDAV_PASS,
                    "roles": ["editor"],
                },
            }
        }
    },
    "http_authenticator": {
        "domain_controller": "wsgidav.dc.simple_dc.SimpleDomainController",
        "accept_basic": True,
        "accept_digest": True,
        "default_to_digest": False,
    },
    "verbose": 0,
    "logging": {"enable_loggers": []},
}

app = WsgiDAVApp(config)
server = wsgi.Server(("0.0.0.0", PORT), app)
server.start_timeout = 10

print(f"ONE2LVOS WEBDAV SERVER")
print(f"  Port     : {PORT}")
print(f"  Root     : {WEBDAV_ROOT}")
print(f"  User     : {WEBDAV_USER}")
print(f"  URL      : http://localhost:{PORT}/")
print()

try:
    server.start()
except KeyboardInterrupt:
    server.stop()
