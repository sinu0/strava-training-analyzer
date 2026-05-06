import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminPage from '@/pages/AdminPage';
import theme from '@/theme/theme';

const mutateConnect = vi.fn();
const mutateSyncRecent = vi.fn();
const mutateSyncPhotos = vi.fn();
let syncRecentState: { isPending: boolean; isError: boolean; error: unknown };
let mockProfileConnected = true;
let mockStravaConfig = {
  clientId: '12345',
  clientIdSource: 'env',
  hasClientSecret: true,
  clientSecretSource: 'env',
  hasWebhookToken: true,
  webhookTokenSource: 'env',
};

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  mutateConnect.mockReset();
  mutateSyncRecent.mockReset();
  mutateSyncPhotos.mockReset();
  syncRecentState = { isPending: false, isError: false, error: null };
  mockProfileConnected = true;
  mockStravaConfig = {
    clientId: '12345',
    clientIdSource: 'env',
    hasClientSecret: true,
    clientSecretSource: 'env',
    hasWebhookToken: true,
    webhookTokenSource: 'env',
  };
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      assign: vi.fn(),
    },
  });
});

vi.mock('@/hooks/useAi', () => ({
  useAiStatus: () => ({
    data: {
      enabled: false,
      activeProvider: null,
      activeModel: null,
      modelAvailable: false,
      availableProviders: [],
      availablePredictionTypes: [],
    },
    isLoading: false,
  }),
  useRunAiBatch: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useGarmin', () => ({
  useGarminStatus: () => ({
    data: { connected: false, lastSyncAt: null, email: null, lastError: null },
    isLoading: false,
  }),
  useGarminBridgeStatus: () => ({
    data: {
      online: false,
      busy: false,
      sessionReady: false,
      requiresInteraction: false,
      lastSyncAt: null,
      lastError: null,
    },
    isLoading: false,
  }),
  useGarminHealth: () => ({ data: null, isLoading: false }),
  useSaveGarminCredentials: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteGarminCredentials: () => ({ mutate: vi.fn(), isPending: false }),
  useGarminSync: () => ({ mutate: vi.fn(), isPending: false, data: null }),
  useGarminBridgeSync: () => ({ mutate: vi.fn(), isPending: false, data: null, isError: false, error: null }),
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useSyncStatus: () => ({
    data: { status: 'idle', timestamp: null, imported: 0, skipped: 0 },
    isLoading: false,
  }),
  useSyncFull: () => ({ mutate: vi.fn(), isPending: false }),
  useSyncRecent: () => ({ mutate: mutateSyncRecent, ...syncRecentState }),
  useSyncActivityPhotos: () => ({
    mutate: mutateSyncPhotos,
    isPending: false,
    isError: false,
    error: null,
  }),
  useClearSyncData: () => ({ mutate: vi.fn(), isPending: false }),
  useRecalculateMetrics: () => ({ mutate: vi.fn(), isPending: false }),
  useRecalculateAllActivityMetrics: () => ({ mutate: vi.fn(), isPending: false }),
  useRecalculateAllTrainingEffects: () => ({ mutate: vi.fn(), isPending: false, data: undefined, error: null }),
  useResyncStreams: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useWeatherLocations: () => ({ data: [], isLoading: false }),
  useRefreshAllWeatherCache: () => ({ mutate: vi.fn(), isPending: false }),
  useRefreshWeatherCache: () => ({ mutate: vi.fn(), isPending: false }),
  useProfile: () => ({
    data: {
      id: 'profile-1',
      name: 'Jan Testowy',
      email: 'jan@test.pl',
      ftpWatts: 280,
      lthrBpm: null,
      maxHrBpm: null,
      restingHrBpm: null,
      weightKg: 74.2,
      dateOfBirth: null,
      stravaConnected: mockProfileConnected,
      stravaAthleteId: 12345,
      currentZones: [],
      createdAt: '2026-03-27T20:00:00Z',
      updatedAt: '2026-03-27T20:00:00Z',
    },
    isLoading: false,
  }),
  useStravaConfig: () => ({
    data: mockStravaConfig,
    isLoading: false,
  }),
  useStravaConnect: () => ({ mutate: mutateConnect, isPending: false }),
  useUpdateStravaConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useResetStravaConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useWeatherJobStatus: () => ({
    data: {
      status: 'idle',
      lastRunAt: null,
      locationsProcessed: 0,
      locationsFailed: 0,
      errorMessage: null,
    },
  }),
  useRebuildHeatmap: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false }),
  useRebuildFtpHistory: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('AdminPage', () => {
  it('renders connected Strava account status', () => {
    renderWithProviders(<AdminPage />);

    expect(screen.getByText('Integracje')).toBeDefined();
    expect(screen.getByText('Sync i dane')).toBeDefined();
    expect(screen.getByText('Przetwarzanie')).toBeDefined();
    expect(screen.getByText('Połączone')).toBeDefined();
    expect(screen.getByText('Konto Strava:')).toBeDefined();
  });

  it('renders disconnected Strava account status', () => {
    mockProfileConnected = false;

    renderWithProviders(<AdminPage />);

    expect(screen.getByText('Niepołączone')).toBeDefined();
  });

  it('disables connect button when Strava credentials are incomplete', () => {
    mockStravaConfig = {
      clientId: '12345',
      clientIdSource: 'env',
      hasClientSecret: false,
      clientSecretSource: 'env',
      hasWebhookToken: true,
      webhookTokenSource: 'env',
    };

    renderWithProviders(<AdminPage />);

    expect((screen.getByRole('button', { name: 'Połącz ze Stravą' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('starts Strava OAuth from the admin panel', () => {
    mutateConnect.mockImplementation((_variables: unknown, options?: { onSuccess?: (data: { url: string }) => void }) => {
      options?.onSuccess?.({ url: 'https://www.strava.com/oauth/authorize?client_id=12345' });
    });

    renderWithProviders(<AdminPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Połącz ze Stravą' }));

    expect(mutateConnect).toHaveBeenCalled();
    expect(window.location.assign).toHaveBeenCalledWith('https://www.strava.com/oauth/authorize?client_id=12345');
  });

  it('shows backend sync error details when sync fails', () => {
    syncRecentState = {
      isPending: false,
      isError: true,
      error: new AxiosError('Request failed', '500', undefined, undefined, {
        data: { message: 'No athlete profile found. Connect Strava first.' },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: { headers: {} as never },
      } as never),
    };

    renderWithProviders(<AdminPage />);

    expect(screen.getByText('No athlete profile found. Connect Strava first.')).toBeDefined();
  });

  it('starts photo backfill from the admin panel', () => {
    renderWithProviders(<AdminPage />);

    fireEvent.click(screen.getByRole('button', { name: /Pobierz zdjęcia/i }));

    expect(mutateSyncPhotos).toHaveBeenCalled();
  });
});
