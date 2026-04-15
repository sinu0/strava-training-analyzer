import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import WorkoutLibrary from '../components/training/WorkoutLibrary';
import theme from '../theme/theme';

import type { WorkoutTemplate } from '../types/training';

const MOCK_TEMPLATES: WorkoutTemplate[] = [
  {
    id: '1',
    name: 'Sweet Spot Base',
    category: 'SWEET_SPOT',
    description: 'Podstawowy trening sweet spot',
    targetTss: 75,
    targetDurationMin: 60,
    relativeEffort: 6.5,
    intensityFactor: 0.88,
    steps: [
      { type: 'warmup', durationSec: 600, powerPctFtpLow: 45, powerPctFtpHigh: 70 },
      { type: 'steady', durationSec: 2400, powerPctFtpLow: 88, powerPctFtpHigh: 93 },
      { type: 'cooldown', durationSec: 600, powerPctFtpLow: 40, powerPctFtpHigh: 65 },
    ],
    createdBy: 'system',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'VO2max Intervals',
    category: 'VO2MAX',
    description: null,
    targetTss: 90,
    targetDurationMin: 75,
    relativeEffort: 8.0,
    intensityFactor: 0.95,
    steps: [
      { type: 'warmup', durationSec: 600, powerPctFtpLow: 45, powerPctFtpHigh: 70 },
      {
        type: 'interval',
        repeat: 5,
        onDurationSec: 180,
        onPowerPctFtpLow: 110,
        onPowerPctFtpHigh: 120,
        offDurationSec: 180,
        offPowerPctFtpLow: 45,
        offPowerPctFtpHigh: 55,
      },
      { type: 'cooldown', durationSec: 600, powerPctFtpLow: 40, powerPctFtpHigh: 60 },
    ],
    createdBy: 'system',
    createdAt: '2025-01-02T00:00:00Z',
  },
];

let mockReturn: {
  data: WorkoutTemplate[] | undefined;
  isLoading: boolean;
} = { data: MOCK_TEMPLATES, isLoading: false };

vi.mock('../hooks/useTrainingPlan', () => ({
  useWorkoutTemplates: () => mockReturn,
  useDeleteWorkoutTemplate: () => ({ mutate: vi.fn() }),
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

describe('WorkoutLibrary', () => {
  beforeEach(() => {
    mockReturn = { data: MOCK_TEMPLATES, isLoading: false };
  });

  it('renders template cards', () => {
    renderWithProviders(<WorkoutLibrary />);
    expect(screen.getByText('Sweet Spot Base')).toBeDefined();
    expect(screen.getByText('VO2max Intervals')).toBeDefined();
  });

  it('shows category filter chips', () => {
    renderWithProviders(<WorkoutLibrary />);
    expect(screen.getByText('Wszystkie')).toBeDefined();
    expect(screen.getByText('Regeneracja')).toBeDefined();
    expect(screen.getAllByText('VO2max').length).toBeGreaterThanOrEqual(1);
  });

  it('can click a category filter', () => {
    renderWithProviders(<WorkoutLibrary />);
    const chip = screen.getByText('Tempo');
    fireEvent.click(chip);
    // chip should now be filled (selected)
    expect(chip.closest('.MuiChip-root')).toBeTruthy();
  });

  it('shows empty state when no templates', () => {
    mockReturn = { data: [], isLoading: false };
    renderWithProviders(<WorkoutLibrary />);
    expect(screen.getByText('Brak szablonów treningowych')).toBeDefined();
  });

  it('shows loading skeleton', () => {
    mockReturn = { data: undefined, isLoading: true };
    const { container } = renderWithProviders(<WorkoutLibrary />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows details button on each card', () => {
    renderWithProviders(<WorkoutLibrary />);
    const buttons = screen.getAllByText('Szczegóły');
    expect(buttons).toHaveLength(2);
  });
});
