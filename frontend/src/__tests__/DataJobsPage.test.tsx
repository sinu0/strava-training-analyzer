import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DataJobsPage from '@/features/data/DataJobsPage';
import theme from '@/theme/theme';

const createImport = vi.fn();
let processingJob: Record<string, unknown> | undefined;
let latestJob: Record<string, unknown> | undefined;

vi.mock('@/features/data/useDataJobs', () => ({
  useDataQualitySummary: () => ({
    data: {
      totalActivities: 10,
      assessedActivities: 10,
      available: 8,
      partial: 2,
      unknown: 0,
      unassessed: 0,
      measuredPowerActivities: 6,
      estimatedPowerActivities: 3,
      unknownPowerProvenanceActivities: 1,
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useProcessingJob: () => ({ data: processingJob }),
  useLatestProcessingJob: () => ({ data: latestJob }),
  useCreateImportJob: () => ({ mutate: createImport, isPending: false }),
  useCreateRecalculationJob: () => ({ mutate: vi.fn(), isPending: false }),
  useRetryJob: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('DataJobsPage', () => {
  beforeEach(() => {
    createImport.mockReset();
    processingJob = undefined;
    latestJob = undefined;
  });

  it('starts an observable power provenance backfill', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <DataJobsPage />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByText('Nieznane źródło mocy')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Uzupełnij źródło mocy' }));

    expect(createImport).toHaveBeenCalledWith('POWER_PROVENANCE', expect.any(Object));
  });

  it('shows and protects an import waiting for automatic rate-limit retry', () => {
    latestJob = {
      id: 'job-1',
      jobType: 'IMPORT',
      mode: 'POWER_PROVENANCE',
      stage: 'REFRESH_PROVENANCE',
      status: 'RETRYABLE',
      attempt: 1,
      retryAt: new Date(Date.now() + 60_000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <DataJobsPage />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByText(/Zadanie wznowi się automatycznie/)).toBeDefined();
    expect((screen.getByRole('button', { name: 'Wznów od niezakończonego etapu' }) as HTMLButtonElement).disabled)
      .toBe(true);
    expect((screen.getByRole('button', { name: 'Uzupełnij źródło mocy' }) as HTMLButtonElement).disabled)
      .toBe(true);
  });

  it('restores the latest observable job after a page reload', () => {
    latestJob = {
      id: 'job-restored',
      jobType: 'IMPORT',
      mode: 'POWER_PROVENANCE',
      stage: 'REFRESH_PROVENANCE',
      status: 'RETRYABLE',
      attempt: 2,
      retryAt: new Date(Date.now() + 60_000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <DataJobsPage />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByText(/Zadanie wznowi się automatycznie/)).toBeDefined();
    expect(screen.getByText(/próba 2/i)).toBeDefined();
  });
});
