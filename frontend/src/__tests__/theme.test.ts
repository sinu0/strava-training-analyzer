import { describe, expect, it } from 'vitest';

import theme, { createAppTheme } from '@/theme/theme';

describe('theme', () => {
  it('uses the light reference palette as the default', () => {
    expect(theme.palette.mode).toBe('light');
    expect(theme.tokens.mode).toBe('light');
  });

  it('uses an accessible action orange without changing the visual brand accent', () => {
    const light = createAppTheme('light');

    expect(light.palette.mode).toBe('light');
    expect(light.palette.primary.main).toBe('#D93F00');
    expect(light.palette.primary.contrastText).toBe('#FFFFFF');
    expect(light.tokens.brand.strava).toBe('#FC4C02');
    expect(light.palette.secondary.main).toBe('#08758D');
    expect(light.tokens.action.primary).toBe(light.palette.primary.main);
    expect(light.tokens.action.secondary).toBe(light.palette.secondary.main);
    expect(light.tokens.action.success).toBe(light.palette.success.main);
    expect(light.tokens.action.info).toBe(light.palette.info.main);
    expect(light.palette.background.default).toBe('#F3F4FA');
    expect(light.palette.background.paper).toBe('#FFFFFF');
    expect(light.palette.text.secondary).toBe('#5F6B7A');
    expect(light.tokens.mode).toBe('light');
  });

  it('matches the soft reference surfaces: large radius, diffuse shadows, pill buttons', () => {
    expect(theme.shape.borderRadius).toBe(8);
    expect(theme.tokens.cardShadow).toBe('0 24px 56px rgba(49, 56, 90, 0.10)');
    expect(theme.tokens.cardShadowHover).toBe('0 32px 68px rgba(49, 56, 90, 0.15)');

    const buttonRadius = theme.components?.MuiButton?.styleOverrides?.root as { borderRadius?: number };
    expect(buttonRadius.borderRadius).toBe(999);
  });

  it('exposes reference surface tokens for icon bubbles, tracks, and search pills', () => {
    const dark = createAppTheme('dark');

    expect(theme.tokens.iconBubble).toBe('#F2F4FA');
    expect(theme.tokens.trackBg).toBe('#E9EDF5');
    expect(theme.tokens.searchPill).toBe('#FFFFFF');
    expect(dark.tokens.iconBubble).not.toBe(theme.tokens.iconBubble);
    expect(dark.tokens.trackBg).not.toBe(theme.tokens.trackBg);
    expect(dark.tokens.searchPill).not.toBe(theme.tokens.searchPill);
  });

  it('centralizes component proportions for cards, controls and overlays', () => {
    expect(theme.tokens.radius.card).toBe(24);
    expect(theme.tokens.radius.control).toBe(14);
    expect(theme.tokens.control.md).toBe(44);
    expect(theme.tokens.control.lg).toBe(50);

    expect(theme.components?.MuiIconButton?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiToggleButton?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiDialog?.styleOverrides?.paper).toBeDefined();
    expect(theme.components?.MuiMenu?.styleOverrides?.paper).toBeDefined();
    expect(theme.components?.MuiTableCell?.styleOverrides?.head).toBeDefined();
    expect(theme.components?.MuiLinearProgress?.styleOverrides?.root).toBeDefined();
  });

  it('exposes a complete visual rhythm for type, spacing, icons and motion', () => {
    expect(theme.tokens.type.weight.regular).toBe(450);
    expect(theme.tokens.type.weight.heading).toBe(650);
    expect(theme.tokens.type.weight.display).toBe(700);
    expect(theme.tokens.space.card).toEqual({ xs: '20px', sm: '24px', md: '28px' });
    expect(theme.tokens.icon.md).toBe(20);
    expect(theme.tokens.icon.lg).toBe(24);
    expect(theme.tokens.motion.fast).toContain('cubic-bezier');
    expect(theme.tokens.focusRing).toContain('0 0 0 3px');
  });

  it('self-hosts the reference typeface and enables stable numeric alignment', () => {
    expect(theme.typography.fontFamily).toContain('Manrope Variable');
    expect(theme.typography.h4?.fontWeight).toBe(theme.tokens.type.weight.display);
    expect(theme.typography.body2?.fontWeight).toBe(theme.tokens.type.weight.regular);
    expect(theme.typography.button?.fontWeight).toBe(theme.tokens.type.weight.label);
  });

  it('styles the remaining shared control families through MUI', () => {
    expect(theme.components?.MuiAutocomplete?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiMenuItem?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiAccordion?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiAccordionSummary?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiSlider?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiSnackbarContent?.styleOverrides?.root).toBeDefined();
  });

  it('overlaps Leaflet raster tiles globally so fractional scaling cannot reveal seams', () => {
    const baselineStyles = theme.components?.MuiCssBaseline?.styleOverrides as Record<string, unknown>;

    expect(baselineStyles['.leaflet-tile']).toEqual({
      width: '257px !important',
      height: '257px !important',
      mixBlendMode: 'normal !important',
    });
  });

  it('exposes semantic surface, status, chart, sport, and weather token groups', () => {
    expect(theme.tokens.status.success).toBe('#2E9E5B');
    expect(theme.tokens.status.info).toBe('#2687D9');
    expect(theme.palette.success.main).toBe(theme.tokens.action.success);
    expect(theme.palette.info.main).toBe(theme.tokens.action.info);
    expect(theme.tokens.chart.primary).toBe(theme.tokens.brand.strava);
    expect(theme.palette.primary.main).toBe(theme.tokens.action.primary);
    expect(theme.tokens.chart.secondary).toBe(theme.tokens.status.secondary);
    expect(theme.palette.secondary.main).toBe(theme.tokens.action.secondary);
    expect(theme.tokens.chart.pmc.CTL).toBe(theme.tokens.status.info);
    expect(theme.tokens.sport.cycling).toBe(theme.tokens.chart.primary);
    expect(theme.tokens.weather.metric.temperature).toBe(theme.tokens.chart.primary);
    expect(theme.tokens.surfaceElevated).toBe(theme.palette.background.paper);
  });

  it('changes surfaces and chart neutrals between modes while retaining accessible text', () => {
    const dark = createAppTheme('dark');

    expect(dark.tokens.canvas).not.toBe(theme.tokens.canvas);
    expect(dark.tokens.chart.grid).not.toBe(theme.tokens.chart.grid);
    expect(dark.palette.text.primary).not.toBe(theme.palette.text.primary);
    expect(dark.tokens.cardShadow).not.toBe(theme.tokens.cardShadow);
  });

  it('uses responsive typography for major text styles', () => {
    expect(theme.typography.h3?.fontSize).toContain('clamp');
    expect(theme.typography.body2?.fontSize).toContain('clamp');
    expect(theme.typography.caption?.fontSize).toContain('clamp');
  });
});
