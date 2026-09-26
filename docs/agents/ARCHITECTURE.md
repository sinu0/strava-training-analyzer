# Architecture — map for agents

Read only the section your task needs. Feature details → `FEATURE_MAP.md`.

## Stack and runtime

| Layer | Technology | Where |
|---|---|---|
| Backend | Java 21, Spring Boot 3.4, Gradle KTS, springdoc | `backend/` |
| Database | PostgreSQL 16 + PostGIS + pgvector, Flyway (V1…V62, forward-only) | `backend/src/main/resources/db/migration/`, image `db/Dockerfile` |
| Frontend | React 19, TS, Vite, MUI 9, TanStack Query, Recharts, Leaflet | `frontend/` |
| AI (optional) | Ollama/OpenAI/Anthropic/Gemini/Azure, prompts as files | `backend/src/main/resources/ai/prompts/` |
| Graphics (GPU) | Python + Z-Image-Turbo; Node asset studio (SVG from LLM, Z-Image sets) | `image-gen/`, `tools/llm-svg-studio/` (local, not in git) |

Compose: `db` :5432, `backend` :8080, `frontend` (nginx) :80, `ollama` (profile `ai`) :11435 — all bound to `127.0.0.1`.
Dev: frontend `npm run dev` → :5173 with proxy `/api` → :8080. Swagger: `:8080/swagger-ui.html`.
Variants: `docker-compose.https.yml` (LAN + password, `docs/LAN_ACCESS.md`), `docker-compose.test.yml` (E2E), `docker-compose.gpu.yml`.

## Backend — package `pl.strava.analizator`

```
domain/        pure POJOs, no Spring/JPA (enforced by ArchUnit: src/test/.../architecture/ArchitectureTest.java)
  model/ vo/     domain entities and value objects
  port/          outbound interfaces (repositories, data sources, export, weather…)
  metrics/calculator/  ActivityMetricCalculator<?> — every calculator is a bean
  coach/ workout/ ai/ gamification/ journal/ equipment/ challenge/  subdomain logic
application/   services (orchestration, @Service), DTOs in application/dto (classes, not records), ai/ (predictions, RAG, MCP)
infrastructure/
  web/           REST controllers (+ web/v2), GlobalExceptionHandler
  persistence/   entity/ jpa/ mapper/ adapter/ (port implementations), ai/
  strava/        OAuth, StravaApiClient, StravaSyncAdapter, mapper
  ai/            LLM provider adapters (+ v2)
  weather/ routing/ export/ (FIT, ZWO) delivery/ config/
```

Dependency rules: `web → application → domain(port)`; `infrastructure.*` implements ports. A controller never calls JPA or the Strava adapter directly.

## Key flows

- **Strava import**: `SyncController`/`V2JobController` → `ImportJobService` + `ImportJobRunner` (persistent jobs, stages `FETCH_SUMMARY → FETCH_DETAIL → STORE_ACTIVITY → CALCULATE_METRICS → UPDATE_DAILY → DERIVE_INSIGHTS → COMPLETE`) → `SyncService` → `StravaSyncAdapter`. Jobs: retry (`ProcessingJobRetryScheduler`), recovery after restart, no parallel jobs of the same type.
- **Metrics**: `MetricRegistry` runs every `ActivityMetricCalculator` bean → `MetricResult` (calculator version, fingerprint, `computedAt`, `asOf`) → `MetricPersistenceService`. Daily: `DailyMetricsService`, load: `TrainingLoadService` (CTL/ATL/TSB). Reads (`AnalyticsService`) use stored values, no recalculation. Recalculation: `RecalculationJobService`.
- **Planning and coaching**: `TrainingPlanService` (calendar, programs, templates), `CoachService`/`CoachingService` (deterministic policy over the `AthleteSnapshotService` snapshot), `LoadScenarioService`, `WeeklyReviewService`.
- **Workout execution**: `WorkoutExecutionService` (event log, offline sync), `WorkoutEvaluationService` + `domain/workout/WorkoutComplianceEvaluator` (`workout-compliance-v3`, timeline reconstruction), `RideRecordingService` + `infrastructure/export/FitActivityEncoder` (trainer recording → FIT).
- **AI**: only behind `AI_ENABLED` + provider flag. AI never computes metrics — it only explains. Prompts: `resources/ai/prompts/<type>/system.md|few_shot.md`, registry `application/ai/PromptRegistry`.

## API contract (OpenAPI → TS)

`./gradlew integrationTest` writes `backend/build/openapi.json` → `cd frontend && npm run api:generate` → `src/api/generated/schema.ts` (**300 kB, generated — never read it whole, grep by DTO name**). CI checks `npm run api:check`.

## Frontend — `frontend/src`

```
App.tsx          routing (lazy); /workout/:id and /design-system outside the layout
features/<area>/ NEW code: page + hook + area types (today, history, analysis, plan, workout, data, segments, matched-rides, more, design-system)
pages/           older pages (Profile, Health, Weight, Weather, RoutePlanner, Admin=/settings)
components/<area>/ domain components of older pages
hooks/           TanStack Query hooks (legacy + shared); useAnalytics.ts is a large aggregate hook
ui/              design system @/ui (see docs/DESIGN_SYSTEM.md)
theme/theme.ts   tokens + createAppTheme (33 kB — grep it)
api/client.ts    axios, baseURL '/api'
types/ utils/ constants/ context/
```

Add new functional areas as `features/<name>/` (page + `use<Name>.ts` + `types.ts` + `__tests__/`).
Tests: vitest (`src/__tests__/`, `features/*/__tests__`), Playwright `e2e/tests` (mocked) and `e2e/real` (real API, test compose).

## Large files — read in ranges (grep + offset)

`AnalyticsService` (87 kB), `TrainingPlanService` (71 kB), `WorkoutEvaluationService`, `TrainingPrioritiesService`, `SyncService`, `application/ai/*Service`, `WeatherService`, `theme.ts`, `schema.ts`, `hooks/useAnalytics.ts`.
