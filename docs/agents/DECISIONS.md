# Decisions — binding product and code rules

Every item is binding until the user changes it. A new decision = a new item (1–2 lines + "why").

## Product

- **Decision-first**: the `Today` screen answers "what should I do today?"; history, analysis and planning come second. Navigation: Today · History · Analysis · Plan · More.
- **Local-only, single-user**: ports bound to `127.0.0.1` only; LAN only via the HTTPS variant + password. No account system.
- **UI**: dark theme by default (light exists too), mobile-first, UI in Polish (default) and English via the in-house `src/i18n` engine (no i18n library; keys in `locales/pl.ts`, `en.ts` type-checked against it; language stored in `localStorage`, toggle in TopBar next to the theme toggle). New/touched UI text goes through `t()`; remaining hard-coded Polish is migrated screen by screen. Code, docs and commits in English.
- **AI never computes metrics or confidence** — it only explains verified results. Every AI feature sits behind the master flag and a provider flag; the app works fully without AI.

## Data and metrics

- **No measurement = `null` / `UNKNOWN`, never `0`**. Activity quality: `UNKNOWN | PARTIAL | AVAILABLE`. Incomplete data → no precise TSS.
- **No future leakage**: historical FTP and metrics use the state at that moment (`asOf`), not today's profile.
- **Power provenance**: `measured` / `estimated` / `unknown` only from Strava's explicit `deviceWatts` flag — no guessing.
- **Dates**: one configurable "athlete day", timezone `Europe/Warsaw`, local dates without UTC conversion, half-open ranges `[from, to)`.
- **A metric result** stores the calculator version, input fingerprint, `computedAt`, `asOf`. A new metric = a new calculator in the pipeline, not calculations in a controller/DTO.
- **Import and recalculation are persistent jobs** with stage, attempt, error; one active job per type; resumable.
- **Execution evaluation** (`workout-compliance-v3`): rebuilds the timeline from the persistent event log; an inconsistent log or missing power → `UNKNOWN`.

## Technical

- **Flyway forward-only**: never edit existing migrations; add `V<n+1>__description.sql`.
- **API contract** is generated from OpenAPI into `frontend/src/api/generated/schema.ts`; DTO change ⇒ regenerate (CI: `api:check`).
- **Hexagonal** enforced by ArchUnit — `domain` without Spring/JPA.
- **Design system `@/ui`** is the only source of look; tokens in `theme.ts`; ESLint blocks color literals and `Card`/`Paper` outside `src/ui`.
- **Bundle budget**: `npm run budget` (total initial JS ~210 kB gzip). Startup files import concrete `@/ui/...` modules, not the barrel. React 19.3 on hold because of the budget.
- **Trainer/BLE**: Web Bluetooth (FTMS + HR), needs a secure origin (localhost or HTTPS on the LAN); ride recordings export as FIT.
- **HTTP security**: `SecurityConfig` = `permitAll`; cross-site writes (`Sec-Fetch-Site: cross-site`) are rejected by `frontend/nginx.conf`; a new endpoint that needs protection ⇒ change the rules explicitly.
