import { ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import theme from '@/theme/theme';
import type { WorkoutExecution } from '@/types/training';

import WorkoutPlayerPage from '../WorkoutPlayerPage';


const store = vi.hoisted(() => ({
  load: vi.fn(), save: vi.fn(), clear: vi.fn(), lock: vi.fn(),
}));
const api = vi.hoisted(() => ({
  active: vi.fn(), get: vi.fn(), send: vi.fn(), flush: vi.fn(),
}));

vi.mock('../offlineStore', () => ({
  loadActiveExecution: store.load,
  saveActiveExecution: store.save,
  clearActiveExecution: store.clear,
  acquireExecutionLock: store.lock,
}));
vi.mock('../workoutApi', () => ({
  getActiveExecution: api.active,
  getExecution: api.get,
  sendExecutionMutation: api.send,
  flushWorkoutQueue: api.flush,
}));

function execution(status: WorkoutExecution['status'] = 'RUNNING'): WorkoutExecution {
  const start = Date.now();
  return {
    id: 'execution-1', scheduledWorkoutId: 'plan-1', workoutNameSnapshot: 'Próg 2 x 10',
    stepsSnapshot: [
      { type: 'steady', name: 'Próg', durationSec: 600, powerPctFtpLow: 95, powerPctFtpHigh: 100 },
      { type: 'freeRide', name: 'Swobodnie', durationType: 'LAP_BUTTON' },
    ],
    ftpWatts: 280, lthrBpm: null, maxHrBpm: null, restingHrBpm: null,
    startedAt: new Date(start).toISOString(), finishedAt: status === 'COMPLETED' ? new Date(start).toISOString() : null,
    status, currentStepIndex: 0, workoutElapsedMs: 20_000, stepElapsedMs: 20_000,
    runningSince: status === 'RUNNING' ? new Date(start).toISOString() : null,
    intensityAdjustmentPct: 0, skippedStepIndexes: [], repeatedStepIndexes: [],
    rpe: null, feeling: null, notes: null, activityId: null, activityMatchStatus: 'PENDING',
    complianceStatus: 'UNKNOWN', complianceScore: null, complianceAlgorithmVersion: 'v1',
    deliveryMethod: 'ON_DEVICE', stateVersion: 1, updatedAt: new Date(start).toISOString(),
  };
}

function renderPlayer() {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/workout/execution-1']}>
        <Routes><Route path="/workout/:executionId" element={<WorkoutPlayerPage />} /></Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('WorkoutPlayerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.lock.mockReturnValue(() => undefined);
    store.save.mockResolvedValue(undefined);
    store.clear.mockResolvedValue(undefined);
    api.active.mockResolvedValue(null);
    api.get.mockRejectedValue(new Error('Execution unavailable'));
    api.send.mockResolvedValue(null);
    api.flush.mockResolvedValue(0);
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('renders the full player with targets, controls, and Wake Lock fallback', async () => {
    store.load.mockResolvedValue(execution());
    renderPlayer();
    expect(await screen.findByRole('heading', { name: 'Próg' })).toBeInTheDocument();
    expect(screen.getByText('266–280')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pauza' })).toHaveStyle({ minHeight: '48px' });
    expect(await screen.findByText(/Wake Lock niedostępny/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pauza' }));
    await waitFor(() => expect(api.send).toHaveBeenCalledWith('execution-1', 'events', expect.objectContaining({ type: 'PAUSE' })));
    expect(screen.getByRole('button', { name: 'Wznów' })).toBeInTheDocument();
  });

  it('shows loss and recovery of network without losing state', async () => {
    store.load.mockResolvedValue(execution());
    renderPlayer();
    await screen.findByRole('heading', { name: 'Próg' });
    fireEvent(window, new Event('offline'));
    expect(screen.getByText(/Offline/)).toBeInTheDocument();
    fireEvent(window, new Event('online'));
    await waitFor(() => expect(api.flush).toHaveBeenCalled());
  });

  it('restores the local snapshot when the browser reports online but the server is unreachable', async () => {
    store.load.mockResolvedValue(execution());
    api.active.mockRejectedValue(new TypeError('Failed to fetch'));

    renderPlayer();

    expect(await screen.findByRole('heading', { name: 'Próg' })).toBeInTheDocument();
    expect(screen.getByText(/Offline/)).toBeInTheDocument();
  });

  it('shows completion, partial data explanation, and accessible RPE feedback', async () => {
    store.load.mockResolvedValue(execution('COMPLETED'));
    renderPlayer();
    expect(await screen.findByText('Trening ukończony')).toBeInTheDocument();
    expect(screen.getByText(/Dokładna ocena zostanie uzupełniona/)).toBeInTheDocument();
    expect(screen.getByText('RPE: nie podano')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zapisz podsumowanie' })).toHaveStyle({ minHeight: '48px' });
  });

  it('restores a completed execution by id when it is no longer active', async () => {
    store.load.mockResolvedValue(null);
    api.get.mockResolvedValue({ ...execution('COMPLETED'), rpe: 8, feeling: 'GOOD', notes: 'Mocno, ale równo' });

    renderPlayer();

    expect(await screen.findByText('Trening ukończony')).toBeInTheDocument();
    expect(screen.getByText('RPE: 8/10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mocno, ale równo')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('execution-1');
  });

  it('blocks a second active player', async () => {
    store.load.mockResolvedValue(execution());
    store.lock.mockReturnValue(null);
    renderPlayer();
    expect(await screen.findByText(/już otwarty w innej karcie/)).toBeInTheDocument();
  });
});
