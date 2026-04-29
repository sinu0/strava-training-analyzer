import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CoachSummaryPanel from '@/components/training/CoachSummaryPanel';

describe('CoachSummaryPanel', () => {
  it('renders coach summary details', () => {
    render(
      <CoachSummaryPanel
        prediction={{
          id: '1',
          predictionType: 'TRAINING_COACH_SUMMARY',
          modelId: 'model',
          providerName: 'provider',
          summary: 'Broń progu i pilnuj świeżości przed weekendem.',
          detail: 'detail',
          confidence: 0.82,
          createdAt: '2026-04-07T08:00:00Z',
          structuredData: {
            weekReview: 'Tydzień trzyma priorytet progowy.',
            blockReview: 'Blok nadal idzie w stronę budowy progu.',
            keyWins: ['Próg rośnie.'],
            keyRisks: ['Weekend może wymusić auto-swap.'],
            nextFocus: 'Obroń jeden mocny akcent progowy w 3-5 dni.',
          },
        }}
      />,
    );

    expect(screen.getByText('Coach AI')).toBeDefined();
    expect(screen.getByText('Tydzień trzyma priorytet progowy.')).toBeDefined();
    expect(screen.getByText('Blok nadal idzie w stronę budowy progu.')).toBeDefined();
    expect(screen.getByText('Próg rośnie.')).toBeDefined();
    expect(screen.getByText('Weekend może wymusić auto-swap.')).toBeDefined();
  });

  it('shows generate action when summary is missing', () => {
    const onGenerate = vi.fn();

    render(<CoachSummaryPanel prediction={null} onGenerate={onGenerate} />);

    expect(screen.getByText(/Brakuje świeżego podsumowania trenera AI/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Generuj' })).toBeDefined();
  });
});
