import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import PlanGenerator from '../components/training/PlanGenerator';
import theme from '../theme/theme';

const mockMutate = vi.fn();

vi.mock('../hooks/useTrainingPlan', () => ({
  useGenerateProgram: () => ({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
  }),
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

describe('PlanGenerator', () => {
  it('renders all form fields', () => {
    renderWithProviders(<PlanGenerator />);
    expect(screen.getByLabelText(/Cel/)).toBeDefined();
    expect(screen.getByLabelText(/Data rozpoczęcia/)).toBeDefined();
    expect(screen.getByLabelText(/Liczba tygodni/)).toBeDefined();
    expect(screen.getByLabelText(/Dni treningowe/)).toBeDefined();
    expect(screen.getByLabelText(/Docelowy TSS/)).toBeDefined();
    expect(screen.getByText('Generuj plan')).toBeDefined();
  });

  it('calls generate mutation on submit', () => {
    renderWithProviders(<PlanGenerator />);
    fireEvent.click(screen.getByText('Generuj plan'));
    expect(mockMutate).toHaveBeenCalledTimes(1);
    const callArgs = mockMutate.mock.calls[0]![0];
    expect(callArgs.goal).toBe('BUILD_BASE');
    expect(callArgs.weeks).toBe(8);
    expect(callArgs.trainingDaysPerWeek).toBe(4);
    expect(callArgs.targetWeeklyTss).toBe(500);
  });

  it('shows validation for invalid weeks value', () => {
    renderWithProviders(<PlanGenerator />);
    const weeksInput = screen.getByLabelText(/Liczba tygodni/);
    fireEvent.change(weeksInput, { target: { value: '0' } });
    expect(screen.getByText('1–52')).toBeDefined();
  });

  it('disables button when validation fails', () => {
    renderWithProviders(<PlanGenerator />);
    const tssInput = screen.getByLabelText(/Docelowy TSS/);
    fireEvent.change(tssInput, { target: { value: '50' } });
    const button = screen.getByText('Generuj plan');
    expect(button.closest('button')?.disabled).toBe(true);
  });
});
