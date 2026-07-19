import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';

import ActivityRoutePreview from '@/components/activity/ActivityRoutePreview';
import theme from '@/theme/theme';

vi.mock('@/components/ActivityMap', () => ({
  default: ({ summaryPolyline }: { summaryPolyline?: string | null }) => (
    <div data-testid="preview-leaflet-map">{summaryPolyline}</div>
  ),
}));

function renderPreview(summaryPolyline?: string | null) {
  return render(
    <ThemeProvider theme={theme}>
      <Suspense fallback={null}>
        <ActivityRoutePreview
          activityName="Morning Ride"
          summaryPolyline={summaryPolyline}
          priority
        />
      </Suspense>
    </ThemeProvider>,
  );
}

describe('ActivityRoutePreview', () => {
  it('renders an immediate non-interactive route map from the summary polyline', async () => {
    renderPreview('_p~iF~ps|U_ulLnnqC_mqNvxq`@');

    expect(screen.getByLabelText('Mapa trasy: Morning Ride')).toBeDefined();
    expect(await screen.findByTestId('preview-leaflet-map')).toBeDefined();
    expect(screen.getByText('Trasa GPS')).toBeDefined();
  });

  it('shows an explicit route-unavailable state without mounting Leaflet', () => {
    renderPreview(null);

    expect(screen.getByText('Brak zapisu trasy')).toBeDefined();
    expect(screen.queryByTestId('preview-leaflet-map')).toBeNull();
  });
});
