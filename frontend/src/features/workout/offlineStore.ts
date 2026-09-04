import type { WorkoutExecution } from '@/types/training';

const DATABASE = 'strava-workout-execution';
const VERSION = 1;
const ACTIVE_STORE = 'active';
const QUEUE_STORE = 'queue';
const FALLBACK_ACTIVE = 'workout-active-snapshot';
const FALLBACK_QUEUE = 'workout-mutation-queue';
const LOCK_KEY = 'workout-player-lock';

export interface OfflineWorkoutMutation {
  id: string;
  url: string;
  method: 'POST' | 'PUT';
  body: unknown;
  createdAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ACTIVE_STORE)) database.createObjectStore(ACTIVE_STORE);
      if (!database.objectStoreNames.contains(QUEUE_STORE)) database.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeRequest<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveActiveExecution(execution: WorkoutExecution): Promise<void> {
  localStorage.setItem(FALLBACK_ACTIVE, JSON.stringify(execution));
  if (typeof indexedDB === 'undefined') return;
  try {
    await storeRequest(ACTIVE_STORE, 'readwrite', store => store.put(execution, 'current'));
  } catch {
    // The localStorage copy keeps start/resume usable when IndexedDB is blocked.
  }
}

export async function loadActiveExecution(): Promise<WorkoutExecution | null> {
  if (typeof indexedDB !== 'undefined') {
    try {
      const value = await storeRequest<WorkoutExecution | undefined>(ACTIVE_STORE, 'readonly', store => store.get('current'));
      if (value) return value;
    } catch {
      // The localStorage copy is an intentional recovery path for private-mode IDB failures.
    }
  }
  const fallback = localStorage.getItem(FALLBACK_ACTIVE);
  return fallback ? JSON.parse(fallback) as WorkoutExecution : null;
}

export async function clearActiveExecution(): Promise<void> {
  localStorage.removeItem(FALLBACK_ACTIVE);
  if (typeof indexedDB === 'undefined') return;
  try {
    await storeRequest(ACTIVE_STORE, 'readwrite', store => store.delete('current'));
  } catch {
    // The local fallback is already cleared; an inaccessible IDB cannot be used for recovery.
  }
}

export async function enqueueWorkoutMutation(mutation: OfflineWorkoutMutation): Promise<void> {
  const existing = JSON.parse(localStorage.getItem(FALLBACK_QUEUE) ?? '[]') as OfflineWorkoutMutation[];
  localStorage.setItem(FALLBACK_QUEUE, JSON.stringify([...existing.filter(item => item.id !== mutation.id), mutation]));
  if (typeof indexedDB === 'undefined') return;
  try {
    await storeRequest(QUEUE_STORE, 'readwrite', store => store.put(mutation));
  } catch {
    // The mirrored local queue remains available if IndexedDB fails.
  }
}

export async function queuedWorkoutMutations(): Promise<OfflineWorkoutMutation[]> {
  const fallback = JSON.parse(localStorage.getItem(FALLBACK_QUEUE) ?? '[]') as OfflineWorkoutMutation[];
  if (typeof indexedDB === 'undefined') {
    return fallback.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }
  try {
    const indexed = await storeRequest<OfflineWorkoutMutation[]>(QUEUE_STORE, 'readonly', store => store.getAll());
    const merged = new Map([...fallback, ...indexed].map(item => [item.id, item]));
    return [...merged.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  } catch {
    return fallback.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }
}

export async function removeQueuedWorkoutMutation(id: string): Promise<void> {
  const fallback = JSON.parse(localStorage.getItem(FALLBACK_QUEUE) ?? '[]') as OfflineWorkoutMutation[];
  localStorage.setItem(FALLBACK_QUEUE, JSON.stringify(fallback.filter(item => item.id !== id)));
  if (typeof indexedDB === 'undefined') return;
  try {
    await storeRequest(QUEUE_STORE, 'readwrite', store => store.delete(id));
  } catch {
    // Removing the mirrored copy prevents a completed mutation from being replayed locally.
  }
}

function playerClientId(): string {
  const key = 'workout-player-client';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  sessionStorage.setItem(key, created);
  return created;
}

export function acquireExecutionLock(executionId: string): (() => void) | null {
  const owner = playerClientId();
  const current = JSON.parse(localStorage.getItem(LOCK_KEY) ?? 'null') as { owner: string; executionId: string; at: number } | null;
  if (current && current.owner !== owner && Date.now() - current.at < 15_000) return null;
  const heartbeat = () => localStorage.setItem(LOCK_KEY, JSON.stringify({ owner, executionId, at: Date.now() }));
  heartbeat();
  const timer = window.setInterval(heartbeat, 5_000);
  return () => {
    window.clearInterval(timer);
    const lock = JSON.parse(localStorage.getItem(LOCK_KEY) ?? 'null') as { owner?: string } | null;
    if (lock?.owner === owner) localStorage.removeItem(LOCK_KEY);
  };
}

export function hasActiveWorkoutSnapshot(): boolean {
  const value = localStorage.getItem(FALLBACK_ACTIVE);
  if (!value) return false;
  try {
    const execution = JSON.parse(value) as WorkoutExecution;
    return execution.status === 'RUNNING' || execution.status === 'PAUSED' || execution.status === 'READY';
  } catch {
    return false;
  }
}
