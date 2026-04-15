import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeAll } from 'vitest';

import AppLayout from '../components/layout/AppLayout';
import theme from '../theme/theme';

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('../components/layout/Sidebar', () => ({
  default: () => <div>Sidebar</div>,
}));

vi.mock('../components/layout/TopBar', () => ({
  default: () => <div>TopBar</div>,
}));

vi.mock('../hooks/useAnalytics', () => ({
  useReadiness: () => ({ data: null }),
  useFtpProgress: () => ({ data: null }),
  useProfile: () => ({ data: null }),
  useWeatherLocations: () => ({ data: [] }),
  useWeatherGradient: () => ({ data: null }),
}));

function renderWithProviders(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('AppLayout', () => {
  it('shows Strava connected toast after OAuth redirect', () => {
    renderWithProviders('/?strava=connected');

    expect(screen.getByText('Konto Strava zostało połączone. Możesz teraz uruchomić synchronizację aktywności.')).toBeDefined();
  });

  it('closes Strava connected toast', async () => {
    renderWithProviders('/?strava=connected');

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitForElementToBeRemoved(() =>
      screen.queryByText('Konto Strava zostało połączone. Możesz teraz uruchomić synchronizację aktywności.'),
    );
  });
});