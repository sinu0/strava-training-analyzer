import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import SegmentDetailPage from '@/features/segments/SegmentDetailPage';
import theme from '@/theme/theme';

vi.mock('@/components/segments/SegmentRouteMap', () => ({ default: () => <div data-testid="segment-map" /> }));
vi.mock('@/components/segments/SegmentComparisonVisual', () => ({ default: () => <div data-testid="segment-comparison" /> }));
vi.mock('@/hooks/useSegments', () => ({
  useSegment: () => ({ data: { segment: { id: 7, name: 'Klasztorna fragment', distanceM: 790, averageGrade: 0.1, effortCount: 1, bestElapsedTimeSec: 85, localFavorite: false, routePolyline: 'abc' }, efforts: [{ id: 'effort-1', segmentId: 7, segmentName: 'Klasztorna fragment', activityId: 'activity-1', activityName: 'Morning Ride', startedAt: '2026-09-01T08:00:00Z', sequence: 0, elapsedTimeSec: 85, personalRank: 1, recordAtTime: true, achievementLabel: 'Najlepszy w dostępnych danych' }], backfillStatus: 'RUNNING', personalBestConfirmed: false }, isLoading: false, isError: false }),
  useSegmentComparison: () => ({ data: { segmentId: 7, referenceEffortId: 'effort-1', distanceM: 790, series: [] }, isLoading: false, isError: false }),
}));

describe('SegmentDetailPage', () => {
  it('keeps activity context and communicates partial PB confidence', () => {
    render(<ThemeProvider theme={theme}><MemoryRouter initialEntries={['/segments/7?effort=effort-1&fromActivity=activity-1']}><Routes><Route path="/segments/:id" element={<SegmentDetailPage />} /></Routes></MemoryRouter></ThemeProvider>);
    expect(screen.getByRole('heading', { name: 'Klasztorna fragment' })).toBeDefined();
    expect(screen.getByText(/Historyczny backfill nie jest ukończony/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Wróć do aktywności' })).toBeDefined();
    expect(screen.getByLabelText('Złoty puchar — 1. wynik w dostępnych danych')).toBeDefined();
    expect(screen.queryByText('Najlepszy w dostępnych danych')).toBeNull();
  });
});
