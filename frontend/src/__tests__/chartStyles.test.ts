import { describe, expect, it } from 'vitest';

import { createAppTheme } from '@/theme/theme';
import { getChartVisuals } from '@/utils/chartStyles';

describe('chart visual tokens', () => {
  it('uses the shared surface, subtle grid and compact type rhythm', () => {
    const theme = createAppTheme('light');
    const chart = getChartVisuals(theme);

    expect(chart.grid.vertical).toBe(false);
    expect(chart.grid.strokeDasharray).toBe('2 5');
    expect(chart.axis.tick.fill).toBe(theme.tokens.chart.tick);
    expect(chart.tooltip.contentStyle.backgroundColor).toBe(theme.tokens.surfaceElevated);
    expect(chart.tooltip.contentStyle.borderRadius).toBe(16);
    expect(chart.barRadius).toEqual([8, 8, 2, 2]);
  });

  it('follows the active color mode instead of retaining light chart surfaces', () => {
    const light = getChartVisuals(createAppTheme('light'));
    const dark = getChartVisuals(createAppTheme('dark'));

    expect(dark.tooltip.contentStyle.backgroundColor).not.toBe(light.tooltip.contentStyle.backgroundColor);
    expect(dark.axis.tick.fill).not.toBe(light.axis.tick.fill);
  });
});
