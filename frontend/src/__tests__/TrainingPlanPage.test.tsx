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
  usePrograms: () => ({ data: [], isLoading: false }),
  useDeleteProgram: () => ({ mutate: vi.fn() }),
  useUpdatePlanStatus: () => ({ mutate: vi.fn() }),
  useDeleteTrainingPlan: () => ({ mutate: vi.fn() }),
  useExportWorkout: () => ({ mutate: vi.fn() }),
  useWorkoutTemplate: () => ({ data: null }),
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
  });

  it('shows library tab as active', () => {
    renderWithProviders(<TrainingPlanPage />);
    const tab = screen.getByText('Biblioteka');
    expect(tab).toBeDefined();
    expect(tab.closest('[role="tab"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('all three tabs are clickable', () => {
    renderWithProviders(<TrainingPlanPage />);
    const kalTab = screen.getByText('Kalendarz');
    const progTab = screen.getByText('Programy');
    expect(kalTab.closest('[role="tab"]')?.classList.contains('Mui-disabled')).toBe(false);
    expect(progTab.closest('[role="tab"]')?.classList.contains('Mui-disabled')).toBe(false);
  });

  it('shows workout library content', () => {
    renderWithProviders(<TrainingPlanPage />);
    expect(screen.getByText('Wszystkie')).toBeDefined();
  });

  it('shows calendar when Kalendarz tab is clicked', () => {
    renderWithProviders(<TrainingPlanPage />);
    fireEvent.click(screen.getByText('Kalendarz'));
    expect(screen.getByText('Generator planu')).toBeDefined();
    // Day headers visible
    expect(screen.getByText('Pn')).toBeDefined();
    expect(screen.getByText('Nd')).toBeDefined();
  });

  it('shows programs list when Programy tab is clicked', () => {
    renderWithProviders(<TrainingPlanPage />);
    fireEvent.click(screen.getByText('Programy'));
    expect(screen.getByText('Brak wygenerowanych programów')).toBeDefined();
  });
});
