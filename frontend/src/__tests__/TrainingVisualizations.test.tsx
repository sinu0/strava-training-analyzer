import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadDotMatrix, RecoveryFormGauge } from '@/components/today/TrainingVisualizations';
import theme from '@/theme/theme';

describe('training visualizations', () => {
  it('describes the load matrix using the supplied live metrics', () => {
    render(
      <ThemeProvider theme={theme}>
        <LoadDotMatrix ctl={31.6} atl={40} form={-14.2} />
      </ThemeProvider>,
    );

    expect(screen.getByLabelText('Porównanie obciążenia: CTL 31.6, ATL 40.0, forma -14.2')).toBeDefined();
  });

  it('places form on a labelled recovery scale', () => {
    render(
      <ThemeProvider theme={theme}>
        <RecoveryFormGauge form={-14.2} />
      </ThemeProvider>,
    );

    expect(screen.getByLabelText('Skala formy: -14.2, od -30 do 30')).toBeDefined();
  });

  it('paints the recovery scale track with the theme track color', () => {
    render(
      <ThemeProvider theme={theme}>
        <RecoveryFormGauge form={0} />
      </ThemeProvider>,
    );

    const track = screen.getByRole('img', { name: /Skala formy/ }).firstElementChild as HTMLElement;
    expect(window.getComputedStyle(track).backgroundColor).toBe('rgb(233, 237, 245)');
  });

  it('paints inactive load dots with the theme track color', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <LoadDotMatrix ctl={10} atl={90} form={0} />
      </ThemeProvider>,
    );

    const trackDots = Array.from(container.querySelectorAll('div')).filter(
      (element) => window.getComputedStyle(element).backgroundColor === 'rgb(233, 237, 245)',
    );
    expect(trackDots.length).toBeGreaterThan(0);
  });
});
