import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import ProgramsList from '../components/training/ProgramsList';
import theme from '../theme/theme';

vi.mock('../hooks/useTrainingPlan', () => ({
  usePrograms: () => ({
    data: [{
      id: 'program-1',
      name: 'BUILD_PEAK 4w',
      goal: 'BUILD_PEAK',
      goalPriority: 'A',
      startDate: '2025-01-06',
      endDate: '2025-02-02',
      eventDate: '2025-02-02',
      taperStartDate: '2025-01-20',
      weeklyObjectives: [{
        weekStart: '2025-01-06',
        weekEnd: '2025-01-12',
        objectiveType: 'BUILD_THRESHOLD',
        label: 'Budowa progu',
        focus: 'Kontrolowany próg i spokojne dni obok',
        plannedTss: 380,
        maxQualityDays: 2,
        keySessionTypes: ['THRESHOLD', 'ENDURANCE'],
        fuelingLabel: 'Węgle pod akcent',
        fuelingGuidance: 'Najwięcej węgli daj przed progiem i po nim, lekkie dni bez ładowania.',
      }],
      goalScorecards: [{
        weekStart: '2025-01-06',
        weekEnd: '2025-01-12',
        label: 'Budowa progu',
        plannedTss: 380,
        actualTss: 360,
        plannedQualityDays: 2,
        completedQualityDays: 1,
        goalFocusLabel: 'Budowa progu',
        goalFocusRole: 'THRESHOLD_QUALITY',
        plannedGoalSessions: 1,
        completedGoalSessions: 1,
        goalExecutionScore: 88,
        goalExecutionStatus: 'ON_TARGET',
        avgExecutionScore: 82,
        onTrack: true,
      }],
      targetWeeklyTss: 420,
      targetWeeklyHours: null,
      generatedBy: 'auto',
    }],
    isLoading: false,
  }),
  useDeleteProgram: () => ({ mutate: vi.fn() }),
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

describe('ProgramsList', () => {
  it('renders goal priority and taper metadata', () => {
    renderWithProviders(<ProgramsList />);
    expect(screen.getByText('Priorytet A')).toBeDefined();
    expect(screen.getByText('Start docelowy 2025-02-02')).toBeDefined();
    expect(screen.getByText('Taper od 2025-01-20')).toBeDefined();
    expect(screen.getByText('Budowa progu')).toBeDefined();
    expect(screen.getByText('Max 2 akcent')).toBeDefined();
    expect(screen.getByText('Węgle pod akcent')).toBeDefined();
    expect(screen.getByText('1/2 akcentów')).toBeDefined();
    expect(screen.getByText('95% planu')).toBeDefined();
    expect(screen.getByText('Cel: Budowa progu')).toBeDefined();
    expect(screen.getByText('1/1 bodźców celu')).toBeDefined();
  });
});
