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
- Lint shared frontend code: `cd frontend && npm run lint`
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
  - `application/SyncService.java` pages through Strava activities, skips already imported activities, fetches full streams for new activities, persists them through domain ports, triggers metric calculation plus daily rollups, and enqueues AI note generation for each new activity.

- AI module has two subsystems:
  - **AI Predictions** (`application/ai/AiPredictionService.java`): Global predictions (FTP, fatigue, overtraining risk, etc.) using 6 prediction types with prompt templates, multiple LLM providers, custom prompts, RAG, and batch scheduling.
  - **AI Activity Notes** (`application/ai/AiActivityNoteService.java`): Per-activity coaching analysis that examines time-series data (power variability, HR drift, cadence), computed metrics, and historical context to produce a markdown-formatted training review. Notes are generated via background queue (`ai_note_queue` table, processed by `AiNoteQueueProcessor` every 30s) or on-demand. Users can also ask follow-up questions about the note.
  - REST endpoints for notes: `GET/POST /api/activities/{id}/ai-note/*` (get, generate, refresh, ask).
  - Domain models: `AiActivityNote`, `AiNoteJob` in `domain/ai/`; ports in `domain/port/`.

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
  - AI activity notes use a background job queue (`ai_note_queue` table) to generate coaching notes without blocking sync operations. The queue processor runs every 30s (configurable via `ai.note-queue.interval-ms`).
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

- The frontend supports the `@/*` path alias via `frontend/tsconfig.json` and `frontend/vite.config.ts`. Prefer `@/` imports for code in `src/`, and only keep relative imports when a file already consistently uses them and changing them would add noise to the current task.

- Shared UI primitives in `frontend/src/components/common/` and shell components in `frontend/src/components/layout/` are treated as public building blocks. Keep a short JSDoc comment above each exported component and update it when the component contract changes.

- Frontend linting is part of the consistency gate:
  - Run `cd frontend && npm run lint` after changing shared components, layout code, or imports.
  - Keep import groups ordered as external packages → `@/` aliases → local relative files.
  - Avoid raw non-boolean JSX guards in shared components; use explicit ternaries or boolean coercion when conditional rendering depends on values that may be strings, numbers, or arrays.
  - Do not use array indexes as React keys when stable domain data (id, date, label, slug) is available.

- The current security setup is intentionally open: `backend/src/main/java/pl/strava/analizator/infrastructure/config/SecurityConfig.java` permits all requests. Do not assume an authentication gate exists when adding endpoints; if a feature needs protection, update security rules explicitly.

## Development methodology

> **⚠️ NON-NEGOTIABLE RULES — these override everything else:**
> 1. **Tests must always pass.** If ANY test is failing — regardless of whether it is related to the current task — STOP and fix it before continuing. Never leave the repository in a broken state.
> 2. **Always follow TDD.** Write the failing test first, then write the minimum code to make it pass, then refactor. No exceptions.
> 3. **Always respect the Clean Architecture layer boundaries.** Violations of the `domain / application / infrastructure` separation must be fixed immediately, even if caught in unrelated code.

### Test-Driven Development (TDD)
- **Write the test first** — the Red → Green → Refactor cycle is mandatory, not optional.
- Backend: write JUnit 5 tests in `backend/src/test/` **before** adding any class to `src/main/`.
- Frontend: write Vitest tests in `frontend/src/__tests__/` **before** implementing components or utilities.
- Every new public method, bug fix, and every new React component or meaningful UI behavior must have automated tests.
- Use `assertThat` (AssertJ) for backend assertions; use `@testing-library/react` + `expect` (Vitest) on the frontend.
- **Before starting any task:** run the full test suite and fix every failing test first — `cd backend && ./gradlew test` and `cd frontend && npm test`.
- **After every change:** run the full test suite again. If anything broke, fix it before moving on.
- Do not deliver a feature while tests are failing — green suite is the definition of "done".
- Target ≥80% line coverage on new code. Do not reduce coverage for existing modules.

### Clean Code
- Functions and methods do one thing only; keep them short (aim for < 20 lines).
- Name things clearly — prefer `calculateOptimalWeeklyLoad` over `calc` or `doWork`.
- No magic numbers: extract constants with descriptive names.
- Remove dead code and commented-out blocks immediately.
- Avoid deep nesting: use early returns / guard clauses.
- Backend: use Lombok (`@Getter`, `@Builder`, `@RequiredArgsConstructor`) consistently; never write manual getters/setters.
- Frontend: prefer `const` over `let`, destructure props, and keep components under 100 lines.

### Clean Architecture (backend)
- **Layer boundaries are strictly enforced by ArchUnit and must never be violated:**
  - `domain/` — pure Java business logic, no Spring, no JPA, no infrastructure imports.
  - `application/` — orchestration services; depends on domain ports and models only.
  - `infrastructure/` — Spring beans, JPA adapters, REST controllers, external integrations.
- **If you discover an architecture violation anywhere — even in code unrelated to your task — fix it immediately.**
- New features follow the same flow: domain model/port → application service → infrastructure adapter/controller.
- DTOs live in `application/dto/`; entities live in `infrastructure/persistence/entity/`.
- Controllers call application services only — never repositories or domain calculators directly.
- New metric calculators implement `ActivityMetricCalculator<T>` (for per-activity) or `TimeSeriesMetricCalculator<T>` (for daily aggregates) and are discovered by Spring injection via `MetricRegistry`.
- Run `./gradlew test --tests 'pl.strava.analizator.architecture.ArchitectureTest'` to verify boundaries after every structural change.

### Clean Architecture (frontend)
- **Layer separation is mandatory:** API calls in `api/client.ts`, data fetching in hooks (`hooks/`), presentation in components (`components/`), pages in `pages/`.
- No raw `fetch`/`axios` calls inside components or pages — always use a React Query hook.
- Shared types live in `types/`; do not duplicate type definitions.
- Components receive data as props; hooks own the loading/error state.
- Keep components pure where possible — no side effects inside render.
- Prefer `@/` imports for cross-folder references inside `src/`; keep relative imports for same-folder neighbors.
- Shared components in `components/common/` and `components/layout/` should expose a small documented surface: colocated props, short JSDoc, and stable prop names.
- Let ESLint own import ordering instead of ad-hoc manual sorting. Keep groups clean: external packages first, then `@/` aliases, then local relatives.
- When rendering collections, use stable business keys instead of array indexes.
- When rendering conditionally, avoid leaking raw values into JSX; prefer boolean coercion or explicit ternaries.
