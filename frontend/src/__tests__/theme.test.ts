import { describe, expect, it } from 'vitest';

import theme, { createAppTheme } from '@/theme/theme';

describe('theme', () => {
  it('keeps dark mode as the server-safe default', () => {
    expect(theme.palette.mode).toBe('dark');
    expect(theme.tokens.mode).toBe('dark');
  });

  it('creates a bright, readable light palette without changing the brand accent', () => {
    const light = createAppTheme('light');

    expect(light.palette.mode).toBe('light');
    expect(light.palette.primary.main).toBe('#FC4C02');
    expect(light.palette.secondary.main).toBe('#16A6C8');
    expect(light.palette.background.default).toBe('#F7F8FC');
    expect(light.palette.background.paper).toBe('#FFFFFF');
    expect(light.tokens.mode).toBe('light');
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
    const light = createAppTheme('light');

    expect(light.tokens.canvas).not.toBe(theme.tokens.canvas);
    expect(light.tokens.chart.grid).not.toBe(theme.tokens.chart.grid);
    expect(light.palette.text.primary).not.toBe(theme.palette.text.primary);
    expect(light.tokens.cardShadow).not.toBe(theme.tokens.cardShadow);
  });

  it('uses responsive typography for major text styles', () => {
    expect(theme.typography.h3?.fontSize).toContain('clamp');
    expect(theme.typography.body2?.fontSize).toContain('clamp');
    expect(theme.typography.caption?.fontSize).toContain('clamp');
  });
});
