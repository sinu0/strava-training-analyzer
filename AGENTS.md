# Strava Training Analyzer

Self-hosted, single-user app for cycling training analysis (Strava → metrics, planning, workout execution on a smart trainer).
Java 21/Spring Boot 3 (hexagonal) + React 19/TypeScript/MUI + PostgreSQL/PostGIS. Dark theme, mobile-first.
**Language: code, docs and commits in English; UI text via i18n keys (Polish default + English).**

## Project knowledge — load only what you need

| File | When to read |
|---|---|
| `docs/agents/STATUS.md` | at the start of every session (short current state and open threads) |
| `docs/agents/FEATURE_MAP.md` | always before changing a feature — maps screen → hook → endpoint → service |
| `docs/agents/ARCHITECTURE.md` | cross-cutting change, new module, flows (import, metrics, jobs, AI), large files |
| `docs/agents/WORKFLOW.md` | new feature: BE/FE recipes, verification, knowledge updates |
| `docs/agents/DECISIONS.md` | before a product/technical decision — binding rules |
| `docs/DESIGN_SYSTEM.md` | any UI change |
| `docs/WORKOUT_EXECUTION_PWA.md`, `docs/LAN_ACCESS.md`, `docs/BACKUP_AND_RECOVERY.md` | only for those areas |

Context-saving rules:
- Do not read README, whole directories or files "just in case". Start with `FEATURE_MAP.md`, then `rg -n` in the indicated place.
- Read large files (`AnalyticsService`, `TrainingPlanService`, `theme.ts`, `api/generated/schema.ts`, `hooks/useAnalytics.ts`) in ranges.
- Ignore: `do_usuniecia/`, `node_modules/`, `build/`, `dist/`, `test-results/`, `package-lock.json`, `.opencode/`.

## Commands

```bash
# backend
cd backend && ./gradlew compileJava        # compile
./gradlew test                             # unit (no Docker)
./gradlew test --tests '*NameTest'         # single test
./gradlew integrationTest                  # PostgreSQL + OpenAPI contract (Docker) → build/openapi.json
./gradlew bootRun                          # dev :8080

# frontend
cd frontend && npx tsc --noEmit            # typecheck
npm run test -- <path>                     # vitest (all: npm run test)
npm run lint                               # ESLint + design-system guard
npm run api:generate                       # TS types from openapi.json
npm run quality                            # lint+typecheck+test+build+budget (as CI)
npm run dev                                # :5173, proxy /api → :8080

# stack
docker compose up -d --build               # :80 frontend, :8080 backend, :5432 db (loopback)
docker compose --profile ai up -d          # + Ollama

# illustrations (needs GPU — tell the user)
./image-gen/setup.sh && /tmp/z-image-studio/.venv/bin/python image-gen/generate.py <prefix> [--force]
node tools/llm-svg-studio/serve.mjs        # asset studio :4177 (SVG via LM Studio :1234, images via Z-Image)
```

## Conventions

- backend: hexagonal — `domain` free of Spring/JPA (ArchUnit), `application` depends on ports, controllers call services only
- backend: `@RequiredArgsConstructor` instead of `@Autowired`; DTOs are separate public classes (not `record`)
- backend: tests — MockMvc (`@WebMvcTest`) for controllers, WireMock for external HTTP, `@Tag("integration")` for a real database
- backend: Flyway migrations forward-only (`V<n+1>__description.sql`); new APIs under `/api/v2/...`
- frontend: new areas in `features/<name>/` (page + hook + types + tests); pages lazy-loaded via `React.lazy`
- frontend: REST through `apiClient` from `@/api/client`, data through TanStack Query hooks
- frontend: UI only from `@/ui` and `theme.ts` tokens (`getAppThemeTokens(theme)` / `useTokens()`), `sx` prop; no color literals and no `Card`/`Paper` outside `src/ui`
- frontend: UI text through `useI18n().t('key')` (`src/i18n/locales/pl.ts` is the key source, `en.ts` mirrors it, type-checked); dates/numbers with `useI18n().locale`
- frontend: types in `types/` or `features/*/types.ts`, hooks in `hooks/` or `features/*/`, components in `components/` or `features/*/`
- configuration via environment variables (`.env`, `.env.example`), nothing hardcoded; `AI_ENABLED=true` enables the AI module
- commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

## How to work

- use TDD: test → implementation → refactor; a failing test gets fixed immediately
- new feature (not a fix to previous work) → propose a new branch `feat/<name>`
- design for reuse: isolated, clean and easy to extend (port/adapter, `features/<name>`, component in `@/ui`)
- need images → consider generating them (`image-gen/`, needs a running GPU — tell the user)
- when work is finished always run `docker compose up -d --build` so the whole stack reloads
- **after every feature update the knowledge** per the table in `docs/agents/WORKFLOW.md` (FEATURE_MAP / DECISIONS / STATUS); never create AUDIT/PROGRESS/HANDOFF files in the root
- never push or merge without the user's consent

`CLAUDE.md` and `.github/copilot-instructions.md` only point to this file — edit `AGENTS.md` only.
