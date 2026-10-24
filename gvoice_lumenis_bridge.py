#!/usr/bin/env python3
"""
Google Voice → Lumenis Bridge
Polls Gmail for new Google Voice messages (SMS, voicemail, missed calls)
and stores them in compass.db. Run with --brief to also tell Lumenis
what came in.

Google Voice number: (424) 431-1237
Gmail: exf0000000@gmail.com
"""
import asyncio, json, os, sqlite3, sys, time, urllib.request, urllib.parse, uuid
import websockets

MATON_API_KEY = os.environ.get("MATON_API_KEY", "")
COMPASS_DB    = os.environ.get("COMPASS_DB", os.path.join(os.path.dirname(os.path.abspath(__file__)), "compass.db"))
LUMENIS_WS    = os.environ.get("LUMENIS_WS", "ws://localhost:8000/ws")
GV_FROM       = "voice-noreply@google.com"


# ── Gmail helpers ─────────────────────────────────────────────────────────────

def gmail_get(path: str) -> dict:
    req = urllib.request.Request(f"https://api.maton.ai/google-mail{path}")
    req.add_header("Authorization", f"Bearer {MATON_API_KEY}")
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


def get_message_body(msg: dict) -> str:
    return msg.get("snippet", "").replace("&#39;", "'").replace("&amp;", "&")


def parse_gvoice_type(subject: str) -> str:
    s = subject.lower()
    if "voicemail" in s:   return "voicemail"
    if "missed call" in s: return "missed_call"
    if "sms" in s or "text" in s: return "sms"
    return "notification"


# ── Compass DB helpers ────────────────────────────────────────────────────────

def already_processed(msg_id: str) -> bool:
    db = sqlite3.connect(COMPASS_DB)
    row = db.execute(
        "SELECT id FROM facts WHERE key=?", (f"gvoice_msg_{msg_id}",)
    ).fetchone()
    db.close()
    return row is not None


def store_message(msg_id: str, gv_type: str, subject: str, date: str, snippet: str):
    db = sqlite3.connect(COMPASS_DB)
    now = time.time()
    db.execute(
        "INSERT OR REPLACE INTO facts (id, session_id, key, value, source, created_at) VALUES (?,?,?,?,?,?)",
        (str(uuid.uuid4()), "gvoice_bridge", f"gvoice_msg_{msg_id}",
         json.dumps({"type": gv_type, "subject": subject, "date": date, "snippet": snippet}),
         "gvoice_bridge", now)
    )
    db.commit()
    db.close()


def get_recent_gvoice(limit: int = 20) -> list:
    db = sqlite3.connect(COMPASS_DB)
    rows = db.execute(
        "SELECT value FROM facts WHERE key LIKE 'gvoice_msg_%' ORDER BY created_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    db.close()
    return [json.loads(r[0]) for r in rows]


# ── Lumenis WebSocket helper ──────────────────────────────────────────────────

async def send_to_lumenis(message: str) -> str:
    try:
        async with websockets.connect(LUMENIS_WS, ping_timeout=300, close_timeout=300) as ws:
            await ws.recv()  # consume init
            await ws.send(json.dumps({
                "action": "chat",
                "message": message,
                "session_id": "gvoice_briefing",
            }))
            chunks = []
            async for raw in ws:
                d = json.loads(raw)
                t = d.get("type", "")
                if t == "response_chunk":
                    chunks.append(d.get("text", ""))
                elif t == "processing_done":
                    break
                elif t == "error":
                    return f"[Error: {d.get('message','')}]"
            return "".join(chunks)
    except Exception as e:
        return f"[Lumenis unreachable: {e}]"


# ── Main ──────────────────────────────────────────────────────────────────────

def poll():
    """Fetch new Google Voice emails from Gmail and store in compass.db."""
    print(f"[{time.strftime('%H:%M:%S')}] Polling Gmail for Google Voice messages...")

    params = urllib.parse.urlencode({"q": f"from:{GV_FROM}", "maxResults": 20})
    result = gmail_get(f"/gmail/v1/users/me/messages?{params}")
    messages = result.get("messages", [])

    if not messages:
        print("  No messages found.")
        return 0

    new_count = 0
    for m in messages:
        msg_id = m["id"]
        if already_processed(msg_id):
            continue

        detail = gmail_get(
            f"/gmail/v1/users/me/messages/{msg_id}"
            "?format=metadata"
            "&metadataHeaders=Subject"
            "&metadataHeaders=From"
            "&metadataHeaders=Date"
        )
        headers = {h["name"]: h["value"] for h in detail["payload"]["headers"]}
        subject = headers.get("Subject", "")
        date    = headers.get("Date", "")
        snippet = get_message_body(detail)
        gv_type = parse_gvoice_type(subject)

        store_message(msg_id, gv_type, subject, date, snippet)
        print(f"  + [{gv_type}] {subject[:70]}")
        new_count += 1

    print(f"  Stored {new_count} new message(s). Total in DB: {new_count}")
    return new_count


async def brief_lumenis():
    """Send a batch summary of recent Google Voice activity to Lumenis."""
    messages = get_recent_gvoice(10)
    if not messages:
        print("No Google Voice messages in compass.db to brief.")
        return

    # Group by type
    by_type = {}
    for m in messages:
        t = m["type"]
        by_type.setdefault(t, []).append(m)

    lines = ["GOOGLE VOICE BRIEFING — (424) 431-1237\n"]
    for gv_type, items in by_type.items():
        lines.append(f"{gv_type.upper().replace('_',' ')} ({len(items)}):")
        for item in items[:3]:
            lines.append(f"  • {item['date'][:16]} — {item['subject']}")
            lines.append(f"    {item['snippet'][:100]}")
        lines.append("")

    lines.append("Council — acknowledge this activity. Note any messages that need follow-up.")
    briefing = "\n".join(lines)

    print(f"[{time.strftime('%H:%M:%S')}] Briefing Lumenis Council (may take a few minutes)...")
    print(briefing[:300])
    response = await send_to_lumenis(briefing)
    print(f"\nCouncil response:\n{response}")


def main():
    new = poll()
    if "--brief" in sys.argv or (new > 0 and "--no-brief" not in sys.argv):
        asyncio.run(brief_lumenis())
    elif new == 0:
        print("Nothing new. Use --brief to send a summary to Lumenis anyway.")


if __name__ == "__main__":
    main()
