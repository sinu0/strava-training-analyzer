import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from '@/features/settings/SettingsPage';
import theme from '@/theme/theme';
import type { AiModuleStatus } from '@/types/ai';

const mutateConnect = vi.fn();
const mutateSyncRecent = vi.fn();
const mutateSyncPhotos = vi.fn();
const mutateUpdateProfile = vi.fn();
const mutateAiSettings = vi.fn();
let syncRecentState: { isPending: boolean; isError: boolean; error: unknown };
let mockProfileConnected = true;
let mockAiStatus: AiModuleStatus = {
  enabled: false,
  batchEnabled: true,
  batchCron: '0 0 3 * * *',
  activeProvider: 'ollama',
  activeModel: 'qwen3.6:27b',
  modelAvailable: false,
  providerStatus: 'DISABLED',
  knowledgeStatus: 'DISABLED',
  knowledgeDocuments: 0,
  knowledgeCorpusVersion: null,
  noteQueueStatus: 'DISABLED',
  noteQueueSuspendedUntil: null,
  availableProviders: [],
  availablePredictionTypes: [],
};
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
  mutateUpdateProfile.mockReset();
  mutateAiSettings.mockReset();
  syncRecentState = { isPending: false, isError: false, error: null };
  mockProfileConnected = true;
  mockAiStatus = {
    enabled: false,
    batchEnabled: true,
    batchCron: '0 0 3 * * *',
    activeProvider: 'ollama',
    activeModel: 'qwen3.6:27b',
    modelAvailable: false,
    providerStatus: 'DISABLED',
    knowledgeStatus: 'DISABLED',
    knowledgeDocuments: 0,
    knowledgeCorpusVersion: null,
    noteQueueStatus: 'DISABLED',
    noteQueueSuspendedUntil: null,
    availableProviders: [],
    availablePredictionTypes: [],
  };
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
  useAiSettings: () => ({
    data: {
      language: 'pl',
      availableLanguages: ['pl', 'en'],
      coachingStyle: 'BALANCED_ADVISOR',
      availableCoachingStyles: ['BALANCED_ADVISOR', 'CONSERVATIVE_SCIENTIST', 'AGGRESSIVE_COACH'],
    },
    isLoading: false,
    isError: false,
  }),
  useUpdateAiSettings: () => ({ mutate: mutateAiSettings, isPending: false, isError: false }),
  useAiStatus: () => ({
    data: mockAiStatus,
    isLoading: false,
  }),
  useAiValidationReport: () => ({
    data: {
      status: 'UNAVAILABLE',
      validSamples: 0,
      rejectedSamples: 0,
      minimumSamples: 20,
      meanAccuracy: null,
      meanConfidence: null,
      calibrationGap: null,
      samplesByType: {},
      provenance: 'POST_PREDICTION_VERIFICATION',
      generatedAt: '2026-09-09T10:00:00Z',
    },
  }),
  useRunAiBatch: () => ({ mutate: vi.fn(), isPending: false }),
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
  useAutoSyncConfig: () => ({ data: { intervalMinutes: 30 }, isLoading: false }),
  useUpdateAutoSyncConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateProfile: () => ({ mutate: mutateUpdateProfile, isPending: false, isError: false }),
}));

vi.mock('@/hooks/useUiPreferences', () => ({
  useUiPreferences: () => ({ data: undefined, isError: true }),
  useSaveUiPreferences: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/components/admin/EquipmentSection', () => ({ default: () => <div>equipment-section</div> }));

function renderSettings(tab?: string) {
  return renderWithProviders(<SettingsPage />, tab ? `/settings?tab=${tab}` : '/settings');
}

function renderWithProviders(ui: React.ReactElement, path = '/settings') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('SettingsPage', () => {
  it('opens on the general tab and switches sections from the navigation', async () => {
    renderSettings();

    expect(screen.getByRole('tab', { name: 'Ogólne' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Język / Language' })).toBeDefined();

    fireEvent.click(screen.getByRole('tab', { name: 'Integracje' }));

    await waitFor(() => expect(screen.getByText('Konto Strava:')).toBeDefined());
    expect(screen.getByRole('tab', { name: 'Integracje' }).getAttribute('aria-selected')).toBe('true');
  });

  it('falls back to the general tab for an unknown tab id', () => {
    renderSettings('nope');

    expect(screen.getByRole('tab', { name: 'Ogólne' }).getAttribute('aria-selected')).toBe('true');
  });

  it('renders connected Strava account status', () => {
    renderSettings('integrations');

    expect(screen.getByText('Połączone')).toBeDefined();
    expect(screen.getByText('Konto Strava:')).toBeDefined();
  });

  it('renders disconnected Strava account status', () => {
    mockProfileConnected = false;

    renderSettings('integrations');

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

    renderSettings('integrations');

    expect((screen.getByRole('button', { name: 'Połącz ze Stravą' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('starts Strava OAuth from the admin panel', () => {
    mutateConnect.mockImplementation((_variables: unknown, options?: { onSuccess?: (data: { url: string }) => void }) => {
      options?.onSuccess?.({ url: 'https://www.strava.com/oauth/authorize?client_id=12345' });
    });

    renderSettings('integrations');

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

    renderSettings('sync');

    expect(screen.getByText('No athlete profile found. Connect Strava first.')).toBeDefined();
  });

  it('starts photo backfill from the admin panel', () => {
    renderSettings('sync');

    fireEvent.click(screen.getByRole('button', { name: /Pobierz zdjęcia/i }));

    expect(mutateSyncPhotos).toHaveBeenCalled();
  });

  it('explains unavailable AI capabilities and blocks batch actions', () => {
    renderSettings('ai');

    expect(screen.getByText('AI wyłączone')).toBeDefined();
    expect(screen.getByText('Baza wiedzy: wyłączona')).toBeDefined();
    expect(screen.getByText('Walidacja zaleceń: brak danych')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Generuj wszystkie predykcje' }) as HTMLButtonElement).disabled)
      .toBe(true);
    expect((screen.getByRole('button', { name: 'Generuj brakujące (pomiń dzisiejsze)' }) as HTMLButtonElement).disabled)
      .toBe(true);
  });

  it('shows the active knowledge corpus version when RAG is ready', () => {
    mockAiStatus = {
      ...mockAiStatus,
      enabled: true,
      knowledgeStatus: 'AVAILABLE',
      knowledgeDocuments: 27,
      knowledgeCorpusVersion: '0123456789abcdef',
    };

    renderSettings('ai');

    expect(screen.getByText('Baza wiedzy: gotowa (27, v 01234567)')).toBeDefined();
  });

  it('saves the AI coaching style', () => {
    renderSettings('ai');

    fireEvent.click(screen.getByRole('button', { name: 'Ostrożny naukowiec' }));

    expect(mutateAiSettings).toHaveBeenCalledWith({ coachingStyle: 'CONSERVATIVE_SCIENTIST' });
  });

  it('edits athlete thresholds including resting heart rate', () => {
    renderSettings('athlete');

    fireEvent.change(screen.getByLabelText('FTP (W)'), { target: { value: '295' } });
    fireEvent.change(screen.getByLabelText('Tętno spoczynkowe (bpm)'), { target: { value: '48' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz profil' }));

    expect(mutateUpdateProfile).toHaveBeenCalledWith({ ftpWatts: 295, restingHrBpm: 48 }, expect.anything());
  });

  it('blocks saving an out-of-range threshold', () => {
    renderSettings('athlete');

    fireEvent.change(screen.getByLabelText('HRmax (bpm)'), { target: { value: '300' } });

    expect(screen.getByText('Poza zakresem 120–250')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Zapisz profil' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('groups rebuild actions under data maintenance', () => {
    renderSettings('maintenance');

    expect(screen.getByRole('button', { name: 'Przebuduj heatmapę' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Odbuduj historię FTP' })).toBeDefined();
  });
});
