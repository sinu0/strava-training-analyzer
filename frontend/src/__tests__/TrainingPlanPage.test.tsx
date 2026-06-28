import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import TrainingPlanPage from '../pages/TrainingPlanPage';
import theme from '../theme/theme';

vi.mock('../hooks/useTrainingPlan', () => ({
  useWorkoutTemplates: () => ({ data: [], isLoading: false }),
  useDeleteWorkoutTemplate: () => ({ mutate: vi.fn() }),
  useCalendarView: () => ({ data: [], isLoading: false }),
  useGenerateProgram: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, isError: false }),
  usePrograms: () => ({
    data: [
      {
        id: 'program-1',
        name: 'Build',
        goal: 'BUILD_BASE',
        goalPriority: 'B',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        weeklyObjectives: [
          {
            weekStart: '2026-04-06',
            weekEnd: '2026-04-12',
            objectiveType: 'THRESHOLD',
            label: 'Budowa progu',
            focus: 'Obroń jeden mocny akcent progowy.',
            plannedTss: 420,
            maxQualityDays: 2,
            keySessionTypes: ['THRESHOLD'],
            fuelingLabel: 'High carb',
            fuelingGuidance: 'Najwięcej węgli wokół jakości.',
          },
        ],
        goalScorecards: [
          {
            weekStart: '2026-04-06',
            weekEnd: '2026-04-12',
            label: 'Tydzień 1',
            plannedTss: 420,
            actualTss: 390,
            plannedQualityDays: 2,
            completedQualityDays: 1,
            goalFocusLabel: 'Budowa progu',
            goalFocusRole: 'THRESHOLD_QUALITY',
            plannedGoalSessions: 1,
            completedGoalSessions: 1,
            goalExecutionScore: 84,
            goalExecutionStatus: 'ON_TARGET',
            avgExecutionScore: 86,
            onTrack: true,
          },
        ],
        targetWeeklyTss: 420,
        targetWeeklyHours: 8,
        weekdayAvailabilityMinutes: 90,
        weekendAvailabilityMinutes: 180,
        preferredLongRideDay: 'SATURDAY',
        environmentPreference: 'OUTDOOR_FOCUSED',
        generatedBy: 'auto',
      },
    ],
    isLoading: false,
  }),
  useDeleteProgram: () => ({ mutate: vi.fn() }),
  useUpdatePlanStatus: () => ({ mutate: vi.fn() }),
  useDeleteTrainingPlan: () => ({ mutate: vi.fn() }),
  useExportWorkout: () => ({ mutate: vi.fn() }),
  useRecordAdjustmentFeedback: () => ({ mutate: vi.fn(), isPending: false }),
  useWorkoutTemplate: () => ({ data: null }),
}));

vi.mock('../hooks/useAnalytics', () => ({
  useReadiness: () => ({ data: { score: 61, dayLabel: 'Tlen' } }),
  useDurability: () => ({ data: { label: 'Stabilna', avgDurabilityScore: 68 } }),
  useProgressionLevels: () => ({
    data: [
      {
        system: 'THRESHOLD',
        label: 'Próg',
        level: 6,
        currentLoad: 82,
        previousLoad: 55,
        targetLoad: 70,
        trend: 'UP',
        description: 'Próg rośnie stabilnie.',
        nextRecommendation: 'Broń jednego akcentu progowego.',
      },
    ],
  }),
  useBlockHealth: () => ({
    data: {
      status: 'STABLE_PRODUCTIVE',
      label: 'Blok stabilny',
      description: 'Tydzień dowozi główny bodziec bez chaosu.',
      objectiveLabel: 'Budowa progu',
      goalExecutionStatus: 'ON_TARGET',
      goalExecutionScore: 84,
      adjustmentDays: 1,
      missedStimulusDays: 0,
      overloadDays: 0,
      keySignals: ['Bodziec celu: 1/1'],
      nextFocus: 'Broń jednego akcentu progowego.',
    },
  }),
  useEvents: () => ({ data: [], isLoading: false }),
  useCreateEvent: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useAi', () => ({
  useLatestAiPrediction: () => ({
    data: {
      id: 'coach-1',
      predictionType: 'TRAINING_COACH_SUMMARY',
      modelId: 'model',
      providerName: 'provider',
      summary: 'Broń progu i pilnuj świeżości.',
      detail: 'detail',
      confidence: 0.8,
      createdAt: '2026-04-07T08:00:00Z',
      structuredData: {
        weekReview: 'Tydzień trzyma priorytet progowy.',
        nextFocus: 'Obroń jeden akcent progowy.',
        keyWins: ['Próg rośnie.'],
        keyRisks: ['Weekend może wymusić auto-swap.'],
      },
    },
  }),
  useAiPredict: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/usePerformancePrediction', () => ({
  useCurrentPerformanceState: () => ({ data: null, isLoading: false }),
  usePerformancePrediction: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useTrainingOptimizer', () => ({
  useOptimizePlan: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useApplyOptimizedPlan: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
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

describe('TrainingPlanPage', () => {
  it('renders page title', () => {
    renderWithProviders(<TrainingPlanPage />);
    expect(screen.getByText('Planer treningowy')).toBeDefined();
    expect(screen.getByRole('img', { name: 'Planer hero' })).toBeDefined();
  });

  it('shows calendar tab as active', () => {
    renderWithProviders(<TrainingPlanPage />);
    const tab = screen.getByText('Kalendarz');
    expect(tab).toBeDefined();
    expect(tab.closest('[role="tab"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('all tabs are clickable', () => {
    renderWithProviders(<TrainingPlanPage />);
    const kalTab = screen.getByRole('tab', { name: 'Kalendarz' });
    const bibTab = screen.getByRole('tab', { name: 'Biblioteka' });
    const planTab = screen.getByRole('tab', { name: 'Plan Builder' });
    const adaptTab = screen.getByRole('tab', { name: 'Adaptacja' });
    expect(kalTab.classList.contains('Mui-disabled')).toBe(false);
    expect(bibTab.classList.contains('Mui-disabled')).toBe(false);
    expect(planTab.classList.contains('Mui-disabled')).toBe(false);
    expect(adaptTab.classList.contains('Mui-disabled')).toBe(false);
  });

  it('shows workout library content', () => {
    renderWithProviders(<TrainingPlanPage />);
    fireEvent.click(screen.getByText('Biblioteka'));
    expect(screen.getByText('Wszystkie')).toBeDefined();
  });

  it('shows calendar when Kalendarz tab is clicked', () => {
    renderWithProviders(<TrainingPlanPage />);
    expect(screen.getByText('Weekly coach cockpit')).toBeDefined();
    expect(screen.getByText('Progresja systemów')).toBeDefined();
    expect(screen.getByText('Pn')).toBeDefined();
    expect(screen.getByText('Nd')).toBeDefined();
  });

  it('shows plan builder when Plan Builder tab is clicked', () => {
    renderWithProviders(<TrainingPlanPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Plan Builder' }));
    const elements = screen.getAllByText('Plan Builder');
    expect(elements.length).toBeGreaterThanOrEqual(2);
  });
});
