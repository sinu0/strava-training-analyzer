import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import TrainingCalendar from '../components/training/TrainingCalendar';
import theme from '../theme/theme';

import type { CalendarDay } from '../types/training';

const recordAdjustmentFeedbackMutate = vi.fn();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function makeMockDays(): CalendarDay[] {
  return [
    {
      date: todayStr(),
      planned: {
        id: 'p1', date: todayStr(), plannedType: 'ENDURANCE', plannedTss: 80,
        plannedDurationMin: 90, plannedDescription: 'Jazda bazowa', actualActivityId: null,
        compliancePct: null, programId: null, workoutTemplateId: null, workoutTemplateName: null,
        targetPowerLowW: null, targetPowerHighW: null, status: 'PLANNED', notes: null,
      },
      actual: null,
      compliance: null,
      projection: {
        plannedTss: 80,
        projectedCtl: 70.8,
        projectedAtl: 77.1,
        projectedTsb: -6.1,
        projectedReadiness: 62,
        dayType: 'TEMPO',
        dayLabel: 'Tempo',
        taperDay: false,
      },
      adjustment: {
        type: 'LIGHTEN',
        title: 'Zdejmij intensywność',
        description: 'Zamień ten dzień na tlen albo skróć akcent o 20-30%.',
        memoryHint: 'Pamięć coacha: zwykle akceptujesz takie korekty.',
      },
    },
    {
      date: tomorrowStr(),
      planned: {
        id: 'p2', date: tomorrowStr(), plannedType: 'THRESHOLD', plannedTss: 100,
        plannedDurationMin: 60, plannedDescription: null, actualActivityId: 'a1',
        compliancePct: 95, programId: null, workoutTemplateId: null, workoutTemplateName: null,
        targetPowerLowW: null, targetPowerHighW: null, status: 'COMPLETED', notes: null,
      },
      actual: { id: 'a1', name: 'Trening progowy', sportType: 'Ride', durationMin: 62, distanceKm: 35.5, tss: 95 },
      compliance: 95,
      execution: {
        outcome: 'WELL_EXECUTED',
        label: 'Trafiony bodziec',
        description: 'Czas i obciążenie były blisko planu.',
        score: 91,
        tssCompliance: 95,
        durationCompliance: 103,
        intervalCompliance: 88,
        zoneCompliance: 92,
        stimulusMatch: true,
        primaryLimiter: 'ON_TARGET',
        nextDayAdvice: 'Możesz trzymać kolejny planowany krok bez dodatkowej korekty.',
      },
      projection: {
        plannedTss: 100,
        projectedCtl: 71.2,
        projectedAtl: 82.3,
        projectedTsb: -11.1,
        projectedReadiness: 53,
        dayType: 'ENDURANCE',
        dayLabel: 'Tlen',
        taperDay: true,
      },
      adjustment: null,
    },
  ];
}

vi.mock('../hooks/useTrainingPlan', () => ({
  useCalendarView: () => ({ data: makeMockDays(), isLoading: false }),
  useWorkoutTemplate: () => ({ data: null }),
  useUpdatePlanStatus: () => ({ mutate: vi.fn() }),
  useDeleteTrainingPlan: () => ({ mutate: vi.fn() }),
  useExportWorkout: () => ({ mutate: vi.fn() }),
  useRecordAdjustmentFeedback: () => ({ mutate: recordAdjustmentFeedbackMutate, isPending: false }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('TrainingCalendar', () => {
  it('renders month grid with day headers', () => {
    renderWithProviders(<TrainingCalendar />);
    expect(screen.getByText('Pn')).toBeDefined();
    expect(screen.getByText('Wt')).toBeDefined();
    expect(screen.getByText('Śr')).toBeDefined();
    expect(screen.getByText('Cz')).toBeDefined();
    expect(screen.getByText('Pt')).toBeDefined();
    expect(screen.getByText('So')).toBeDefined();
    expect(screen.getByText('Nd')).toBeDefined();
  });

  it('shows planned workout chip', () => {
    renderWithProviders(<TrainingCalendar />);
    expect(screen.getByText('Wytrzymałość 80')).toBeDefined();
  });

  it('shows actual activity', () => {
    renderWithProviders(<TrainingCalendar />);
    expect(screen.getByText(/Trening progowy/)).toBeDefined();
  });

  it('shows compliance percentage', () => {
    renderWithProviders(<TrainingCalendar />);
    expect(screen.getByText('95%')).toBeDefined();
  });

  it('shows execution assessment label', () => {
    renderWithProviders(<TrainingCalendar />);
    expect(screen.getByText('Trafiony bodziec')).toBeDefined();
  });

  it('has month navigation arrows', () => {
    renderWithProviders(<TrainingCalendar />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('shows plan projection summary', () => {
    renderWithProviders(<TrainingCalendar />);
    expect(screen.getByText('Projekcja PMC planu')).toBeDefined();
    expect(screen.getByText('Zdejmij intensywność')).toBeDefined();
  });

  it('shows scenario simulator in day dialog', () => {
    renderWithProviders(<TrainingCalendar />);
    fireEvent.click(screen.getByText('Wytrzymałość 80'));
    expect(screen.getByText('Symulator decyzji')).toBeDefined();
    expect(screen.getByText('Dlaczego aplikacja to sugeruje')).toBeDefined();
    expect(screen.getByText('Odchudź o 20-25%')).toBeDefined();
    expect(screen.getByText('Przenieś na jutro')).toBeDefined();
  });

  it('records coach feedback for adjustment suggestion', () => {
    renderWithProviders(<TrainingCalendar />);
    fireEvent.click(screen.getByText('Wytrzymałość 80'));
    expect(screen.getByText(/Pamięć coacha:/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Trafna sugestia' }));

    expect(recordAdjustmentFeedbackMutate).toHaveBeenCalledWith(
      {
        date: todayStr(),
        planId: 'p1',
        suggestionType: 'LIGHTEN',
        suggestionTitle: 'Zdejmij intensywność',
        feedback: 'ACCEPTED',
      },
    );
  });

  it('shows detailed execution review in day dialog', () => {
    renderWithProviders(<TrainingCalendar />);
    fireEvent.click(screen.getByText(/Trening progowy/));
    expect(screen.getByText('Interwały 88%')).toBeDefined();
    expect(screen.getByText('Strefa 92%')).toBeDefined();
    expect(screen.getByText('Limiter: Na celu')).toBeDefined();
    expect(screen.getByText(/Możesz trzymać kolejny planowany krok/)).toBeDefined();
  });
});
