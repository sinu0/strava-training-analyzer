# Strava Training Analyzer

A private, self-hosted app for cycling training analysis. It imports activities from Strava, calculates metrics (NP, TSS, IF, CTL/ATL/TSB, power curve, zones), helps plan training and runs workouts on a smart trainer.

- **Today** — one recommendation for the day with its evidence, current load and the next workout
- **History & Analysis** — list, calendar, map, period comparison, power and recovery
- **Plan** — calendar, workout library, load scenario
- **Trainer mode** — Bluetooth (FTMS + HR strap), ERG, ride recording and FIT export
- **More** — weather, route planner with heatmap, segments, health, weight, optional AI

Runs locally (bound to `127.0.0.1`), dark theme, mobile-first. The UI is in Polish.

## Quick start

Requires Docker 24+ with Compose and a Strava API application ([how to](docs/INSTALLATION.md#1-strava-api-application)).

```bash
cp .env.example .env        # fill in DB_PASSWORD, STRAVA_*, JWT_SECRET, ENCRYPTION_KEY
docker compose up -d --build
```

Open **http://localhost** → **Ustawienia** (Settings) → **Połącz ze Stravą** (Connect with Strava), then **Dane i zadania** (Data & jobs) → **Pełny import** (Full import).

| Service | URL |
|---|---|
| App | http://localhost |
| API / Swagger | http://localhost:8080/swagger-ui.html |
| Database | localhost:5432 |

## Documentation

| Topic | File |
|---|---|
| Installation, `.env`, Docker, dev mode | [docs/INSTALLATION.md](docs/INSTALLATION.md) |
| First run, import, screens | [docs/USAGE.md](docs/USAGE.md) |
| Trainer mode, phone, PWA, Garmin | [docs/WORKOUT_EXECUTION_PWA.md](docs/WORKOUT_EXECUTION_PWA.md) |
| LAN access (HTTPS + password) | [docs/LAN_ACCESS.md](docs/LAN_ACCESS.md) |
| Backups | [docs/BACKUP_AND_RECOVERY.md](docs/BACKUP_AND_RECOVERY.md) |
| Development: tests, architecture, API contract | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| Troubleshooting | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |

## Tech stack

Java 21 · Spring Boot 3 · PostgreSQL 16 + PostGIS · React 19 · TypeScript · MUI · TanStack Query · Leaflet · Recharts · optional Ollama / OpenAI / Anthropic / Gemini.

## License

[GNU GPL v3](LICENSE) — free to use, study and modify; derivative works must remain GPL v3.
