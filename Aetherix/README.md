# One2lvOs v2 (Browser Operating System)

Features:
- WebOS UI (Terminal + Packages)
- WebSocket live server (/ws)
- Upload/Download files (/api/files)
- Persistent AI memory on server (data/memory.json)
- AI injection via OpenAI server-side (no keys in browser)
- OBS control (optional) via OBS WebSocket v5 (default port 4455)

## Run
1) Install deps
   npm install

2) Set environment (optional)
   export OPENAI_API_KEY="..."
   export OBS_PASSWORD="..."   # if OBS WebSocket auth enabled
   export OBS_HOST="127.0.0.1"
   export OBS_PORT="4455"

3) Start
   npm start

Open:
http://127.0.0.1:8080

## OBS
Enable OBS WebSocket (OBS v28+ includes it).
Default port for v5 is 4455.

## Security
- This template does not execute arbitrary OS commands.
- It controls OBS through its websocket API and exposes limited endpoints.


## Twitch (Chat + AI Moderator)
This build adds a Twitch IRC bridge (server-side) + UI controls.

### Connect
In the Web UI, enter:
- Channel (without '#')
- Bot username (lowercase login)
- OAuth token (format: oauth:xxxxx)

Twitch IRC uses PASS oauth:<token>, NICK <login>, JOIN #channel. citeturn0search0

### AutoMod modes
- suggest: AI flags messages in the UI only
- timeout: AI sends `/timeout <user> <seconds> <reason>` into chat (bot must be a mod)

Environment variables (optional):
- TWITCH_CHANNEL, TWITCH_NICK, TWITCH_OAUTH
- TWITCH_IRC_HOST (default irc.chat.twitch.tv)
- TWITCH_IRC_PORT (default 6697)
