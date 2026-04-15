import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ActivityZonesBar from '../components/ActivityZonesBar';
import theme from '../theme/theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ActivityZonesBar', () => {
  it('renders correct zone proportions', () => {
    const zonesJson = JSON.stringify({
      powerZoneSeconds: {
        Z1: 600,
        Z2: 1200,
        Z3: 900,
        Z4: 300,
        Z5: 0,
      },
    });

    renderWithTheme(<ActivityZonesBar zonesJson={zonesJson} />);

    expect(screen.getByText('Strefy mocy')).toBeDefined();
    // Z2 is the largest zone at 40%
    expect(screen.getByText(/Z2: 20m/)).toBeDefined();
  });

  it('renders HR zones when present', () => {
    const zonesJson = JSON.stringify({
      hrZoneSeconds: {
        Z1: 300,
        Z2: 600,
        Z3: 900,
        Z4: 600,
        Z5: 300,
      },
    });

    renderWithTheme(<ActivityZonesBar zonesJson={zonesJson} />);

    expect(screen.getByText('Strefy HR')).toBeDefined();
  });

  it('renders nothing for invalid JSON', () => {
    const { container } = renderWithTheme(<ActivityZonesBar zonesJson="not-json" />);

    expect(container.textContent).toBe('');
  });
});
