import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MetricTile from '../components/common/MetricTile';
import theme from '../theme/theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('MetricTile', () => {
  it('renders label, value and unit', () => {
    renderWithTheme(<MetricTile label="Dystans" value="120" unit="km" />);

    expect(screen.getByText('Dystans')).toBeDefined();
    expect(screen.getByText('120')).toBeDefined();
    expect(screen.getByText('km')).toBeDefined();
  });

  it('renders icon inside the header row', () => {
    renderWithTheme(
      <MetricTile
        label="Dystans"
        value="120"
        icon={<DirectionsBikeIcon data-testid="metric-icon" fontSize="small" />}
      />,
    );

    expect(screen.getByTestId('metric-icon')).toBeDefined();
  });

  it('renders positive trend as a badge with a plus sign', () => {
    renderWithTheme(<MetricTile label="FTP" value={250} trend={4.2} />);

    const badge = screen.getByTestId('metric-trend-badge');
    expect(badge.textContent).toContain('+');
    expect(badge.textContent).toContain('4.2%');
  });

  it('renders negative trend as a badge', () => {
    renderWithTheme(<MetricTile label="FTP" value={250} trend={-2.5} />);

    const badge = screen.getByTestId('metric-trend-badge');
    expect(badge.textContent).toContain('-2.5%');
  });

  it('omits trend badge when trend is not provided', () => {
    renderWithTheme(<MetricTile label="FTP" value={250} />);

    expect(screen.queryByTestId('metric-trend-badge')).toBeNull();
  });
});
