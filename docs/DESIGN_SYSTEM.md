# System komponentów `@/ui`

Jedno miejsce, które wyznacza wygląd aplikacji. Wzorem jest referencyjny dashboard „Granger”: zaokrąglone karty, ikony w okrągłych bąblach, duże lekkie liczby z małą jednostką, pigułki statusu, cienkie paski postępu i wykresy kropkowe.

## Gdzie co zmieniać

| Co zmieniasz | Gdzie |
|---|---|
| Kolory, promienie, odstępy, typografia, cienie, ruch, szkło, kolory map i stref | `frontend/src/theme/theme.ts` → `getThemeTokens(mode)` |
| Wygląd i budowa części interfejsu | `frontend/src/ui/*` (import zawsze z `@/ui`) |
| Nadpisania surowych komponentów MUI (Button, Chip, Tabs, Slider…) | `createAppTheme()` w `theme.ts` |

Podgląd wszystkich części w obu motywach: trasa `/design-system` (ukryta w nawigacji). Test `e2e/tests/design-system.spec.ts` porównuje ją ze zrzutami wzorcowymi.

## Części

| Grupa | Komponenty |
|---|---|
| Powierzchnie | `Surface` (default / accent / muted / glass / outlined), `Widget` (Surface + nagłówek + treść), `HeroCard` (overlay / split), `WidgetGrid` + `WidgetCell` |
| Nagłówki | `PageHeader`, `Page`, `SectionHeader`, `WidgetHeader`, `IconBubble`, `BrandMark` |
| Wartości | `Metric` (readout / stat / hero), `LegendStat`, `StatRow`, `GlassStat` |
| Status i postęp | `StatusPill` (soft / solid / outline / glass, `tone` albo `color`), `ProgressTrack` (bar / marker / segmenty) |
| Wykresy | `DotMatrixRow`, `DotMatrixChart`, `Sparkline`, `ChartFrame` + `useChartVisuals()` dla Recharts |
| Akcje | `RoundAction` (media / accent / bubble) |
| Stany | `LoadingState`, `ErrorState`, `EmptyState`, `SkeletonCard` |

## Zasady

- Ekrany składają się z `@/ui` i zwykłych komponentów układu MUI (`Box`, `Stack`, `Grid`, `Typography`, `Button`). `Card` i `Paper` są zarezerwowane dla `src/ui`.
- Żadnych literałów kolorów (`#hex`, `rgba(`) poza `src/theme`. Kolor bierzesz z palety (`'primary.main'`, `'text.secondary'`) albo z tokenów.
- Tokeny czytasz zawsze przez `getAppThemeTokens(theme)` lub `useTokens()`, nigdy przez `theme.tokens.x`, bo testy mogą renderować na gołym motywie MUI.
- Kolory kategorii danych (strefy, efekt treningowy, serie map) leżą w `tokens.chart.*` i `tokens.map.*`. Nie definiuj ich lokalnie w komponencie.
- Pliki ładowane na starcie (`App.tsx`, `components/layout/*`) importują konkretne moduły (`@/ui/feedback/LoadingState`, `@/ui/BrandMark`), nie barrel `@/ui`. Inaczej cały zestaw trafia do początkowego bundla i łamie budżet `npm run budget`.
- Brakuje części? Dodaj ją do `src/ui`, eksportuj w `src/ui/index.ts`, pokaż w katalogu i napisz test w `src/ui/__tests__`. Nie buduj lokalnego odpowiednika w feature.

Strażnik w ESLint (`eslint.config.mjs`) jest częścią `npm run lint` i odrzuca literały kolorów oraz importy starych powierzchni.
