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
});
