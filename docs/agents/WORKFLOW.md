# Workflow — step-by-step recipes

## Session start (saving context)

1. `AGENTS.md` is already in context — do not read README or whole directories.
2. `git status -sb && git log --oneline -5` + `docs/agents/STATUS.md` (short current state).
3. Find the row in `FEATURE_MAP.md`; open only the listed files. Search with `rg -n "<symbol>" <dir>` instead of listing trees.
4. Read large files (list in `ARCHITECTURE.md`) in ranges: `rg -n` → read with offset.
5. Skip: `do_usuniecia/`, `node_modules/`, `build/`, `dist/`, `test-results/`, `package-lock.json`, `api/generated/schema.ts` (grep only), `backend/src/main/resources/ai/prompts/` (unless the task is about prompts).
6. Delegate broad research (> ~5 files) to a sub-agent when the tool supports it, so results do not flood the main context.

## New feature

1. Propose a branch `feat/<short-name>` (fixes to the current work stay on the same branch).
2. Clarify scope with the user if ambiguous; check `DECISIONS.md`.
3. **TDD**: failing test first → implementation → refactor.
4. Implement in the order of the recipes below (backend → contract → frontend).
5. Verify (section below), commit using `feat:/fix:/chore:/docs:`.
6. Update knowledge (section below).
7. Finish with `docker compose up -d --build`.

## Backend recipes

- **Endpoint**: DTO (class in `application/dto/`) → service method in `application/` (depends on ports) → controller in `infrastructure/web/` (`@RequiredArgsConstructor`). New APIs under `/api/v2/...`. Tests: MockMvc (`@WebMvcTest`) for the controller, unit for the service, WireMock for external HTTP.
- **Persistence**: port in `domain/port/` → entity `persistence/entity/` + repo `persistence/jpa/` + mapper `persistence/mapper/` + adapter `persistence/adapter/` → migration `V<n+1>__description.sql` (find the number: `ls backend/src/main/resources/db/migration | sort -V | tail -1`). Integration test with `@Tag("integration")` (real PostgreSQL via Docker).
- **Metric**: new `ActivityMetricCalculator` in `domain/metrics/calculator/` (bean, auto-registered in `MetricRegistry`) + unit test; bump the calculator version when the algorithm changes.
- **External integration**: port in `domain/port/` → adapter in `infrastructure/<area>/` → configuration via env (`application.yml` `${ENV:default}`, documented in `.env.example`).
- **After a DTO/endpoint change**: `cd backend && ./gradlew integrationTest` → `cd frontend && npm run api:generate`.

## Frontend recipes

- **New area**: `features/<name>/` — `<Name>Page.tsx`, `use<Name>.ts` (TanStack Query + `apiClient`), `types.ts`, `__tests__/`. Lazy route in `App.tsx`; navigation entry (`components/layout/`) only if the user wants it.
- **UI**: only `@/ui` + `Box/Stack/Grid/Typography/Button`. Missing component → add to `src/ui`, export in `index.ts`, show in `DesignSystemPage`, test in `src/ui/__tests__` (rules: `docs/DESIGN_SYSTEM.md`). UI text in Polish.
- **Data**: types from `api/generated/schema.ts` or `types/`; query keys consistent with existing ones (`['v2', ...]`); invalidation in `hooks/queryInvalidation.ts`.
- **Images**: `image-gen/` or `tools/llm-svg-studio/` (needs GPU — tell the user before running).

## Verification (run what the change touches)

| Change | Command |
|---|---|
| Backend | `cd backend && ./gradlew test` (+ `integrationTest` for DB/contract) |
| Single BE test | `./gradlew test --tests '*NameTest'` |
| Frontend | `cd frontend && npx tsc --noEmit && npm run test -- <file>`; before commit `npm run lint && npm run test` |
| Full CI gate | `cd frontend && npm run quality && npm run api:check` |
| UI / design system | `npm run test:e2e -- e2e/tests/design-system.spec.ts` |

A failing test gets fixed right away, not later.

## Knowledge update (mandatory after a feature)

| What changed | Update |
|---|---|
| New screen / endpoint / service / moved files | row in `FEATURE_MAP.md` |
| New rule, trade-off, "don't do X because Y" | item in `DECISIONS.md` |
| Layers, flow, stack, commands | `ARCHITECTURE.md` / `AGENTS.md` |
| Finished work / open threads | `STATUS.md` (max ~30 lines, drop the oldest — history is in git) |
| User-visible or installation change | `docs/USAGE.md` / `docs/INSTALLATION.md` (README only for a new area) |
| Operational procedure (LAN, backup, PWA) | the matching file in `docs/` |

All docs in English. Never create AUDIT/PROGRESS/HANDOFF files in the root. A plan for large work → `docs/plans/<name>.md`; delete it when done and move the conclusions to `DECISIONS.md`/`STATUS.md`.
