# Current status

Short: what is done, what is open. Max ~30 lines — drop older entries (history is in `git log`).

## Recently finished (newest first)

- 2026-09-26 — i18n PL/EN (`src/i18n`, toggle in TopBar); translated so far: app shell (TopBar, sidebar, bottom nav, sync button), More, theme settings, mobile shortcuts.
- 2026-09-26 — repo cleanup and agent knowledge (`docs/agents/`), short English README + `docs/*` subpages; obsolete files in `do_usuniecia/` (local, outside git).
- 2026-09-24 — trainer cockpit: Bluetooth HR + FTMS (ERG/resistance, Cycling Power fallback), ride recording → FIT export.
- 2026-09 — `@/ui` design system ("Granger" reference), all screens migrated, `/design-system` catalogue + snapshots.
- 2026-09-10 — hardening: execution timeline v3, power provenance, AI flag matrix, validation report, retry of Strava rate-limited jobs.
- 2026-09-06 — app coherence: athlete day, `null` instead of 0, shared `TrainingLoadService`, OpenAPI contract, E2E against the real API.
- 2026-07 — V2 rebuild (Today/History/Analysis/Plan/More), frontend V3/V4.

## Open

- Hardware test of the trainer (Elite Suito + Garmin HRM) per the checklist in `docs/WORKOUT_EXECUTION_PWA.md`; the user compares both recording modes.
- Prediction model validation: needs a versioned set of expert labels + backtest methodology (external data).
- AI providers other than Ollama — not tested live (no keys).
- Dependencies on hold: ESLint 10 (plugins incompatible), TypeScript 7 (`@typescript-eslint`), React 19.3 (bundle budget).
- Backend legacy without UI (list in `FEATURE_MAP.md`) — to decide: remove or wire up.
- i18n: screens (Today, History, Analysis, Plan, Weather, Profile, Settings, …) and `'pl-PL'` date/number formatting still hard-coded — migrate to `t()` / `locale` screen by screen.
- Some docs/comments in code may still be in Polish — translate to English when touching them.
- Remote push/CI only with the user's consent.
