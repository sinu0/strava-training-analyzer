import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
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

vi.mock('../components/layout/TopBarSyncButton', () => ({
  default: () => <div>Sync button</div>,
}));

vi.mock('../hooks/useAnalytics', () => ({
  useReadiness: () => ({ data: null }),
  useBlockHealth: () => ({ data: null }),
  useFtpProgress: () => ({ data: null }),
  useProfile: () => ({ data: null }),
  useWeatherLocations: () => ({ data: [] }),
  useWeatherGradient: () => ({ data: null }),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-probe">{location.pathname}{location.search}</output>;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderWithProviders(initialEntry: string) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
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

async function renderRealTopBar(initialEntry: string) {
  const { default: RealTopBar } = await vi.importActual<typeof import('../components/layout/TopBar')>(
    '../components/layout/TopBar',
  );

  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <RealTopBar onToggleSidebar={vi.fn()} />
          <LocationProbe />
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

describe('TopBar search pill', () => {
  it('renders the global search input', async () => {
    await renderRealTopBar('/');

    expect(screen.getByRole('textbox', { name: 'Szukaj aktywności lub metryk' })).toBeDefined();
  });

  it('navigates to activities with the search query on Enter', async () => {
    await renderRealTopBar('/');

    const input = screen.getByRole('textbox', { name: 'Szukaj aktywności lub metryk' });
    fireEvent.change(input, { target: { value: 'tempo ride' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('location-probe').textContent).toBe('/activities?q=tempo%20ride');
  });
});
