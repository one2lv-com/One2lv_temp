"""
Talk to Lumenis — interactive CLI chat client
Connects to the Lumenis Sovereign Core via WebSocket.
"""

import asyncio
import json
import sys
import websockets

LUMENIS_WS = "ws://localhost:8000/ws"

async def chat():
    print("╔═══════════════════════════════════════════════╗")
    print("║       LUMENIS SOVEREIGN CORE — CHAT           ║")
    print("║  Connected to: ws://localhost:8000/ws         ║")
    print("║  Type 'exit' to quit                          ║")
    print("╚═══════════════════════════════════════════════╝\n")

    async with websockets.connect(LUMENIS_WS) as ws:
        session_id = None

        while True:
            # Get user input
            try:
                user_input = input("You: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n[Disconnected]")
                break

            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit"):
                print("[Session ended]")
                break

            # Send message to Lumenis
            await ws.send(json.dumps({
                "type": "chat",
                "message": user_input,
                "session_id": session_id,
            }))

            # Collect streaming response
            response_parts = []

            while True:
                raw = await ws.recv()
                msg = json.loads(raw)
                event = msg.get("type")

                if event == "session_created":
                    session_id = msg["session_id"]

                elif event == "processing_start":
                    print("Lumenis: ", end="", flush=True)

                elif event == "seat_activity":
                    # Show which agent seat is active (dim indicator)
                    seat = msg.get("seat", "")
                    print(f"\n  [{seat}] ", end="", flush=True)

                elif event == "response_chunk":
                    chunk = msg.get("text", "")
                    response_parts.append(chunk)
                    print(chunk, end="", flush=True)

                elif event == "processing_done":
                    meta = msg.get("meta", {})
                    intent = meta.get("intent", "")
                    risk = meta.get("risk_level", "")
                    seats = ", ".join(meta.get("seats_activated", []))
                    print(f"\n  ↳ intent={intent} | risk={risk} | seats=[{seats}]\n")
                    break

                elif event == "error":
                    print(f"\n[Error from Lumenis]: {msg.get('message')}\n")
                    break

async def main():
    # Make sure server is up
    import urllib.request
    try:
        urllib.request.urlopen("http://localhost:8000/api/status", timeout=3)
    except Exception:
        print("[ERROR] Lumenis server is not running.")
        print("Start it with: python3 -m uvicorn lumenis-main:app --host 0.0.0.0 --port 8000")
        sys.exit(1)

    await chat()

if __name__ == "__main__":
    asyncio.run(main())
