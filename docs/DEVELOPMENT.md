# Development

[← README](../README.md)

Working rules, conventions and the code map live in [AGENTS.md](../AGENTS.md) and [docs/agents/](agents/) — this file is a short human summary.

## Structure

```
backend/    Spring Boot, hexagonal architecture: domain → application → infrastructure
frontend/   React + Vite; features/<area>, shared UI in src/ui (docs/DESIGN_SYSTEM.md)
db/         PostgreSQL + PostGIS + pgvector image
scripts/    backup, LAN access
image-gen/  illustration generation (GPU); tools/llm-svg-studio — local asset studio
```

Details: [agents/ARCHITECTURE.md](agents/ARCHITECTURE.md), where things live: [agents/FEATURE_MAP.md](agents/FEATURE_MAP.md).

## Tests and quality

```bash
cd backend && ./gradlew test               # unit tests
cd backend && ./gradlew integrationTest    # PostgreSQL in Docker + OpenAPI contract
cd frontend && npm run test                # vitest
cd frontend && npm run quality             # lint + typecheck + tests + build + bundle budget
cd frontend && npm run test:e2e            # Playwright
```

CI (`.github/workflows`) runs the same plus E2E against the real API (`docker-compose.test.yml`).

## API contract

Frontend types are generated from the backend OpenAPI spec:

```bash
cd backend && ./gradlew integrationTest    # writes build/openapi.json
cd frontend && npm run api:generate        # → src/api/generated/schema.ts
```

Interactive docs: http://localhost:8080/swagger-ui.html

## Rules in short

- TDD, conventional commits (`feat:`, `fix:`, `chore:`, `docs:`), each new feature on its own branch.
- Code and docs in English; UI text in Polish.
- Flyway migrations are append-only (`V<n+1>__description.sql`).
- UI built only from `@/ui` components and theme tokens.
- After changes: `docker compose up -d --build`.
