#!/usr/bin/env python3
"""
One2lvOS Real Network Boot Server
Serves the actual OS, BIOS, and kernel files over HTTP.
No simulation — real file transfers, real execution.

Endpoints:
  GET /              → PXE boot menu (netboot.html)
  GET /os            → Actual One2lvOS desktop (One2lvOS/index.html)
  GET /bios          → BIOS setup page
  GET /One2lvOS/**   → All OS static files (JS, CSS, HTML, assets)
  GET /api/manifest  → Real file manifest with sizes and hashes
  GET /api/discover  → Real port scan for running services
  GET /api/status    → Real service status
  GET /health        → Health check
"""

import os
import sys
import json
import time
import socket
import hashlib
import threading
import http.server
import urllib.parse
from datetime import datetime, timezone

PORT     = int(os.environ.get("NETBOOT_PORT", 9000))
HOST     = os.environ.get("NETBOOT_HOST", "0.0.0.0")
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
OS_DIR   = os.path.join(ROOT_DIR, "One2lvOS")

BOOT_VERSION = "1.0.0"

MIME_MAP = {
    ".js":    "application/javascript",
    ".mjs":   "application/javascript",
    ".css":   "text/css",
    ".html":  "text/html; charset=utf-8",
    ".json":  "application/json",
    ".png":   "image/png",
    ".jpg":   "image/jpeg",
    ".svg":   "image/svg+xml",
    ".ico":   "image/x-icon",
    ".woff2": "font/woff2",
    ".woff":  "font/woff",
    ".ttf":   "font/ttf",
    ".webmanifest": "application/manifest+json",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def file_hash(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def build_manifest() -> dict:
    """Walk One2lvOS directory and build a real file manifest."""
    files = {}

    def walk(directory, url_prefix):
        if not os.path.isdir(directory):
            return
        for entry in sorted(os.listdir(directory)):
            full = os.path.join(directory, entry)
            url  = f"{url_prefix}/{entry}"
            if os.path.isfile(full):
                size = os.path.getsize(full)
                files[url] = {
                    "size":   size,
                    "hash":   file_hash(full),
                    "url":    f"/One2lvOS{url}",
                    "mime":   MIME_MAP.get(os.path.splitext(entry)[1], "application/octet-stream"),
                }
            elif os.path.isdir(full) and entry not in ("node_modules", "__pycache__", ".git"):
                walk(full, url)

    walk(OS_DIR, "")

    # Identify boot-critical files
    boot_files = {
        "bios":   "/BIOS/boot.js",
        "shader": "/BIOS/shader.js",
        "state":  "/BIOS/state-loader.js",
        "kernel": "/Kernel/reactor-core.js",
    }

    return {
        "version":    BOOT_VERSION,
        "timestamp":  datetime.now(timezone.utc).isoformat(),
        "server":     f"http://{local_ip()}:{PORT}",
        "os_url":     f"http://{local_ip()}:{PORT}/os",
        "tftp_port":  6969,
        "boot_order": [boot_files["shader"], boot_files["state"],
                       boot_files["bios"],   boot_files["kernel"]],
        "entry":      "/One2lvOS/index.html",
        "files":      files,
        "count":      len(files),
        "total_bytes": sum(v["size"] for v in files.values()),
    }


def scan_services() -> list:
    """Actually probe ports to find running One2lvOS services."""
    ip = local_ip()
    services = [
        ("boot-server", PORT,  "/health"),
        ("core",        3002,  "/health"),
        ("lobby",       8006,  "/"),
        ("gateway",     8888,  "/status"),
        ("arcade",      8003,  "/"),
        ("lumenis",     8005,  "/"),
        ("steamos",     8080,  "/"),
        ("aetherix",    9003,  "/health"),
        ("lumenis-os",  9002,  "/api/healthz"),
    ]
    results = []
    for name, port, _ in services:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.4)
        try:
            s.connect(("127.0.0.1", port))
            status = "online"
        except Exception:
            status = "offline"
        finally:
            s.close()
        results.append({
            "id":     name,
            "role":   name,
            "ip":     ip,
            "port":   port,
            "url":    f"http://{ip}:{port}",
            "status": status,
        })
    return results


# ---------------------------------------------------------------------------
# HTTP handler
# ---------------------------------------------------------------------------

class NetBootHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        method = getattr(self, 'command', '?')
        path   = getattr(self, 'path', '?')
        code   = args[1] if len(args) > 1 else '?'
        print(f"  [{method}] {path}  {code}")

    # ── Response helpers ──────────────────────────────────────────────────

    def send_json(self, data, status=200):
        body = json.dumps(data, indent=2).encode()
        self._respond(status, "application/json", body)

    def send_html(self, html, status=200):
        body = html.encode() if isinstance(html, str) else html
        self._respond(status, "text/html; charset=utf-8", body)

    def _respond(self, status, content_type, body: bytes):
        self.send_response(status)
        self.send_header("Content-Type",   content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control",  "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def serve_file(self, path: str):
        if ".." in os.path.realpath(path):
            self.send_json({"error": "forbidden"}, 403)
            return
        if not os.path.isfile(path):
            self.send_json({"error": "not found", "path": path}, 404)
            return
        ext  = os.path.splitext(path)[1].lower()
        mime = MIME_MAP.get(ext, "application/octet-stream")
        with open(path, "rb") as f:
            body = f.read()
        self._respond(200, mime, body)

    # ── Router ────────────────────────────────────────────────────────────

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        p = parsed.path

        # Serve the actual One2lvOS desktop
        if p in ("/os", "/os/"):
            idx = os.path.join(OS_DIR, "index.html")
            self.serve_file(idx)

        # Serve the real BIOS setup page
        elif p in ("/bios", "/bios/"):
            f = os.path.join(ROOT_DIR, "BIOS_BOOT.html")
            if not os.path.isfile(f):
                f = os.path.join(OS_DIR, "BIOS_BOOT.html")
            self.serve_file(f)

        # Serve netboot menu
        elif p in ("/", "/netboot", "/netboot/"):
            self.send_html(build_netboot_html())

        # Serve all One2lvOS static files
        elif p.startswith("/One2lvOS/"):
            rel  = p[len("/One2lvOS/"):].lstrip("/")
            if ".." in rel:
                self.send_json({"error": "forbidden"}, 403)
                return
            full = os.path.join(OS_DIR, rel)
            self.serve_file(full)

        # Root-level static files (index.html, manifest.json, etc.)
        elif p.startswith("/static/"):
            rel  = p[len("/static/"):].lstrip("/")
            if ".." in rel:
                self.send_json({"error": "forbidden"}, 403)
                return
            full = os.path.join(ROOT_DIR, rel)
            self.serve_file(full)

        # API
        elif p == "/health":
            self.send_json({"status": "ok", "version": BOOT_VERSION,
                            "server": local_ip(), "port": PORT})

        elif p == "/api/manifest":
            self.send_json(build_manifest())

        elif p == "/api/discover":
            self.send_json({
                "nodes":     scan_services(),
                "scanned_at": datetime.now(timezone.utc).isoformat(),
            })

        elif p == "/api/status":
            nodes  = scan_services()
            online = [n for n in nodes if n["status"] == "online"]
            self.send_json({
                "version":         BOOT_VERSION,
                "services_online": len(online),
                "services_total":  len(nodes),
                "nodes":           nodes,
            })

        else:
            # Try root dir as fallback
            rel = p.lstrip("/")
            if rel and ".." not in rel:
                full = os.path.join(ROOT_DIR, rel)
                if os.path.isfile(full):
                    self.serve_file(full)
                    return
            self.send_json({"error": "not found", "path": p}, 404)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()


# ---------------------------------------------------------------------------
# Netboot HTML — real boot, no simulation
# Fetches the actual BIOS/kernel files using fetch() with streaming,
# measures real transfer speeds, then injects and executes the real scripts.
# ---------------------------------------------------------------------------

def build_netboot_html() -> str:
    ip   = local_ip()
    port = PORT
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ONE2LVOS — Network Boot</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#000;color:#0f0;font-family:'Courier New',monospace;
     min-height:100vh;display:flex;flex-direction:column;align-items:center;
     justify-content:center;padding:20px}}
#screen{{width:100%;max-width:860px;border:1px solid #0a0;padding:24px;
         background:rgba(0,255,0,.02);box-shadow:0 0 30px rgba(0,255,0,.1)}}
.hdr{{text-align:center;border-bottom:1px solid #0a0;padding-bottom:14px;margin-bottom:18px}}
.logo{{font-size:20px;color:#0ff;letter-spacing:5px}}
.sub{{color:#ff0;font-size:10px;letter-spacing:2px;margin-top:5px}}
#log{{height:300px;overflow-y:auto;padding:6px 0;margin-bottom:14px;
      border-top:1px solid #020;border-bottom:1px solid #020;font-size:12px}}
.line{{line-height:1.9;padding:0 2px}}
.ok  {{color:#0f0}} .info{{color:#0af}} .warn{{color:#ff0}}
.err {{color:#f44}} .done{{color:#0ff}} .xfer{{color:#0a0;font-size:11px}}
#prog-wrap{{margin-bottom:14px}}
#prog-label{{font-size:11px;color:#0af;margin-bottom:4px;display:flex;justify-content:space-between}}
#prog-track{{background:#010;border:1px solid #020;height:8px}}
#prog-bar{{width:0%;height:100%;background:#0f0;transition:width .15s;box-shadow:0 0 6px #0f0}}
#actions{{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:10px}}
button{{background:transparent;border:1px solid #0f0;color:#0f0;
        font-family:inherit;font-size:12px;padding:8px 18px;cursor:pointer;
        letter-spacing:1px;transition:all .2s}}
button:hover{{background:rgba(0,255,0,.12);box-shadow:0 0 8px rgba(0,255,0,.3)}}
button:disabled{{opacity:.3;cursor:not-allowed}}
#status-bar{{display:flex;justify-content:space-between;font-size:10px;
             color:#444;border-top:1px solid #010;padding-top:7px;margin-top:6px}}
.dot{{width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:4px;
      vertical-align:middle}}
.on{{background:#0f0;box-shadow:0 0 4px #0f0}} .off{{background:#333}}
#nodes{{margin-top:10px;display:none}}
.node-row{{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}}
.node{{border:1px solid #020;padding:5px 9px;font-size:10px}}
.node.online{{border-color:#0f0;color:#0f0}} .node.offline{{color:#333}}
canvas{{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;opacity:.04;pointer-events:none}}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="screen">
  <div class="hdr">
    <div class="logo">ONE2LVOS  NETBOOT</div>
    <div class="sub">REAL NETWORK BOOT — HTTP/TFTP — {ip}:{port}</div>
  </div>

  <div id="log"></div>

  <div id="prog-wrap">
    <div id="prog-label"><span id="prog-text">Ready.</span><span id="prog-pct"></span></div>
    <div id="prog-track"><div id="prog-bar"></div></div>
  </div>

  <div id="actions">
    <button id="btn-boot">[ BOOT ONE2LVOS ]</button>
    <button onclick="showNodes()">[ DISCOVER NODES ]</button>
    <button onclick="location.href='/bios'">[ BIOS SETUP ]</button>
  </div>

  <div id="nodes">
    <div style="font-size:10px;color:#0af">[ NETWORK SCAN ]</div>
    <div id="node-row" class="node-row"></div>
  </div>

  <div id="status-bar">
    <span id="s-ip">IP: {ip}</span>
    <span id="s-tftp">TFTP: {ip}:6969</span>
    <span id="s-time"></span>
  </div>
</div>

<script>
"use strict";
const MANIFEST_URL = "/api/manifest";
const log  = document.getElementById("log");
const bar  = document.getElementById("prog-bar");
const pct  = document.getElementById("prog-pct");
const ptxt = document.getElementById("prog-text");
let   booting = false;

// ── Logging ──────────────────────────────────────────────────────────────
function addLine(cls, msg) {{
  if (!msg) {{ log.appendChild(document.createElement("br")); return; }}
  const d = document.createElement("div");
  d.className = "line " + cls;
  const icons = {{ok:"[✓]", info:"[·]", warn:"[!]", err:"[✗]", done:"[★]", xfer:"    "}};
  d.textContent = (icons[cls] || "[·]") + " " + msg;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}}

function setProgress(pctVal, label) {{
  bar.style.width = pctVal + "%";
  ptxt.textContent = label;
  pct.textContent  = pctVal.toFixed(0) + "%";
}}

// ── Real file downloader with byte progress ───────────────────────────────
async function downloadFile(url) {{
  const t0  = performance.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${{res.status}} ${{url}}`);

  const contentLength = parseInt(res.headers.get("Content-Length") || "0");
  const reader  = res.body.getReader();
  const chunks  = [];
  let received  = 0;

  while (true) {{
    const {{ done, value }} = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
  }}

  const elapsed = (performance.now() - t0) / 1000;
  const speed   = received / elapsed / 1024;
  const blob    = new Uint8Array(received);
  let   offset  = 0;
  for (const c of chunks) {{ blob.set(c, offset); offset += c.length; }}
  const text = new TextDecoder().decode(blob);

  return {{ text, bytes: received, elapsed, speed }};
}}

// ── Main boot sequence — real network fetches, real execution ─────────────
async function boot() {{
  if (booting) return;
  booting = true;
  document.getElementById("btn-boot").disabled = true;
  log.innerHTML = "";
  setProgress(0, "Fetching boot manifest...");

  try {{
    // Step 1: get real manifest from server
    addLine("info", "Connecting to network boot server...");
    addLine("info", "GET /api/manifest");
    const t0 = performance.now();
    const manifest = await fetch(MANIFEST_URL).then(r => {{
      if (!r.ok) throw new Error("Manifest fetch failed: " + r.status);
      return r.json();
    }});
    const ms = (performance.now() - t0).toFixed(0);

    addLine("ok", `Manifest received in ${{ms}}ms`);
    addLine("xfer", `  ${{manifest.count}} files · ${{(manifest.total_bytes/1024).toFixed(1)}} KB total`);
    addLine("info", "");
    setProgress(5, "Manifest OK");

    // Step 2: download boot-critical files in order, inject and execute
    const bootOrder = manifest.boot_order;  // real order from server
    const totalSteps = bootOrder.length + 2;
    let   step = 1;

    const loadedScripts = {{}};

    for (const relPath of bootOrder) {{
      const url      = "/One2lvOS" + relPath;
      const filename = relPath.split("/").pop();
      addLine("info", `Downloading ${{relPath}}`);

      let result;
      try {{
        result = await downloadFile(url);
      }} catch (e) {{
        addLine("err", `Failed: ${{filename}} — ${{e.message}}`);
        throw e;
      }}

      const kbps = result.speed.toFixed(0);
      const kb   = (result.bytes / 1024).toFixed(1);
      addLine("ok",   `${{filename}} — ${{kb}} KB @ ${{kbps}} KB/s`);
      loadedScripts[relPath] = result.text;

      step++;
      setProgress((step / totalSteps) * 90, `Loading ${{filename}}...`);
    }}

    // Step 3: inject scripts in correct dependency order
    addLine("info", "");
    addLine("info", "Injecting BIOS into runtime...");

    // Shader first (sets up WebGL context)
    if (loadedScripts["/BIOS/shader.js"]) {{
      const s = document.createElement("script");
      s.textContent = loadedScripts["/BIOS/shader.js"];
      document.head.appendChild(s);
      addLine("ok", "Aurora shader system injected");
    }}

    // State loader
    if (loadedScripts["/BIOS/state-loader.js"]) {{
      const s = document.createElement("script");
      s.textContent = loadedScripts["/BIOS/state-loader.js"];
      document.head.appendChild(s);
      // Instantiate StateLoader
      const initSL = document.createElement("script");
      initSL.textContent = "window.StateLoader = new StateLoader();";
      document.head.appendChild(initSL);
      addLine("ok", "State management layer injected");
    }}

    // Reactor Core kernel
    if (loadedScripts["/Kernel/reactor-core.js"]) {{
      const s = document.createElement("script");
      s.textContent = loadedScripts["/Kernel/reactor-core.js"];
      document.head.appendChild(s);
      const init = document.createElement("script");
      init.textContent = "window.ReactorCore = new ReactorCore();";
      document.head.appendChild(init);
      addLine("ok", "Reactor Core kernel injected");
    }}

    // BIOS bootloader last
    if (loadedScripts["/BIOS/boot.js"]) {{
      const s = document.createElement("script");
      s.textContent = loadedScripts["/BIOS/boot.js"];
      document.head.appendChild(s);
      addLine("ok", "BIOS bootloader injected");
    }}

    setProgress(95, "All files loaded — launching OS...");
    addLine("info", "");
    addLine("done", "Network boot complete. Launching One2lvOS...");
    setProgress(100, "Boot complete.");

    // Step 4: navigate to the actual OS
    await new Promise(r => setTimeout(r, 800));
    window.location.href = "/os";

  }} catch (err) {{
    addLine("err", "Boot failed: " + err.message);
    console.error(err);
    document.getElementById("btn-boot").disabled = false;
    booting = false;
    setProgress(0, "Boot failed.");
  }}
}}

// ── Node discovery ────────────────────────────────────────────────────────
async function showNodes() {{
  const wrap = document.getElementById("nodes");
  const row  = document.getElementById("node-row");
  wrap.style.display = "block";
  row.innerHTML = '<span style="color:#555;font-size:10px">Scanning...</span>';
  try {{
    const d = await fetch("/api/discover").then(r => r.json());
    row.innerHTML = "";
    d.nodes.forEach(n => {{
      const el = document.createElement("div");
      el.className = "node " + n.status;
      el.innerHTML = `<span class="dot ${{n.status === "online" ? "on" : "off"}}"></span>` +
                     `${{n.role.toUpperCase()}}  ${{n.ip}}:${{n.port}}`;
      row.appendChild(el);
    }});
  }} catch {{ row.innerHTML = '<span style="color:#f44">Scan failed</span>'; }}
}}

// ── Clock ─────────────────────────────────────────────────────────────────
setInterval(() => {{
  document.getElementById("s-time").textContent =
    new Date().toISOString().replace("T"," ").slice(0,19) + " UTC";
}}, 1000);

// ── Subtle background animation ───────────────────────────────────────────
(function() {{
  const canvas = document.getElementById("c");
  const ctx    = canvas.getContext("2d");
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const particles = Array.from({{length: 40}}, () => ({{
    x: Math.random()*canvas.width, y: Math.random()*canvas.height,
    vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
    r: Math.random()*1.5+.5
  }}));
  function frame() {{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {{
      p.x += p.vx; p.y += p.vy;
      if (p.x<0||p.x>canvas.width)  p.vx *= -1;
      if (p.y<0||p.y>canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle="rgba(0,255,0,.9)";
      ctx.fill();
    }});
    requestAnimationFrame(frame);
  }}
  frame();
}})();

// ── Auto-boot countdown ───────────────────────────────────────────────────
let countdown = 5;
const btn = document.getElementById("btn-boot");
btn.addEventListener("click", boot);
(function tick() {{
  if (booting) return;
  btn.textContent = `[ BOOT ONE2LVOS (${{countdown}}) ]`;
  if (--countdown < 0) {{ boot(); return; }}
  setTimeout(tick, 1000);
}})();
</script>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ip = local_ip()

    # Start TFTP server in background thread
    try:
        from tftp_server import TFTPServer
        tftp = TFTPServer(root_dir=ROOT_DIR, port=6969)
        t = threading.Thread(target=tftp.start, daemon=True)
        t.start()
        tftp_status = f"udp://{ip}:6969"
    except Exception as e:
        tftp_status = f"unavailable ({e})"

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║          ONE2LVOS  REAL NETWORK BOOT SERVER  v{BOOT_VERSION}           ║
╠══════════════════════════════════════════════════════════════╣
║  Boot Menu   →  http://{ip}:{PORT:<5}                        ║
║  OS Desktop  →  http://{ip}:{PORT:<5}/os                     ║
║  BIOS Setup  →  http://{ip}:{PORT:<5}/bios                   ║
║  Manifest    →  http://{ip}:{PORT:<5}/api/manifest           ║
║  Nodes       →  http://{ip}:{PORT:<5}/api/discover           ║
║  Health      →  http://{ip}:{PORT:<5}/health                 ║
╠══════════════════════════════════════════════════════════════╣
║  TFTP (PXE)  →  {tftp_status:<46}║
╠══════════════════════════════════════════════════════════════╣
║  iPXE:  chain --autofree http://{ip}:{PORT}/os               ║
╚══════════════════════════════════════════════════════════════╝
Press Ctrl+C to stop.
""")

    server = http.server.ThreadingHTTPServer((HOST, PORT), NetBootHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
