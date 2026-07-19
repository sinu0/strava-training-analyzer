import { createTheme, type Theme } from '@mui/material/styles';

export type AppColorMode = 'light' | 'dark';

const STATUS = {
  accent: '#FC4C02',
  success: '#2E9E5B',
  successLight: '#46B978',
  warning: '#C98516',
  warningStrong: '#A96808',
  error: '#D84444',
  info: '#2687D9',
  neutral: '#788596',
  muted: '#596575',
  secondary: '#16A6C8',
  highlight: '#8A62D4',
  sunny: '#E6A500',
  brand: '#FC4C02',
  garmin: '#00A7C7',
} as const;

/**
 * Values that describe a surface rather than a product feature belong here.
 * Components should read them from `theme.tokens`, never duplicate a dark hex.
 */
export const getThemeTokens = (mode: AppColorMode) => {
  const isLight = mode === 'light';
  const canvas = isLight ? '#F3F4FA' : '#081018';
  const elevated = isLight ? '#FFFFFF' : '#121B26';
  const muted = isLight ? '#ECF0F7' : '#182433';
  const ink = isLight ? '#111827' : '#F4F7FB';
  const quietInk = isLight ? '#697586' : '#A5B1C2';
  const border = isLight ? 'rgba(26, 43, 62, 0.07)' : 'rgba(255,255,255,0.085)';

  return {
    mode,
    surfaceBorder: border,
    surfaceSubtle: isLight ? 'rgba(17, 24, 39, 0.03)' : 'rgba(255,255,255,0.025)',
    surfaceStrongBorder: isLight ? 'rgba(26, 43, 62, 0.18)' : 'rgba(91, 108, 129, 0.78)',
    hoverOverlay: isLight ? 'rgba(17, 24, 39, 0.045)' : 'rgba(255,255,255,0.045)',
    activeOverlay: 'rgba(252,76,2,0.11)',
    surfaceElevated: elevated,
    surfaceMuted: muted,
    canvas,
    topBar: isLight ? 'rgba(243,244,250,0.88)' : 'rgba(8,16,24,0.82)',
    iconBubble: isLight ? '#F2F4FA' : 'rgba(255,255,255,0.05)',
    trackBg: isLight ? '#E9EDF5' : 'rgba(255,255,255,0.08)',
    searchPill: elevated,
    radius: {
      control: 14,
      panel: 20,
      card: 24,
      hero: 30,
      pill: 999,
    },
    control: {
      sm: 36,
      md: 42,
      lg: 48,
    },
    pageGlow: isLight
      ? 'radial-gradient(circle at 88% 4%, rgba(252,76,2,0.06), transparent 26%), radial-gradient(circle at 48% 94%, rgba(22,166,200,0.045), transparent 30%)'
      : 'radial-gradient(circle at 88% 4%, rgba(252,76,2,0.09), transparent 25%), radial-gradient(circle at 48% 94%, rgba(22,166,200,0.05), transparent 30%)',
    heroScrim: isLight
      ? 'linear-gradient(90deg, rgba(8,16,24,0.78) 0%, rgba(8,16,24,0.38) 56%, rgba(8,16,24,0.12) 100%)'
      : 'linear-gradient(90deg, rgba(5,10,16,0.86) 0%, rgba(5,10,16,0.48) 57%, rgba(5,10,16,0.18) 100%)',
    cardShadow: isLight ? '0 24px 56px rgba(49, 56, 90, 0.10)' : '0 12px 34px rgba(0,0,0,0.18)',
    cardShadowHover: isLight ? '0 32px 68px rgba(49, 56, 90, 0.15)' : '0 20px 48px rgba(0,0,0,0.28)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    status: STATUS,
    chart: {
      primary: '#FC4C02',
      secondary: '#16A6C8',
      tertiary: '#2687D9',
      grid: isLight ? '#D9E2EC' : '#2A3848',
      tooltip: elevated,
      tooltipText: ink,
      tick: quietInk,
      surface: muted,
      zone: {
        Z1: '#2687D9', Z2: '#2E9E5B', Z3: '#C98516', Z4: '#FC4C02',
        Z5: '#D84444', Z6: '#9A61E4', Z7: '#DB4A9A',
      },
      pmc: { CTL: '#2687D9', ATL: '#D84444', TSB: '#2E9E5B' },
      load: {
        OPTIMAL: '#2E9E5B', UNDER: '#C98516', OVER: '#A96808', DANGER: '#D84444',
        INSUFFICIENT: '#788596', NO_DATA: '#596575', FUTURE: '#2687D9', CTL: '#8A62D4',
      },
    },
    sport: { cycling: '#FC4C02', running: '#2E9E5B', swimming: '#2687D9', walking: '#C98516', strength: '#C98516', default: '#C98516' },
    weather: {
      score: { excellent: '#22A65A', good: '#C98516', poor: '#D84444', severe: '#252B34' },
      metric: { temperature: '#FC4C02', wind: '#2687D9', precipitation: '#16A6C8', sun: '#E6A500' },
      icon: { sunny: '#E6A500', cloud: '#788596', rain: '#2687D9', snow: '#2687D9', storm: '#D84444' },
    },
    brand: {
      strava: '#FC4C02', stravaLight: '#FF8051', stravaHover: '#D93F00', stravaHoverLight: '#F26A37',
      garmin: '#00A7C7', garminHover: '#008BA7', ai: '#8A62D4', aiDark: '#6F46C1', aiHover: '#7450BE', aiHoverDark: '#5D35A7',
    },
    gradients: {
      strava: 'linear-gradient(135deg, #FC4C02 0%, #FF8051 100%)',
      stravaHover: 'linear-gradient(135deg, #D93F00 0%, #F26A37 100%)',
      ai: 'linear-gradient(135deg, #8A62D4 0%, #6F46C1 100%)',
      aiHover: 'linear-gradient(135deg, #7450BE 0%, #5D35A7 100%)',
    },
  } as const;
};

export type AppThemeTokens = ReturnType<typeof getThemeTokens>;

export function createAppTheme(mode: AppColorMode = 'light'): Theme {
  const tokens = getThemeTokens(mode);
  const isLight = mode === 'light';
  const theme = createTheme({
    palette: {
      mode,
      primary: { main: tokens.chart.primary, contrastText: '#FFFFFF' },
      secondary: { main: tokens.chart.secondary, contrastText: '#06202A' },
      background: { default: tokens.canvas, paper: tokens.surfaceElevated },
      text: { primary: isLight ? '#111827' : '#F4F7FB', secondary: isLight ? '#697586' : '#A5B1C2' },
      divider: tokens.surfaceBorder,
      success: { main: STATUS.success, light: STATUS.successLight },
      warning: { main: STATUS.warning, dark: STATUS.warningStrong },
      error: { main: STATUS.error },
      info: { main: STATUS.info },
    },
    typography: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h3: { fontWeight: 800, fontSize: 'clamp(1.75rem, 1.35rem + 1.35vw, 2.35rem)', letterSpacing: '-0.035em', lineHeight: 1.14 },
      h4: { fontWeight: 800, fontSize: 'clamp(1.5rem, 1.18rem + 0.95vw, 1.95rem)', letterSpacing: '-0.025em', lineHeight: 1.2 },
      h5: { fontWeight: 700, fontSize: 'clamp(1.1rem, 1rem + 0.45vw, 1.35rem)', lineHeight: 1.3 },
      h6: { fontWeight: 700, lineHeight: 1.4 },
      subtitle1: { fontWeight: 600, lineHeight: 1.5 },
      subtitle2: { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em', lineHeight: 1.4 },
      body1: { fontSize: 'clamp(0.95rem, 0.92rem + 0.15vw, 1rem)', lineHeight: 1.6 },
      body2: { fontSize: 'clamp(0.875rem, 0.82rem + 0.28vw, 1rem)', lineHeight: 1.55 },
      caption: { fontSize: 'clamp(0.75rem, 0.72rem + 0.16vw, 0.82rem)', lineHeight: 1.45, letterSpacing: '0.01em' },
    },
    // MUI multiplies numeric `sx.borderRadius` values by this base unit.
    // Keep the standard 8px scale so local values such as `borderRadius: 3`
    // resolve to the intended 24px, while the named tokens below continue to
    // define the exact radii for shared surfaces and controls.
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { colorScheme: mode },
          body: {
            backgroundColor: tokens.canvas,
            backgroundImage: tokens.pageGlow,
            backgroundAttachment: 'fixed',
            scrollbarColor: `${tokens.surfaceStrongBorder} ${tokens.canvas}`,
            scrollPaddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
          },
          ':focus-visible': { outline: '3px solid rgba(38,135,217,0.9)', outlineOffset: 3 },
          '::selection': { backgroundColor: 'rgba(252,76,2,0.28)', color: '#FFFFFF' },
          '.recharts-wrapper': {
            fontFamily: 'inherit',
            '& .recharts-cartesian-grid-horizontal line': {
              stroke: tokens.chart.grid,
              strokeDasharray: '2 5',
            },
            '& .recharts-cartesian-grid-vertical line': { stroke: 'transparent' },
            '& .recharts-cartesian-axis-line, & .recharts-cartesian-axis-tick-line': { stroke: 'transparent' },
            '& .recharts-cartesian-axis-tick-value': {
              fill: `${tokens.chart.tick} !important`,
              fontSize: '11px',
              fontWeight: 600,
            },
            '& .recharts-legend-item-text': {
              color: `${tokens.chart.tick} !important`,
              fontSize: '12px',
              fontWeight: 700,
            },
            '& .recharts-default-tooltip': {
              backgroundColor: `${tokens.surfaceElevated} !important`,
              border: `1px solid ${tokens.surfaceBorder} !important`,
              borderRadius: '16px !important',
              boxShadow: `${tokens.cardShadow} !important`,
              padding: '11px 13px !important',
            },
          },
          '@keyframes sectionFadeInUp': {
            from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important', animationIterationCount: '1 !important', scrollBehavior: 'auto !important', transitionDuration: '0.01ms !important',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: tokens.radius.card,
            boxShadow: tokens.cardShadow,
            transition: tokens.transition,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: tokens.radius.panel,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.pill,
            textTransform: 'none',
            fontWeight: 700,
            letterSpacing: '-0.005em',
            minHeight: tokens.control.md,
            paddingLeft: 20,
            paddingRight: 20,
            transition: tokens.transition,
            '&.Mui-disabled': { opacity: 0.46 },
          },
          sizeSmall: { minHeight: tokens.control.sm, paddingLeft: 14, paddingRight: 14 },
          sizeLarge: { minHeight: tokens.control.lg, paddingLeft: 24, paddingRight: 24 },
          contained: {
            boxShadow: isLight ? '0 10px 22px rgba(252,76,2,0.22)' : '0 10px 22px rgba(0,0,0,0.24)',
            '&:hover': { boxShadow: isLight ? '0 14px 28px rgba(252,76,2,0.30)' : '0 14px 28px rgba(0,0,0,0.32)' },
          },
          outlined: {
            borderColor: tokens.surfaceStrongBorder,
            '&:hover': { borderColor: tokens.chart.primary, backgroundColor: tokens.activeOverlay },
          },
          text: { '&:hover': { backgroundColor: tokens.hoverOverlay } },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: '50%',
            transition: tokens.transition,
            '&:hover': { backgroundColor: tokens.hoverOverlay },
            '&.Mui-disabled': { opacity: 0.42 },
          },
          sizeSmall: { width: tokens.control.sm, height: tokens.control.sm },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: tokens.radius.pill, fontWeight: 700, letterSpacing: '0.01em' },
          sizeSmall: { height: 28, fontSize: '0.72rem' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: tokens.surfaceSubtle,
            borderRadius: tokens.radius.control,
            minHeight: 48,
            transition: tokens.transition,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.surfaceBorder },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.surfaceStrongBorder },
            '&.Mui-focused': {
              backgroundColor: tokens.surfaceElevated,
              boxShadow: `0 0 0 3px ${tokens.activeOverlay}`,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.chart.primary, borderWidth: 2 },
            },
            '&.Mui-disabled': { backgroundColor: tokens.surfaceSubtle, opacity: 0.62 },
          },
          input: { paddingTop: 12, paddingBottom: 12, fontWeight: 500 },
          inputSizeSmall: { paddingTop: 8, paddingBottom: 8 },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: tokens.chart.tick, fontWeight: 600 },
          shrink: { fontWeight: 700 },
        },
      },
      MuiFormHelperText: {
        styleOverrides: { root: { marginLeft: 4, marginTop: 6, fontWeight: 500, lineHeight: 1.4 } },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            padding: 8,
            color: tokens.chart.tick,
            '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: tokens.chart.primary },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            padding: 8,
            color: tokens.chart.tick,
            '&.Mui-checked': { color: tokens.chart.primary },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: { width: 44, height: 28, padding: 2 },
          switchBase: {
            padding: 6,
            '&.Mui-checked': {
              color: '#FFFFFF',
              transform: 'translateX(16px)',
              '& + .MuiSwitch-track': { backgroundColor: tokens.chart.primary, opacity: 1 },
            },
            '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.34 },
          },
          thumb: { width: 16, height: 16, boxShadow: '0 2px 5px rgba(16,24,40,0.24)' },
          track: { borderRadius: tokens.radius.pill, backgroundColor: tokens.trackBg, opacity: 1 },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: { label: { fontSize: '0.9rem', fontWeight: 600, color: tokens.chart.tooltipText } },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            padding: 4,
            border: 0,
            borderRadius: tokens.radius.pill,
            backgroundColor: tokens.trackBg,
            '& .MuiToggleButtonGroup-grouped': { border: 0, borderRadius: `${tokens.radius.pill}px !important`, margin: 0 },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            minHeight: tokens.control.sm,
            border: 0,
            borderRadius: `${tokens.radius.pill}px !important`,
            color: tokens.chart.tick,
            fontWeight: 700,
            paddingLeft: 14,
            paddingRight: 14,
            textTransform: 'none',
            '&.Mui-selected': {
              color: '#FFFFFF',
              backgroundColor: tokens.chart.primary,
              boxShadow: '0 6px 14px rgba(252,76,2,0.22)',
              '&:hover': { backgroundColor: tokens.brand.stravaHover },
            },
            '&:hover': { backgroundColor: tokens.hoverOverlay },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            letterSpacing: 0,
            minHeight: 44,
            paddingLeft: 18,
            paddingRight: 18,
            color: tokens.chart.tick,
            '&.Mui-selected': { color: tokens.chart.primary },
            '&.Mui-disabled': { opacity: 0.45 },
          },
        },
      },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: '3px 3px 0 0' } } },
      MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none', boxShadow: 'none' } } },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 10,
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '7px 10px',
            backgroundColor: isLight ? '#202936' : '#EAF0F7',
            color: isLight ? '#FFFFFF' : '#111827',
            boxShadow: '0 10px 24px rgba(16,24,40,0.18)',
          },
          arrow: { color: isLight ? '#202936' : '#EAF0F7' },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            marginTop: 6,
            padding: 6,
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: tokens.radius.panel,
            boxShadow: tokens.cardShadowHover,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: tokens.transition,
            '&:hover': { backgroundColor: tokens.hoverOverlay },
            '&.Mui-selected': { backgroundColor: tokens.activeOverlay },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: tokens.radius.card,
            boxShadow: tokens.cardShadowHover,
            backgroundImage: 'none',
          },
        },
      },
      MuiDialogTitle: { styleOverrides: { root: { padding: '24px 24px 12px', fontWeight: 800, letterSpacing: '-0.02em' } } },
      MuiDialogContent: {
        styleOverrides: {
          root: { padding: '16px 24px 24px' },
          dividers: { borderColor: tokens.surfaceBorder },
        },
      },
      MuiDialogActions: { styleOverrides: { root: { padding: '12px 24px 20px', gap: 8 } } },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            borderColor: tokens.surfaceBorder,
            boxShadow: isLight ? '8px 0 32px rgba(49,56,90,0.08)' : '8px 0 32px rgba(0,0,0,0.22)',
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: tokens.radius.panel,
            backgroundColor: tokens.surfaceElevated,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: tokens.surfaceBorder, padding: '13px 16px' },
          head: {
            backgroundColor: tokens.surfaceMuted,
            color: tokens.chart.tick,
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.055em',
            textTransform: 'uppercase',
          },
          sizeSmall: { padding: '10px 12px' },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.MuiTableRow-hover:hover': { backgroundColor: tokens.hoverOverlay },
            '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: tokens.activeOverlay },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { height: 7, borderRadius: tokens.radius.pill, backgroundColor: tokens.trackBg },
          bar: { borderRadius: tokens.radius.pill },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: tokens.radius.control, alignItems: 'center', fontWeight: 600 },
          message: { padding: '7px 0' },
        },
      },
      MuiSkeleton: { styleOverrides: { root: { backgroundColor: tokens.surfaceMuted, borderRadius: 8 } } },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            minWidth: tokens.control.sm,
            height: tokens.control.sm,
            borderRadius: '50%',
            fontWeight: 700,
            '&.Mui-selected': { backgroundColor: tokens.chart.primary, color: '#FFFFFF' },
          },
        },
      },
      MuiBottomNavigationAction: { styleOverrides: { root: { minWidth: 44, minHeight: 44, fontWeight: 700 } } },
    },
  });

  return { ...theme, tokens } as Theme;
}

/** Backwards-compatible palette for non-react helpers. Matches the app default mode. */
export const tokens = getThemeTokens('light');

declare module '@mui/material/styles' {
  interface Theme { tokens: AppThemeTokens; }
  interface ThemeOptions { tokens?: AppThemeTokens; }
}

export default createAppTheme();
