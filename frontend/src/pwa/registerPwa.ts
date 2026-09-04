import { hasActiveWorkoutSnapshot } from '@/features/workout/offlineStore';

export interface PwaCapability {
  secure: boolean;
  serviceWorker: boolean;
  offlineReady: boolean;
}

export function pwaCapability(): PwaCapability {
  const secure = window.isSecureContext === true;
  const serviceWorker = 'serviceWorker' in navigator;
  return { secure, serviceWorker, offlineReady: secure && serviceWorker };
}

export async function registerPwa(): Promise<ServiceWorkerRegistration | null> {
  if (!pwaCapability().offlineReady) return null;
  const registration = await navigator.serviceWorker.register('/service-worker.js');
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller && !hasActiveWorkoutSnapshot()) {
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  });
  return registration;
}
