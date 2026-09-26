# Installation

[← README](../README.md)

## 1. Strava API application

1. Go to https://www.strava.com/settings/api and create an application.
2. **Website**: `http://localhost`, **Authorization Callback Domain**: `localhost`.
3. Copy **Client ID** and **Client Secret** into `.env` (or enter them later in the app's Settings).

The backend uses the callback URL `http://localhost:8080/api/auth/strava/callback`.

## 2. `.env` file

```bash
cp .env.example .env
openssl rand -base64 32   # → JWT_SECRET
openssl rand -hex 32      # → ENCRYPTION_KEY (encrypts Strava tokens — keep it safe)
```

| Variable | Required | Description |
|---|---|---|
| `DB_PASSWORD` | yes | database password |
| `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` | yes* | Strava app credentials (*or set in Settings) |
| `STRAVA_WEBHOOK_TOKEN` | yes | any random string |
| `JWT_SECRET`, `ENCRYPTION_KEY` | yes | secrets from the commands above |
| `APP_TIMEZONE` | no | default `Europe/Warsaw` |
| `APP_FRONTEND_URL` | no | where to return after Strava authorization (default `http://localhost:5173`) |
| `AI_*`, `COMPOSE_PROFILES` | no | AI module — see below |

### AI (optional)

The app is fully functional without AI. Local Ollama in Docker:

```env
AI_ENABLED=true
AI_OLLAMA_ENABLED=true
COMPOSE_PROFILES=ai
```

Other providers (OpenAI, Anthropic, Gemini, Azure): set `AI_<PROVIDER>_ENABLED=true` and the API key. Full list of variables: `.env.example`.

## 3. Docker (recommended)

```bash
docker compose up -d --build     # start / rebuild
docker compose ps                # status
docker compose logs -f backend   # logs of one service
docker compose down              # stop (data is kept)
docker compose down -v           # stop + DELETE the database
```

Variants: `docker-compose.https.yml` — [LAN access](LAN_ACCESS.md), `docker-compose.gpu.yml` — Ollama on GPU.

## 4. Development mode (hot reload)

Requires Java 21 and Node.js 20+.

```bash
docker compose up -d db                    # database only
cd backend && ./gradlew bootRun            # :8080, Flyway migrations run automatically
cd frontend && npm install && npm run dev  # :5173, /api proxied to :8080
```
