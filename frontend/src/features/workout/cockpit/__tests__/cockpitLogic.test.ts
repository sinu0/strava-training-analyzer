import { describe, expect, it } from 'vitest';

import { computeCue } from '../cues';
import { formatClock, formatDurationShort, stepLabel, stepTargetText } from '../format';

describe('cockpit formatting', () => {
  it('formats clocks with hours only when needed', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(89_000)).toBe('01:29');
    expect(formatClock(3_725_000)).toBe('1:02:05');
    expect(formatClock(-5)).toBe('00:00');
  });

  it('formats short durations', () => {
    expect(formatDurationShort(45)).toBe('45 s');
    expect(formatDurationShort(1800)).toBe('30 min');
    expect(formatDurationShort(3900)).toBe('1 h 5 min');
    expect(formatDurationShort(undefined)).toBe('LAP');
  });

  it('labels steps and describes their targets', () => {
    expect(stepLabel({ type: 'warmup', durationSec: 600 }, 0)).toBe('Rozgrzewka');
    expect(stepLabel({ type: 'steady', name: 'Próg' }, 1)).toBe('Próg');
    expect(stepLabel(undefined, 3)).toBe('Koniec treningu');
    expect(stepTargetText({ type: 'steady', durationSec: 600, powerPctFtpLow: 95, powerPctFtpHigh: 100 }, 280, 0))
      .toEqual({ pct: '95–100%', watts: '266–280', lowWatts: 266, highWatts: 280 });
    expect(stepTargetText({ type: 'steady', durationSec: 600, powerPctFtpLow: 90, powerPctFtpHigh: 90 }, 200, 10))
      .toEqual({ pct: '99%', watts: '198', lowWatts: 198, highWatts: 198 });
    expect(stepTargetText({ type: 'freeRide' }, 280, 0)).toEqual({ pct: 'Dowolna', watts: '—', lowWatts: null, highWatts: null });
  });
});

describe('cues', () => {
  const target = { watts: 125, lowWatts: 120, highWatts: 130 };
  const step = { type: 'steady' as const, durationSec: 600, cadenceRpmLow: 85, cadenceRpmHigh: 95 };

  it('asks to increase or decrease power when the trainer does not hold the target', () => {
    expect(computeCue({ ergActive: false, compliance: 'below', target, powerWatts: 100, cadenceRpm: 90, step }))
      .toEqual({ key: 'power-up', tone: 'warning', text: 'Zwiększ moc do 120 W' });
    expect(computeCue({ ergActive: false, compliance: 'above', target, powerWatts: 160, cadenceRpm: 90, step }))
      .toEqual({ key: 'power-down', tone: 'error', text: 'Zmniejsz moc do 130 W' });
  });

  it('in ERG only cadence matters because the trainer holds the power', () => {
    expect(computeCue({ ergActive: true, compliance: 'below', target, powerWatts: 100, cadenceRpm: 90, step })).toBeNull();
    expect(computeCue({ ergActive: true, compliance: 'in', target, powerWatts: 125, cadenceRpm: 72, step }))
      .toEqual({ key: 'cadence-up', tone: 'warning', text: 'Kadencja 85–95 rpm' });
  });

  it('stays quiet without data or targets', () => {
    expect(computeCue({ ergActive: false, compliance: 'unknown', target: null, powerWatts: null, cadenceRpm: null, step })).toBeNull();
  });
});
