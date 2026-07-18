import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../features/today/useToday', () => ({
  useToday: vi.fn(),
}));

import TodayPage from '../features/today/TodayPage';
import { useToday } from '../features/today/useToday';

function renderPage() {
  return render(
    <MemoryRouter>
      <TodayPage />
    </MemoryRouter>,
  );
}

describe('TodayPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows explicit unknown state without fabricated load values', () => {
    vi.mocked(useToday).mockReturnValue({
      data: {
        asOf: '2026-07-18',
        dataStatus: 'UNKNOWN',
        recommendation: null,
        evidence: [],
        confidence: { level: 'LOW', reasons: ['Brak aktywności do porównania'] },
        lastActivity: null,
        load: null,
        nextTraining: null,
        sync: { status: 'idle', imported: 0, skipped: 0 },
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useToday>);

    renderPage();

    expect(screen.getByText('Brak danych')).toBeDefined();
    expect(screen.getByText('Brak historii wymaganej do obliczenia obciążenia.')).toBeDefined();
    expect(screen.queryByText('0.0')).toBeNull();
    expect(screen.getByRole('button', { name: 'Otwórz pełną pogodę' })).toBeDefined();
  });

  it('shows one recommendation together with its evidence', () => {
    vi.mocked(useToday).mockReturnValue({
      data: {
        asOf: '2026-07-18',
        dataStatus: 'AVAILABLE',
        recommendation: {
          decision: 'TRAIN',
          sessionType: 'ENDURANCE',
          durationMinutes: 60,
          targetTss: 45,
          description: 'Spokojna jazda Z2.',
        },
        evidence: [{ code: 'LOAD', message: 'Obciążenie jest stabilne', source: 'daily_metrics', asOf: '2026-07-18' }],
        confidence: { level: 'HIGH', reasons: ['Aktualne źródła'] },
        lastActivity: null,
        load: { ctl42: 42, atl7: 45, form: -3, asOf: '2026-07-18' },
        nextTraining: null,
        sync: { status: 'completed', imported: 1, skipped: 0 },
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useToday>);

    renderPage();

    expect(screen.getByRole('heading', { name: 'ENDURANCE' })).toBeDefined();
    expect(screen.getByText('Spokojna jazda Z2.')).toBeDefined();
    expect(screen.getByText('Obciążenie jest stabilne')).toBeDefined();
  });
});
