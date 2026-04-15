import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import ActivityMediaCarousel from '../components/ActivityMediaCarousel';
import theme from '../theme/theme';

import type { GeoJsonFeature } from '../types/activity';

vi.mock('../components/ActivityMap', () => ({
  default: () => <div data-testid="activity-map">Mapa aktywności</div>,
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const geoJson: GeoJsonFeature = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [19.94, 50.06],
      [19.95, 50.07],
    ],
  },
  properties: {},
};

describe('ActivityMediaCarousel', () => {
  it('renders nothing when activity has no map and no photos', () => {
    const { container } = renderWithTheme(<ActivityMediaCarousel activityName="Morning Ride" geoJson={null} photoUrls={[]} />);

    expect(container.innerHTML).toBe('');
  });

  it('shows map first and lets user navigate to photos', () => {
    renderWithTheme(
      <ActivityMediaCarousel
        activityName="Morning Ride"
        geoJson={geoJson}
        photoUrls={['https://example.com/photo-1.jpg', 'https://example.com/photo-2.jpg']}
      />,
    );

    expect(screen.getByTestId('activity-map')).toBeDefined();
    expect(screen.getByText('1/3')).toBeDefined();

    // Navigate to next item via right arrow
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[buttons.length - 1]!;
    fireEvent.click(nextButton);

    expect(screen.getByRole('img', { name: 'Morning Ride' })).toBeDefined();
    expect(screen.getByText('2/3')).toBeDefined();
  });

  it('defaults to the first photo when there is no map', () => {
    renderWithTheme(
      <ActivityMediaCarousel
        activityName="Morning Ride"
        geoJson={null}
        photoUrls={['https://example.com/photo-1.jpg']}
      />,
    );

    expect(screen.queryByTestId('activity-map')).toBeNull();
    expect(screen.getByRole('img', { name: 'Morning Ride' })).toBeDefined();
  });

  it('shows map when only summary polyline is available', () => {
    renderWithTheme(
      <ActivityMediaCarousel
        activityName="Morning Ride"
        geoJson={null}
        summaryPolyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@"
        photoUrls={[]}
      />,
    );

    expect(screen.getByTestId('activity-map')).toBeDefined();
  });
});
