import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

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
  it('renders first wizard step with goal fields', () => {
    renderWithProviders(<PlanGenerator />);
    expect(screen.getByText('Wizard planu')).toBeDefined();
    expect(screen.getByLabelText(/^Cel$/)).toBeDefined();
    expect(screen.getByLabelText(/Priorytet celu/)).toBeDefined();
    expect(screen.getByLabelText(/Data rozpoczęcia/)).toBeDefined();
    expect(screen.getByText('Dalej')).toBeDefined();
  });

  it('shows constraint step after moving forward', () => {
    renderWithProviders(<PlanGenerator />);
    fireEvent.click(screen.getByText('Dalej'));
    expect(screen.getByLabelText(/Okno w dzień roboczy/)).toBeDefined();
    expect(screen.getByLabelText(/Okno weekendowe/)).toBeDefined();
    expect(screen.getByLabelText(/Preferowany dzień długiej jazdy/)).toBeDefined();
    expect(screen.getByLabelText(/Środowisko treningu/)).toBeDefined();
  });

  it('calls generate mutation with planner constraints on submit', () => {
    renderWithProviders(<PlanGenerator />);
    fireEvent.change(screen.getByLabelText(/Data rozpoczęcia/), { target: { value: '2099-01-06' } });
    fireEvent.change(screen.getByLabelText(/Data startu docelowego/), { target: { value: '2099-02-02' } });
    fireEvent.click(screen.getByText('Dalej'));
    fireEvent.change(screen.getByLabelText(/Okno w dzień roboczy/), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText(/Okno weekendowe/), { target: { value: '240' } });
    fireEvent.click(screen.getByText('Dalej'));
    fireEvent.click(screen.getByText('Generuj plan'));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const callArgs = mockMutate.mock.calls[0]![0];
    expect(callArgs).toMatchObject({
      goal: 'BUILD_BASE',
      goalPriority: 'B',
      startDate: '2099-01-06',
      eventDate: '2099-02-02',
      weeks: 8,
      trainingDaysPerWeek: 4,
      targetWeeklyTss: 500,
      weekdayAvailabilityMinutes: 90,
      weekendAvailabilityMinutes: 240,
      preferredLongRideDay: 'SATURDAY',
      environmentPreference: 'MIXED',
    });
  });

  it('shows validation for invalid weeks value', () => {
    renderWithProviders(<PlanGenerator />);
    fireEvent.change(screen.getByLabelText(/Liczba tygodni/), { target: { value: '0' } });
    expect(screen.getByText('1–52')).toBeDefined();
  });

  it('disables next button when first-step validation fails', () => {
    renderWithProviders(<PlanGenerator />);
    fireEvent.change(screen.getByLabelText(/Docelowy TSS/), { target: { value: '50' } });
    expect(screen.getByText('Dalej').closest('button')?.disabled).toBe(true);
  });

  it('shows validation when event date is before plan start', () => {
    renderWithProviders(<PlanGenerator />);
    fireEvent.change(screen.getByLabelText(/Data startu docelowego/), { target: { value: '2000-01-01' } });
    expect(screen.getByText('Data celu nie może być wcześniejsza niż start planu')).toBeDefined();
  });
});
