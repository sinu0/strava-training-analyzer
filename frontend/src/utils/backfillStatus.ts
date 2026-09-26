import { defineMessages, getLocale } from '@/i18n';
import type { BackfillStatus } from '@/types/matchedRides';

export const BACKFILL_MAX_ATTEMPTS = 8;

const { t } = defineMessages({
  pl: {
    running: 'w toku',
    retrying: 'ponawianie automatyczne o {time} (próba {attempt}/{max})',
    rateLimited: 'limit Stravy — wznowienie o {time}',
    failed: 'błąd: {message}',
    unknown: 'nieznany',
    unavailable: 'Strava nie udostępnia danych segmentów',
    idle: 'nie uruchomiono',
    completed: 'ukończono',
  },
  en: {
    running: 'in progress',
    retrying: 'automatic retry at {time} (attempt {attempt}/{max})',
    rateLimited: 'Strava rate limit — resumes at {time}',
    failed: 'error: {message}',
    unknown: 'unknown',
    unavailable: 'Strava does not provide segment data',
    idle: 'not started',
    completed: 'completed',
  },
});

function clock(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(getLocale(), { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(iso));
}

export function describeBackfillStatus(status: BackfillStatus, timeZone?: string): string {
  switch (status.status) {
    case 'RUNNING': return t('running');
    case 'RETRYING':
      return t('retrying', { time: clock(status.retryAt, timeZone), attempt: status.attemptCount ?? 1, max: BACKFILL_MAX_ATTEMPTS });
    case 'RATE_LIMITED': return t('rateLimited', { time: clock(status.rateLimitResetsAt, timeZone) });
    case 'FAILED': return t('failed', { message: status.errorMessage ?? t('unknown') });
    case 'UNAVAILABLE': return t('unavailable');
    case 'IDLE': return t('idle');
    case 'COMPLETED': return t('completed');
    default: return status.status;
  }
}

/** A scheduled retry can still be started manually, so it is not treated as busy. */
export function isBackfillBusy(status: string): boolean {
  return status === 'RUNNING' || status === 'RATE_LIMITED';
}
