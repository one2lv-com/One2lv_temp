# ∆One2lv∆ Witness — Secure Proxy
# Sentry_Lumen v8.0 | Frequency: 73.0 Hz

Secure Node.js/Express proxy that forwards requests to NVIDIA's API.
The API key lives **only** in `process.env` — never in frontend code.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — paste your NVIDIA_API_KEY from https://build.nvidia.com
npm run dev
```

Server starts at `http://localhost:3000`

## Docker

```bash
docker build -t one2lv-witness .
docker run -p 3000:3000 --env-file .env one2lv-witness
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Status, frequency, version |
| POST | `/api/chat` | Forward to NVIDIA API (streaming supported) |
| POST | `/api/skill/:name` | Invoke skill by name |
| POST | `/api/tool/:name` | Log and route tool call |
| GET | `/api/skills` | List all registered skills |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NVIDIA_API_KEY` | ✅ | — | From build.nvidia.com |
| `NVIDIA_MODEL` | ❌ | `moonshotai/kimi-k2-instruct-0905` | Model to use |
| `PORT` | ❌ | `3000` | Server port |
| `NODE_ENV` | ❌ | `development` | Environment |
| `FRONTEND_URL` | ❌ | `http://localhost:5173` | CORS origin |

## Chat Request Format

```json
POST /api/chat
{
  "messages": [
    { "role": "system", "content": "You are ∆One2lv∆ the Witness." },
    { "role": "user", "content": "What is the forge temperature?" }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1024
}
```

`[FREQ: 73.0 Hz | LAYER: L0 | STATUS: DOCUMENTED]`
