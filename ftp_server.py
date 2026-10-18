#!/usr/bin/env python3
"""
One2lvOS FTP Server
Runs a real FTP server on port 2121 (unprivileged).
Root: /home/vercel-sandbox/One2lvos-build/ftp_root
"""

import os
from pathlib import Path
from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer

PORT = int(os.environ.get("FTP_PORT", 2121))
FTP_ROOT = os.environ.get("FTP_ROOT", str(Path(__file__).parent / "ftp_root"))
FTP_USER = os.environ.get("FTP_USER", "one2lv")
FTP_PASS = os.environ.get("FTP_PASS", "sovereign")

Path(FTP_ROOT).mkdir(parents=True, exist_ok=True)

# Drop a welcome file if empty
welcome = Path(FTP_ROOT) / "WELCOME.txt"
if not welcome.exists():
    welcome.write_text(
        "ONE2LVOS FTP SERVER\n"
        "===================\n"
        "Sovereign file storage. Welcome.\n"
    )

authorizer = DummyAuthorizer()
# Full permissions: elradfmwMT
authorizer.add_user(FTP_USER, FTP_PASS, FTP_ROOT, perm="elradfmwMT")
authorizer.add_anonymous(FTP_ROOT, perm="elr")

handler = FTPHandler
handler.authorizer = authorizer
handler.banner = "ONE2LVOS FTP Server v1.0 — Sovereign File Transfer Protocol"
handler.passive_ports = range(60000, 60100)

server = FTPServer(("0.0.0.0", PORT), handler)
server.max_cons = 64
server.max_cons_per_ip = 8

print(f"ONE2LVOS FTP SERVER")
print(f"  Port     : {PORT}")
print(f"  Root     : {FTP_ROOT}")
print(f"  User     : {FTP_USER}")
print(f"  Anon     : enabled (read-only)")
print(f"  Passive  : 60000-60099")
print()

server.serve_forever()
