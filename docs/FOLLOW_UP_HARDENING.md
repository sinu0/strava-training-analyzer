# Utwardzenie po audycie — 2026-09-10

Branch: `fix/follow-up-hardening`. Zmiany domykają elementy zapisane po audycie spójności oraz ich kontrolowaną weryfikację na lokalnym runtime.

## Zrealizowane

- pełne odtworzenie osi czasu wykonania z trwałego logu zdarzeń i algorytm zgodności `workout-compliance-v3`;
- kontrolowane uzupełnianie jawnej proweniencji mocy ze Stravy oraz widoczne liczniki `measured`/`estimated`/`unknown`;
- spójna macierz przełączników AI, jawne statusy providera, bazy wiedzy i kolejki oraz blokada niedostępnych operacji w panelu;
- raport walidacji oparty wyłącznie o wyniki zapisane po predykcji, z odrzuceniem wycieku czasowego i uczciwymi stanami braku danych;
- brak pollingu endpointu Stravy przy niepełnej konfiguracji;
- automatyczne zwolnienie wygasłego limitu Stravy do stanu umożliwiającego ponowienie, także dla starego joba `RETRYABLE`;
- trwałe `retryAt`, automatyczne wznowienie po resecie limitu, odzyskanie joba po przeładowaniu UI i blokada równoległych duplikatów w bazie;
- poprawne rozróżnienie pustego indeksu wiedzy (`EMPTY`) od niedostępnego magazynu (`UNAVAILABLE`);
- wersjonowany i idempotentny korpus RAG, z kompletnym przygotowaniem przed zapisem, atomową podmianą i testem rollbacku;
- odtwarzalny obraz PostgreSQL 16/pgvector 0.8.6 na Bookworm, PostGIS 3.6.4 oraz kontrolowana migracja collation bez utraty danych;
- aktualizacja oficjalnych akcji CI i zależności frontendowych możliwych do podniesienia bez migracji głównych wersji;
- naprawa dwóch testów zależnych od strefy czasowej, odkryta podczas pełnej weryfikacji.

## Potwierdzona weryfikacja

- backend: 913 testów jednostkowych i 7 integracyjnych, wszystkie zielone;
- frontend: 412 testów w 95 plikach, lint, TypeScript, OpenAPI, build i budżety paczek zielone;
- zależności: `npm audit` — 0 podatności;
- E2E: prawdziwy backend i PostgreSQL w izolowanym Compose, pełny krytyczny przepływ treningowy zielony;
- LAN: 401 bez hasła, 200 po uwierzytelnieniu oraz 403 dla zapisu cross-site.
- runtime: cztery usługi Compose są zdrowe, zwykła synchronizacja ma status `completed`, frontend odpowiada 200, Ollama wygenerował odpowiedź modelem `qwen2.5:7b`, a `all-minilm` zwrócił embedding 384D na GPU;
- dane: `POWER_PROVENANCE` ukończył 4 próby z automatycznym wznowieniem i rozdzielił 446 aktywności z mocą na 301 zmierzonych oraz 145 szacowanych, bez nieznanej proweniencji;
- RAG: 36 unikalnych fragmentów z 3 stron, jedna wersja korpusu `d58b84c5…`; ponowny import zwrócił `unchanged`.
- baza: Flyway V60, zgodne wersje collation `2.36`, działające PostGIS 3.6.4 i pgvector 0.8.6; zachowano 1143 aktywności oraz 3 plany.

## Granice automatyzacji

- Raport walidacji nie zastępuje zbioru ocen eksperckich. Bez prawidłowych próbek zwraca `UNAVAILABLE` albo `INSUFFICIENT_DATA`.
- Providerzy AI inni niż lokalny Ollama wymagają kluczy użytkownika i nie byli wywoływani bez nich.
- Korpus RAG korzysta z wersjonowanej treści pobieranej z trzech publicznych stron TrainingPeaks; nie jest zamiennikiem wersjonowanych etykiet eksperckich do walidacji modelu.
- Nowy workflow GitHub Actions nie został jeszcze uruchomiony zdalnie; wymaga pushu, na który potrzebna jest osobna dyspozycja.
