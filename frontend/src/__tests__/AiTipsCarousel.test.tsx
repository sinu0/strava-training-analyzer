import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';

import AiTipsCarousel from '../components/AiTipsCarousel';
import theme from '../theme/theme';

import type { AiModuleStatus, PredictionResponse } from '../types/ai';

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const makeTip = (overrides: Partial<PredictionResponse> = {}): PredictionResponse => ({
  id: '1',
  predictionType: 'TRAINING_TYPE_RECOMMENDATION',
  modelId: 'qwen2.5:7b',
  providerName: 'ollama',
  summary: 'Go for a 90-min Z2 endurance ride today',
  detail: 'Your TSB is fresh and CTL is building.',
  structuredData: {
    summary: 'Go for a 90-min Z2 endurance ride today',
    insight: 'Your TSB is fresh and CTL is building nicely.',
    action: 'Endurance ride 80-100min at 200-230W (Z2)',
    metrics: { CTL: '45', ATL: '37', TSB: '+8' },
    warnings: [],
    confidence: 0.85,
    reasoning: 'Reasoning here',
  },
  confidence: 0.85,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const makeStatus = (overrides: Partial<AiModuleStatus> = {}): AiModuleStatus => ({
  enabled: true,
  batchEnabled: true,
  batchCron: '0 0 3 * * *',
  todayTipsReady: false,
  activeProvider: 'ollama',
  activeModel: 'qwen2.5:7b',
  modelAvailable: true,
  availableProviders: ['ollama'],
  availablePredictionTypes: ['TRAINING_TYPE_RECOMMENDATION'],
  ...overrides,
});

describe('AiTipsCarousel', () => {
  it('shows empty state when no tips', () => {
    renderWithTheme(<AiTipsCarousel tips={[]} loading={false} />);
    expect(screen.getByText(/brak/i)).toBeDefined();
  });

  it('explains when nightly batch is disabled', () => {
    renderWithTheme(<AiTipsCarousel tips={[]} loading={false} status={makeStatus({ batchEnabled: false })} />);
    expect(screen.getByText(/batch rekomendacji jest wyłączony/i)).toBeDefined();
  });

  it('shows scheduler-based fallback copy when waiting for overnight tips', () => {
    renderWithTheme(<AiTipsCarousel tips={[]} loading={false} status={makeStatus()} />);
    expect(screen.getByText(/batch działa o 03:00/i)).toBeDefined();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = renderWithTheme(<AiTipsCarousel tips={[]} loading={true} />);
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull();
  });

  it('renders single tip without navigation buttons', () => {
    renderWithTheme(<AiTipsCarousel tips={[makeTip()]} loading={false} />);
    expect(screen.queryByRole('button', { name: /poprzedni/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /następny/i })).toBeNull();
  });

  it('renders summary from structuredData', () => {
    renderWithTheme(<AiTipsCarousel tips={[makeTip()]} loading={false} />);
    expect(screen.getByText('Go for a 90-min Z2 endurance ride today')).toBeDefined();
  });

  it('renders insight from structuredData', () => {
    renderWithTheme(<AiTipsCarousel tips={[makeTip()]} loading={false} />);
    expect(screen.getByText(/TSB is fresh/i)).toBeDefined();
  });

  it('renders action from structuredData', () => {
    renderWithTheme(<AiTipsCarousel tips={[makeTip()]} loading={false} />);
    expect(screen.getAllByText(/Endurance ride/i).length).toBeGreaterThan(0);
  });

  it('shows multiple slides counter for multiple tips', () => {
    const tips = [
      makeTip({ id: '1', predictionType: 'TRAINING_TYPE_RECOMMENDATION' }),
      makeTip({ id: '2', predictionType: 'FATIGUE_PREDICTION', summary: 'Fatigue tip' }),
      makeTip({ id: '3', predictionType: 'OVERTRAINING_RISK', summary: 'Overtraining tip' }),
    ];
    renderWithTheme(<AiTipsCarousel tips={tips} loading={false} />);
    expect(screen.getByText(/1\s*\/\s*3/)).toBeDefined();
  });

  it('navigates to next tip on next button click', () => {
    const tips = [
      makeTip({ id: '1', predictionType: 'TRAINING_TYPE_RECOMMENDATION', summary: 'First tip',
        structuredData: { summary: 'First tip', insight: 'A', action: 'B', metrics: {}, warnings: [], confidence: 0.8, reasoning: '' } }),
      makeTip({ id: '2', predictionType: 'FATIGUE_PREDICTION', summary: 'Second tip',
        structuredData: { summary: 'Second tip', insight: 'C', action: 'D', metrics: {}, warnings: [], confidence: 0.7, reasoning: '' } }),
    ];
    renderWithTheme(<AiTipsCarousel tips={tips} loading={false} />);

    expect(screen.getByText('First tip')).toBeDefined();

    const nextBtn = screen.getByRole('button', { name: /następny/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText('Second tip')).toBeDefined();
    expect(screen.getByText(/2\s*\/\s*2/)).toBeDefined();
  });

  it('navigates back to first tip on prev button click', () => {
    const tips = [
      makeTip({ id: '1', summary: 'First tip',
        structuredData: { summary: 'First tip', insight: 'A', action: 'B', metrics: {}, warnings: [], confidence: 0.8, reasoning: '' } }),
      makeTip({ id: '2', predictionType: 'FATIGUE_PREDICTION', summary: 'Second tip',
        structuredData: { summary: 'Second tip', insight: 'C', action: 'D', metrics: {}, warnings: [], confidence: 0.7, reasoning: '' } }),
    ];
    renderWithTheme(<AiTipsCarousel tips={tips} loading={false} />);

    fireEvent.click(screen.getByRole('button', { name: /następny/i }));
    expect(screen.getByText('Second tip')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /poprzedni/i }));
    expect(screen.getByText('First tip')).toBeDefined();
  });

  it('wraps around from last to first tip', () => {
    const tips = [
      makeTip({ id: '1', summary: 'First tip',
        structuredData: { summary: 'First tip', insight: 'A', action: 'B', metrics: {}, warnings: [], confidence: 0.8, reasoning: '' } }),
      makeTip({ id: '2', predictionType: 'FATIGUE_PREDICTION', summary: 'Second tip',
        structuredData: { summary: 'Second tip', insight: 'C', action: 'D', metrics: {}, warnings: [], confidence: 0.7, reasoning: '' } }),
    ];
    renderWithTheme(<AiTipsCarousel tips={tips} loading={false} />);

    fireEvent.click(screen.getByRole('button', { name: /następny/i }));
    fireEvent.click(screen.getByRole('button', { name: /następny/i }));

    expect(screen.getByText('First tip')).toBeDefined();
    expect(screen.getByText(/1\s*\/\s*2/)).toBeDefined();
  });

  it('shows confidence percentage', () => {
    renderWithTheme(<AiTipsCarousel tips={[makeTip()]} loading={false} />);
    expect(screen.getByText(/85%/)).toBeDefined();
  });

  it('shows metric chips from structuredData.metrics', () => {
    renderWithTheme(<AiTipsCarousel tips={[makeTip()]} loading={false} />);
    expect(screen.getAllByText(/CTL/).length).toBeGreaterThan(0);
  });

  it('dot indicator count matches tip count', () => {
    const tips = [
      makeTip({ id: '1' }),
      makeTip({ id: '2', predictionType: 'FATIGUE_PREDICTION' }),
      makeTip({ id: '3', predictionType: 'OVERTRAINING_RISK' }),
    ];
    const { container } = renderWithTheme(<AiTipsCarousel tips={tips} loading={false} />);
    const dots = container.querySelectorAll('[data-tip-dot]');
    expect(dots.length).toBe(3);
  });

  it('clicking dot navigates to that tip', () => {
    const tips = [
      makeTip({ id: '1', summary: 'First tip',
        structuredData: { summary: 'First tip', insight: 'A', action: 'B', metrics: {}, warnings: [], confidence: 0.8, reasoning: '' } }),
      makeTip({ id: '2', predictionType: 'FATIGUE_PREDICTION', summary: 'Second tip',
        structuredData: { summary: 'Second tip', insight: 'C', action: 'D', metrics: {}, warnings: [], confidence: 0.7, reasoning: '' } }),
      makeTip({ id: '3', predictionType: 'OVERTRAINING_RISK', summary: 'Third tip',
        structuredData: { summary: 'Third tip', insight: 'E', action: 'F', metrics: {}, warnings: [], confidence: 0.6, reasoning: '' } }),
    ];
    const { container } = renderWithTheme(<AiTipsCarousel tips={tips} loading={false} />);

    const dots = container.querySelectorAll('[data-tip-dot]');
    fireEvent.click(dots[2] as Element);

    expect(screen.getByText('Third tip')).toBeDefined();
  });
});
