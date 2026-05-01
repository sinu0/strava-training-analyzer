# Strava Training Analyzer

Projekt typu self-hosted do zaawansowanej analizy treningów kolarskich.
Java/Spring Boot + React/TypeScript, architektura heksagonalna.

## Stack

- **Backend**: Java 21+, Spring Boot 3, Gradle, hexagonal (port-adapter)
- **Frontend**: React 19, TypeScript, MUI, TanStack Query, Recharts, Leaflet, Vite
- **Baza**: PostgreSQL z Flyway migracjami
- **AI**: Ollama / OpenAI / Anthropic / Gemini (opcjonalne)
- **Grafika**: Python 3 + zimage (Z-Image-Turbo SDNQ)

## Komendy

### Backend
```bash
cd backend
./gradlew compileJava           # kompilacja
./gradlew test                  # testy jednostkowe
./gradlew bootRun               # uruchomienie
```

### Frontend
```bash
cd frontend
npm run test                    # vitest (363 testów)
npx tsc --noEmit               # typecheck
npm run build                   # tsc + vite build
npm run dev                     # dev server
```

### Generowanie ilustracji
```bash
./image-gen/setup.sh                                # pierwsze uruchomienie
/tmp/z-image-studio/.venv/bin/python image-gen/generate.py <prefix> [--force]
```

### Docker
```bash
docker compose up -d
```

## Struktura kodu

### Backend (hexagonal)
- `domain/model/` — czyste modele domenowe (POJO, żadnych frameworków)
- `domain/port/` — interfejsy wyjściowe (repozytoria, adaptery)
- `application/` — serwisy aplikacyjne + DTO
- `infrastructure/persistence/` — JPA, encje, mapperzy
- `infrastructure/web/` — REST controllery

### Frontend
- `src/hooks/` — TanStack Query hooks (useAnalytics.ts, useTrainingPriorities.ts, itd.)
- `src/pages/` — strony (lazy-loaded)
- `src/types/` — TypeScript interfejsy
- `src/components/` — komponenty UI
- `src/utils/` — helpery (kolory, formatowanie, ilustracje)

## Konwencje

- backend: `@RequiredArgsConstructor` zamiast `@Autowired`
- backend: DTO osobne publiczne klasy (nie `record` w DTO warstwie)
- backend: implementacja testów przez WireMock + MockMvc
- frontend: `apiClient` z `@/api/client` do REST
- frontend: lazy loading stron przez `React.lazy`
- frontend: Material UI `sx` prop, `tokens` z theme dla kolorów
- frontend: typy w `types/`, hooki w `hooks/`, komponenty w `components/`
- commit message: conventional commits (feat:, fix:, chore:, docs:)
- UI w ciemnym motywie, mobile-first

## Opcjonalne moduły

- `ai.enabled=true` w `.env` włącza moduł AI/LLM
- `*.properties` przez environment variables, nie hardcoded
