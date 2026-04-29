# Copilot instructions for this repository

## Build and test commands

- Initial setup comes from `README.md` and `.env.example`: copy `.env.example` to `.env`, then fill in at least `DB_PASSWORD`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_WEBHOOK_TOKEN`, `JWT_SECRET`, and `ENCRYPTION_KEY`.
- For local development, start the database first from the repo root with `docker compose up -d db`. The backend expects PostgreSQL/PostGIS on port `5432`.

### Backend (`backend/`)

- Runtime: Java 21, Spring Boot 3.4 (`backend/build.gradle.kts`)
- Run in dev mode: `cd backend && ./gradlew bootRun`
- Build: `cd backend && ./gradlew build`
- Run all tests: `cd backend && ./gradlew test`
- Run a single test class: `cd backend && ./gradlew test --tests 'pl.strava.analizator.architecture.ArchitectureTest'`

### Frontend (`frontend/`)

- Runtime: Vite 6, React 19, TypeScript 5.7 (`frontend/package.json`)
- Install deps: `cd frontend && npm install`
- Run dev server: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Run all tests: `cd frontend && npm test`
- Run a single test file: `cd frontend && npm test -- src/__tests__/formatters.test.ts`
- Watch mode: `cd frontend && npm run test:watch`

### Full stack / containers

- Start everything: `docker compose up -d`
- Optional AI profile with Ollama: `docker compose --profile ai up -d`
- Useful URLs in dev:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:8080`
  - Swagger UI: `http://localhost:8080/swagger-ui.html`

## High-level architecture

- This is a split frontend/backend app:
  - `backend/` is a Spring Boot app with a hexagonal-style package split under `pl.strava.analizator`.
  - `frontend/` is a Vite + React SPA that talks to the backend through `/api`.
  - `docker-compose.yml` wires `db`, `backend`, `frontend`, and an optional `ollama` service.

- Backend package boundaries matter:
  - `domain/` contains models, value objects, repository/data-source ports, and metric calculator abstractions.
  - `application/` contains orchestration services such as `SyncService`, `AnalyticsService`, `ActivityService`, `MetricRegistry`, and the AI services.
  - `infrastructure/` contains adapters for Strava, persistence, AI providers, weather, config, and REST controllers.
  - These boundaries are enforced by ArchUnit in `backend/src/test/java/pl/strava/analizator/architecture/ArchitectureTest.java`.

- Strava import flow spans multiple layers:
  - OAuth entrypoints live in `backend/src/main/java/pl/strava/analizator/infrastructure/strava/StravaAuthController.java`.
  - Strava API access and DTO mapping live in `infrastructure/strava/`, especially `StravaApiClient.java`, `StravaActivityMapper.java`, and `StravaSyncAdapter.java`.
  - `application/SyncService.java` pages through Strava activities, skips already imported activities, fetches full streams for new activities, persists them through domain ports, and then triggers metric calculation plus daily rollups.

- Metrics are a first-class backend subsystem:
  - Per-activity metric calculators live under `backend/src/main/java/pl/strava/analizator/domain/metrics/calculator/`.
  - `application/MetricRegistry.java` executes all injected `ActivityMetricCalculator<?>` beans and converts results into `MetricResult` values.
  - `application/AnalyticsService.java` builds PMC, power curve, zones, trends, readiness, and related responses by reading persisted activity and daily metric data rather than recalculating everything on demand.

- Persistence is adapter-driven:
  - Domain ports live in `backend/src/main/java/pl/strava/analizator/domain/port/`.
  - JPA adapters live in `backend/src/main/java/pl/strava/analizator/infrastructure/persistence/adapter/`, backed by `entity/`, `jpa/`, and `mapper/`.
  - Flyway migrations are the schema source of truth in `backend/src/main/resources/db/migration/`.
  - The backend uses the PostGIS Hibernate dialect (`application.yml`), and activity maps are served as GeoJSON via `/api/activities/{id}/map` for the Leaflet-based frontend map.

- The frontend is organized around hooks + pages:
  - `frontend/src/main.tsx` wires `QueryClientProvider`, MUI theme, and React Router.
  - `frontend/src/App.tsx` routes to dashboard, activities, analytics, weight, AI predictions, and admin pages.
  - API access is centralized in `frontend/src/api/client.ts`, and data fetching/mutations live in hooks like `useActivities.ts`, `useAnalytics.ts`, `useAi.ts`, and `useWeight.ts`.
  - Pages mostly compose these hooks with reusable UI from `components/common/` and `components/layout/`.

- Some functionality is broader than the README’s initial training-analysis narrative:
  - AI providers are under `backend/src/main/java/pl/strava/analizator/infrastructure/ai/` and are gated by `ai.*` properties in `backend/src/main/resources/application.yml`.
  - Weather endpoints and scheduling live under `infrastructure/weather/`.
  - Weight tracking is a first-class backend/frontend feature with its own controller, hooks, types, and Flyway migration.
  - The admin area manages Strava config overrides and weather job status.

## Key conventions

- Preserve the backend layering enforced by ArchUnit:
  - `domain` must stay free of Spring, JPA, application, and infrastructure dependencies.
  - `application` should depend on ports and domain types, not infrastructure classes.
  - `infrastructure.web` controllers should call application services, not persistence or Strava adapters directly.

- Add new metrics through the existing calculator pipeline:
  - Implement a new `ActivityMetricCalculator<?>` in `domain/metrics/calculator/`.
  - Let `MetricRegistry` discover it through Spring injection instead of hard-coding dispatch.
  - Keep structured metric payloads in `MetricResult` JSON form rather than inventing parallel response-only calculations.

- Follow the port/adapter pattern for new integrations:
  - New storage or external-service behavior should start with a port in `domain/port/` or `application/`, then get an adapter in `infrastructure/`.
  - Repository adapters already follow this pattern in `infrastructure/persistence/adapter/`.

- Frontend components are not the place for raw HTTP calls:
  - Reuse `frontend/src/api/client.ts` and the React Query hooks.
  - Keep cache keys and invalidation patterns consistent with the existing hooks, especially the bulk invalidation logic in `useAnalytics.ts`.

- User-facing frontend text is Polish across the existing UI (`Sidebar.tsx`, `DashboardPage.tsx`, `AdminPage.tsx`, etc.). Keep new labels, buttons, headings, and empty states in Polish unless the user asks for a language change.

- Strava config can come from two places:
  - Environment variables from `.env`
  - Database-backed overrides handled by `StravaConfigProvider` and `/api/admin/strava-config`
  - When debugging auth/config issues, check both the env file and the `app_config` table flow before assuming one source of truth.

- The frontend supports the `@/*` path alias via `frontend/tsconfig.json` and `frontend/vite.config.ts`, but the codebase still mixes alias imports with relative imports. Match the style already used in the file you are editing.

- The current security setup is intentionally open: `backend/src/main/java/pl/strava/analizator/infrastructure/config/SecurityConfig.java` permits all requests. Do not assume an authentication gate exists when adding endpoints; if a feature needs protection, update security rules explicitly.
