import { describe, expect, it } from 'vitest';

import type { BackfillStatus } from '@/types/matchedRides';
import { describeBackfillStatus, isBackfillBusy } from '@/utils/backfillStatus';

const base: BackfillStatus = {
  jobType: 'SEGMENTS', status: 'RUNNING', processed: 270, total: 1142, capability: 'AVAILABLE', updatedAt: '2026-09-24T10:00:00Z',
};

describe('backfill status', () => {
  it('describes an automatic retry with local time and attempt', () => {
    const label = describeBackfillStatus({ ...base, status: 'RETRYING', retryAt: '2026-09-24T10:08:00Z', attemptCount: 3 }, 'Europe/Warsaw');
    expect(label).toBe('ponawianie automatyczne o 12:08 (próba 3/8)');
  });

  it('describes rate limit and failure', () => {
    expect(describeBackfillStatus({ ...base, status: 'RATE_LIMITED', rateLimitResetsAt: '2026-09-24T10:15:00Z' }, 'Europe/Warsaw'))
      .toBe('limit Stravy — wznowienie o 12:15');
    expect(describeBackfillStatus({ ...base, status: 'FAILED', errorMessage: 'bad payload' })).toBe('błąd: bad payload');
    expect(describeBackfillStatus(base)).toBe('w toku');
  });

  it('treats running, retrying and rate-limited jobs as busy', () => {
    expect(isBackfillBusy('RUNNING')).toBe(true);
    expect(isBackfillBusy('RETRYING')).toBe(false);
    expect(isBackfillBusy('RATE_LIMITED')).toBe(true);
    expect(isBackfillBusy('FAILED')).toBe(false);
  });
});
