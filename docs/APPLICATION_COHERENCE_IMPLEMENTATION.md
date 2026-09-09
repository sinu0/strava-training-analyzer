# Uspójnienie aplikacji — 2026-09-05/06

Branch: `feat/application-coherence`. Zakres zatwierdzony po audycie aplikacji.

## Zrealizowany zakres

- [x] Daty: jeden konfigurowalny dzień sportowca, lokalne daty bez konwersji przez UTC, półotwarte zakresy czasu i test przejścia przez północ w `Europe/Warsaw`.
- [x] Metryki: brak pomiaru jest `null`/`UNKNOWN`, nie zerem; wspólny `TrainingLoadService` zwraca aktualność, pokrycie aktywności oraz pokrycie dni.
- [x] Coaching: jawny cel, dostępność tygodniowa i ograniczenia; jedna deterministyczna polityka oparta o snapshot; brak precyzyjnego TSS przy niepełnych danych; trwały, idempotentny feedback.
- [x] Ocena wykonania: wspólny ewaluator planu i wykonania; brak potwierdzonej mocy lub zmieniona oś czasu daje `UNKNOWN`; kalendarz zachowuje kilka sesji jednego dnia.
- [x] Kontekst i review: edycja założeń sportowca, optymistyczna blokada rewizji i tygodniowy przegląd wykonania oraz RPE.
- [x] Kontrakty i testy: generowane typy OpenAPI, lokalne CI, PostgreSQL/Flyway oraz E2E z prawdziwym API i bez mocków.
- [x] Uproszczenie: usunięte nieużywane alternatywne silniki i komponenty decyzji; aktywne wejścia korzystają ze wspólnych przypadków użycia.
- [x] Proweniencja i walidacja: `deviceWatts` przechodzi od importu do API/UI, krzywa mocy domyślnie przyjmuje tylko pomiar, a scenariusze polityki i zgodności są deterministycznymi zestawami regresyjnymi.
- [x] Operacje: spójny backup z sumami, próbne odtworzenie do odizolowanego kontenera oraz opcjonalny wariant LAN z HTTPS, hasłem i blokadą zapisu cross-site.
- [x] Weryfikacja końcowa: pełne testy, E2E, OpenAPI, Docker build, kontrola runtime i `git diff --check` zakończone powodzeniem.

## Potwierdzone testy

- Backend: 868 testów jednostkowych i 5 integracyjnych, PostgreSQL z migracjami do V55.
- Frontend: 405 testów w 94 plikach; lint, TypeScript, build i budżety paczek zakończone powodzeniem.
- E2E: prawdziwy zapis kontekstu, dwie sesje jednego dnia, start/pauza/odświeżenie/zakończenie treningu, RPE 8 oraz tygodniowy review.
- OpenAPI: wygenerowany kontrakt jest zgodny z backendem.
- LAN: bez hasła 401, z hasłem 200, zapis cross-site 403.
- Backup: odtworzenie kopii potwierdziło 1142 aktywności, 3 plany i 52 migracje w kopii sprzed nowych migracji.
- Runtime: trzy kontenery są zdrowe, synchronizacja ma status `completed`, aktywne wykonanie zwraca 204, a baza po migracji V55 zachowała 1143 aktywności i 3 plany.
- Readiness: brak bieżących CTL/ATL/TSB zwraca `availability=UNKNOWN` bez pól liczbowych zamiast pozornego wyniku z zer; domena zachowuje `null`, UI pokazuje brak oceny, a kontekst AI nie dostaje precyzyjnej wskazówki.
- Ścisłe przeliczenie: 0 dni oznaczonych jako `POWER_TSS` bez potwierdzonej mocy; zachowano 597 dni z `HR_TSS`, a 312 dni jawnie opisano jako `UNKNOWN`.

## Uczciwe ograniczenia i dalsze utwardzenie

- Historyczne aktywności bez flagi źródła mocy nadal pozostają nieznane. Dodane 2026-09-09 zadanie `POWER_PROVENANCE` potrafi uzupełnić wyłącznie jawne metadane zwrócone przez Stravę; nie zostało uruchomione masowo i nigdy nie klasyfikuje aktywności na podstawie samej wartości watów.
- Od 2026-09-09 wykonania z pełnym, spójnym logiem zdarzeń mogą być oceniane także po pauzie, zmianie intensywności, pominięciu lub powtórzeniu kroku. Niepełny, niespójny albo niewyrównany log nadal celowo daje `UNKNOWN`.
- Testy regresyjne sprawdzają poprawność i konserwatywność polityki, nie stanowią klinicznej ani naukowej walidacji zaleceń treningowych.
- Wariant LAN jest przygotowany, ale celowo nie został włączony. Wymaga certyfikatu, hasła i dokładnego `APP_FRONTEND_URL`.
- Pipeline baseline `c4e35cc` przeszedł zdalnie w GitHub Actions jako run `34049307509`. Zmiany z 2026-09-09 wymagają nowego przebiegu po osobnej zgodzie na push.

Dodatkowe znaleziska spoza audytu są zapisane w `FOLLOW_UP_BACKLOG.md`.
