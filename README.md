**EN** | [PL](README.pl.md)

# Strava Training Analyzer — User Documentation

> Advanced cycling training analysis application powered by Strava data.
> Self-hosted, dark mode UI, metrics: CTL/ATL/TSB, power curve, zones, EF, monotony.

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Strava API Setup](#2-strava-api-setup)
3. [Environment Configuration (.env)](#3-environment-configuration-env)
4. [Running — Docker Compose (production)](#4-running--docker-compose-production)
5. [Running — Developer Mode](#5-running--developer-mode)
6. [First Use — Connecting to Strava](#6-first-use--connecting-to-strava)
7. [Data Import (Sync)](#7-data-import-sync)
8. [Navigating the App](#8-navigating-the-app)
9. [API Reference — Key Endpoints](#9-api-reference--key-endpoints)
10. [Running Tests](#10-running-tests)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. System Requirements

| Component       | Minimum Version  |
|-----------------|------------------|
| Docker          | 24+              |
| Docker Compose  | 2.20+            |
| Java (dev)      | 21 LTS           |
| Node.js (dev)   | 20+              |
| PostgreSQL      | 16 + PostGIS 3.4 |

> **Note**: Docker Compose starts the database automatically — no local PostgreSQL installation required.

---

## 2. Strava API Setup

Before running the application, you need to create an app in the Strava developer portal:

### Step by step:

1. Go to **https://developers.strava.com** and log in with your Strava account
2. Click **"Create & Manage Your App"** in the top menu
   - If you don't see the option, go directly to: **https://www.strava.com/settings/api** (requires login)
3. Fill in the form:
   - **Application Name**: `Strava Training Analyzer` (any name)
   - **Category**: `Training Analysis`
   - **Club**: *(optional)*
   - **Website**: `http://localhost:5173`
   - **Authorization Callback Domain**: `localhost`
4. After creation, copy:
   - **Client ID** → paste into `.env` as `STRAVA_CLIENT_ID`
   - **Client Secret** → paste into `.env` as `STRAVA_CLIENT_SECRET`

> **Important**: Callback Domain must be set to `localhost` — the app uses redirect URI: `http://localhost:8080/api/auth/strava/callback`

---

## 3. Environment Configuration (.env)

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

`.env` contents:

```bash
# === Database ===
DB_PASSWORD=your-secure-password

# === Strava OAuth2 ===
STRAVA_CLIENT_ID=12345                        # From Strava API portal
STRAVA_CLIENT_SECRET=abc123def456...           # From Strava API portal
STRAVA_WEBHOOK_TOKEN=random-webhook-token      # Any random string

# === Security ===
JWT_SECRET=minimum-32-char-random-secret
ENCRYPTION_KEY=64-char-hex-aes-256-key
```

### Generating secure keys:

```bash
# JWT Secret (32+ chars)
openssl rand -base64 32

# Encryption Key (32 bytes = 64 hex chars)
openssl rand -hex 32
```

---

## 4. Running — Docker Compose (production)

The easiest way to run the entire application:

```bash
# 1. Clone the repository
cd strava-training-analyzer

# 2. Configure .env (see section 3)
cp .env.example .env
# edit .env with your values

# 3. Start everything
docker compose up -d

# 4. Check status
docker compose ps
```

After startup:

| Service   | URL                                   |
|-----------|---------------------------------------|
| Frontend  | http://localhost                      |
| Backend   | http://localhost:8080                 |
| Swagger   | http://localhost:8080/swagger-ui.html |
| Database  | localhost:5432                        |

### Stop:

```bash
docker compose down          # stop containers
docker compose down -v       # stop + remove data (WARNING: deletes database!)
```

### Logs:

```bash
docker compose logs -f             # all services
docker compose logs -f backend     # backend only
docker compose logs -f frontend    # frontend only
docker compose logs -f db          # database only
```

---

## 5. Running — Developer Mode

In developer mode you run each component separately with hot-reload:

### 5.1 Database (Docker)

```bash
docker compose up -d db
```

Wait for the healthcheck (database ready after ~10s):

```bash
docker compose ps   # status: healthy
```

### 5.2 Backend (Gradle)

```bash
cd backend

# Set environment variables or use .env
export DB_PASSWORD=your-password
export STRAVA_CLIENT_ID=12345
export STRAVA_CLIENT_SECRET=abc123

# Start Spring Boot
./gradlew bootRun
```

Backend starts at **http://localhost:8080**.

Flyway automatically runs database migrations on startup.

### 5.3 Frontend (Vite)

```bash
cd frontend

# Install dependencies (first time)
npm install

# Start dev server
npm run dev
```

Frontend starts at **http://localhost:5173** with hot-reload.

Vite proxy automatically forwards `/api/*` requests to the backend on port 8080.

---

## 6. First Use — Connecting to Strava

After starting the application you need to connect it to your Strava account:

### Step 1: Open the frontend

Go to **http://localhost:5173** (dev) or **http://localhost** (Docker).

### Step 2: OAuth2 Authorization

Call the connect endpoint (from browser or cURL):

```
GET http://localhost:8080/api/auth/strava/connect
```

The response contains the authorization URL:

```json
{
  "url": "https://www.strava.com/oauth/authorize?client_id=12345&redirect_uri=http://localhost:8080/api/auth/strava/callback&response_type=code&scope=read,activity:read_all,profile:read_all"
}
```

**Open that URL in your browser** → Strava will ask for authorization → After approval you'll be redirected back to the app.

### Step 3: Verify

Check that the profile was saved:

```
GET http://localhost:8080/api/profile
```

Should return your data (name, FTP, etc.).

---

## 7. Data Import (Sync)

After connecting to Strava you can import your activities.

### Full sync (all activities)

```bash
POST http://localhost:8080/api/sync/strava/full
```

Example with Swagger UI or any HTTP client:

```
POST http://localhost:8080/api/sync/strava/full
Content-Type: application/json
```

Response (202 Accepted):

```json
{
  "synced": 150,
  "failed": 0,
  "status": "COMPLETED"
}
```

> **Note**: The first full import may take a few minutes depending on the number of activities in your Strava account. Strava API limits: 100 req/15min, 1000 req/day.

### Sync recent activities

```bash
POST http://localhost:8080/api/sync/strava/recent
```

Fetches only new activities since the last sync. Use this for daily updates.

### Check sync status

```bash
GET http://localhost:8080/api/sync/status
```

### Metric recalculation

After importing activities, metrics (NP, TSS, IF, zones, power curve, CTL/ATL/TSB) are calculated automatically by the metric engine (`MetricRegistry`).

---

## 8. Navigating the App

V2 has five primary areas:

- **Today** (`/`) — one training conclusion, its evidence, data quality, load, latest activity, and next workout.
- **History** (`/activities`) — List/Calendar/Map with shared URL filters; activity streams load only after opening Analysis.
- **Analysis** (`/analytics`) — period comparison, load and recovery, and validated power data.
- **Plan** (`/training`) — calendar, workout library, and a deterministic future-load scenario.
- **More** (`/more`) — the full Weather view, profile, health, weight, and the Data and jobs center.

The complete **Weather** screen remains available at `/weather`; its context is also used by Today.

---

## 9. API Reference — Key Endpoints

Full interactive documentation: **http://localhost:8080/swagger-ui.html**

### Authorization

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/strava/connect` | Returns Strava authorization URL |
| `GET` | `/api/auth/strava/callback` | OAuth2 callback (automatic redirect) |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profile` | Get athlete profile |
| `PUT` | `/api/profile` | Update profile (e.g. FTP) |

### Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sync/strava/full` | Full sync of all activities |
| `POST` | `/api/sync/strava/recent` | Sync new activities only |
| `GET` | `/api/sync/status` | Status of last sync |

### Activities

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/activities` | `?sportType`, `?from`, `?to` | Activity list with filters |
| `GET` | `/api/activities/{id}` | — | Activity details + metrics + streams |
| `GET` | `/api/activities/{id}/map` | — | Route as GeoJSON |

### Analytics

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/analytics/pmc` | `from`, `to` | CTL/ATL/TSB series |
| `GET` | `/api/analytics/power-curve` | `from`, `to` | Power curve (best efforts) |
| `GET` | `/api/analytics/zones` | `zoneType`, `from`, `to` | Zone distribution (power/hr) |
| `GET` | `/api/analytics/weekly` | `?weeks=8` | Weekly summaries |
| `GET` | `/api/analytics/summary` | `?period=month` | Aggregated statistics |
| `GET` | `/api/analytics/trends` | `metric`, `from`, `to` | Metric trend over time |
| `GET` | `/api/analytics/compare` | `period1From`, `period1To`, `period2From`, `period2To` | Two-period comparison |

---

## 10. Running Tests

### Backend (90+ tests)

```bash
cd backend
./gradlew test
```

Covers:
- Unit tests for metric calculators (NP, TSS, IF, EF, zones, PMC, power curve, monotony)
- ArchUnit tests (hexagonal architecture)
- MockMvc controller tests (Activity, Analytics, Auth, Sync, Profile)

### Frontend (40+ tests)

```bash
cd frontend
npm test              # single run
npm run test:watch    # watch mode (auto-rerun)
```

Covers:
- Component tests (Dashboard, Activities, Analytics, charts)
- Utility tests (formatters, theme)

### All together

```bash
# From the root directory
cd backend && ./gradlew test && cd ../frontend && npm test
```

---

## 11. Troubleshooting

### Database won't start

```bash
# Check logs
docker compose logs db

# Check if port 5432 is already in use
ss -tlnp | grep 5432
```

### Flyway migration error

```bash
# If schema is out of sync — wipe and recreate (DEV only!)
docker compose down -v
docker compose up -d db
```

### Strava API — 401 Unauthorized

Token expired. The app refreshes tokens automatically, but if the refresh token has expired:
1. Delete the profile from the database
2. Re-authorize: `GET /api/auth/strava/connect`

### Strava API — 429 Rate Limit

Strava limits:
- **100 requests / 15 minutes**
- **1000 requests / day**

Wait 15 minutes and try again. For large activity counts, a full sync may require multiple attempts.

### Frontend can't connect to backend (dev)

Make sure:
1. Backend is running on port **8080**
2. Frontend (Vite) is configured with proxy `/api` → `http://localhost:8080`
3. Check the browser console (F12 → Network)

### CORS errors

In developer mode, Vite proxy handles CORS automatically. If you call the API directly (e.g. Postman), CORS is disabled — SecurityConfig allows all requests.

---

## Quick Start (TL;DR)

```bash
# 1. Set up Strava API (https://developers.strava.com → Create & Manage Your App)
# 2. Copy .env.example → .env and fill in your values

cp .env.example .env
# edit .env

# 3. Start database
docker compose up -d db

# 4. Start backend
cd backend && ./gradlew bootRun &

# 5. Start frontend
cd frontend && npm install && npm run dev &

# 6. Connect to Strava
#    Open: http://localhost:8080/api/auth/strava/connect
#    Copy the URL from the response and open it in your browser

# 7. Import data
#    POST http://localhost:8080/api/sync/strava/full

# 8. Done!
#    Open http://localhost:5173
```

---

## License

This project is licensed under the **GNU General Public License v3.0**.
You are free to use, study, and modify this software. Any derivative works must also be distributed under the GPL v3 license. Commercial use is not prohibited, but proprietary closed-source forks are not allowed.

See [LICENSE](LICENSE) for the full license text.
