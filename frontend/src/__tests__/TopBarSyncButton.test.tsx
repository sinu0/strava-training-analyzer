import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from '@/api/client';
import TopBarSyncButton from '@/components/layout/TopBarSyncButton';
import theme from '@/theme/theme';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);

function renderButton(onSyncComplete = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <TopBarSyncButton onSyncComplete={onSyncComplete} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { onSyncComplete };
}

describe('TopBarSyncButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockImplementation(async (url) => {
      if (url === '/sync/strava/check') {
        return { data: { hasNew: true, count: 1 } };
      }
      if (url === '/v2/jobs/job-1') {
        return { data: { id: 'job-1', status: 'COMPLETED', stage: 'COMPLETE' } };
      }
      throw new Error(`Unexpected GET ${url}`);
    });
    mockedPost.mockResolvedValue({
      data: { id: 'job-1', status: 'QUEUED', stage: 'FETCH_SUMMARY' },
    });
  });

  it('starts an observable background import and completes after polling the job', async () => {
    const { onSyncComplete } = renderButton();

    fireEvent.click(await screen.findByRole('button', { name: 'Synchronizuj ostatnie treningi' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/v2/import-jobs', { mode: 'RECENT' }));
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/v2/jobs/job-1'));
    await waitFor(() => expect(onSyncComplete).toHaveBeenCalledTimes(1));
    expect(mockedPost).not.toHaveBeenCalledWith('/sync/strava/recent');
  });
});
