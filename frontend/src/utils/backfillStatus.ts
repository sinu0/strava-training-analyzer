import type { BackfillStatus } from '@/types/matchedRides';

export const BACKFILL_MAX_ATTEMPTS = 8;

function clock(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(iso));
}

export function describeBackfillStatus(status: BackfillStatus, timeZone?: string): string {
  switch (status.status) {
    case 'RUNNING': return 'w toku';
    case 'RETRYING':
      return `ponawianie automatyczne o ${clock(status.retryAt, timeZone)} (próba ${status.attemptCount ?? 1}/${BACKFILL_MAX_ATTEMPTS})`;
    case 'RATE_LIMITED': return `limit Stravy — wznowienie o ${clock(status.rateLimitResetsAt, timeZone)}`;
    case 'FAILED': return `błąd: ${status.errorMessage ?? 'nieznany'}`;
    case 'UNAVAILABLE': return 'Strava nie udostępnia danych segmentów';
    case 'IDLE': return 'nie uruchomiono';
    case 'COMPLETED': return 'ukończono';
    default: return status.status;
  }
}

/** A scheduled retry can still be started manually, so it is not treated as busy. */
export function isBackfillBusy(status: string): boolean {
  return status === 'RUNNING' || status === 'RATE_LIMITED';
}
