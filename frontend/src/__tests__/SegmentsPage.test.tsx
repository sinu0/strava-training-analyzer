import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import SegmentsPage from '@/features/segments/SegmentsPage';
import theme from '@/theme/theme';

vi.mock('@/hooks/useSegments', () => ({
  useSegments: () => ({ data: { items: [{ id: 7, name: 'Klasztorna fragment', distanceM: 790, averageGrade: 0.1, effortCount: 3, bestElapsedTimeSec: 85, localFavorite: false }], total: 1, page: 0, size: 30, totalPages: 1 }, isLoading: false, isError: false }),
  useBackfillStatus: (type: string) => ({ data: type === 'segments'
    ? { status: 'RUNNING', processed: 12, total: 100, capability: 'AVAILABLE' }
    : { status: 'IDLE', processed: 0, total: 100, capability: 'LOCAL' } }),
  useStartBackfill: () => ({ mutate: vi.fn(), isPending: false }),
  useSetSegmentFavorite: () => ({ mutate: vi.fn() }),
}));

describe('SegmentsPage', () => {
  it('renders searchable catalog filters and partial backfill state', () => {
    render(<ThemeProvider theme={theme}><MemoryRouter><SegmentsPage /></MemoryRouter></ThemeProvider>);
    expect(screen.getByRole('heading', { name: 'Segmenty' })).toBeDefined();
    expect(screen.getByLabelText('Szukaj segmentu')).toBeDefined();
    expect(screen.getByLabelText('Dystans')).toBeDefined();
    expect(screen.getByLabelText('Podjazdy ≥ 3%')).toBeDefined();
    expect(screen.getByText('Klasztorna fragment')).toBeDefined();
    expect(screen.getByText(/12\/100 aktywności/)).toBeDefined();
    expect(screen.getByText(/Lokalny backfill dopasowanych tras/)).toBeDefined();
    expect(screen.getByLabelText('Dodaj Klasztorna fragment do ulubionych')).toBeDefined();
  });
});
