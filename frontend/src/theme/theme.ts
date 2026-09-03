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
  const quietInk = isLight ? '#5F6B7A' : '#A5B1C2';
  const border = isLight ? 'rgba(26, 43, 62, 0.07)' : 'rgba(255,255,255,0.085)';
  const fastMotion = '160ms cubic-bezier(0.2, 0, 0, 1)';
  const standardMotion = '220ms cubic-bezier(0.2, 0, 0, 1)';
  const action = {
    primary: isLight ? '#D93F00' : '#FF8051',
    primaryContrast: isLight ? '#FFFFFF' : '#081018',
    secondary: isLight ? '#08758D' : '#54D0EB',
    secondaryContrast: '#081018',
    success: isLight ? '#237A49' : '#65D68F',
    warning: isLight ? '#9A5D00' : '#FFC25A',
    error: isLight ? '#B93333' : '#FF7A7A',
    info: isLight ? '#176BAD' : '#74B9F2',
    statusContrast: isLight ? '#FFFFFF' : '#081018',
  } as const;

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
    space: {
      card: { xs: '20px', sm: '24px', md: '28px' },
      section: { xs: '24px', sm: '28px', md: '36px' },
      page: { xs: '16px', sm: '24px', md: '32px', xl: '40px' },
      cluster: '12px',
      inline: '8px',
    },
    control: {
      sm: 36,
      md: 44,
      lg: 50,
    },
    icon: {
      xs: 14,
      sm: 18,
      md: 20,
      lg: 24,
      xl: 28,
    },
    type: {
      weight: {
        regular: 450,
        medium: 550,
        label: 650,
        heading: 650,
        display: 700,
      },
      tracking: {
        tight: '-0.03em',
        heading: '-0.02em',
        label: '0.01em',
        eyebrow: '0.075em',
      },
    },
    motion: {
      fast: fastMotion,
      standard: standardMotion,
    },
    pageGlow: isLight
      ? 'radial-gradient(circle at 88% 4%, rgba(252,76,2,0.06), transparent 26%), radial-gradient(circle at 48% 94%, rgba(22,166,200,0.045), transparent 30%)'
      : 'radial-gradient(circle at 88% 4%, rgba(252,76,2,0.09), transparent 25%), radial-gradient(circle at 48% 94%, rgba(22,166,200,0.05), transparent 30%)',
    heroScrim: isLight
      ? 'linear-gradient(90deg, rgba(8,16,24,0.78) 0%, rgba(8,16,24,0.38) 56%, rgba(8,16,24,0.12) 100%)'
      : 'linear-gradient(90deg, rgba(5,10,16,0.86) 0%, rgba(5,10,16,0.48) 57%, rgba(5,10,16,0.18) 100%)',
    cardShadow: isLight ? '0 24px 56px rgba(49, 56, 90, 0.10)' : '0 12px 34px rgba(0,0,0,0.18)',
    cardShadowHover: isLight ? '0 32px 68px rgba(49, 56, 90, 0.15)' : '0 20px 48px rgba(0,0,0,0.28)',
    transition: `all ${standardMotion}`,
    focusRing: `0 0 0 3px ${isLight ? 'rgba(252,76,2,0.20)' : 'rgba(255,128,81,0.28)'}`,
    status: STATUS,
    podium: {
      gold: isLight ? '#A96808' : '#FFD166',
      silver: isLight ? '#657184' : '#CBD5E1',
      bronze: isLight ? '#9A4F24' : '#E09A62',
    },
    action,
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

/**
 * Returns application tokens even when a component is embedded under MUI's
 * bare default theme (for example in isolated tests or external previews).
 */
export function getAppThemeTokens(theme: Theme): AppThemeTokens {
  const candidate = (theme as Theme & { tokens?: AppThemeTokens }).tokens;
  return candidate ?? getThemeTokens(theme.palette.mode === 'dark' ? 'dark' : 'light');
}

export function createAppTheme(mode: AppColorMode = 'light'): Theme {
  const tokens = getThemeTokens(mode);
  const isLight = mode === 'light';
  const actionAccent = tokens.action.primary;
  const actionContrast = tokens.action.primaryContrast;
  const theme = createTheme({
    palette: {
      mode,
      primary: { main: actionAccent, contrastText: actionContrast },
      secondary: { main: tokens.action.secondary, contrastText: tokens.action.secondaryContrast },
      background: { default: tokens.canvas, paper: tokens.surfaceElevated },
      text: { primary: isLight ? '#111827' : '#F4F7FB', secondary: tokens.chart.tick },
      divider: tokens.surfaceBorder,
      success: { main: tokens.action.success, light: STATUS.successLight, contrastText: tokens.action.statusContrast },
      warning: { main: tokens.action.warning, dark: STATUS.warningStrong, contrastText: tokens.action.statusContrast },
      error: { main: tokens.action.error, contrastText: tokens.action.statusContrast },
      info: { main: tokens.action.info, contrastText: tokens.action.statusContrast },
    },
    typography: {
      fontFamily: '"Manrope Variable", Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      allVariants: { fontVariantNumeric: 'tabular-nums', textRendering: 'optimizeLegibility' },
      h1: { fontWeight: tokens.type.weight.display, fontSize: 'clamp(2rem, 1.55rem + 1.8vw, 3rem)', letterSpacing: tokens.type.tracking.tight, lineHeight: 1.08 },
      h2: { fontWeight: tokens.type.weight.display, fontSize: 'clamp(1.8rem, 1.45rem + 1.3vw, 2.5rem)', letterSpacing: tokens.type.tracking.tight, lineHeight: 1.1 },
      h3: { fontWeight: tokens.type.weight.display, fontSize: 'clamp(1.65rem, 1.32rem + 1.15vw, 2.2rem)', letterSpacing: tokens.type.tracking.tight, lineHeight: 1.14 },
      h4: { fontWeight: tokens.type.weight.display, fontSize: 'clamp(1.45rem, 1.18rem + 0.82vw, 1.9rem)', letterSpacing: tokens.type.tracking.heading, lineHeight: 1.18 },
      h5: { fontWeight: tokens.type.weight.heading, fontSize: 'clamp(1.08rem, 1rem + 0.38vw, 1.3rem)', letterSpacing: '-0.012em', lineHeight: 1.3 },
      h6: { fontWeight: tokens.type.weight.heading, fontSize: '1rem', letterSpacing: '-0.008em', lineHeight: 1.4 },
      subtitle1: { fontWeight: tokens.type.weight.label, lineHeight: 1.48 },
      subtitle2: { fontWeight: tokens.type.weight.label, fontSize: '0.78rem', letterSpacing: tokens.type.tracking.label, lineHeight: 1.4 },
      body1: { fontWeight: tokens.type.weight.regular, fontSize: 'clamp(0.94rem, 0.91rem + 0.14vw, 1rem)', lineHeight: 1.62 },
      body2: { fontWeight: tokens.type.weight.regular, fontSize: 'clamp(0.84rem, 0.81rem + 0.18vw, 0.94rem)', lineHeight: 1.56 },
      button: { fontWeight: tokens.type.weight.label, fontSize: '0.875rem', letterSpacing: '-0.005em', lineHeight: 1.35, textTransform: 'none' },
      caption: { fontWeight: tokens.type.weight.medium, fontSize: 'clamp(0.72rem, 0.7rem + 0.12vw, 0.8rem)', lineHeight: 1.45, letterSpacing: '0.005em' },
      overline: { fontWeight: tokens.type.weight.label, fontSize: '0.7rem', lineHeight: 1.6, letterSpacing: tokens.type.tracking.eyebrow },
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
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          'button, input, textarea, select': { font: 'inherit' },
          ':focus-visible': { outline: `2px solid ${tokens.chart.primary}`, outlineOffset: 3 },
          '::selection': { backgroundColor: 'rgba(252,76,2,0.28)', color: '#FFFFFF' },
          '.leaflet-tile': {
            width: '257px !important',
            height: '257px !important',
            mixBlendMode: 'normal !important',
          },
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
              fontWeight: tokens.type.weight.medium,
            },
            '& .recharts-legend-item-text': {
              color: `${tokens.chart.tick} !important`,
              fontSize: '12px',
              fontWeight: tokens.type.weight.label,
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
            from: { transform: 'translateY(8px)' }, to: { transform: 'translateY(0)' },
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
            fontWeight: tokens.type.weight.label,
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
            width: tokens.control.md,
            height: tokens.control.md,
            borderRadius: '50%',
            transition: tokens.transition,
            '&:hover': { backgroundColor: tokens.hoverOverlay },
            '&:focus-visible': { boxShadow: tokens.focusRing },
            '&.Mui-disabled': { opacity: 0.42 },
            '& .MuiSvgIcon-root': { fontSize: tokens.icon.lg },
          },
          sizeSmall: {
            width: tokens.control.sm,
            height: tokens.control.sm,
            '& .MuiSvgIcon-root': { fontSize: tokens.icon.sm },
          },
          sizeLarge: {
            width: tokens.control.lg,
            height: tokens.control.lg,
            '& .MuiSvgIcon-root': { fontSize: tokens.icon.lg },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { height: 32, borderRadius: tokens.radius.pill, fontWeight: tokens.type.weight.label, letterSpacing: tokens.type.tracking.label },
          sizeSmall: { height: 28, fontSize: '0.72rem' },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: { fontWeight: tokens.type.weight.medium },
          input: {
            '&::placeholder': { color: tokens.chart.tick, opacity: 0.82 },
          },
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
              boxShadow: tokens.focusRing,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.chart.primary, borderWidth: 2 },
            },
            '&.Mui-disabled': { backgroundColor: tokens.surfaceSubtle, opacity: 0.62 },
            '&.MuiInputBase-sizeSmall': { minHeight: 40 },
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
        styleOverrides: { label: { fontSize: '0.9rem', fontWeight: tokens.type.weight.medium, color: tokens.chart.tooltipText } },
      },
      MuiFormLabel: {
        styleOverrides: { root: { fontWeight: tokens.type.weight.label, color: tokens.chart.tick } },
      },
      MuiSelect: {
        styleOverrides: { icon: { color: tokens.chart.tick } },
      },
      MuiAutocomplete: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': { paddingTop: 4, paddingBottom: 4 },
            '& .MuiAutocomplete-tag': { margin: 3 },
          },
          popper: { marginTop: 6 },
          paper: {
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: tokens.radius.panel,
            boxShadow: tokens.cardShadowHover,
          },
          option: {
            minHeight: 44,
            margin: '2px 6px',
            borderRadius: 12,
            fontWeight: tokens.type.weight.medium,
            '&[aria-selected="true"]': { backgroundColor: tokens.activeOverlay },
          },
        },
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
            fontWeight: tokens.type.weight.label,
            paddingLeft: 14,
            paddingRight: 14,
            textTransform: 'none',
            '&.Mui-selected': {
              color: actionContrast,
              backgroundColor: actionAccent,
              boxShadow: '0 6px 14px rgba(252,76,2,0.22)',
              '&:hover': { backgroundColor: isLight ? '#C23800' : '#FF966F' },
            },
            '&:hover': { backgroundColor: tokens.hoverOverlay },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: tokens.type.weight.label,
            letterSpacing: 0,
            minHeight: 44,
            paddingLeft: 18,
            paddingRight: 18,
            color: tokens.chart.tick,
            '&.Mui-selected': { color: actionAccent },
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
            fontWeight: tokens.type.weight.medium,
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
      MuiPopover: {
        styleOverrides: {
          paper: {
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: tokens.radius.panel,
            boxShadow: tokens.cardShadowHover,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            minHeight: 44,
            margin: '2px 6px',
            padding: '10px 12px',
            borderRadius: 12,
            fontWeight: tokens.type.weight.medium,
            transition: `background-color ${tokens.motion.fast}`,
            '&:hover': { backgroundColor: tokens.hoverOverlay },
            '&.Mui-selected': { backgroundColor: tokens.activeOverlay },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            minHeight: 44,
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
      MuiBackdrop: {
        styleOverrides: { root: { backgroundColor: isLight ? 'rgba(17,24,39,0.28)' : 'rgba(0,0,0,0.58)', backdropFilter: 'blur(3px)' } },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            overflow: 'hidden',
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: `${tokens.radius.panel}px !important`,
            backgroundColor: tokens.surfaceElevated,
            boxShadow: 'none',
            '&::before': { display: 'none' },
            '&.Mui-expanded': { margin: 0 },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 56,
            paddingLeft: 20,
            paddingRight: 20,
            '&.Mui-expanded': { minHeight: 56 },
          },
          content: {
            margin: '16px 0',
            '&.Mui-expanded': { margin: '16px 0' },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: { root: { padding: '4px 20px 20px' } },
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
          root: { height: 8, borderRadius: tokens.radius.pill, backgroundColor: tokens.trackBg },
          bar: { borderRadius: tokens.radius.pill },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: { height: 6, padding: '16px 0' },
          rail: { opacity: 1, backgroundColor: tokens.trackBg },
          track: { border: 0 },
          thumb: {
            width: 18,
            height: 18,
            boxShadow: isLight ? '0 4px 12px rgba(49,56,90,0.18)' : '0 4px 12px rgba(0,0,0,0.32)',
            '&:focus-visible, &:hover': { boxShadow: tokens.focusRing },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: tokens.radius.control, alignItems: 'center', fontWeight: 600 },
          message: { padding: '7px 0' },
        },
      },
      MuiSkeleton: { styleOverrides: { root: { backgroundColor: tokens.surfaceMuted, borderRadius: 8 } } },
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.control,
            backgroundColor: isLight ? '#202936' : '#EAF0F7',
            color: isLight ? '#FFFFFF' : '#111827',
            boxShadow: tokens.cardShadowHover,
            fontWeight: tokens.type.weight.medium,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            width: 52,
            height: 52,
            minHeight: 52,
            boxShadow: tokens.cardShadow,
            '&:hover': { boxShadow: tokens.cardShadowHover },
          },
        },
      },
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
