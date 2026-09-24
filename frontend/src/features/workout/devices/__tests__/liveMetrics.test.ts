import { describe, expect, it } from 'vitest';

import { complianceOf, createLiveMetrics, smoothPower } from '../liveMetrics';

describe('live metrics', () => {
  it('averages 3 s power from recent samples', () => {
    expect(smoothPower([{ at: 0, watts: 100 }, { at: 1000, watts: 200 }, { at: 2000, watts: 300 }], 2500)).toBe(200);
    expect(smoothPower([{ at: 0, watts: 100 }, { at: 5000, watts: 300 }], 5500)).toBe(300);
    expect(smoothPower([], 0)).toBeNull();
  });

  it('accumulates session and step statistics at 1 Hz', () => {
    const metrics = createLiveMetrics(250);
    for (let second = 0; second < 60; second += 1) metrics.tick({ powerWatts: 250, heartRateBpm: 140, cadenceRpm: 90 }, 0);
    metrics.tick({ powerWatts: 100, heartRateBpm: 120, cadenceRpm: 80 }, 1);
    const snapshot = metrics.snapshot();
    expect(snapshot.session.durationSec).toBe(61);
    expect(snapshot.session.maxPower).toBe(250);
    expect(snapshot.session.kilojoules).toBeCloseTo((250 * 60 + 100) / 1000, 2);
    expect(snapshot.step.avgPower).toBe(100);
    expect(snapshot.step.avgHeartRate).toBe(120);
  });

  it('computes normalized power, intensity factor and TSS after 30 s', () => {
    const metrics = createLiveMetrics(250);
    for (let second = 0; second < 3600; second += 1) metrics.tick({ powerWatts: 250, heartRateBpm: null, cadenceRpm: null }, 0);
    const { session } = metrics.snapshot();
    expect(session.normalizedPower).toBe(250);
    expect(session.intensityFactor).toBeCloseTo(1, 2);
    expect(session.tss).toBeCloseTo(100, 0);
  });

  it('integrates virtual distance from trainer speed', () => {
    const metrics = createLiveMetrics(250);
    for (let second = 0; second < 360; second += 1) metrics.tick({ powerWatts: 200, heartRateBpm: null, cadenceRpm: 90, speedKph: 36 }, 0);
    expect(metrics.snapshot().session.distanceKm).toBeCloseTo(3.6, 5);
  });

  it('ignores missing values instead of counting zeros', () => {
    const metrics = createLiveMetrics(null);
    metrics.tick({ powerWatts: null, heartRateBpm: 150, cadenceRpm: null }, 0);
    const { session } = metrics.snapshot();
    expect(session.avgPower).toBeNull();
    expect(session.avgHeartRate).toBe(150);
    expect(session.tss).toBeNull();
  });
});

describe('compliance', () => {
  it('classifies power against the target range', () => {
    expect(complianceOf(230, { lowWatts: 220, highWatts: 235, watts: 228 })).toBe('in');
    expect(complianceOf(200, { lowWatts: 220, highWatts: 235, watts: 228 })).toBe('below');
    expect(complianceOf(260, { lowWatts: 220, highWatts: 235, watts: 228 })).toBe('above');
    expect(complianceOf(null, { lowWatts: 220, highWatts: 235, watts: 228 })).toBe('unknown');
    expect(complianceOf(150, null)).toBe('unknown');
  });

  it('gives a single-value target a tolerance of 5 %', () => {
    expect(complianceOf(205, { lowWatts: 200, highWatts: 200, watts: 200 })).toBe('in');
    expect(complianceOf(212, { lowWatts: 200, highWatts: 200, watts: 200 })).toBe('above');
  });
});
