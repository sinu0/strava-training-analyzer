import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from '@/api/client';
import AiLanguageSettings from '@/components/settings/AiLanguageSettings';
import { I18nProvider } from '@/i18n';
import theme from '@/theme/theme';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPut = vi.mocked(apiClient.put);

function renderSettings() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <I18nProvider>
          <AiLanguageSettings />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('AiLanguageSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockedGet.mockResolvedValue({ data: { language: 'pl', availableLanguages: ['pl', 'en'] } });
  });

  it('shows the saved AI language and saves a new choice', async () => {
    mockedPut.mockResolvedValue({ data: { language: 'en', availableLanguages: ['pl', 'en'] } });
    renderSettings();

    expect(screen.getByRole('heading', { name: 'Język AI' })).toBeDefined();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Polski' }).getAttribute('aria-pressed')).toBe('true'));
    expect(mockedGet).toHaveBeenCalledWith('/v2/ai/settings');

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    await waitFor(() => expect(mockedPut).toHaveBeenCalledWith('/v2/ai/settings', { language: 'en' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true'));
  });

  it('reports a failed save', async () => {
    mockedPut.mockRejectedValue(new Error('boom'));
    renderSettings();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Polski' }).getAttribute('aria-pressed')).toBe('true'));

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(await screen.findByText('Nie udało się zapisać języka AI.')).toBeDefined();
  });
});
