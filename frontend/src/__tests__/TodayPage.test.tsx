import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../features/today/useToday', () => ({
  useToday: vi.fn(),
}));

vi.mock('../hooks/useUiPreferences', () => ({
  useUiPreferences: vi.fn(),
  useSaveUiPreferences: vi.fn(),
}));

import TodayPage from '../features/today/TodayPage';
import { useToday } from '../features/today/useToday';
import { useSaveUiPreferences, useUiPreferences } from '../hooks/useUiPreferences';
import { DEFAULT_UI_PREFERENCES } from '../utils/uiPreferences';

function renderPage() {
  return render(
    <MemoryRouter>
      <TodayPage />
    </MemoryRouter>,
  );
}

describe('TodayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUiPreferences).mockReturnValue({
      data: structuredClone(DEFAULT_UI_PREFERENCES),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useUiPreferences>);
    vi.mocked(useSaveUiPreferences).mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(structuredClone(DEFAULT_UI_PREFERENCES)),
    } as unknown as ReturnType<typeof useSaveUiPreferences>);
  });

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
    expect(screen.getByRole('button', { name: 'Otwórz pogodę' })).toBeDefined();
  });

  it('shows one recommendation together with its evidence', async () => {
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
        lastActivity: {
          id: 'activity-1',
          sportType: 'cycling',
          name: 'Morning Ride',
          startedAt: '2026-07-18T07:01:16Z',
          movingTimeSec: 7566,
          distanceM: 57526,
          summaryPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
        },
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
    expect(screen.getByText(/Obciążenie jest stabilne/)).toBeDefined();
    expect(screen.getByLabelText('Ślad trasy: Morning Ride')).toBeDefined();
    expect(await screen.findByTestId('lightweight-route-preview')).toBeDefined();
  });

  it('exposes a round hero CTA that navigates to the training plan', () => {
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
        evidence: [],
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

    const cta = screen.getByRole('button', { name: 'Otwórz plan' });
    expect(cta).toBeDefined();
    fireEvent.click(cta);
    expect(screen.getByRole('heading', { name: 'ENDURANCE' })).toBeDefined();
  });
});
