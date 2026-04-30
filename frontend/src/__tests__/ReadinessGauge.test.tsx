import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ReadinessGauge from '@/components/ReadinessGauge';

import theme from '../theme/theme';

function renderWithTheme(ui: Parameters<typeof render>[0]) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ReadinessGauge', () => {
  it('renders day type label and focus when available', () => {
    renderWithTheme(
      <ReadinessGauge
        data={{
          score: 38,
          level: 'zmęczenie',
          tsb: -18,
          ctl: 70,
          atl: 84,
          description: 'Umiarkowana gotowość, lżejszy trening lub aktywny odpoczynek.',
          dayType: 'ENDURANCE',
          dayLabel: 'Tlen',
          dayFocus: 'Najlepszy będzie spokojny trening tlenowy z kontrolą obciążenia.',
          sessionVariants: [
            {
              title: 'Krótki tlen',
              durationMinutes: 45,
              targetPower: '60-70% FTP',
              targetTss: 35,
              fuelingHint: '30-45 g węgli/h',
              recoveryHint: '20-30 g białka po treningu',
            },
          ],
          tomorrowHint: 'Jutro nadal spokojnie albo wejście w tempo, jeśli noga będzie świeża.',
          bestQualityWindowLabel: 'Jutro',
          qualityWindowSummary: 'Najlepsze okno jakości wypada jutro, jeśli dziś utrzymasz kontrolę.',
          qualityWindows: [
            {
              date: '2025-01-06',
              label: 'Dziś',
              score: 38,
              recommendation: 'CONTROLLED',
              focus: 'Trzymaj spokojny tlen.',
            },
            {
              date: '2025-01-07',
              label: 'Jutro',
              score: 52,
              recommendation: 'BEST_QUALITY',
              focus: 'Najlepsze okno na jakościowy bodziec.',
            },
          ],
          healthSignals: {
            sourceDate: '2025-01-06',
            sleepScore: 78,
            bodyBattery: 62,
            restingHrBpm: 51,
            restingHrDelta: -2,
            scoreAdjustment: 4,
          },
          checkIn: {
            date: '2025-01-06',
            sleepQuality: 4,
            legFreshness: 3,
            motivation: 5,
            soreness: 2,
            scoreAdjustment: 8,
            updatedAt: '2025-01-06T06:45:00Z',
          },
        }}
        onSaveCheckIn={vi.fn()}
      />,
    );

    expect(screen.getByText('Typ dnia')).toBeTruthy();
    expect(screen.getByText('Tlen')).toBeTruthy();
    expect(
      screen.getByText('Najlepszy będzie spokojny trening tlenowy z kontrolą obciążenia.'),
    ).toBeTruthy();
    expect(screen.getByText('Krótki tlen')).toBeTruthy();
    expect(screen.getByText('45 min')).toBeTruthy();
    expect(screen.getByText(/30-45 g węgli\/h/)).toBeTruthy();
    expect(screen.getByText(/20-30 g białka po treningu/)).toBeTruthy();
    expect(screen.getAllByText('Jutro').length).toBeGreaterThan(0);
    expect(screen.getByText('Okno jakości 72h')).toBeTruthy();
    expect(screen.getByText(/Najlepsze okno jakości wypada jutro/)).toBeTruthy();
    expect(screen.getByText('Najlepsze okno na jakościowy bodziec.')).toBeTruthy();
    expect(screen.getByText('Sygnały regeneracji')).toBeTruthy();
    expect(screen.getByText('Sen 78/100')).toBeTruthy();
    expect(screen.getByText('Poranny check-in')).toBeTruthy();
    expect(screen.getByText(/Ostatni wpływ \+8 pkt/)).toBeTruthy();
    expect(screen.getByText(/Ostatnia aktualizacja:/)).toBeTruthy();
  });

  it('submits updated morning check-in values', () => {
    const onSaveCheckIn = vi.fn();

    renderWithTheme(
      <ReadinessGauge
        data={{
          score: 61,
          level: 'dobra',
          tsb: -6,
          ctl: 68,
          atl: 74,
          description: 'Dobry dzień na kontrolowany bodziec.',
        }}
        onSaveCheckIn={onSaveCheckIn}
      />,
    );

    fireEvent.click(
      within((screen.getByText('Sen').closest('div') as HTMLElement).parentElement as HTMLElement).getByRole('button', {
        name: '5',
      }),
    );
    fireEvent.click(
      within(
        (screen.getByText('Świeżość nóg').closest('div') as HTMLElement).parentElement as HTMLElement,
      ).getByRole('button', { name: '4' }),
    );
    fireEvent.click(
      within((screen.getByText('Motywacja').closest('div') as HTMLElement).parentElement as HTMLElement).getByRole(
        'button',
        { name: '5' },
      ),
    );
    fireEvent.click(
      within((screen.getByText('Obolałość').closest('div') as HTMLElement).parentElement as HTMLElement).getByRole(
        'button',
        { name: '2' },
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz check-in' }));

    expect(onSaveCheckIn).toHaveBeenCalledWith({
      sleepQuality: 5,
      legFreshness: 4,
      motivation: 5,
      soreness: 2,
    });
  });
});
