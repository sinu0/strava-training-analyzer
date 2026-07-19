import { describe, expect, it } from 'vitest';

import theme from '@/theme/theme';

describe('theme', () => {
  it('is dark mode', () => {
    expect(theme.palette.mode).toBe('dark');
  });

  it('has correct primary color', () => {
    expect(theme.palette.primary.main).toBe('#FF6B35');
  });

  it('has correct secondary color', () => {
    expect(theme.palette.secondary.main).toBe('#4ECDC4');
  });

  it('has correct background colors', () => {
    expect(theme.palette.background.default).toBe('#080D13');
    expect(theme.palette.background.paper).toBe('#111821');
  });

  it('includes semantic status, chart, sport, and weather token groups', () => {
    expect(theme.tokens.status.success).toBe(theme.palette.success.main);
    expect(theme.tokens.status.info).toBe(theme.palette.info.main);
    expect(theme.tokens.chart.primary).toBe(theme.palette.primary.main);
    expect(theme.tokens.chart.secondary).toBe(theme.palette.secondary.main);
    expect(theme.tokens.chart.pmc.CTL).toBe(theme.tokens.status.info);
    expect(theme.tokens.chart.load.OPTIMAL).toBe('#2EA043');
    expect(theme.tokens.sport.cycling).toBe(theme.tokens.chart.primary);
    expect(theme.tokens.weather.metric.temperature).toBe(theme.tokens.chart.primary);
  });

  it('keeps palette and shared neutrals aligned', () => {
    expect(theme.palette.text.primary).toBe('#F2F5F8');
    expect(theme.palette.text.secondary).toBe('#98A4B3');
    expect(theme.palette.text.secondary).toBe(theme.tokens.status.neutral);
    expect(theme.palette.divider).toBe(theme.tokens.chart.grid);
  });

  it('uses responsive typography for major text styles', () => {
    expect(theme.typography.h3?.fontSize).toContain('clamp');
    expect(theme.typography.body2?.fontSize).toContain('clamp');
    expect(theme.typography.caption?.fontSize).toContain('clamp');
  });
});
