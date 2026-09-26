# Feature map → files

Find your feature's row and open only the listed files. Path shorthands:
`FE` = `frontend/src/`, `BE` = `backend/src/main/java/pl/strava/analizator/`, `app/` = `BE application/`, `web/` = `BE infrastructure/web/`.
Tests sit alongside: FE `__tests__/<Name>.test.tsx`, BE `backend/src/test/java/...` in the mirrored package.

## Screens (navigation: Today · History · Analysis · Plan · More)

| Feature / route | Frontend | Hook → endpoint | Backend |
|---|---|---|---|
| Today `/` | `FE features/today/` (TodayPage, TodayWidget), `components/today/`, `components/dashboard/EditableDashboard` | `useToday` → `/v2/today` | `web/V2TodayController` → `app/V2TodayService` (uses `CoachService`, `TrainingLoadService`, `HealthService`, `TrainingPlanService`, `ActivityDataQualityService`) |
| History `/activities`, `/activities/:id` | `FE features/history/` (HistoryPage, ActivityDetailV2Page), `components/activity/` | `useHistory` → `/v2/activities` | `V2ActivityController` → `V2ActivityService`, `ActivityDataQualityService` |
| Analysis `/analytics` | `FE features/analysis/`, `components/analytics/`, `PMChart`, `PowerCurveChart` | `useV2Analytics` → `/v2/analytics/{compare,load,power}`; legacy `hooks/useAnalytics` → `/analytics/*` | `V2AnalyticsController`, `AnalyticsController` → `AnalyticsService`, `TrainingLoadService`, `BlockHealthService` |
| Plan `/training` | `FE features/plan/`, `components/training/` (calendar, context, weekly review) | `hooks/useTrainingPlan` → `/training/*`; `useTrainingContext` → `/v2/training/*`; `useLoadScenario` → `/v2/planning/load-scenario` | `TrainingPlanController`, `WorkoutTemplateController`, `TrainingContextController`, `V2PlanningController` → `TrainingPlanService`, `TrainingPreferencesService`, `WeeklyReviewService`, `LoadScenarioService`, `WeeklyBudgetService` |
| Scheduled workout `/training/workouts/:id` | `FE features/workout/ScheduledWorkoutPage` | `workoutApi` → `/v2/workouts/scheduled/*`, `delivery-capabilities` | `WorkoutExecutionController` → `WorkoutExecutionService`, `WorkoutExportService` (FIT/ZWO, `infrastructure/export`) |
| Player / trainer cockpit `/workout/:executionId` | `FE features/workout/` — `WorkoutPlayerPage`, `workoutRunner`, `offlineStore` (IndexedDB), `cockpit/` (UI), `devices/` (BLE: HR + FTMS, ERG, simulation), `recording/` (ride recording) | `workoutApi` → `/v2/workouts/executions/*` | `WorkoutExecutionService`, `RideRecordingService` → `FitActivityEncoder`; evaluation: `WorkoutEvaluationService`, `domain/workout/*`. Doc: `docs/WORKOUT_EXECUTION_PWA.md` |
| Segments `/segments`, `/segments/:id` | `FE features/segments/`, `components/segments/` | `hooks/useSegments` → `/v2/segments`, `/v2/activities/*/segments` | `SegmentController`, `ActivitySegmentController` → `SegmentAnalysisService`, `SegmentRecordDetector` |
| Matched rides `/matched-rides/:id` | `FE features/matched-rides/`, `components/matched-rides/` | `hooks/useMatchedRides` → `/v2/matched-rides` | `MatchedRideController` → `RouteMatchingService`, `RouteMatchingAlgorithm` |
| Data & jobs `/data` | `FE features/data/` | `useDataJobs` → `/v2/import-jobs`, `/v2/jobs/*`, `/v2/data-quality` | `V2JobController`, `V2DataQualityController`, `AnalysisBackfillController` → `ImportJobService`, `RecalculationJobService`, `AnalysisBackfillService` |
| More `/more` | `FE features/more/MorePage` (links: weather, profile, health, weight, data, settings) | — | — |
| Weather `/weather` | `FE pages/WeatherPage`, `components/weather/`, `utils/weatherScoring` | `useAnalytics` → `/weather/*` | `WeatherController` → `infrastructure/weather/WeatherService`, `WeatherCacheScheduler` |
| Routes `/routes` (entered from Weather) | `FE pages/RoutePlannerPage` + `pages/route-planner/`, `components/route*/`, `RouteHeatmap` | `useRoutePlanner` → `/routes/*`; heatmap `/activities/heatmap/tile` | `RoutePlannerController`, `HeatmapTileController` → `RoutePlannerService`, `RouteGeneratorService`, `HeatmapBuildService`; `infrastructure/routing` |
| Health `/health` | `FE pages/HealthPage` | `useHealth` → `/health/*` | `HealthController` → `HealthService` |
| Weight `/weight` | `FE pages/WeightPage`, `components/weight/` | `useWeight` → `/weight/*` | `WeightController` → `WeightService` |
| Profile `/profile` | `FE pages/ProfilePage`, `components/profile/` (gallery, records, streak, summaries) | `useAnalytics` → `/profile`; `usePersonalRecords`, `useStreak`, `useGamification`, `useSeasonWrapped` | `AthleteProfileController`, `PersonalRecordController`, `StreakController`, `GamificationController`, `SeasonWrappedController` |
| Settings `/settings?tab=` | `FE features/settings/` — `SettingsPage` (vertical tabs on desktop, scrollable tabs on phones; only the active tab mounts), `settingsTabs.tsx` (ids/icons), `tabs/*Tab.tsx` (general, athlete, integrations, sync, ai, weather, equipment, maintenance), `athleteProfileForm.ts` (limits + partial update); sections in `components/admin/` and `components/settings/` | `useAnalytics` → `/admin/*`, `/sync/*`, `PUT /profile`; `useUiPreferences` → `/v2/ui-preferences`; `useAi` → `/v2/ai/settings`; `useEquipment` | `AdminController`, `SyncController`, `AthleteProfileController`, `UiPreferencesController`, `AiSettingsController`, `EquipmentController` |
| UI catalogue `/design-system` | `FE features/design-system/`, `FE ui/` | — | — (snapshots: `e2e/tests/design-system.spec.ts`) |
| Layout / navigation | `FE components/layout/` (AppLayout, Sidebar, TopBar, TopBarSyncButton, MobileBottomNav) | — | — |

## Cross-cutting subsystems

| Subsystem | Where |
|---|---|
| Strava OAuth + config | `BE infrastructure/strava/` (`StravaAuthController`, `StravaConfigProvider` — env **or** the `app_config` table), `FE components/admin/StravaConfigSection` |
| Metric calculators | `BE domain/metrics/calculator/`, `app/MetricRegistry`, `app/DailyMetricsService` |
| Events / goals | `EventController` → `EventService`; FE `useAnalytics` → `/events/*` |
| Fatigue / energy | `FatigueAndEnergyController` → `FatigueAndEnergyService` |
| AI predictions, notes, tips | `AiPredictionController`, `AiActivityNoteController`, `AiV2Controller`, `OllamaManagementController` → `app/ai/*`; FE `hooks/useAi`; prompts `backend/src/main/resources/ai/prompts/` |
| AI language + coaching style | FE `components/settings/AiLanguageSettings`, `AiCoachingStyleSettings` (Settings → AI) → `useAiSettings` → `/v2/ai/settings` → `web/AiSettingsController` → `app/ai/AiSettingsService` (table `ai_settings`); `domain/ai/AiLanguage` holds the language directive; `app/ai/AiPromptDirectives` appends persona + language to V1 predictions and notes, `PromptEngine` gets both for V2 |
| i18n (PL/EN) | `FE i18n/` — `I18nContext` (`useI18n`: core `t`, `language`, `locale`, `setLanguage`), `defineMessages` (feature namespaces, `messages.ts` next to each feature), `localized` (label maps), `runtime` (`getLocale`), `translate.ts` (dotted keys, `{param}`, plurals via `Intl.PluralRules`), core `locales/pl.ts` + lazy `en.ts`; toggle in `components/layout/TopBar`, `components/settings/LanguageSettings` |
| Security | `BE infrastructure/config/SecurityConfig` — `permitAll` (protection only via loopback / nginx basic auth in the HTTPS variant) |
| Backup | `scripts/backup.sh`, `scripts/verify-backup.sh`, doc `docs/BACKUP_AND_RECOVERY.md` |

## Backend without UI (legacy after the V2 consolidation — do not extend without a decision)

`/api/adaptive-coach`, `/api/coach`, `/api/daily-decision`, `/api/nudges`, `/api/timeline`, `/api/challenges`, `/api/journal`, `/api/discover`, `/api/performance`, `/api/training-priorities`, `/api/evaluation`, `/api/mcp`, `/api/ai/prompts`, `/api/ai/ollama`, `/api/v2/ai`.
Old FE routes (`/coach`, `/priorities`, `/performance`, `/ai-*`, `/timeline`, `/admin`, `/dashboard`) are only redirects in `App.tsx`.
