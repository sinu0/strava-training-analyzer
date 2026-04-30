import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CDP_PORT,
  buildChromeArgs,
  getBrowserCandidates,
} from '../../scripts/garmin-bridge-launcher.mjs';

describe('garmin bridge launcher', () => {
  it('builds chrome args that prefer a debuggable non-automation profile', () => {
    const args = buildChromeArgs({
      profileDir: '/tmp/garmin-profile',
      cdpPort: DEFAULT_CDP_PORT,
      startUrl: 'https://connect.garmin.com/modern/',
    });

    expect(args).toContain('--user-data-dir=/tmp/garmin-profile');
    expect(args).toContain(`--remote-debugging-port=${DEFAULT_CDP_PORT}`);
    expect(args).toContain('--disable-blink-features=AutomationControlled');
  });

  it('returns at least one browser candidate for the current OS', () => {
    expect(getBrowserCandidates().length).toBeGreaterThan(0);
  });
});
