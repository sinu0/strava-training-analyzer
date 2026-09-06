# Dalsze znaleziska

Problemy i pomysły odkryte podczas uspójnienia aplikacji, poza zatwierdzonym audytem. Lista nie oznacza wdrożenia.

| Obszar | Dowód / problem | Następny krok |
|---|---|---|
| Docker tooling | Compose ostrzega o braku pluginu buildx; klasyczny build działa. | Osobno uporządkować narzędzia hosta. |
| Zależności frontend | `npm audit` z 2026-09-05: 10 zgłoszeń (8 high, 2 moderate), m.in. react-router, undici, js-yaml, brace-expansion, PostCSS. Nie oznacza to potwierdzonej ekspozycji każdego wektora w tej aplikacji. | Oddzielny branch aktualizacyjny; sprawdzić zależności produkcyjne vs narzędzia build/test, zaktualizować lockfile i powtórzyć quality/E2E. Bez automatycznego `audit fix --force`. |
| Oś czasu wykonania | Po pauzie, zmianie intensywności, pominięciu/powtórzeniu kroku lub niezgodnym starcie wynik zgodności jest obecnie UNKNOWN. | Osobno wdrożyć odtworzenie pełnej osi czasu zdarzeń i jej wyrównanie do nagrania; nie zastępować brakujących danych przybliżoną oceną. |
| Opcjonalne AI | Test uruchomienia bez AI wykrył obowiązkowe zależności od opcjonalnego RAG/embeddingów. Blokadę startu poprawiono. W aktualnym runtime kolejka notatek jest wstrzymana, ponieważ skonfigurowany Ollama nie jest osiągalny. | Osobny test macierzy konfiguracji wszystkich dostawców, jawny status niedostępności indeksowania i decyzja: uruchomić usługę Ollama albo wyłączyć moduł AI w konfiguracji. |
| Historyczna moc | Żadna z 1143 obecnych aktywności nie ma w zachowanych danych flagi potwierdzającej pomiar lub estymację. Sama wartość watów nie pozwala odtworzyć pochodzenia. | Przy przyszłym odświeżeniu metadanych zachować flagę ze Stravy; ewentualną ręczną klasyfikację projektować jako audytowalną korektę, nigdy jako automatyczne zgadywanie. |
| Walidacja modelu | Testy deterministyczne chronią kontrakty i zachowanie konserwatywne, ale nie mierzą skuteczności zaleceń na oznaczonym zbiorze historycznym. | Na osobnym branchu przygotować wersjonowany zbiór ocen eksperckich i raport backtestu bez używania danych przyszłych. |
| Brak połączenia ze Stravą | Na pustym środowisku kontrolnym cykliczne `GET /api/sync/strava/check` kończy się 404 i zaśmieca logi, mimo że jest to oczekiwany stan bez poświadczeń. | Uzależnić polling od jawnego statusu połączenia i pokazać stan `UNAVAILABLE`, bez traktowania go jako awarii strony. |
