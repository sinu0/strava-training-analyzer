import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import AchievementsSection from '../components/profile/AchievementsSection';
import theme from '../theme/theme';

vi.mock('../hooks/useGamification', () => ({
  useAchievements: () => ({
    data: [
      {
        id: 'weekly-100km',
        name: 'Setka w tygodniu',
        description: 'Przejechaj 100 km w jednym tygodniu',
        icon: '🏅',
        type: 'DISTANCE',
        unlocked: false,
      },
      {
        id: 'ftp-200',
        name: 'FTP 200 W',
        description: 'Osiągnij FTP na poziomie 200 W',
        icon: '💪',
        type: 'FTP',
        unlocked: true,
        unlockedAt: '2024-06-01',
      },
    ],
    isLoading: false,
  }),
  useEvaluateAchievements: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={theme}>
        <AchievementsSection />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('AchievementsSection', () => {
  it('renders locked achievement with reduced opacity indicator', () => {
    renderSection();
    const badge = screen.getByTestId('achievement-badge-weekly-100km');
    expect(badge).toBeDefined();
    expect(badge.getAttribute('data-unlocked')).toBe('false');
    expect(screen.getByText('Setka w tygodniu')).toBeDefined();
  });

  it('renders unlocked achievement with full display including date', () => {
    renderSection();
    const badge = screen.getByTestId('achievement-badge-ftp-200');
    expect(badge).toBeDefined();
    expect(badge.getAttribute('data-unlocked')).toBe('true');
    expect(screen.getByText('FTP 200 W')).toBeDefined();
    expect(screen.getByText('2024-06-01')).toBeDefined();
  });

  it('shows achievement name and type label', () => {
    renderSection();
    expect(screen.getByText('Setka w tygodniu')).toBeDefined();
    expect(screen.getByText('FTP 200 W')).toBeDefined();
    expect(screen.getByText('Dystans')).toBeDefined();
    expect(screen.getByText('FTP')).toBeDefined();
  });

  it('renders the evaluate button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: 'Sprawdź osiągnięcia' })).toBeDefined();
  });
});
