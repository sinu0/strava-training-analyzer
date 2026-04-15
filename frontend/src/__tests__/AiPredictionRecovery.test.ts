import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from '../api/client';
import { requestPredictionWithRecovery } from '../hooks/useAi';

import type { PredictionResponse } from '../types/ai';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function makePrediction(overrides: Partial<PredictionResponse> = {}): PredictionResponse {
  return {
    id: 'prediction-1',
    predictionType: 'FATIGUE_PREDICTION',
    modelId: 'llama3',
    providerName: 'ollama',
    summary: 'Reduce training volume this week.',
    detail: 'Fatigue remains elevated.',
    structuredData: {},
    confidence: 0.82,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('requestPredictionWithRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns prediction immediately when the request succeeds', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    const prediction = makePrediction();
    mockedPost.mockResolvedValueOnce({ data: prediction } as never);

    await expect(
      requestPredictionWithRecovery({ predictionType: 'FATIGUE_PREDICTION' }),
    ).resolves.toEqual(prediction);

    expect(mockedPost).toHaveBeenCalledWith(
      '/ai/predict',
      { predictionType: 'FATIGUE_PREDICTION' },
      { skipErrorNotification: true },
    );
  });

  it('recovers from 504 by polling prediction history for a newly saved result', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    const mockedGet = vi.mocked(apiClient.get);

    const gatewayTimeout = new AxiosError(
      'Request failed with status code 504',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        data: {},
        status: 504,
        statusText: 'Gateway Timeout',
        headers: {},
        config: {} as never,
      },
    );

    const oldPrediction = makePrediction({
      id: 'old',
      createdAt: '2024-01-01T00:00:00.000Z',
      summary: 'Old prediction',
    });
    const recoveredPrediction = makePrediction({
      id: 'new',
      createdAt: '2026-04-07T20:45:00.000Z',
      summary: 'Recovered prediction',
    });

    mockedPost.mockRejectedValueOnce(gatewayTimeout);
    mockedGet
      .mockResolvedValueOnce({ data: [oldPrediction] } as never)
      .mockResolvedValueOnce({ data: [recoveredPrediction, oldPrediction] } as never);

    vi.setSystemTime(new Date('2026-04-07T20:44:42.000Z'));

    const responsePromise = requestPredictionWithRecovery({ predictionType: 'FATIGUE_PREDICTION' });

    await vi.advanceTimersByTimeAsync(3_000);

    await expect(responsePromise).resolves.toEqual(recoveredPrediction);
    expect(mockedGet).toHaveBeenCalledWith('/ai/predictions', {
      params: { type: 'FATIGUE_PREDICTION', limit: 3 },
      skipErrorNotification: true,
    });
  });
});
