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
  const canvas = isLight ? '#F7F8FC' : '#081018';
  const elevated = isLight ? '#FFFFFF' : '#121B26';
  const muted = isLight ? '#EEF1F5' : '#182433';
  const ink = isLight ? '#111827' : '#F4F7FB';
  const quietInk = isLight ? '#697586' : '#A5B1C2';
  const border = isLight ? 'rgba(26, 43, 62, 0.11)' : 'rgba(255,255,255,0.085)';

  return {
    mode,
    surfaceBorder: border,
    surfaceSubtle: isLight ? 'rgba(17, 24, 39, 0.025)' : 'rgba(255,255,255,0.025)',
    surfaceStrongBorder: isLight ? 'rgba(26, 43, 62, 0.2)' : 'rgba(91, 108, 129, 0.78)',
    hoverOverlay: isLight ? 'rgba(17, 24, 39, 0.045)' : 'rgba(255,255,255,0.045)',
    activeOverlay: 'rgba(252,76,2,0.11)',
    surfaceElevated: elevated,
    surfaceMuted: muted,
    canvas,
    topBar: isLight ? 'rgba(247,248,252,0.90)' : 'rgba(8,16,24,0.82)',
    pageGlow: isLight
      ? 'radial-gradient(circle at 88% 4%, rgba(252,76,2,0.10), transparent 25%), radial-gradient(circle at 48% 94%, rgba(22,166,200,0.065), transparent 30%)'
      : 'radial-gradient(circle at 88% 4%, rgba(252,76,2,0.09), transparent 25%), radial-gradient(circle at 48% 94%, rgba(22,166,200,0.05), transparent 30%)',
    heroScrim: isLight
      ? 'linear-gradient(90deg, rgba(8,16,24,0.78) 0%, rgba(8,16,24,0.38) 56%, rgba(8,16,24,0.12) 100%)'
      : 'linear-gradient(90deg, rgba(5,10,16,0.86) 0%, rgba(5,10,16,0.48) 57%, rgba(5,10,16,0.18) 100%)',
    cardShadow: isLight ? '0 18px 46px rgba(45, 52, 72, 0.085)' : '0 12px 34px rgba(0,0,0,0.18)',
    cardShadowHover: isLight ? '0 24px 54px rgba(45, 52, 72, 0.14)' : '0 20px 48px rgba(0,0,0,0.28)',
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

export function createAppTheme(mode: AppColorMode = 'dark'): Theme {
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
    shape: { borderRadius: 20 },
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
      MuiCard: { styleOverrides: { root: { backgroundImage: 'none', border: `1px solid ${tokens.surfaceBorder}`, boxShadow: tokens.cardShadow, transition: tokens.transition } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { styleOverrides: { root: { borderRadius: 12, textTransform: 'none', fontWeight: 700, transition: tokens.transition, minHeight: 40 } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 700 } } },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, letterSpacing: 0, minHeight: 40, paddingLeft: 18, paddingRight: 18 } } },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: '3px 3px 0 0' } } },
      MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none', boxShadow: 'none' } } },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 10, fontSize: '0.85rem' } } },
      MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: tokens.surfaceSubtle, borderRadius: 12, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.surfaceStrongBorder } } } },
      MuiBottomNavigationAction: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 12, transition: tokens.transition } } },
    },
  });

  return { ...theme, tokens } as Theme;
}

/** Backwards-compatible dark palette for non-react helpers. */
export const tokens = getThemeTokens('dark');

declare module '@mui/material/styles' {
  interface Theme { tokens: AppThemeTokens; }
  interface ThemeOptions { tokens?: AppThemeTokens; }
}

export default createAppTheme();
