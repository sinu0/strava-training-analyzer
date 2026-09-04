import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn() }));
const store = vi.hoisted(() => ({ enqueue: vi.fn(), save: vi.fn() }));

vi.mock('@/api/client', () => ({ default: api }));
vi.mock('../offlineStore', () => ({
  enqueueWorkoutMutation: store.enqueue,
  saveActiveExecution: store.save,
}));

import { sendExecutionMutation } from '../workoutApi';

describe('workout API offline mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.enqueue.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('queues a network failure even when navigator.onLine is stale', async () => {
    api.post.mockRejectedValue(Object.assign(new Error('Network Error'), {
      code: 'ERR_NETWORK', isAxiosError: true, request: {},
    }));

    await expect(sendExecutionMutation('execution-1', 'events', {
      type: 'PAUSE', idempotencyKey: 'event-1',
    })).resolves.toBeNull();

    expect(store.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      id: 'event-1', url: '/v2/workouts/executions/execution-1/events', method: 'POST',
    }));
  });

  it('does not queue an HTTP error returned by the server', async () => {
    const error = Object.assign(new Error('Bad request'), {
      isAxiosError: true, response: { status: 400 },
    });
    api.post.mockRejectedValue(error);

    await expect(sendExecutionMutation('execution-1', 'events', {
      type: 'PAUSE', idempotencyKey: 'event-2',
    })).rejects.toBe(error);
    expect(store.enqueue).not.toHaveBeenCalled();
  });
});
