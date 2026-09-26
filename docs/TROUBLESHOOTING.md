# Troubleshooting

[← README](../README.md)

| Symptom | What to do |
|---|---|
| Database does not start | `docker compose logs db`; check that port 5432 is free: `ss -tlnp \| grep 5432` |
| Flyway migration error (dev) | `docker compose down -v && docker compose up -d db` — **deletes data**, take a [backup](BACKUP_AND_RECOVERY.md) first |
| "Połącz ze Stravą" is disabled | set Client ID and Secret in Settings or `.env` |
| Strava 401 | token expired and could not be refreshed — reconnect in Settings |
| Strava 429 (rate limit) | the job resumes by itself after the limit resets; see **Data & jobs** |
| Wrong URL after Strava authorization | set `APP_FRONTEND_URL` in `.env` to the address you open the app from |
| Frontend cannot reach the API (dev) | backend must run on :8080; check the Network tab in the browser (F12) |
| Bluetooth / PWA not working on the phone | HTTPS is required — [LAN_ACCESS.md](LAN_ACCESS.md), [WORKOUT_EXECUTION_PWA.md](WORKOUT_EXECUTION_PWA.md) |
| AI unavailable | `AI_ENABLED=true` + the provider flag; for Ollama also `COMPOSE_PROFILES=ai` ([installation](INSTALLATION.md#ai-optional)) |
