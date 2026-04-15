import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import PeakEffortsDisplay from '../components/activity/PeakEffortsDisplay';
import theme from '../theme/theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('PeakEffortsDisplay', () => {
  it('renders nothing when data is null', () => {
    const { container } = renderWithTheme(<PeakEffortsDisplay data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when data is not an object', () => {
    const { container } = renderWithTheme(<PeakEffortsDisplay data="invalid" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all sections are empty', () => {
    const { container } = renderWithTheme(<PeakEffortsDisplay data={{ power: {}, heartrate: {}, speed: {} }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when data object has no known keys', () => {
    const { container } = renderWithTheme(<PeakEffortsDisplay data={{ foo: {} }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders power column with correct label', () => {
    renderWithTheme(<PeakEffortsDisplay data={{ power: { '1s': 450, '5s': 420 } }} />);
    expect(screen.getByText('⚡ Moc (W)')).toBeDefined();
  });

  it('renders heartrate column with correct label', () => {
    renderWithTheme(<PeakEffortsDisplay data={{ heartrate: { '1s': 180 } }} />);
    expect(screen.getByText('❤ Tętno (bpm)')).toBeDefined();
  });

  it('renders speed column with correct label', () => {
    renderWithTheme(<PeakEffortsDisplay data={{ speed: { '1s': 12.5 } }} />);
    expect(screen.getByText('🚀 Prędkość (m/s)')).toBeDefined();
  });

  it('renders power values rounded', () => {
    renderWithTheme(<PeakEffortsDisplay data={{ power: { '1s': 450.7, '5s': 420.3 } }} />);
    expect(screen.getByText('451')).toBeDefined();
    expect(screen.getByText('420')).toBeDefined();
  });

  it('renders duration labels for each entry', () => {
    renderWithTheme(<PeakEffortsDisplay data={{ power: { '1min': 305, '5min': 280 } }} />);
    expect(screen.getByText('1min')).toBeDefined();
    expect(screen.getByText('5min')).toBeDefined();
  });

  it('renders unit labels for power column', () => {
    renderWithTheme(<PeakEffortsDisplay data={{ power: { '1s': 350 } }} />);
    expect(screen.getByText('W')).toBeDefined();
  });

  it('renders unit labels for heartrate column', () => {
    renderWithTheme(<PeakEffortsDisplay data={{ heartrate: { '1s': 178 } }} />);
    expect(screen.getByText('bpm')).toBeDefined();
  });

  it('renders unit labels for speed column', () => {
    renderWithTheme(<PeakEffortsDisplay data={{ speed: { '1s': 12 } }} />);
    expect(screen.getByText('m/s')).toBeDefined();
  });

  it('renders all three columns when all data is present', () => {
    renderWithTheme(
      <PeakEffortsDisplay
        data={{
          power: { '1s': 450 },
          heartrate: { '1s': 180 },
          speed: { '1s': 13 },
        }}
      />
    );
    expect(screen.getByText('⚡ Moc (W)')).toBeDefined();
    expect(screen.getByText('❤ Tętno (bpm)')).toBeDefined();
    expect(screen.getByText('🚀 Prędkość (m/s)')).toBeDefined();
  });

  it('renders only present columns — omits missing sections', () => {
    renderWithTheme(<PeakEffortsDisplay data={{ power: { '1s': 450 } }} />);
    expect(screen.queryByText('❤ Tętno (bpm)')).toBeNull();
    expect(screen.queryByText('🚀 Prędkość (m/s)')).toBeNull();
  });

  it('does not render [object Object] for any data', () => {
    renderWithTheme(
      <PeakEffortsDisplay
        data={{ power: { '1s': 450, '5s': 420, '20min': 280 }, heartrate: { '1s': 180 } }}
      />
    );
    expect(screen.queryByText('[object Object]')).toBeNull();
  });
});
