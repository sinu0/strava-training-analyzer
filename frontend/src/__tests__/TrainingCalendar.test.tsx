import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import TrainingCalendar from '../components/training/TrainingCalendar';
import theme from '../theme/theme';

import type { CalendarDay } from '../types/training';

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
    },
  ];
}

vi.mock('../hooks/useTrainingPlan', () => ({
  useCalendarView: () => ({ data: makeMockDays(), isLoading: false }),
  useWorkoutTemplate: () => ({ data: null }),
  useUpdatePlanStatus: () => ({ mutate: vi.fn() }),
  useDeleteTrainingPlan: () => ({ mutate: vi.fn() }),
  useExportWorkout: () => ({ mutate: vi.fn() }),
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

  it('has month navigation arrows', () => {
    renderWithProviders(<TrainingCalendar />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
