# `@/ui` component system

The single place that defines how the app looks. The reference is the "Granger" dashboard: rounded cards, icons in round bubbles, large light numbers with a small unit, status pills, thin progress bars and dot charts.

## Where to change what

| What you change | Where |
|---|---|
| Colors, radii, spacing, typography, shadows, motion, glass, map and zone colors | `frontend/src/theme/theme.ts` → `getThemeTokens(mode)` |
| Look and structure of UI parts | `frontend/src/ui/*` (always import from `@/ui`) |
| Overrides of raw MUI components (Button, Chip, Tabs, Slider…) | `createAppTheme()` in `theme.ts` |

Preview of all parts in both themes: route `/design-system` (hidden from navigation). The test `e2e/tests/design-system.spec.ts` compares it against baseline screenshots.

## Parts

| Group | Components |
|---|---|
| Surfaces | `Surface` (default / accent / muted / glass / outlined), `Widget` (Surface + header + content), `HeroCard` (overlay / split), `WidgetGrid` + `WidgetCell` |
| Headers | `PageHeader`, `Page`, `SectionHeader`, `WidgetHeader`, `IconBubble`, `BrandMark` |
| Values | `Metric` (readout / stat / hero), `LegendStat`, `StatRow`, `GlassStat` |
| Status and progress | `StatusPill` (soft / solid / outline / glass, `tone` or `color`), `ProgressTrack` (bar / marker / segments) |
| Charts | `DotMatrixRow`, `DotMatrixChart`, `Sparkline`, `ChartFrame` + `useChartVisuals()` for Recharts |
| Actions | `RoundAction` (media / accent / bubble) |
| States | `LoadingState`, `ErrorState`, `EmptyState`, `SkeletonCard` |

## Rules

- Screens are composed of `@/ui` and plain MUI layout components (`Box`, `Stack`, `Grid`, `Typography`, `Button`). `Card` and `Paper` are reserved for `src/ui`.
- No color literals (`#hex`, `rgba(`) outside `src/theme`. Take colors from the palette (`'primary.main'`, `'text.secondary'`) or from tokens.
- Always read tokens via `getAppThemeTokens(theme)` or `useTokens()`, never `theme.tokens.x` — tests may render with a bare MUI theme.
- Data category colors (zones, training effect, map series) live in `tokens.chart.*` and `tokens.map.*`. Do not define them locally in a component.
- Files loaded at startup (`App.tsx`, `components/layout/*`) import concrete modules (`@/ui/feedback/LoadingState`, `@/ui/BrandMark`), not the `@/ui` barrel. Otherwise the whole set lands in the initial bundle and breaks the `npm run budget` limit.
- Missing a part? Add it to `src/ui`, export it from `src/ui/index.ts`, show it in the catalogue and write a test in `src/ui/__tests__`. Do not build a local equivalent inside a feature.

The ESLint guard (`eslint.config.mjs`) is part of `npm run lint` and rejects color literals and imports of legacy surfaces.
