# Strava Analizator — Dokumentacja użytkownika

> Aplikacja do zaawansowanej analizy treningów rowerowych z danymi ze Stravy.
> Self-hosted, dark mode UI, metryki: CTL/ATL/TSB, krzywa mocy, strefy, EF, monotonia.

---

## Spis treści

1. [Wymagania systemowe](#1-wymagania-systemowe)
2. [Konfiguracja Strava API](#2-konfiguracja-strava-api)
3. [Konfiguracja środowiska (.env)](#3-konfiguracja-środowiska-env)
4. [Uruchomienie — Docker Compose (produkcja)](#4-uruchomienie--docker-compose-produkcja)
5. [Uruchomienie — tryb deweloperski](#5-uruchomienie--tryb-deweloperski)
6. [Pierwsze użycie — połączenie ze Stravą](#6-pierwsze-użycie--połączenie-ze-stravą)
7. [Import danych (synchronizacja)](#7-import-danych-synchronizacja)
8. [Nawigacja w aplikacji](#8-nawigacja-w-aplikacji)
9. [API Reference — kluczowe endpointy](#9-api-reference--kluczowe-endpointy)
10. [Uruchamianie testów](#10-uruchamianie-testów)
11. [Rozwiązywanie problemów](#11-rozwiązywanie-problemów)

---

## 1. Wymagania systemowe

| Składnik        | Minimalna wersja |
|-----------------|------------------|
| Docker          | 24+              |
| Docker Compose  | 2.20+            |
| Java (dev)      | 21 LTS           |
| Node.js (dev)   | 20+              |
| PostgreSQL      | 16 + PostGIS 3.4 |

> **Uwaga**: Docker Compose uruchamia bazę danych automatycznie — nie potrzebujesz lokalnie zainstalowanego PostgreSQL.

---

## 2. Konfiguracja Strava API

Zanim uruchomisz aplikację, musisz utworzyć aplikację w portalu Strava:

### Krok po kroku:

1. Przejdź na **https://developers.strava.com** i zaloguj się kontem Strava
2. W górnym menu kliknij **"Create & Manage Your App"**
   - Jeśli nie widzisz opcji, wejdź bezpośrednio: **https://www.strava.com/settings/api** (wymaga zalogowania)
3. Wypełnij formularz:
   - **Application Name**: `Strava Analizator` (dowolna nazwa)
   - **Category**: `Training Analysis`
   - **Club**: *(opcjonalnie)*
   - **Website**: `http://localhost:5173`
   - **Authorization Callback Domain**: `localhost`
4. Po utworzeniu skopiuj:
   - **Client ID** → wpisz do `.env` jako `STRAVA_CLIENT_ID`
   - **Client Secret** → wpisz do `.env` jako `STRAVA_CLIENT_SECRET`

> **Ważne**: Callback Domain musi być ustawiony na `localhost` — aplikacja używa redirect URI: `http://localhost:8080/api/auth/strava/callback`

---

## 3. Konfiguracja środowiska (.env)

Skopiuj plik `.env.example` do `.env` i uzupełnij wartości:

```bash
cp .env.example .env
```

Zawartość `.env`:

```bash
# === Baza danych ===
DB_PASSWORD=twoje-bezpieczne-haslo

# === Strava OAuth2 ===
STRAVA_CLIENT_ID=12345                        # Z portalu Strava API
STRAVA_CLIENT_SECRET=abc123def456...           # Z portalu Strava API
STRAVA_WEBHOOK_TOKEN=losowy-token-webhook      # Dowolny ciąg znaków

# === Bezpieczeństwo ===
JWT_SECRET=minimum-32-znakowy-losowy-secret
ENCRYPTION_KEY=64-znakowy-hex-klucz-aes-256
```

### Generowanie bezpiecznych kluczy:

```bash
# JWT Secret (32+ znaków)
openssl rand -base64 32

# Encryption Key (32 bajty = 64 znaki hex)
openssl rand -hex 32
```

---

## 4. Uruchomienie — Docker Compose (produkcja)

Najprostszy sposób uruchomienia całej aplikacji:

```bash
# 1. Sklonuj repozytorium
cd strava-analizator

# 2. Skonfiguruj .env (patrz sekcja 3)
cp .env.example .env
# edytuj .env z własnymi wartościami

# 3. Uruchom wszystko
docker compose up -d

# 4. Sprawdź status
docker compose ps
```

Po uruchomieniu:

| Usługa    | URL                                 |
|-----------|-------------------------------------|
| Frontend  | http://localhost                     |
| Backend   | http://localhost:8080                |
| Swagger   | http://localhost:8080/swagger-ui.html |
| Baza      | localhost:5432                       |

### Zatrzymanie:

```bash
docker compose down          # zatrzymaj kontenery
docker compose down -v       # zatrzymaj + usuń dane (UWAGA: kasuje bazę!)
```

### Logi:

```bash
docker compose logs -f             # wszystkie usługi
docker compose logs -f backend     # tylko backend
docker compose logs -f frontend    # tylko frontend
docker compose logs -f db          # tylko baza
```

---

## 5. Uruchomienie — tryb deweloperski

W trybie deweloperskim uruchamiasz każdy komponent osobno z hot-reload:

### 5.1 Baza danych (Docker)

```bash
docker compose up -d db
```

Poczekaj na healthcheck (baza gotowa po ~10s):

```bash
docker compose ps   # status: healthy
```

### 5.2 Backend (Gradle)

```bash
cd backend

# Ustaw zmienne środowiskowe lub użyj .env
export DB_PASSWORD=twoje-haslo
export STRAVA_CLIENT_ID=12345
export STRAVA_CLIENT_SECRET=abc123

# Uruchom Spring Boot
./gradlew bootRun
```

Backend wystartuje na **http://localhost:8080**.

Flyway automatycznie wykona migracje bazy danych przy starcie.

### 5.3 Frontend (Vite)

```bash
cd frontend

# Zainstaluj zależności (pierwszy raz)
npm install

# Uruchom dev server
npm run dev
```

Frontend wystartuje na **http://localhost:5173** z hot-reload.

Proxy Vite automatycznie przekierowuje żądania `/api/*` do backendu na porcie 8080.

---

## 6. Pierwsze użycie — połączenie ze Stravą

Po uruchomieniu aplikacji musisz połączyć ją z kontem Strava:

### Krok 1: Otwórz frontend

Przejdź do **http://localhost:5173** (dev) lub **http://localhost** (Docker).

### Krok 2: Autoryzacja OAuth2

Wywołaj endpoint połączenia (z przeglądarki lub cURL):

```
GET http://localhost:8080/api/auth/strava/connect
```

Odpowiedź zawiera URL autoryzacji:

```json
{
  "url": "https://www.strava.com/oauth/authorize?client_id=12345&redirect_uri=http://localhost:8080/api/auth/strava/callback&response_type=code&scope=read,activity:read_all,profile:read_all"
}
```

**Otwórz ten URL w przeglądarce** → Strava poprosi o autoryzację → Po zatwierdzeniu nastąpi redirect z powrotem do aplikacji.

### Krok 3: Weryfikacja

Sprawdź, czy profil został zapisany:

```
GET http://localhost:8080/api/profile
```

Powinna zwrócić Twoje dane (imię, nazwisko, FTP, itp.).

---

## 7. Import danych (synchronizacja)

Po połączeniu ze Stravą możesz zaimportować aktywności.

### Pełna synchronizacja (wszystkie aktywności)

```bash
POST http://localhost:8080/api/sync/strava/full
```

Przykład z Swagger UI lub dowolnego klienta HTTP:

```
POST http://localhost:8080/api/sync/strava/full
Content-Type: application/json
```

Odpowiedź (202 Accepted):

```json
{
  "synced": 150,
  "failed": 0,
  "status": "COMPLETED"
}
```

> **Uwaga**: Pierwsze pełne pobranie może zająć kilka minut w zależności od liczby aktywności na koncie Strava. API Strava ma limity: 100 req/15min, 1000 req/dzień.

### Synchronizacja ostatnich aktywności

```bash
POST http://localhost:8080/api/sync/strava/recent
```

Pobiera tylko nowe aktywności od ostatniej synchronizacji. Używaj tego na co dzień.

### Sprawdzenie statusu synchronizacji

```bash
GET http://localhost:8080/api/sync/status
```

### Przeliczanie metryk

Po imporcie aktywności, metryki (NP, TSS, IF, strefy, krzywa mocy, CTL/ATL/TSB) są obliczane automatycznie przez silnik metrykowy (`MetricRegistry`).

---

## 8. Nawigacja w aplikacji

Aplikacja ma trzy główne sekcje dostępne z paska bocznego:

### Dashboard (`/`)

- **Podsumowanie tygodnia** — dystans, czas, TSS, wzniesienie
- **Obciążenie treningowe (30d)** — wykres PMC (CTL/ATL/TSB)
- **Ostatnie aktywności** — 5 ostatnich z linkami do szczegółów
- **Gotowość** — placeholder (przyszła integracja z Garmin)
- **Rekomendacja na dziś** — placeholder (przyszły advisor)

### Aktywności (`/activities`)

- **Lista aktywności** — tabela z filtrowaniem po typie sportu
- **Kliknięcie w wiersz** → strona szczegółowa aktywności
- **Szczegóły aktywności** (`/activities/:id`):
  - Mapa trasy (Leaflet + CARTO dark tiles)
  - Metryki: moc, tętno, kadencja, dystans, czas, wzniesienie
  - Wykresy strumieni (power, HR, kadencja, wysokość)
  - Strefy mocy i tętna (poziome paski)

### Analityka (`/analytics`)

6 zakładek:

| Zakładka | Opis |
|----------|------|
| **PMC** | Performance Management Chart — CTL (fitness), ATL (zmęczenie), TSB (forma) |
| **Krzywa mocy** | Najlepsze wysiłki 1s–120min, skala logarytmiczna |
| **Strefy** | Rozkład czasu w strefach mocy (wykres słupkowy) |
| **Obciążenie** | TSS tygodniowo (wykres słupkowy) |
| **Trendy** | FTP w czasie + Efficiency Factor (scatter plot) |
| **Porównanie** | Zestawienie dwóch dowolnych okresów (dystans, czas, wzniesienie) |

Każda zakładka ma **date range picker** do wyboru zakresu dat.

---

## 9. API Reference — kluczowe endpointy

Pełna dokumentacja interaktywna: **http://localhost:8080/swagger-ui.html**

### Autoryzacja

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/auth/strava/connect` | Zwraca URL autoryzacji Strava |
| `GET` | `/api/auth/strava/callback` | Callback OAuth2 (automatyczny redirect) |

### Profil

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/profile` | Pobierz profil sportowca |
| `PUT` | `/api/profile` | Zaktualizuj profil (np. FTP) |

### Synchronizacja

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `POST` | `/api/sync/strava/full` | Pełna synchronizacja wszystkich aktywności |
| `POST` | `/api/sync/strava/recent` | Synchronizacja nowych aktywności |
| `GET` | `/api/sync/status` | Status ostatniej synchronizacji |

### Aktywności

| Metoda | Endpoint | Parametry | Opis |
|--------|----------|-----------|------|
| `GET` | `/api/activities` | `?sportType`, `?from`, `?to` | Lista aktywności z filtrami |
| `GET` | `/api/activities/{id}` | — | Szczegóły aktywności + metryki + strumienie |
| `GET` | `/api/activities/{id}/map` | — | Trasa w formacie GeoJSON |

### Analityka

| Metoda | Endpoint | Parametry | Opis |
|--------|----------|-----------|------|
| `GET` | `/api/analytics/pmc` | `from`, `to` | Seria CTL/ATL/TSB |
| `GET` | `/api/analytics/power-curve` | `from`, `to` | Krzywa mocy (best efforts) |
| `GET` | `/api/analytics/zones` | `zoneType`, `from`, `to` | Rozkład stref (power/hr) |
| `GET` | `/api/analytics/weekly` | `?weeks=8` | Podsumowania tygodniowe |
| `GET` | `/api/analytics/summary` | `?period=month` | Zagregowane statystyki |
| `GET` | `/api/analytics/trends` | `metric`, `from`, `to` | Trend metryki w czasie |
| `GET` | `/api/analytics/compare` | `period1From`, `period1To`, `period2From`, `period2To` | Porównanie dwóch okresów |

---

## 10. Uruchamianie testów

### Backend (90+ testów)

```bash
cd backend
./gradlew test
```

Obejmuje:
- Testy jednostkowe kalkulatorów metryk (NP, TSS, IF, EF, strefy, PMC, krzywa mocy, monotonia)
- Testy ArchUnit (architektura heksagonalna)
- Testy MockMvc kontrolerów (Activity, Analytics, Auth, Sync, Profile)

### Frontend (40+ testów)

```bash
cd frontend
npm test              # jednokrotne uruchomienie
npm run test:watch    # tryb watch (auto-rerun)
```

Obejmuje:
- Testy komponentów (Dashboard, Activities, Analytics, wykresy)
- Testy utility (formattersy, theme)

### Wszystko razem

```bash
# Z katalogu głównego
cd backend && ./gradlew test && cd ../frontend && npm test
```

---

## 11. Rozwiązywanie problemów

### Baza danych nie startuje

```bash
# Sprawdź logi
docker compose logs db

# Sprawdź czy port 5432 nie jest zajęty
ss -tlnp | grep 5432
```

### Flyway migration error

```bash
# Jeśli schemat się rozjeżdża — wyczyść i odtwórz (DEV only!)
docker compose down -v
docker compose up -d db
```

### Strava API — 401 Unauthorized

Token wygasł. Aplikacja automatycznie odświeża tokeny, ale jeśli refresh token wygasł:
1. Usuń profil z bazy
2. Ponownie wykonaj autoryzację: `GET /api/auth/strava/connect`

### Strava API — 429 Rate Limit

Limity Strava:
- **100 żądań / 15 minut**
- **1000 żądań / dzień**

Poczekaj 15 minut i spróbuj ponownie. Przy dużej liczbie aktywności, pełna synchronizacja może wymagać wielu prób.

### Frontend nie łączy się z backendem (dev)

Upewnij się, że:
1. Backend działa na porcie **8080**
2. Frontend (Vite) skonfigurowany z proxy `/api` → `http://localhost:8080`
3. Sprawdź konsolę przeglądarki (F12 → Network)

### CORS errors

W trybie deweloperskim proxy Vite obsługuje CORS automatycznie. Jeśli wywołujesz API bezpośrednio (np. Postman), CORS jest wyłączony — SecurityConfig pozwala na wszystkie żądania.

---

## Szybki start (TL;DR)

```bash
# 1. Skonfiguruj Strava API (https://developers.strava.com → Create & Manage Your App)
# 2. Skopiuj .env.example → .env i uzupełnij dane

cp .env.example .env
# edytuj .env

# 3. Uruchom bazę
docker compose up -d db

# 4. Uruchom backend
cd backend && ./gradlew bootRun &

# 5. Uruchom frontend
cd frontend && npm install && npm run dev &

# 6. Połącz ze Stravą
#    Otwórz: http://localhost:8080/api/auth/strava/connect
#    Skopiuj URL z odpowiedzi i otwórz w przeglądarce

# 7. Zaimportuj dane
#    POST http://localhost:8080/api/sync/strava/full

# 8. Gotowe!
#    Otwórz http://localhost:5173
```
