import { createTheme, type Theme } from '@mui/material/styles';

/* ── Custom design tokens ── */

export const tokens = {
  surfaceBorder: 'rgba(255,255,255,0.085)',
  surfaceSubtle: 'rgba(255,255,255,0.025)',
  surfaceStrongBorder: 'rgba(65,76,91,0.76)',
  hoverOverlay: 'rgba(255,255,255,0.04)',
  activeOverlay: 'rgba(255,107,53,0.10)',
  surfaceElevated: '#121923',
  surfaceMuted: '#18212D',
  cardShadow: '0 12px 34px rgba(0,0,0,0.18)',
  cardShadowHover: '0 20px 48px rgba(0,0,0,0.28)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  status: {
    accent: '#FF6B35',
    success: '#3FB950',
    successLight: '#56D364',
    warning: '#D29922',
    warningStrong: '#E3B341',
    error: '#F85149',
    info: '#58A6FF',
    neutral: '#98A4B3',
    muted: '#484F58',
    secondary: '#4ECDC4',
    highlight: '#BC8CFF',
    sunny: '#FFD93D',
    brand: '#FC4C02',
    garmin: '#00B0D8',
  },
  chart: {
    primary: '#FF6B35',
    secondary: '#4ECDC4',
    tertiary: '#58A6FF',
    grid: '#27313D',
    tooltip: '#161B22',
    tooltipText: '#F2F5F8',
    tick: '#98A4B3',
    surface: '#21262D',
    zone: {
      Z1: '#58A6FF',
      Z2: '#3FB950',
      Z3: '#D29922',
      Z4: '#FF6B35',
      Z5: '#F85149',
      Z6: '#BC4DFF',
      Z7: '#FF1493',
    },
    pmc: {
      CTL: '#58A6FF',
      ATL: '#F85149',
      TSB: '#3FB950',
    },
    load: {
      OPTIMAL: '#2EA043',
      UNDER: '#D29922',
      OVER: '#E3B341',
      DANGER: '#F85149',
      INSUFFICIENT: '#8B949E',
      NO_DATA: '#484F58',
      FUTURE: '#58A6FF',
      CTL: '#BC8CFF',
    },
  },
  sport: {
    cycling: '#FF6B35',
    running: '#3FB950',
    swimming: '#58A6FF',
    walking: '#D29922',
    strength: '#D29922',
    default: '#D29922',
  },
  weather: {
    score: {
      excellent: '#22C55E',
      good: '#EAB308',
      poor: '#EF4444',
      severe: '#1C1C1C',
    },
    metric: {
      temperature: '#FF6B35',
      wind: '#58A6FF',
      precipitation: '#4ECDC4',
      sun: '#FFD700',
    },
    icon: {
      sunny: '#FFD93D',
      cloud: '#8B949E',
      rain: '#58A6FF',
      snow: '#58A6FF',
      storm: '#F85149',
    },
  },
  brand: {
    strava: '#FC4C02',
    stravaLight: '#FF8A4C',
    stravaHover: '#E64500',
    stravaHoverLight: '#FF7A33',
    garmin: '#00B0D8',
    garminHover: '#009BBF',
    ai: '#BC8CFF',
    aiDark: '#8B5CF6',
    aiHover: '#A879EE',
    aiHoverDark: '#7C4DDF',
  },
  gradients: {
    strava: 'linear-gradient(135deg, #FC4C02 0%, #FF8A4C 100%)',
    stravaHover: 'linear-gradient(135deg, #E64500 0%, #FF7A33 100%)',
    ai: 'linear-gradient(135deg, #BC8CFF 0%, #8B5CF6 100%)',
    aiHover: 'linear-gradient(135deg, #A879EE 0%, #7C4DDF 100%)',
  },
} as const;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FF6B35' },
    secondary: { main: '#4ECDC4' },
    background: {
      default: '#080D13',
      paper: '#111821',
    },
    text: {
      primary: '#F2F5F8',
      secondary: '#98A4B3',
    },
    divider: '#27313D',
    success: { main: '#3FB950', light: '#56D364' },
    warning: { main: '#D29922', dark: '#E3B341' },
    error: { main: '#F85149' },
    info: { main: '#58A6FF' },
  },

  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: { fontWeight: 800, fontSize: 'clamp(1.75rem, 1.35rem + 1.35vw, 2.35rem)', letterSpacing: '-0.035em', lineHeight: 1.14 },
    h4: { fontWeight: 800, fontSize: 'clamp(1.5rem, 1.18rem + 0.95vw, 1.95rem)', letterSpacing: '-0.025em', lineHeight: 1.2 },
    h5: { fontWeight: 600, fontSize: 'clamp(1.1rem, 1rem + 0.45vw, 1.35rem)', lineHeight: 1.3 },
    h6: { fontWeight: 600, lineHeight: 1.4 },
    subtitle1: { fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.04em', lineHeight: 1.4 },
    body1: { fontSize: 'clamp(0.95rem, 0.92rem + 0.15vw, 1rem)', lineHeight: 1.6 },
    body2: { fontSize: 'clamp(0.875rem, 0.82rem + 0.28vw, 1rem)', lineHeight: 1.55 },
    caption: { fontSize: 'clamp(0.75rem, 0.72rem + 0.16vw, 0.82rem)', lineHeight: 1.45, letterSpacing: '0.01em' },
  },

  shape: { borderRadius: 14 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#080D13',
          backgroundImage: 'radial-gradient(circle at 72% -20%, rgba(255,107,53,0.055), transparent 30%)',
          backgroundAttachment: 'fixed',
          scrollbarColor: '#27313D #080D13',
          scrollPaddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
        },
        ':focus-visible': {
          outline: '3px solid rgba(88,166,255,0.9)',
          outlineOffset: 3,
        },
        '::selection': {
          backgroundColor: 'rgba(255,107,53,0.32)',
          color: '#fff',
        },
        '@keyframes sectionFadeInUp': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            scrollBehavior: 'auto !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: tokens.cardShadow,
          transition: tokens.transition,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none' as const,
          fontWeight: 600,
          transition: tokens.transition,
          minHeight: 40,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 650,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 500,
          letterSpacing: 0,
          minHeight: 40,
          paddingLeft: 18,
          paddingRight: 18,
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 10,
          fontSize: '0.85rem',
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.018)',
          borderRadius: 11,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.22)',
          },
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: tokens.transition,
        },
      },
    },
  },
});

/* ── Type augmentation for custom tokens ── */

declare module '@mui/material/styles' {
  interface Theme {
    tokens: typeof tokens;
  }
  interface ThemeOptions {
    tokens?: typeof tokens;
  }
}

const themeWithTokens: Theme = { ...theme, tokens };

export default themeWithTokens;
