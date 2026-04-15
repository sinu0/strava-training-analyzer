import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import ProfilePage from '../pages/ProfilePage';
import theme from '../theme/theme';

vi.mock('../hooks/useAnalytics', () => ({
  useProfile: () => ({ data: { id: 'ath1', name: 'Test User', ftpWatts: 260, weightKg: 70, createdAt: '2020-01-01', stravaConnected: true } }),
  useRecentActivities: () => ({ data: [{ id: 'a1', name: 'Morning Ride', startedAt: '2025-06-01', photoUrls: ['http://example.com/p1.jpg'] }] }),
  useFtpProgress: () => ({ data: { currentFtp: 260, trend: 'up', changePercent: 5.0, history: [] } }),
  useWeeklySummaries: () => ({ data: [] }),
  useReadiness: () => ({ data: { score: 72, level: 'good', tsb: 5, ctl: 55, atl: 50, description: 'Dobra forma' } }),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('ProfilePage', () => {
  it('renders profile header and gallery', () => {
    renderPage();
    expect(screen.getByText('Test User')).toBeDefined();
    expect(screen.getByText('Podsumowanie treningowe')).toBeDefined();
    expect(screen.getByText('Galeria zdjęć')).toBeDefined();
    expect(screen.getByAltText('Morning Ride')).toBeDefined();
  });
});
