import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import SummaryStoryModal from '../components/profile/SummaryStoryModal';
import theme from '../theme/theme';

import type { WeeklySummary, ReadinessData } from '../types/analytics';

const mockWeekly: WeeklySummary[] = [
  { weekStart: '2025-06-16', activityCount: 5, totalDistanceM: 250000, totalTimeSec: 36000, totalElevationM: 2500, totalTss: 320 },
  { weekStart: '2025-06-09', activityCount: 4, totalDistanceM: 200000, totalTimeSec: 28800, totalElevationM: 1800, totalTss: 250 },
  { weekStart: '2025-06-02', activityCount: 0, totalDistanceM: 0, totalTimeSec: 0, totalElevationM: 0, totalTss: 0 },
];

const mockReadiness: ReadinessData = {
  score: 78,
  level: 'good',
  tsb: 8,
  ctl: 65,
  atl: 57,
  description: 'Dobra forma',
};

function renderModal(props: Partial<React.ComponentProps<typeof SummaryStoryModal>> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <SummaryStoryModal
        open={true}
        onClose={vi.fn()}
        weeklySummaries={mockWeekly}
        readiness={mockReadiness}
        streak={2}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe('SummaryStoryModal', () => {
  it('renders the modal when open', () => {
    renderModal();
    expect(screen.getByText('Twój tydzień')).toBeDefined();
  });

  it('shows slide 1 content with distance', () => {
    renderModal();
    expect(screen.getByText('250.0 km')).toBeDefined();
  });

  it('navigates to next slide on next button click', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /dalej/i }));
    expect(screen.getByText('Wysiłek')).toBeDefined();
  });

  it('shows close button', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /zamknij/i })).toBeDefined();
  });

  it('does not render content when closed', () => {
    renderModal({ open: false });
    expect(screen.queryByText('Twój tydzień')).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: /zamknij/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates back to first slide on prev button click', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /dalej/i }));
    expect(screen.getByText('Wysiłek')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /wstecz/i }));
    expect(screen.getByText('Twój tydzień')).toBeDefined();
  });

  it('shows readiness CTL value on slide 2', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /dalej/i }));
    expect(screen.getByText('65')).toBeDefined();
  });
});
