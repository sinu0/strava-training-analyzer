import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import WeightPage from '@/pages/WeightPage';
import theme from '@/theme/theme';
import type { WeightOverview } from '@/types/weight';

const mutateAddWeight = vi.fn();
const mutateSetGoal = vi.fn();
const mutateDeleteGoal = vi.fn();
const refetchOverview = vi.fn();

const mockOverview: WeightOverview = {
  currentWeightKg: 74.2,
  goal: {
    id: 'goal-1',
    targetWeightKg: 70.5,
    targetDate: '2026-08-01',
    createdAt: '2026-03-27T20:00:00Z',
    updatedAt: '2026-03-27T20:00:00Z',
  },
  dailyCaloricNeed: 2600,
  dailyDeficitOrSurplus: 450,
  weeksRemaining: 10,
  history: [
    {
      id: 'weight-1',
      weightKg: 75.1,
      recordedDate: '2026-03-20',
      notes: 'Rano',
      createdAt: '2026-03-20T08:00:00Z',
    },
    {
      id: 'weight-2',
      weightKg: 74.2,
      recordedDate: '2026-03-27',
      notes: null,
      createdAt: '2026-03-27T08:00:00Z',
    },
  ],
  weeklyTrainingCalories: 4200,
  adjustedDailyTdee: 2800,
  recommendedDailyCalories: 2350,
  weeklyWeightChange: -0.9,
  dataConfidence: 'wysoki',
};

let overviewState: {
  data?: WeightOverview;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
};

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  mutateAddWeight.mockReset();
  mutateSetGoal.mockReset();
  mutateDeleteGoal.mockReset();
  refetchOverview.mockReset();
  overviewState = {
    data: mockOverview,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchOverview,
  };
});

vi.mock('@/hooks/useWeight', () => ({
  useWeightOverview: () => overviewState,
  useAddWeight: () => ({ mutate: mutateAddWeight, isPending: false }),
  useSetWeightGoal: () => ({ mutate: mutateSetGoal, isPending: false }),
  useDeleteWeightGoal: () => ({ mutate: mutateDeleteGoal, isPending: false }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('WeightPage', () => {
  it('submits a new weight entry from the dialog', async () => {
    mutateAddWeight.mockImplementation((_variables: unknown, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
    });

    renderWithProviders(<WeightPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Dodaj wagę' }));
    fireEvent.change(screen.getByLabelText('Waga (kg)'), { target: { value: '73.8' } });
    fireEvent.change(screen.getByLabelText('Notatki (opcjonalnie)'), {
      target: { value: 'Po treningu' },
    });

    const recordedDate = (screen.getByLabelText('Data') as HTMLInputElement).value;

    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(mutateAddWeight).toHaveBeenCalledWith(
      {
        weightKg: 73.8,
        recordedDate,
        notes: 'Po treningu',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    await waitFor(() => {
      expect(screen.queryByText('Dodaj pomiar wagi')).toBeNull();
    });
  });

  it('prefills the goal dialog with the current goal', () => {
    renderWithProviders(<WeightPage />);

    expect(screen.getByText('Stan dziś')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Zmień cel' }));

    expect((screen.getByLabelText('Docelowa waga (kg)') as HTMLInputElement).value).toBe('70.5');
    expect((screen.getByLabelText('Data docelowa') as HTMLInputElement).value).toBe('2026-08-01');
  });

  it('shows the backend error message when overview loading fails', () => {
    overviewState = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new AxiosError('Request failed', '500', undefined, undefined, {
        data: { message: 'Backend wagi niedostępny.' },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: { headers: {} as never },
      } as never),
      refetch: refetchOverview,
    };

    renderWithProviders(<WeightPage />);

    expect(screen.getByText('Backend wagi niedostępny.')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));

    expect(refetchOverview).toHaveBeenCalled();
  });
});
