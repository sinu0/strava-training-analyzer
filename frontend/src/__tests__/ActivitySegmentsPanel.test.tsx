import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import ActivitySegmentsPanel from '@/components/segments/ActivitySegmentsPanel';
import theme from '@/theme/theme';

vi.mock('@/components/segments/SegmentRouteMap', () => ({ default: () => <div data-testid="activity-segment-map" /> }));
vi.mock('@/hooks/useSegments', () => ({
  useActivitySegments: () => ({ data: { activityId: 'activity-1', routePolyline: 'encoded-route', availability: 'AVAILABLE', backfillStatus: 'RUNNING', personalBestConfirmed: false, efforts: [{ id: 'effort-1', segmentId: 7, segmentName: 'Leśny podjazd', activityId: 'activity-1', startedAt: '2026-09-01T08:00:00Z', sequence: 0, elapsedTimeSec: 95, averagePowerW: 240, averageHeartrate: 145, averageSpeedMs: 8, averageCadence: 82, personalRank: 2, differenceToBestSec: 5, recordAtTime: false, achievementLabel: '2. wynik' }] }, isLoading: false, isError: false }),
}));

describe('ActivitySegmentsPanel', () => {
  it('shows segments in ride order with rank and metrics', () => {
    render(<ThemeProvider theme={theme}><MemoryRouter><ActivitySegmentsPanel activityId="activity-1" /></MemoryRouter></ThemeProvider>);
    expect(screen.getByText('Leśny podjazd')).toBeDefined();
    expect(screen.getByLabelText('Srebrny puchar — 2. wynik w dostępnych danych')).toBeDefined();
    expect(screen.queryByText('2. wynik')).toBeNull();
    expect(screen.getByText(/2\. wśród własnych prób/)).toBeDefined();
    expect(screen.getByTestId('activity-segment-map')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Pokaż szybki podgląd segmentu Leśny podjazd' }));

    expect(screen.getByText('Szybki podgląd odcinka')).toBeDefined();
    expect(screen.getAllByTestId('activity-segment-map')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Ukryj szybki podgląd segmentu Leśny podjazd' })).toBeDefined();
  });
});
