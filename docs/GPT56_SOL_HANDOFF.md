# Przekazanie końcowego przeglądu do GPT-5.6 Sol

Skopiuj poniższy prompt do kolejnej sesji:

```text
Pracujesz w /home/mariuszp/Dokumenty/stravaAnalizator na branchu
feat/application-coherence. To jest końcowy przegląd już wdrożonego uspójnienia,
nie nowy audyt i nie zgoda na push, merge ani rozszerzanie zakresu.

Najpierw przeczytaj instrukcje AGENTS.md podane w sesji oraz:
- docs/APPLICATION_COHERENCE_IMPLEMENTATION.md
- docs/FOLLOW_UP_BACKLOG.md
- docs/BACKUP_AND_RECOVERY.md
- docs/LAN_ACCESS.md

Zweryfikowane fakty z 2026-09-06:
- pełny backend: 868 testów jednostkowych + 5 integracyjnych;
- frontend: lint, TypeScript, 405 testów/94 pliki, build i budżety są zielone;
- npm run api:check jest zielone;
- E2E na izolowanym Compose przeszło z prawdziwym API: kontekst, dwie sesje
  jednego dnia, start/pauza/odświeżenie/zakończenie, RPE 8 i weekly review;
- test LAN potwierdził 401 bez hasła, 200 z hasłem i 403 dla zapisu cross-site;
- właściwy stack został przebudowany przez docker compose up -d --build;
- runtime: kontenery healthy, /api/sync/status=completed, Flyway V55,
  1143 aktywności, 3 plany, brak aktywnego wykonania;
- migracja V55 unieważniła stare pochodne o niepewnej proweniencji, a ścisłe
  przeliczenie nie utworzyło żadnego POWER_TSS bez deviceWatts=true.
- końcowy przegląd usunął ostatnie sztuczne zera z legacy readiness i kontekstu
  AI; przy braku CTL/ATL/TSB API zwraca UNKNOWN bez pól liczbowych, a UI pokazuje
  brak oceny (wartości domenowe pozostają `null`).

Twoje zadanie:
1. Sprawdź bieżący branch, status i git diff --check. Brudny worktree jest
   oczekiwany i zawiera pracę użytkownika/poprzedniej sesji — niczego nie cofaj.
2. Przejrzyj diff pod kątem oczywistych przypadkowych artefaktów, niespójności
   kontraktu albo brakującego importu. Nie przebudowuj architektury ponownie.
3. Jeśli niczego nie zmieniasz, nie powtarzaj kosztownych testów bez powodu;
   potwierdź aktualny runtime poleceniami docker compose ps oraz
   curl -fsS http://127.0.0.1:8080/api/sync/status.
4. Jeśli znajdziesz i poprawisz realną regresję, zastosuj TDD, a potem uruchom
   proporcjonalne testy oraz pełne bramki końcowe:
   cd backend && ./gradlew test integrationTest
   cd frontend && npm run api:check && npm run quality
   cd .. && docker compose up -d --build
   docker compose ps
   curl -fsS http://127.0.0.1:8080/api/sync/status
   git diff --check
5. Zakończ raportem: co potwierdzono, co zmieniono i jakie ograniczenia pozostają.
   Nie twórz commita, nie pushuj i nie scalaj bez osobnego polecenia użytkownika.

Niezmienne zasady:
- brak danych to null/UNKNOWN/PARTIAL, nigdy sztuczne zero;
- deviceWatts=null nie jest pomiarem, a wartości historycznych nie wolno
  klasyfikować na podstawie samych watów;
- brak pełnej osi czasu wykonania oznacza compliance UNKNOWN;
- nie włączaj LAN bez certyfikatu, hasła i dokładnego APP_FRONTEND_URL;
- nie uruchamiaj npm audit fix --force;
- nie deklaruj zdalnego CI ani testu fizycznego urządzenia Garmin;
- dodatkowe tematy zapisane w FOLLOW_UP_BACKLOG.md wymagają nowego brancha i
  decyzji użytkownika, zamiast cichego dokładania ich do tego diffu.

Kryterium odbioru: aktualny zakres pozostaje zielony, runtime jest zdrowy,
proweniencja jest uczciwa, dokumentacja zgadza się ze stanem, a raport nie
ukrywa ograniczeń. Jeśli wszystko się zgadza, powiedz wprost, że branch jest
gotowy do decyzji użytkownika o commit/push/merge.
```
