import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AlternativesPanel from '@/components/daily-decision/AlternativesPanel';
import DailyDecisionHeroCard from '@/components/daily-decision/DailyDecisionHeroCard';
import ReasoningPanel from '@/components/daily-decision/ReasoningPanel';
import theme from '@/theme/theme';
import type { DailyDecisionDto, DecisionReason } from '@/types/dailyDecision';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockRideDecision: DailyDecisionDto = {
  decision: 'RIDE',
  workout: {
    type: 'ENDURANCE',
    durationMin: 90,
    targetTss: 75,
    difficulty: 'MODERATE',
    intensityDescription: 'Full workout as planned',
    description: '90min ENDURANCE ride',
    indoor: false,
  },
  confidence: { score: 0.85, label: 'VERY_HIGH', description: 'All good' },
  risk: 'LOW',
  reasons: [
    { priority: 'SAFETY', signal: 'TSB', message: 'Good TSB', evidence: 'TSB=5' },
    { priority: 'PLAN', signal: 'SCHEDULE', message: 'Planned workout', evidence: 'type=ENDURANCE' },
  ],
  alternatives: [
    {
      label: 'Shorter version',
      type: 'MODIFY',
      workout: { type: 'ENDURANCE', durationMin: 45, targetTss: 35, difficulty: 'EASY', intensityDescription: 'Half', description: 'Compact 45min', indoor: false },
      rationale: 'Time-efficient',
    },
    {
      label: 'Easier version',
      type: 'MODIFY',
      workout: { type: 'ENDURANCE', durationMin: 90, targetTss: 50, difficulty: 'EASY', intensityDescription: 'Low intensity', description: 'Easy 90min', indoor: false },
      rationale: 'Gentle',
    },
    {
      label: 'Indoor version',
      type: 'INDOOR',
      workout: { type: 'ENDURANCE', durationMin: 90, targetTss: 75, difficulty: 'MODERATE', intensityDescription: 'On trainer', description: 'Indoor 90min', indoor: true },
      rationale: 'Train inside',
    },
  ],
};

const mockSkipDecision: DailyDecisionDto = {
  decision: 'SKIP',
  workout: {
    type: 'REST',
    durationMin: 0,
    targetTss: 0,
    difficulty: 'NONE',
    intensityDescription: 'Rest day',
    description: 'Take a rest day',
    indoor: false,
  },
  confidence: { score: 0.75, label: 'HIGH', description: 'Fatigue signals' },
  risk: 'HIGH',
  reasons: [
    { priority: 'SAFETY', signal: 'TSB', message: 'TSB below -40', evidence: 'TSB=-42' },
  ],
  alternatives: [],
};

describe('DailyDecisionHeroCard', () => {
  it('renders RIDE decision correctly', () => {
    renderWithTheme(
      <DailyDecisionHeroCard decision={mockRideDecision} isLoading={false} />,
    );

    expect(screen.getByText('Decyzja na dziś')).toBeDefined();
    expect(screen.getByText('Jedź!')).toBeDefined();
    expect(screen.getByText('90min ENDURANCE ride')).toBeDefined();
  });

  it('renders SKIP decision correctly', () => {
    renderWithTheme(
      <DailyDecisionHeroCard decision={mockSkipDecision} isLoading={false} />,
    );

    expect(screen.getByText('Odpoczynek')).toBeDefined();
    expect(screen.queryByText('Rozpocznij trening')).toBeNull();
  });

  it('shows loading state', () => {
    renderWithTheme(
      <DailyDecisionHeroCard decision={undefined} isLoading={true} />,
    );

    expect(screen.getByText('Analizuję dane...')).toBeDefined();
  });

  it('shows empty state when no decision', () => {
    renderWithTheme(
      <DailyDecisionHeroCard decision={undefined} isLoading={false} />,
    );

    expect(screen.getByText('Brak danych decyzyjnych')).toBeDefined();
  });

  it('displays confidence and risk badges', () => {
    renderWithTheme(
      <DailyDecisionHeroCard decision={mockRideDecision} isLoading={false} />,
    );

    expect(screen.getByText('Pewność: 85%')).toBeDefined();
    expect(screen.getByText('Ryzyko: LOW')).toBeDefined();
  });

  it('calls onStartWorkout when start button is clicked', () => {
    const onStart = vi.fn();
    renderWithTheme(
      <DailyDecisionHeroCard decision={mockRideDecision} isLoading={false} onStartWorkout={onStart} />,
    );

    fireEvent.click(screen.getByText('Rozpocznij trening'));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('calls onSkip when skip button is clicked', () => {
    const onSkip = vi.fn();
    renderWithTheme(
      <DailyDecisionHeroCard decision={mockRideDecision} isLoading={false} onSkip={onSkip} />,
    );

    fireEvent.click(screen.getByText('Pomiń / Przełóż'));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('does not show start button for SKIP decision', () => {
    const onStart = vi.fn();
    renderWithTheme(
      <DailyDecisionHeroCard decision={mockSkipDecision} isLoading={false} onStartWorkout={onStart} />,
    );

    expect(screen.queryByText('Rozpocznij trening')).toBeNull();
  });
});

describe('AlternativesPanel', () => {
  it('renders alternatives count', () => {
    renderWithTheme(
      <AlternativesPanel alternatives={mockRideDecision.alternatives} />,
    );

    expect(screen.getByText('Alternatywy (3)')).toBeDefined();
  });

  it('expands to show alternatives on click', () => {
    renderWithTheme(
      <AlternativesPanel alternatives={mockRideDecision.alternatives} />,
    );

    const header = screen.getByText('Alternatywy (3)');
    fireEvent.click(header);

    expect(screen.getByText('Shorter version')).toBeDefined();
    expect(screen.getByText('Easier version')).toBeDefined();
    expect(screen.getByText('Indoor version')).toBeDefined();
  });

  it('renders nothing when alternatives empty', () => {
    const { container } = renderWithTheme(
      <AlternativesPanel alternatives={[]} />,
    );

    expect(container.innerHTML.trim()).toBe('');
  });

  it('calls onSelect when choose button is clicked', () => {
    const onSelect = vi.fn();
    renderWithTheme(
      <AlternativesPanel alternatives={mockRideDecision.alternatives} onSelect={onSelect} />,
    );

    const header = screen.getByText('Alternatywy (3)');
    fireEvent.click(header);

    const buttons = screen.getAllByText('Wybierz tę opcję');
    fireEvent.click(buttons[0]!);
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});

describe('ReasoningPanel', () => {
  const reasons: DecisionReason[] = mockRideDecision.reasons;

  it('renders reasoning header', () => {
    renderWithTheme(<ReasoningPanel reasons={reasons} />);

    expect(screen.getByText('Dlaczego ta decyzja?')).toBeDefined();
  });

  it('expands to show reasons on click', () => {
    renderWithTheme(<ReasoningPanel reasons={reasons} />);

    const header = screen.getByText('Dlaczego ta decyzja?');
    fireEvent.click(header);

    expect(screen.getByText('Good TSB')).toBeDefined();
    expect(screen.getByText('Planned workout')).toBeDefined();
  });

  it('renders nothing when reasons empty', () => {
    const { container } = renderWithTheme(<ReasoningPanel reasons={[]} />);

    expect(container.innerHTML.trim()).toBe('');
  });

  it('shows priority chips for each reason', () => {
    renderWithTheme(<ReasoningPanel reasons={reasons} />);

    const header = screen.getByText('Dlaczego ta decyzja?');
    fireEvent.click(header);

    expect(screen.getAllByText('SAFETY').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PLAN').length).toBeGreaterThan(0);
  });
});
