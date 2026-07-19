# Audyt i plan przebudowy V2

## Decyzje właściciela

- Kierunek produktu: decision-first Performance Lab z ekranem `Dzisiaj`.
- Pełny ekran `Pogoda` pozostaje częścią produktu. Jest dostępny z menu `Więcej`, paska bocznego i kontekstu na ekranie `Dzisiaj`.
- Historia, analityka i planowanie są konsolidowane do trzech spójnych obszarów.
- AI nie oblicza metryk ani pewności. Może w przyszłości wyłącznie objaśniać zweryfikowane wyniki.
- Aplikacja pozostaje local-only. Baza, backend, frontend i opcjonalna Ollama są domyślnie przypięte do loopbacka.
- Stare migracje Flyway pozostają bez zmian; schemat rozwijany jest wyłącznie migracjami forward-only.

## Architektura informacji V2

1. **Dzisiaj** — jeden główny wniosek, jawna dostępność i świeżość danych, dowody, ostatnia aktywność, obciążenie i kolejny trening.
2. **Historia** — jeden model filtrów zapisany w URL oraz widoki Lista/Kalendarz/Mapa. Szczegół aktywności rozdziela Przegląd, Analizę i Okrążenia.
3. **Analiza** — Porównaj, Obciążenie i regeneracja oraz Moc i trwałość. Każdy panel pobiera dane dopiero po otwarciu.
4. **Plan** — Kalendarz, Biblioteka i deterministyczny Scenariusz obciążenia.
5. **Więcej** — pełna Pogoda, profil, zdrowie, masa oraz Dane i zadania.

## Zrealizowany fundament

### Poprawność i jakość danych

- historyczne FTP nie korzysta z dzisiejszego profilu (`no future leakage`),
- rekordy osobiste są liczone chronologicznie, deduplikowane i filtrowane pod kątem niewiarygodnych wartości,
- 5 s power korzysta z okna krzywej mocy, a 40 km z rzeczywistego odcinka,
- brak danych zdrowotnych ma stan `UNKNOWN`, nigdy wynik `0`,
- priorytety używają właściwych źródeł TSS i tętna, nie zwracają ujemnego zmęczenia ani `NaN`,
- wynik metryki zapisuje wersję kalkulatora, fingerprint wejścia, `computedAt` i `asOf`,
- jakość aktywności ma jawny stan `UNKNOWN | PARTIAL | AVAILABLE`; brak miernika mocy nie oznacza niekompletnego importu,
- `VirtualRide` pozostaje rozróżnialne jako `virtual_ride`.

### Import i zadania

Import i przeliczenia są reprezentowane przez trwałe zadania. Każde zadanie zapisuje etap, próbę, błąd i postęp. Aktywne zadania danego typu są blokowane przed równoległym uruchomieniem, a nieudane zadanie można wznowić.

Etapy importu:

`FETCH_SUMMARY → FETCH_DETAIL → STORE_ACTIVITY → CALCULATE_METRICS → UPDATE_DAILY → DERIVE_INSIGHTS → COMPLETE`

OAuth Stravy używa jednorazowego, losowego parametru `state` z czasem wygaśnięcia. Niebezpieczny, częściowy endpoint `DELETE /api/sync/data` został wycofany i zwraca `410 Gone`.

### API V2

- `GET /api/v2/today`
- `GET /api/v2/activities`
- `GET /api/v2/activities/{id}`
- `GET /api/v2/activities/{id}/streams?series=&resolution=`
- `GET /api/v2/activities/{id}/laps`
- `GET /api/v2/analytics/overview`
- `GET /api/v2/analytics/compare`
- `GET /api/v2/analytics/load`
- `GET /api/v2/analytics/power`
- `GET /api/v2/planning/load-scenario`
- `GET /api/v2/data-quality/summary`
- `GET /api/v2/data-quality/activities/{id}`
- `POST /api/v2/import-jobs`
- `POST /api/v2/recalculation-jobs`
- `GET /api/v2/jobs/{id}`

Lista aktywności korzysta z lekkiej projekcji, szczegół nie zawiera strumieni, a strumienie są pobierane na żądanie i domyślnie downsamplowane. Publiczne odpowiedzi V2 używają typowanych DTO i jawnych stanów dostępności.

### Frontend V2 i mapy aktywności

- powłoka używa jednej gramatyki Performance Lab: zwarte powierzchnie, czytelne liczby, spokojne tło i pomarańczowy akcent,
- `Dzisiaj`, `Historia`, szczegół aktywności, `Analiza`, `Plan`, `Więcej` oraz `Dane i zadania` korzystają ze wspólnych komponentów powierzchni i metryk,
- lista Historii ponownie pokazuje mapę każdej aktywności w stylu feedu Stravy,
- mapy listowe powstają wyłącznie z `summaryPolyline`; nie pobierają ciężkich strumieni,
- pierwsze widoczne mapy są montowane od razu, dalsze dopiero przed wejściem w viewport przez `IntersectionObserver`,
- trasa jest widoczna również przy ostatnim treningu na ekranie `Dzisiaj` i jako duża mapa w Przeglądzie aktywności,
- pełne Studio pogody pozostało dostępne i korzysta z nowej powłoki bez redukcji funkcji.

### Wydajność, bezpieczeństwo i runtime

- lista 20 aktywności na obecnym zbiorze 1123 sesji ma około 29 kB,
- szczegół przykładowej aktywności ma około 137 kB, a zredukowane strumienie około 21 kB,
- główny chunk aplikacji spadł z 551 kB do około 28 kB; React, MUI, Recharts, Leaflet i warstwa danych mają osobne chunki,
- produkcyjne zależności frontendu po bezpiecznym `npm audit fix` nie mają znanych podatności w raporcie npm; pozostały problemy narzędzi deweloperskich wymagające breaking update Vitest i nie zostały wymuszone,
- baza, backend i frontend mają healthchecki oraz bindy wyłącznie do `127.0.0.1`,
- migracje V43–V45 zostały wykonane na istniejącej bazie, a zapytania lekkich projekcji sprawdzone na PostgreSQL 16,
- nieistniejący zasób zwraca `404`, a wycofane niebezpieczne czyszczenie danych `410`.

### Redukcja bez utraty danych

Przed usuwaniem modułów sprawdzono istniejącą bazę. `planned_route` i `gear` są puste, ale istnieją dane, które wymagają eksportu lub migracji: 1 element equipment, 1 wpis dziennika, 82 notatki AI i 489 predykcji AI. Dlatego stare trasy UI są przekierowane do V2, lecz tabele i kod obsługujący zapisane dane nie zostały skasowane w tej zmianie. Usunięcie nastąpi dopiero po przygotowaniu eksportu i potwierdzeniu zachowania tych danych.

## Świadomie wstrzymane analizy

Durability, eFTP/CP range, podobne sesje i tygodniowy review nie trafiają do interfejsu wyłącznie na podstawie heurystyki. Ich publikacja wymaga złotych zbiorów danych, poprawnego uwzględnienia `timeStream`, rolling-origin backtestu oraz raportu błędu, bias i coverage. Scenariusz obciążenia jest deterministycznym wyliczeniem CTL/ATL z jawnymi założeniami i nie jest nazywany prognozą wyniku.

## Kryteria odbioru

- pełne testy backendu i frontendu są zielone,
- krytyczne E2E obejmują Dzisiaj, Historię/szczegół, Analizę, Plan i Pogodę,
- typecheck i build produkcyjny frontendu przechodzą,
- migracje uruchamiają się na PostgreSQL,
- stack startuje poleceniem `docker compose up -d --build`,
- backend, baza i Ollama nie są publicznie wystawione,
- żaden brak danych nie jest przedstawiany jako zero ani pewna predykcja.

## Wynik weryfikacji 2026-07-19

- backend: 798 testów zaliczonych,
- frontend: 369 testów Vitest zaliczonych w 76 plikach,
- Playwright: 5/5 krytycznych przepływów zaliczonych,
- TypeScript oraz produkcyjny build Vite zaliczone bez ostrzeżenia o chunku powyżej 500 kB,
- `npm audit --omit=dev`: 0 znanych podatności produkcyjnych,
- Compose przebudowany od obrazów aplikacji; baza, backend i frontend osiągnęły stan `healthy`,
- kontrola rzeczywistego UI wykonana na desktopie i przy szerokości 390 px; pełna Pogoda działa bez błędów przeglądarki,
- istniejący dług lint V1 pozostaje jawny: 101 błędów w 44 z 361 analizowanych plików i 155 ostrzeżeń. Nowe moduły V2 przechodzą kontrolę lint; masowa korekta V1 nie została połączona z migracją funkcjonalną.

## Następne bezpieczne rozszerzenia

1. Dodać generowanie typów TypeScript z OpenAPI i sprawdzenie kontraktu w CI.
2. Dodać Testcontainers dla projekcji JSONB, migracji i pełnego przepływu importu.
3. Zbudować oraz backtestować podobne sesje, tygodniowy review, eFTP/CP i durability.
4. Po potwierdzeniu pokrycia scenariuszy usunąć pozostałe klasy V1 i martwe endpointy w osobnej migracji redukcyjnej.
5. Dla dostępu przez LAN lub Internet dodać single-user authentication przed zmianą bindów z loopbacka.
