# Przekazanie przeglądu do GPT-5.6 Sol

Skopiuj poniższy prompt do kolejnej sesji, jeśli potrzebny będzie niezależny przegląd brancha:

```text
Pracujesz w /home/mariuszp/Dokumenty/stravaAnalizator na branchu
fix/follow-up-hardening. To jest niezależny przegląd już wdrożonego utwardzenia,
nie zgoda na push, merge ani masowe uruchamianie zadań na danych użytkownika.

Najpierw przeczytaj instrukcje AGENTS.md podane w sesji oraz:
- docs/FOLLOW_UP_HARDENING.md
- docs/FOLLOW_UP_BACKLOG.md
- docs/APPLICATION_COHERENCE_IMPLEMENTATION.md
- docs/BACKUP_AND_RECOVERY.md
- docs/LAN_ACCESS.md

Zweryfikowane lokalnie 2026-09-10:
- backend: 913 testów jednostkowych i 7 integracyjnych;
- frontend: 412 testów/95 plików, lint, TypeScript, OpenAPI, build i budżety;
- npm audit: 0 podatności;
- E2E z prawdziwym API i PostgreSQL oraz kontrola LAN są zielone;
- pełna oś zdarzeń może zasilać workout-compliance-v3;
- AI ujawnia osobne stany providera, RAG i kolejki;
- lokalny Ollama ma gotowe `qwen2.5:7b` i `all-minilm`; atomowy indeks RAG ma 36 dokumentów i wersję `d58b84c5…`;
- zadanie POWER_PROVENANCE zachowuje wyłącznie jawną flagę Stravy, ukończyło 4 próby i dało 301 `measured`, 145 `estimated`, 0 `unknown`;
- job po limicie ma trwałe `retryAt`, wznawia się automatycznie i jest odnajdywany po przeładowaniu panelu;
- baza działa po migracji V60 na PostgreSQL 16/Bookworm, PostGIS 3.6.4 i pgvector 0.8.6, z odświeżoną collation;
- polling Stravy nie działa bez kompletnej konfiguracji.

Twoje zadanie:
1. Sprawdź branch, status i `git diff --check`; nie cofaj cudzych zmian.
2. Przejrzyj ostatni commit pod kątem regresji kontraktu, przypadkowych artefaktów
   i naruszenia zasady null/UNKNOWN/PARTIAL.
3. Jeżeli nie zmieniasz kodu, nie powtarzaj kosztownych testów bez nowego powodu;
   sprawdź bieżący runtime przez `docker compose ps` i endpointy statusowe.
4. Realną regresję napraw przez TDD, a następnie uruchom proporcjonalne testy.
5. Nie uruchamiaj zadania POWER_PROVENANCE, AI batch, synchronizacji ani innych
   operacji na danych użytkownika wyłącznie w celu przeglądu.
6. Nie twórz commita, nie pushuj i nie scalaj bez osobnego polecenia użytkownika.

Niezmienne zasady:
- brak danych to null/UNKNOWN/PARTIAL/UNAVAILABLE, nigdy sztuczne zero;
- deviceWatts=null nie jest pomiarem i nie wolno klasyfikować go po samych watach;
- niepełny lub sprzeczny log wykonania oznacza compliance UNKNOWN;
- raport wyników AI nie jest naukową walidacją ani zbiorem etykiet eksperckich;
- brak zdalnego runu CI lub fizycznego testu Garmin należy raportować,
  a nie przedstawiać jako potwierdzone.

Kryterium odbioru: runtime jest zdrowy, proweniencja pozostaje uczciwa,
dokumentacja zgadza się ze stanem, a raport wyraźnie oddziela wykonane zmiany
od zadań zależnych od środowiska lub człowieka.
```
