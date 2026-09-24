import type { RideSample } from '../devices/trainerSession';

export interface RecordedChunk {
  executionId: string;
  chunkIndex: number;
  samples: RideSample[];
  uploaded: boolean;
}

/** Durable home of recorded chunks; IndexedDB in the browser, memory in tests. */
export interface RecordingStorage {
  load(executionId: string): Promise<RecordedChunk[]>;
  put(chunk: RecordedChunk): Promise<void>;
  clear(executionId: string): Promise<void>;
}

const DATABASE = 'strava-ride-recording';
const STORE = 'chunks';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: ['executionId', 'chunkIndex'] });
      store.createIndex('execution', 'executionId');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export function memoryRecordingStorage(): RecordingStorage {
  const chunks = new Map<string, RecordedChunk>();
  const key = (chunk: Pick<RecordedChunk, 'executionId' | 'chunkIndex'>) => `${chunk.executionId}:${chunk.chunkIndex}`;
  return {
    async load(executionId) {
      return [...chunks.values()].filter((chunk) => chunk.executionId === executionId)
        .map((chunk) => ({ ...chunk, samples: [...chunk.samples] }))
        .sort((a, b) => a.chunkIndex - b.chunkIndex);
    },
    async put(chunk) { chunks.set(key(chunk), { ...chunk, samples: [...chunk.samples] }); },
    async clear(executionId) { [...chunks.keys()].filter((id) => id.startsWith(`${executionId}:`)).forEach((id) => chunks.delete(id)); },
  };
}

export function indexedDbRecordingStorage(): RecordingStorage {
  if (typeof indexedDB === 'undefined') return memoryRecordingStorage();
  return {
    async load(executionId) {
      const rows = await withStore<RecordedChunk[]>('readonly', (store) => store.index('execution').getAll(executionId));
      return rows.sort((a, b) => a.chunkIndex - b.chunkIndex);
    },
    async put(chunk) { await withStore('readwrite', (store) => store.put(chunk)); },
    async clear(executionId) {
      await withStore('readwrite', (store) => store.delete(IDBKeyRange.bound([executionId, 0], [executionId, Number.MAX_SAFE_INTEGER])));
    },
  };
}

/**
 * Appends 1 Hz samples into fixed-size chunks. The open chunk is rewritten
 * every `persistEvery` samples, so a reload loses at most that many seconds.
 */
export async function createRideRecorder(
  executionId: string,
  { storage = indexedDbRecordingStorage(), chunkSize = 60, persistEvery = 10 }: { storage?: RecordingStorage; chunkSize?: number; persistEvery?: number } = {},
) {
  const existing = await storage.load(executionId);
  const last = existing[existing.length - 1];
  let current: RecordedChunk = last && last.samples.length < chunkSize && !last.uploaded
    ? last
    : { executionId, chunkIndex: last ? last.chunkIndex + 1 : 0, samples: [], uploaded: false };
  let total = existing.reduce((sum, chunk) => sum + chunk.samples.length, 0);
  let unsaved = 0;
  let lastElapsed = existing.flatMap((chunk) => chunk.samples).reduce((max, item) => Math.max(max, item.elapsedMs), -1);

  const persist = async () => {
    unsaved = 0;
    await storage.put(current);
  };

  return {
    async append(sample: RideSample) {
      if (sample.elapsedMs <= lastElapsed) return; // replayed tick after a reload
      lastElapsed = sample.elapsedMs;
      current.samples.push(sample);
      total += 1;
      unsaved += 1;
      if (current.samples.length >= chunkSize) {
        await persist();
        current = { executionId, chunkIndex: current.chunkIndex + 1, samples: [], uploaded: false };
      } else if (unsaved >= persistEvery) {
        await persist();
      }
    },
    async flush() {
      if (current.samples.length) await persist();
    },
    count: () => total,
  };
}

export type RideRecorder = Awaited<ReturnType<typeof createRideRecorder>>;

export type ChunkSender = (executionId: string, chunkIndex: number, samples: RideSample[]) => Promise<void>;

/** Sends every chunk not yet confirmed; the server upserts by (execution, chunkIndex). */
export async function uploadPendingChunks(executionId: string, storage: RecordingStorage, send: ChunkSender) {
  const chunks = await storage.load(executionId);
  let uploaded = 0;
  let pending = 0;
  for (const chunk of chunks.filter((item) => !item.uploaded && item.samples.length > 0)) {
    try {
      await send(executionId, chunk.chunkIndex, chunk.samples);
      await storage.put({ ...chunk, uploaded: true });
      uploaded += 1;
    } catch {
      pending += 1;
    }
  }
  return { uploaded, pending };
}
