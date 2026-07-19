import { describe, expect, it } from 'vitest';

import theme, { createAppTheme } from '@/theme/theme';

describe('theme', () => {
  it('uses the light reference palette as the default', () => {
    expect(theme.palette.mode).toBe('light');
    expect(theme.tokens.mode).toBe('light');
  });

  it('creates a bright, readable light palette without changing the brand accent', () => {
    const light = createAppTheme('light');

    expect(light.palette.mode).toBe('light');
    expect(light.palette.primary.main).toBe('#FC4C02');
    expect(light.palette.secondary.main).toBe('#16A6C8');
    expect(light.palette.background.default).toBe('#F3F4FA');
    expect(light.palette.background.paper).toBe('#FFFFFF');
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
    expect(theme.tokens.control.md).toBe(42);
    expect(theme.tokens.control.lg).toBe(48);

    expect(theme.components?.MuiIconButton?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiToggleButton?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiDialog?.styleOverrides?.paper).toBeDefined();
    expect(theme.components?.MuiMenu?.styleOverrides?.paper).toBeDefined();
    expect(theme.components?.MuiTableCell?.styleOverrides?.head).toBeDefined();
    expect(theme.components?.MuiLinearProgress?.styleOverrides?.root).toBeDefined();
  });

  it('exposes semantic surface, status, chart, sport, and weather token groups', () => {
    expect(theme.tokens.status.success).toBe(theme.palette.success.main);
    expect(theme.tokens.status.info).toBe(theme.palette.info.main);
    expect(theme.tokens.chart.primary).toBe(theme.palette.primary.main);
    expect(theme.tokens.chart.secondary).toBe(theme.palette.secondary.main);
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
