import { describe, expect, it } from 'vitest';

import { addDays, localDate } from '@/utils/localDate';

describe('calendar dates', () => {
  it('preserves local midnight instead of converting it to the previous UTC day', () => {
    expect(localDate(new Date(2026, 8, 5, 0, 1))).toBe('2026-09-05');
  });
  it('advances date-only values across month and daylight-saving boundaries', () => {
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-09-01', -1)).toBe('2026-08-31');
  });
});
