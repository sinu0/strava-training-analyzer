# Strava Analizator — Progress & Decisions Log

> **Cel**: Śledzenie postępu implementacji i decyzji architektonicznych.
> Pozwala kontynuować pracę z dokładnie tego miejsca, gdzie skończono.

---

## Status tasków

| Task | Status | Data | Uwagi |
|---|---|---|---|
| 1.1 Docker Compose + PostGIS | ✅ done | 2026-03-26 | PostGIS 3.4, port 5432, verified |
| 1.2 Spring Boot scaffold + ArchUnit | ✅ done | 2026-03-26 | Java 21, Spring Boot 3.4.4, 7 ArchUnit tests pass |
| 1.3 Flyway migracje | ✅ done | 2026-03-26 | 10 migrations (V1-V10), 11 tables, 12 default zones |
| 1.4 JPA Entities + Domain Models + Mappers | ✅ done | 2026-03-26 | 9 domain models, 6 VOs, 7 ports, 8 entities, 5 JPA repos, 5 adapters, 5 mappers |
| 1.5 Frontend scaffold + Dark Theme | ✅ done | 2026-03-26 | Vite+React19+TS+MUI6, 15 tests pass, build OK |
| 2.1 Strava OAuth2 + Token Management | ✅ done | 2026-03-26 | StravaOAuth2Service, StravaApiClient, EncryptionUtil AES-GCM, Auth+Profile controllers, 13 tests |
| 2.2 Strava Sync — import aktywności | ✅ done | 2026-03-26 | StravaSyncAdapter, StravaActivityMapper, SyncService, SyncController, 9 tests |
| 2.3 Activity CRUD — API + Frontend | ✅ done | 2026-03-26 | ActivityService, ActivityController, frontend pages + components, 4 MockMvc + 8 Vitest tests |
| 3.1 NormalizedPowerCalculator | ✅ done | 2026-03-26 | 30s rolling avg, 6 unit tests |
| 3.2 IF + TSS Calculators | ✅ done | 2026-03-26 | IF=NP/FTP, TSS formula, 7 tests |
| 3.3 HeartRateTssCalculator | ✅ done | 2026-03-26 | hrTSS fallback, 4 tests |
| 3.4 TimeInZonesCalculator | ✅ done | 2026-03-26 | Power+HR zones, 5 tests |
| 3.5 EF + AerobicDecoupling | ✅ done | 2026-03-26 | EF=NP/avgHR, decoupling%, 8 tests |
| 3.6 MetricRegistry + Persistence | ✅ done | 2026-03-26 | MetricRegistry, MetricPersistenceService, MetricsConfig @Bean, 2 tests |
| 3.7 CTL/ATL/TSB Calculator | ✅ done | 2026-03-26 | EMA τ=42/7, PMC, 5 tests |
| 3.8 PowerCurveCalculator | ✅ done | 2026-03-26 | 13 standard durations, 5 tests |
| 3.9 TrainingMonotonyCalculator | ✅ done | 2026-03-26 | Monotony+Strain, warnings, 4 tests |
| 4.1 Analytics API | ✅ done | 2026-03-26 | AnalyticsService, AnalyticsController (7 endpoints), 5 DTOs, 7 MockMvc tests |
| 4.2 Dashboard Frontend | ✅ done | 2026-03-26 | DashboardPage, WeeklySummaryCard, TrainingLoadMiniChart, RecentActivitiesList, ReadinessGauge, TodayRecommendation, 8 Vitest tests |
| 4.3 Analytics Pages Frontend | ✅ done | 2026-03-26 | AnalyticsPage (6 tabs), PMChart, PowerCurveChart, ZoneDistributionChart, WeeklyVolumeChart, FtpTrendChart, EfficiencyTrend, SeasonComparison, 9 Vitest tests |

---

## Decyzje architektoniczne

### D1: Struktura projektu — monorepo
- **Data**: 2026-03-26
- **Decyzja**: Monorepo z `frontend/` i `backend/` w jednym katalogu `strava-analizator/`
- **Powód**: Prostota dla self-hosted, jeden `docker compose up`

### D2: Java 21 + Spring Boot 3.4
- **Data**: 2026-03-26
- **Decyzja**: Backend w Javie 21 LTS z Spring Boot 3.4+
- **Powód**: Doświadczenie użytkownika w Javie, stabilność LTS, records, pattern matching

### D3: Clean/Hexagonal Architecture
- **Data**: 2026-03-26
- **Decyzja**: 3 warstwy: domain (zero Spring), application, infrastructure
- **Powód**: Testowalność, wymuszenie ArchUnit, łatwe dodawanie adapterów (Garmin)

### D4: Generyczny storage metryk
- **Data**: 2026-03-26
- **Decyzja**: Tabele `activity_metrics` i `daily_metric_values` zamiast kolumn per metryka
- **Powód**: Nowe metryki bez migracji Flyway, pluggable Metrics Engine

### D5: Dark Mode jako domyślny
- **Data**: 2026-03-26
- **Decyzja**: MUI dark theme z custom palette (granat-czarny tło, pomarańczowy akcent)
- **Powód**: Profesjonalny look analityczny, lepsza czytelność wykresów, przewaga nad Stravą

### D6: Gradle Kotlin DSL
- **Data**: 2026-03-26
- **Decyzja**: Gradle z Kotlin DSL zamiast Maven
- **Powód**: Nowoczesny, type-safe build, lepszy multi-module support

---

## Log implementacji

### Sesja 1 — 2026-03-26

**Zakres**: Tworzenie specyfikacji (PROMPT.md)
- Stworzono pełny PROMPT.md (1910 linii, 17 sekcji)
- Zdefiniowano architekturę, stack, data model, API, algorytmy
- Dodano pluggable Metrics Engine z 4 interfejsami
- Dodano generyczne tabele metryk (activity_metrics, daily_metric_values)
- Dodano strict quality rules (sekcja 5)
- Dodano pełną specyfikację UI/UX dark mode (sekcja 9)
- Dodano plan delegacji dla subagentów (sekcja 17, 25 tasków w 6 fazach)

### Sesja 2 — 2026-03-26

**Zakres**: Tasks 1.1–1.4 (Docker, Spring Boot, Flyway, Domain Layer)

#### Task 1.1 — Docker Compose + PostGIS
- docker-compose.yml z PostGIS 16-3.4, healthcheck, .env.example, .gitignore
- Container uruchomiony i zweryfikowany (SELECT PostGIS_Version() = 3.4)

#### Task 1.2 — Spring Boot scaffold + ArchUnit
- build.gradle.kts (Spring Boot 3.4.4, Java 21, wszystkie deps)
- Gradle wrapper 8.12 (system miał 9.4.0)
- SecurityConfig (permitAll), CorsConfig, JacksonConfig, OpenApiConfig
- ArchitectureTest (7 reguł, ClassFileImporter + allowEmptyShould)

#### Task 1.3 — Flyway migrations
- 10 migracji (V1-V10): athlete_profile, gear, activities (PostGIS), activity_metrics, daily_summary, daily_metric_values, training_zones, ftp_history, training_plans
- V10 seed: 7 Coggan power zones + 5 HR zones z kolorami

#### Task 1.4 — Domain Models + JPA Entities + Mappers
- **Domain models** (9): Activity, AthleteProfile, DailySummary, TrainingZone, Gear, FtpRecord, MetricResult, AthleteState, TrainingRecommendation
- **Value Objects** (6): PowerData, HeartRateData, TimeInZones, BestEfforts, GeoRoute, DateRange
- **Ports** (7): ActivityRepository, ActivityMetricRepository, DailyMetricRepository, DailySummaryRepository, AthleteProfileRepository, ActivityDataSource, HealthDataSource
- **JPA Entities** (8): ActivityEntity, ActivityMetricEntity, DailyMetricValueEntity, DailySummaryEntity, AthleteProfileEntity, GearEntity, TrainingZoneEntity, FtpHistoryEntity
- **JPA Repos** (5): ActivityJpaRepository, ActivityMetricJpaRepository, DailyMetricValueJpaRepository, DailySummaryJpaRepository, AthleteProfileJpaRepository
- **Adapters** (5): ActivityRepositoryAdapter, ActivityMetricRepositoryAdapter, DailyMetricRepositoryAdapter, DailySummaryRepositoryAdapter, AthleteProfileRepositoryAdapter
- **Mappers** (5 MapStruct): ActivityEntityMapper, ActivityMetricEntityMapper, DailyMetricValueEntityMapper, DailySummaryEntityMapper, AthleteProfileEntityMapper
- ActivityEntity.StreamsJson — typed JSONB mapping for power/hr/cadence/altitude/time streams
- Build OK, all 7 ArchUnit tests pass, JPA validate against DB schema OK

---

## Następne kroki

Kontynuuj od **Task 1.5** (Frontend scaffold + Dark Theme) — niezależny od backendu.
Potem **Task 2.1** (Strava OAuth2) → **Task 2.2** (Strava Sync) → **Task 2.3** (Activity CRUD).

Pełny plan z zależnościami: patrz PROMPT.md sekcja 17 "Plan implementacji".

### Sesja — 2026-03-27

**Zakres**: Moduł AI Predictions (LLM Engine) — architektura Spring Boot

#### AI Module — Faza 1 (architektura)
- **Domain layer** (domain.ai): `PredictionType` enum (6 typów), `AiPrediction`, `PromptTemplate`, `TrainingContext`, `LlmPort` (interface), `TrainingDataPort` (interface)
- **Application layer** (application.ai): `AiPredictionService` (orkiestracja), `PromptRegistry` (6 predefiniowanych promptów), `LlmProviderRegistry` (auto-discovery), `TrainingDataAdapter` (czyta z existing repos)
- **Infrastructure layer** (infrastructure.ai): `OllamaAdapter` (Ollama REST API), `OpenAiAdapter` (OpenAI-compatible API), `AiModuleConfig`
- **REST API** (infrastructure.web): `AiPredictionController` — `POST /api/ai/predict`, `GET /api/ai/status`
- **DTOs**: `PredictionRequestDto`, `PredictionResponseDto`, `AiModuleStatusDto`
- **Config**: application.yml — `ai.enabled`, `ai.provider`, `ai.model`, `ai.ollama.*`, `ai.openai.*`
- **Error handling**: `AiModuleDisabledException` → 503 Service Unavailable
- Kompilacja OK, kompatybilne z ArchUnit
- **Osobna dokumentacja**: [AI_PROMPT.md](AI_PROMPT.md) (specyfikacja), [AI_PROGRESS.md](AI_PROGRESS.md) (progress + tasks)
