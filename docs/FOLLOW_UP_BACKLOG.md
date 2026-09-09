# Dalsze znaleziska i stan realizacji

Lista powstała podczas uspójnienia aplikacji. Stan z 2026-09-09 odróżnia zakończone zmiany w repozytorium od prac wymagających środowiska, danych albo decyzji użytkownika.

| Obszar | Stan | Co zostało zrobione | Co pozostaje |
|---|---|---|---|
| Docker tooling | ZEWNĘTRZNE | Klasyczny build Compose działa i jest częścią weryfikacji końcowej. | Na hoście nadal brakuje pluginu `docker buildx`. Jego instalacja jest zmianą systemową, nie poprawką repozytorium. |
| Zależności frontend | ZAKOŃCZONE BEZPIECZEŃSTWO | Zaktualizowano lockfile w zgodnych zakresach i wymuszono bezpieczną wersję przechodniej `js-yaml`; `npm audit` nie zgłasza podatności. | ESLint 9 jest już oznaczony jako niewspierany, ale bieżące wydania `eslint-plugin-import`, `eslint-plugin-jsx-a11y` i `eslint-plugin-react` nie deklarują jeszcze zgodności z ESLint 10. Razem z MUI 9, TypeScript 7 i Vitest 5 wymaga to osobnej migracji funkcjonalnej, nie wymuszonego `audit fix`. |
| Oś czasu wykonania | ZAKOŃCZONE | Ocena v3 odtwarza z trwałego logu pauzy, wznowienia, zmianę intensywności, pomijanie, cofanie, powtarzanie i kroki sterowane okrążeniem, po czym wyrównuje cele do czasu nagrania. Niespójny log nadal daje `UNKNOWN`. | Brak pracy wymaganej dla obecnego kontraktu. |
| Opcjonalne AI | ZAKOŃCZONE | Wszystkie adaptery i zadania wymagają przełącznika głównego oraz własnego; API i panel pokazują osobno stan providera, RAG i kolejki. `.env.example` opisuje pełną macierz konfiguracji. W lokalnym runtime uruchomiono profil Compose AI oraz modele `qwen2.5:7b` i `all-minilm`; generowanie i embedding sprawdzono na GPU. | Inni opcjonalni providerzy mają pokrycie konfiguracji testami, ale nie byli wywoływani bez kluczy użytkownika. |
| Historyczna moc | GOTOWE DO KONTROLOWANEGO URUCHOMIENIA | Dodano zadanie `POWER_PROVENANCE`, które pobiera wyłącznie jawną flagę `deviceWatts` z metadanych Stravy, nie pobiera ponownie strumieni i nie zgaduje wartości. Panel pokazuje liczby źródeł zmierzonych, szacowanych i nieznanych. | Nie uruchomiono masowego odświeżenia istniejących aktywności: wykonuje zewnętrzne wywołania i podlega limitom Stravy. Uruchamia je użytkownik z panelu danych. |
| Walidacja modelu | CZĘŚCIOWE / DANE ZEWNĘTRZNE | Dodano raport wyników zweryfikowanych dopiero po predykcji, odrzucający rekordy z wyciekiem czasowym lub niepoprawnymi metrykami. Brak próbek jest jawnie `UNAVAILABLE`, a mała próba `INSUFFICIENT_DATA`. | Naukowa ocena nadal wymaga wersjonowanego zbioru etykiet eksperckich i uzgodnionej metodologii backtestu. Aplikacja nie tworzy takich etykiet automatycznie. |
| Korpus wiedzy AI | NOWE ZNALEZISKO | Runtime poprawnie rozróżnia dostępny, lecz pusty indeks jako `EMPTY`. Nie uruchomiono automatycznego importu trudnego do audytu korpusu. | Obecny `KnowledgeBaseBuilder.rebuild()` korzysta z bieżących stron blogowych bez wersjonowanego snapshotu, nie wykonuje atomowej podmiany i może dopisywać duplikaty przy kolejnych przebiegach. Przed zasileniem RAG należy zaprojektować wersjonowane źródła, idempotentny zapis i bezpieczny rollback. |
| Brak połączenia ze Stravą | ZAKOŃCZONE | Polling nowych aktywności uruchamia się tylko przy kompletnej konfiguracji Stravy; przycisk pokazuje stan połączenia i jest bezpiecznie zablokowany. | Brak. |
| GitHub Actions | ZAKOŃCZONE W REPO | Workflow używa aktualnych głównych wersji oficjalnych akcji i zachowuje pełny zakres quality/E2E/LAN. | Zdalny przebieg nowej rewizji będzie możliwy dopiero po osobnej zgodzie na push. Poprzedni baseline `c4e35cc` przeszedł w runie `34049307509`. |

## Dodatkowo naprawione podczas realizacji

- Dwa testy zależały od rzeczywistej północy i mieszały `Europe/Warsaw` z UTC. Otrzymały stały `Clock`, dzięki czemu nie są już losowo czerwone między północą lokalną a północą UTC.
- Odtwarzanie osi treningu odrzuca również identyfikatory obcego wykonania, luki w sekwencji, cofnięcie czasu oraz indeksy kroków spoza zapisanego snapshotu.
- Historyczny status `rate_limited` z minioną datą resetu nie blokuje już synchronizacji i gotowości danych bezterminowo; zostaje odzyskany jako nieukończona operacja możliwa do ponowienia.
- Kontrola dostępności RAG nie używa już zapytania `LIMIT 0`, które zawsze zwracało brak wiersza; istniejący pusty indeks ma stan `EMPTY`.
- Po aktualizacji Playwrighta lokalny cache przeglądarki został odświeżony do wymaganej rewizji; nie jest to zmiana przechowywana w repozytorium.
