import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActivityMap from '../components/ActivityMap';
import theme from '../theme/theme';

const fitBoundsMock = vi.fn();
const invalidateSizeMock = vi.fn();

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="leaflet-map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Polyline: () => <div data-testid="polyline" />,
  useMap: () => ({
    fitBounds: fitBoundsMock,
    invalidateSize: invalidateSizeMock,
  }),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ActivityMap', () => {
  beforeEach(() => {
    fitBoundsMock.mockClear();
    invalidateSizeMock.mockClear();
  });

  it('uses explicit preview height so the inline map can render before interaction', () => {
    renderWithTheme(<ActivityMap summaryPolyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@" minHeight={360} />);

    const shell = screen.getByTestId('activity-map-shell');
    const styles = window.getComputedStyle(shell);

    expect(styles.height).toBe('360px');
    expect(styles.minHeight).toBe('360px');
  });

  it('invalidates map size after mount to avoid blank leaflet preview', async () => {
    renderWithTheme(<ActivityMap summaryPolyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@" minHeight={360} />);

    await waitFor(() => {
      expect(invalidateSizeMock).toHaveBeenCalled();
      expect(fitBoundsMock).toHaveBeenCalled();
    });
  });

  it('fills the parent container in fullscreen mode', () => {
    renderWithTheme(<ActivityMap summaryPolyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@" minHeight={0} />);

    const shell = screen.getByTestId('activity-map-shell');
    const styles = window.getComputedStyle(shell);

    expect(styles.height).toBe('100%');
    expect(styles.minHeight).toBe('0px');
  });
});
