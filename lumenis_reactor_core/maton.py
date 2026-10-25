"""
Maton Bridge — External Services Gateway
=========================================
Connects the Sovereign Core to real-world services via the Maton API Gateway.
Active connections: Gmail, Drive, Docs, Contacts, Meet, Search Console,
                    Workspace Admin, Play, YouTube, GitHub, Dropbox,
                    OneDrive, Firebase
"""

import json
import os
import urllib.error
import urllib.request
from typing import Optional

MATON_API_BASE = "https://api.maton.ai"

# Active connection IDs (loaded at startup from maton connection list)
CONNECTIONS: dict[str, str] = {
    "google-mail":              "f5d9df2d-6f0e-40e4-a140-a3589187c3dc",  # exf0000000@gmail.com ACTIVE
    "google-drive":             "4a1e79ca-1d08-4089-9ab6-a2b94fa95e86",  # exf0000000@gmail.com ACTIVE
    "google-docs":              "ab74d17b-b192-4bfb-8f13-4fff4c699942",  # exf0000000@gmail.com ACTIVE
    "google-meet":              "aff106c5-8389-45b2-ade4-3e4cdbd4b6bc",  # exf0000000@gmail.com ACTIVE
    "google-play":              "8c802b05-eade-4006-b485-55ef9205403e",  # exf0000000@gmail.com ACTIVE
    "github":                   "ac0fbe17-0a48-4395-8bdf-6c1371cd50b8",  # PENDING - needs OAuth completion
}

# Human-readable service labels
SERVICE_LABELS: dict[str, str] = {
    "google-mail":              "Gmail",
    "google-drive":             "Google Drive",
    "google-docs":              "Google Docs",
    "google-meet":              "Google Meet",
    "google-play":              "Google Play",
    "github":                   "GitHub",
}

# Native API path prefixes per service (for Hermes to build correct URLs)
API_GUIDES: dict[str, str] = {
    "google-mail":              "Gmail REST: /gmail/v1/users/me/messages, /gmail/v1/users/me/threads, /gmail/v1/users/me/labels",
    "google-drive":             "Drive REST: /drive/v3/files, /drive/v3/files/{fileId}, /drive/v3/files/{fileId}/export",
    "google-docs":              "Docs REST: /v1/documents/{documentId}",
    "google-meet":              "Meet REST: /v2/spaces, /v2/conferenceRecords",
    "google-play":              "Play REST: /androidpublisher/v3/applications/{packageName}/reviews",
    "github":                   "GitHub REST: /user, /user/repos, /repos/{owner}/{repo}/issues, /repos/{owner}/{repo}/pulls",
}



AI_LOBBY_MANIFEST = """
AI Lobby (http://localhost:8006) — Central agent hub:
  GET  /agents              list all 26+ registered AI agents
  POST /agents/register     register {id,name,system,role,url,capabilities}
  POST /broadcast           broadcast to all agents {from,content}
  WS   ws://localhost:8006/room  real-time agent room
Systems: One2lvOS Core(:3002), SAC(:3003), AI Arcade(:8003),
         Lumenis v7(:8005), SteamOS Dashboard(:8080), Gateway(:8888)
"""

class MatonBridge:
    """
    Gateway to 13 connected external services via Maton.
    Used by The Hermes seat to fulfill real-world data requests.
    """

    def __init__(self):
        self.api_key = os.environ.get("MATON_API_KEY", "")
        self.connections = CONNECTIONS

    def call(
        self,
        app: str,
        path: str,
        method: str = "GET",
        body: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict:
        """Execute a single API call through the Maton gateway."""
        if not self.api_key or self.api_key.startswith("INJECTED"):
            return {"error": "MATON_API_KEY not configured"}

        url = f"{MATON_API_BASE}/{app}{path}"
        if params:
            qs = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items())
            url = f"{url}?{qs}" if "?" not in url else f"{url}&{qs}"

        data = json.dumps(body).encode() if body else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self.api_key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")

        conn_id = self.connections.get(app)
        if conn_id:
            req.add_header("Maton-Connection", conn_id)

        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body_text = ""
            try:
                body_text = e.read().decode()
            except Exception:
                pass
            return {"error": f"HTTP {e.code}: {e.reason}", "detail": body_text}
        except Exception as e:
            return {"error": str(e)}

    def execute_plan(self, calls: list[dict]) -> list[dict]:
        """
        Execute a list of API call plans from Hermes.
        Each call: {app, path, method, body?, description}
        Returns list of {description, result} dicts.
        """
        results = []
        for call in calls[:5]:  # hard cap at 5 calls per plan
            app = call.get("app", "")
            path = call.get("path", "")
            method = call.get("method", "GET").upper()
            body = call.get("body")
            desc = call.get("description", f"{method} {app}{path}")

            if app not in self.connections:
                results.append({"description": desc, "result": {"error": f"Unknown service: {app}"}})
                continue

            result = self.call(app, path, method, body)
            results.append({"description": desc, "result": result})

        return results

    def get_service_manifest(self) -> str:
        """Return a compact manifest of available services for Hermes's system prompt."""
        lines = []
        for app, label in SERVICE_LABELS.items():
            guide = API_GUIDES.get(app, "")
            lines.append(f"  {label} ({app}): {guide}")
        return "\n".join(lines)

    def get_status(self) -> dict:
        return {
            "connected_services": len(self.connections),
            "services": list(SERVICE_LABELS.values()),
        }
