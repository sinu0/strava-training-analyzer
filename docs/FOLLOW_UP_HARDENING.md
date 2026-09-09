# Utwardzenie po audycie — 2026-09-09

Branch: `fix/follow-up-hardening`. Zmiany domykają elementy zapisane po audycie spójności, bez uruchamiania operacji masowo zmieniających dane zewnętrzne.

## Zrealizowane

- pełne odtworzenie osi czasu wykonania z trwałego logu zdarzeń i algorytm zgodności `workout-compliance-v3`;
- kontrolowane uzupełnianie jawnej proweniencji mocy ze Stravy oraz widoczne liczniki `measured`/`estimated`/`unknown`;
- spójna macierz przełączników AI, jawne statusy providera, bazy wiedzy i kolejki oraz blokada niedostępnych operacji w panelu;
- raport walidacji oparty wyłącznie o wyniki zapisane po predykcji, z odrzuceniem wycieku czasowego i uczciwymi stanami braku danych;
- brak pollingu endpointu Stravy przy niepełnej konfiguracji;
- automatyczne zwolnienie wygasłego limitu Stravy do stanu umożliwiającego ponowienie, także dla starego joba `RETRYABLE`;
- poprawne rozróżnienie pustego indeksu wiedzy (`EMPTY`) od niedostępnego magazynu (`UNAVAILABLE`);
- aktualizacja oficjalnych akcji CI i zależności frontendowych możliwych do podniesienia bez migracji głównych wersji;
- naprawa dwóch testów zależnych od strefy czasowej, odkryta podczas pełnej weryfikacji.

## Potwierdzona weryfikacja

- backend: 894 testy jednostkowe i 5 integracyjnych, wszystkie zielone;
- frontend: 409 testów w 95 plikach, lint, TypeScript, OpenAPI, build i budżety paczek zielone;
- zależności: `npm audit` — 0 podatności;
- E2E: prawdziwy backend i PostgreSQL w izolowanym Compose, pełny krytyczny przepływ treningowy zielony;
- LAN: 401 bez hasła, 200 po uwierzytelnieniu oraz 403 dla zapisu cross-site.
- runtime: cztery usługi Compose są zdrowe, zwykła synchronizacja ma status `completed`, frontend odpowiada 200, Ollama wygenerował odpowiedź modelem `qwen2.5:7b`, a `all-minilm` zwrócił embedding 384D na GPU.

## Granice automatyzacji

- Zadanie `POWER_PROVENANCE` nie zostało uruchomione na danych użytkownika, ponieważ wywołuje API Stravy dla historycznych aktywności i podlega limitom. Jest dostępne z panelu danych.
- Raport walidacji nie zastępuje zbioru ocen eksperckich. Bez prawidłowych próbek zwraca `UNAVAILABLE` albo `INSUFFICIENT_DATA`.
- Brak `docker buildx` jest stanem hosta, nie błędem kodu aplikacji; klasyczny build całego stosu przeszedł.
- Indeks wiedzy pozostaje celowo `EMPTY`. Istniejący importer korpusu wymaga osobnego utwardzenia proweniencji, idempotencji i rollbacku przed zasileniem produkcyjnej bazy.
- Nowy workflow GitHub Actions nie został jeszcze uruchomiony zdalnie; wymaga pushu, na który potrzebna jest osobna dyspozycja.
