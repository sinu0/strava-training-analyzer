# Frontend V3 — audyt wzorców i wdrożenie

Stan na: 2026-07-19

## Cel produktu

Frontend ma odpowiadać najpierw na pytanie „co dziś zrobić?”, a dopiero później prowadzić do historii, analizy i planowania. Interfejs pozostaje ciemny, mobile-first, local-only i nie ukrywa braku ani niskiej jakości danych.

## Benchmark największych platform

Audyt publicznych, aktualnych stron produktowych wykonano w realnej przeglądarce. Nie kopiujemy ich warstwy wizualnej; wykorzystujemy sprawdzone modele informacji.

| Platforma | Publicznie eksponowany wzorzec | Wniosek dla Training Lab | Realizacja |
| --- | --- | --- | --- |
| [Strava](https://www.strava.com/features) | Trzy proste filary: Train, Explore, Compete; cele, spersonalizowane wnioski, pełna historia, trasy i progres w czasie | Ograniczyć główną nawigację do zadań użytkownika; trasy traktować jako pełnoprawny obszar | Dzisiaj, Historia, Analiza, Plan, Trasy; osobny lekki ślad trasy na kokpicie |
| [TrainingPeaks](https://www.trainingpeaks.com/athlete-features/) | Plan jako centrum operacyjne, metryki mają prowadzić do działania, produkt oddziela doświadczenie sportowca od narzędzi dodatkowych | Analiza nie może być ścianą wykresów; plan, kalendarz i scenariusz muszą pozostać odtwarzalne | Zakładki z lazy fetching, zakresy w URL, jawne założenia scenariusza CTL/ATL |
| [Garmin Connect](https://www.garmin.com/en-US/p/125677/) | Statystyki „at a glance”, personalizacja względem celów i priorytetów, coach, courses, workout database | Krótki przegląd ma być konfigurowalny, a funkcje specjalistyczne dostępne bez przeciążania startu | Widgetowy kokpit z kolejnością, rozmiarem i ustawieniami; cztery własne skróty mobilne |
| [WHOOP](https://www.whoop.com/pl/en/how-it-works/) | Przepływ: pomiar → znaczący wniosek → wskazówka → zmiana; Sleep/Strain/Recovery jako odrębne, proste obszary | Najpierw rekomendacja i jej dowody, następnie regeneracja i obciążenie; pewność musi być widoczna | Widget decyzji, evidence, confidence i jawne stany UNKNOWN/PARTIAL/AVAILABLE |

## Zrealizowana architektura informacji

### Nawigacja

- Desktop: pięć sekcji głównych — Dzisiaj, Historia, Analiza, Plan, Trasy.
- Sekcje wtórne: Pogoda, Zdrowie, Profil, Dane, Ustawienia.
- Mobile: dokładnie cztery zapisane skróty oraz stały przycisk Więcej.
- Skróty można skonfigurować w Więcej, a Trasy przypiąć bezpośrednio z planera po jawnym wybraniu elementu do zastąpienia.
- Stare adresy mają bezpieczne przekierowania: `/dashboard → /`, `/route-planner → /routes`, `/admin → /data`.
- Top bar zawiera wyłącznie akcje globalne. Kontekst i jedyny `h1` należą do strony.

### Kokpit Dzisiaj

- Układ jest zapisywany po stronie backendu z `schemaVersion` i `revision`.
- Aktualizacja ze starą rewizją zwraca `409 Conflict`.
- Można dodawać, usuwać, przenosić klawiaturą lub wskaźnikiem, zwężać i poszerzać widgety.
- Nieznany typ widgetu jest pomijany z ostrzeżeniem, dzięki czemu przyszła wersja schematu nie psuje całego pulpitu.
- Ostatnia trasa używa lokalnego SVG z `summaryPolyline`; nie ładuje Leaflet ani zewnętrznych kafelków.
- Dostępne moduły: decyzja, regeneracja, obciążenie, ostatnia aktywność, następny trening, pogoda, objętość tygodnia i cel.

### Trasy i pozostałe obszary

- Planner tras wrócił jako pełna sekcja `/routes`, z wariantami, wysokością i pogodą na trasie.
- Historia zachowuje listę, kalendarz i mapę oraz zapisuje widok, filtry i stronę w URL.
- Analiza pobiera dane dopiero dla otwartej zakładki i zapisuje zakres w URL.
- Plan zachowuje kalendarz, bibliotekę oraz deterministyczny scenariusz obciążenia.
- Pogoda, Zdrowie, Profil, Dane i Ustawienia pozostają dostępne, ale nie konkurują z decyzją dnia.

## System wizualny i dostępność

- Jedna paleta powierzchni, akcentów, statusów i wykresów z tokenów motywu.
- Systemowy font bez blokującego pobrania Google Fonts.
- Widoczny fokus, skip link, obsługa `prefers-reduced-motion` i safe-area na urządzeniach mobilnych.
- Jeden `h1` na ekran, uporządkowane nagłówki widgetów i nazwy dostępności dla map, wykresów, ikonowych akcji oraz dni kalendarza.
- Kalendarz działa klawiaturą, a elementy list mają prawidłową semantykę.
- Automatyczny gate axe obejmuje WCAG 2.1 A/AA dla głównych ekranów i szerokości 390, 768, 1280 oraz 1440 px.
- Wykresy PMC, mocy i scenariusza obciążenia mają tekstowe podsumowania wartości dla technologii asystujących.

## Wydajność i runtime

- React 19.2, MUI 7, TanStack Query, Recharts 3, Vite 8 i Node 24.
- Strony są lazy-loaded; mapa i Recharts pozostają poza wejściem ekranów, które ich nie potrzebują.
- Nginx kompresuje treści i stosuje długie cache dla fingerprintowanych assetów.
- Budżety po gzip są egzekwowane w `npm run quality`:
  - wejście aplikacji: maks. 115 kB,
  - Dzisiaj: maks. 30 kB,
  - Trasy: maks. 25 kB,
  - dowolny pojedynczy chunk: maks. 110 kB.
- OpenAPI generuje typy do `src/api/generated/schema.ts` poleceniem `npm run api:generate`.

## Mechanizmy kontroli jakości

- ESLint ma zero ostrzeżeń i obejmuje reguły hooks oraz a11y.
- TypeScript działa w trybie ścisłym, produkcyjny build musi przejść przed budżetem bundle.
- Vitest obejmuje migrację preferencji, konflikty rewizji, edycję widgetów, skróty mobilne, routing i podsumowania wykresów.
- Playwright obejmuje przepływy krytyczne oraz osobny automatyczny audyt axe.
- Backend ma testy serwisu i kontrolera preferencji, a Flyway tworzy trwały zapis ustawień.

## Granice audytu

Automatyczny axe wykrywa część problemów WCAG, ale nie zastępuje manualnego testu czytnikiem ekranu, oceny zrozumiałości tekstów ani badań z użytkownikami. Rekomendacje treningowe nadal muszą wynikać ze zweryfikowanych danych domenowych, a nie z samej prezentacji lub modelu językowego.
