import { describe, expect, it, vi } from 'vitest';

import { createRideRecorder, memoryRecordingStorage, uploadPendingChunks } from '../rideRecorder';

import type { RideSample } from '../../devices/trainerSession';

function sample(second: number): RideSample {
  return { atMs: 1_700_000_000_000 + second * 1000, elapsedMs: second * 1000, stepIndex: 0, powerWatts: 200 + second, heartRateBpm: 140, cadenceRpm: 90, speedKph: 32 };
}

describe('ride recorder', () => {
  it('groups samples into fixed chunks and persists the growing chunk', async () => {
    const storage = memoryRecordingStorage();
    const recorder = await createRideRecorder('exec-1', { storage, chunkSize: 3, persistEvery: 1 });
    for (let second = 0; second < 7; second += 1) await recorder.append(sample(second));

    const chunks = await storage.load('exec-1');
    expect(chunks.map((chunk) => [chunk.chunkIndex, chunk.samples.length])).toEqual([[0, 3], [1, 3], [2, 1]]);
    expect(recorder.count()).toBe(7);
  });

  it('continues after a reload without losing or duplicating samples', async () => {
    const storage = memoryRecordingStorage();
    const first = await createRideRecorder('exec-1', { storage, chunkSize: 3, persistEvery: 1 });
    for (let second = 0; second < 4; second += 1) await first.append(sample(second));

    const second = await createRideRecorder('exec-1', { storage, chunkSize: 3, persistEvery: 1 });
    await second.append(sample(4));
    const chunks = await storage.load('exec-1');
    expect(chunks.flatMap((chunk) => chunk.samples.map((item) => item.elapsedMs / 1000))).toEqual([0, 1, 2, 3, 4]);
    expect(second.count()).toBe(5);
  });

  it('uploads each chunk once, idempotently by index, and keeps failures for later', async () => {
    const storage = memoryRecordingStorage();
    const recorder = await createRideRecorder('exec-1', { storage, chunkSize: 2, persistEvery: 1 });
    for (let second = 0; second < 5; second += 1) await recorder.append(sample(second));
    await recorder.flush();

    const send = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined);

    // A failed chunk does not block the ones after it; it is retried on the next pass.
    await expect(uploadPendingChunks('exec-1', storage, send)).resolves.toEqual({ uploaded: 2, pending: 1 });
    await expect(uploadPendingChunks('exec-1', storage, send)).resolves.toEqual({ uploaded: 1, pending: 0 });
    expect(send.mock.calls.map(([, chunkIndex]) => chunkIndex)).toEqual([0, 1, 2, 1]);
  });
});
