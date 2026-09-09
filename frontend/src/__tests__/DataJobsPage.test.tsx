import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DataJobsPage from '@/features/data/DataJobsPage';
import theme from '@/theme/theme';

const createImport = vi.fn();

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
  useProcessingJob: () => ({ data: undefined }),
  useCreateImportJob: () => ({ mutate: createImport, isPending: false }),
  useCreateRecalculationJob: () => ({ mutate: vi.fn(), isPending: false }),
  useRetryJob: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('DataJobsPage', () => {
  beforeEach(() => createImport.mockReset());

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
});
