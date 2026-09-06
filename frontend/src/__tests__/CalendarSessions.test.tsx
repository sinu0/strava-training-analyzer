import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import CalendarDayDialog from '@/components/training/CalendarDayDialog';
import theme from '@/theme/theme';
import type { CalendarDay, TrainingPlan } from '@/types/training';

const update = vi.fn();
vi.mock('@/hooks/useTrainingPlan', () => ({
  useUpdatePlanStatus: () => ({ mutate: update }),
  useDeleteTrainingPlan: () => ({ mutate: vi.fn() }),
  useRecordAdjustmentFeedback: () => ({ mutate: vi.fn() }),
}));

describe('calendar sessions', () => {
  it('targets the selected session and never prints null as a score or distance', () => {
    const plan: TrainingPlan = {
      id: 'first', date: '2026-09-05', plannedType: 'ENDURANCE', plannedTss: 30,
      plannedDurationMin: 30, plannedDescription: 'Poranek', actualActivityId: null, compliancePct: null,
      programId: null, workoutTemplateId: null, workoutTemplateName: null, targetPowerLowW: null,
      targetPowerHighW: null, status: 'PLANNED', notes: null,
    };
    const day: CalendarDay = {
      date: plan.date, planned: plan, actual: null, compliance: null,
      sessions: [
        { planned: plan, actual: null, compliance: null },
        { planned: { ...plan, id: 'second', plannedDescription: 'Wieczór' }, compliance: null,
          actual: { id: 'a', name: 'Trenażer', sportType: 'VirtualRide', durationMin: 30, distanceKm: null, tss: null },
          execution: { outcome: 'UNKNOWN', label: 'Brak pełnej oceny', description: 'Brak pomiaru', score: null,
            tssCompliance: null, durationCompliance: 100, stimulusMatch: false } },
      ],
    };
    render(<QueryClientProvider client={new QueryClient()}><ThemeProvider theme={theme}><MemoryRouter>
      <CalendarDayDialog day={day} open onClose={vi.fn()} />
    </MemoryRouter></ThemeProvider></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Sesja 2: Wieczór' }));
    expect(screen.getByText('Ocena niedostępna')).toBeDefined();
    expect(screen.getByText(/Dystans nieznany/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Oznacz jako zrealizowany' }));
    expect(update).toHaveBeenCalledWith({ id: 'second', status: 'COMPLETED' }, expect.anything());
  });
});
