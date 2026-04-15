import { describe, expect, it } from 'vitest';

import {
  READINESS_SCALES,
  getReadinessColor,
  getReadinessImage,
  getReadinessLabel,
  getReadinessLevelLabel,
  getReadinessScale,
} from '@/utils/readinessScales';

describe('readinessScales', () => {
  it('has 9 readiness levels', () => {
    expect(READINESS_SCALES).toHaveLength(9);
  });

  it('scales are ordered by min descending', () => {
    for (let i = 1; i < READINESS_SCALES.length; i++) {
      expect(READINESS_SCALES[i]!.min).toBeLessThan(READINESS_SCALES[i - 1]!.min);
    }
  });

  describe('getReadinessScale boundary tests', () => {
    const cases: Array<[number, string]> = [
      [100, 'peak'],
      [95, 'peak'],
      [94, 'rested'],
      [85, 'rested'],
      [84, 'energetic'],
      [75, 'energetic'],
      [74, 'fresh'],
      [65, 'fresh'],
      [64, 'good'],
      [55, 'good'],
      [54, 'recovering'],
      [45, 'recovering'],
      [44, 'tired'],
      [35, 'tired'],
      [34, 'struggling'],
      [15, 'struggling'],
      [14, 'exhausted'],
      [0, 'exhausted'],
    ];

    it.each(cases)('score %d → image %s', (score, expectedImage) => {
      expect(getReadinessImage(score)).toBe(expectedImage);
    });
  });

  it('returns correct labels for new levels', () => {
    expect(getReadinessLabel(90)).toBe('Wypoczęty');
    expect(getReadinessLabel(70)).toBe('Świeży');
    expect(getReadinessLabel(50)).toBe('Regeneracja');
  });

  it('returns color for each level', () => {
    for (const score of [97, 90, 80, 70, 60, 50, 40, 20, 5]) {
      expect(getReadinessColor(score)).toBeTruthy();
    }
  });

  it('getReadinessScale returns full scale object', () => {
    const scale = getReadinessScale(90);
    expect(scale.image).toBe('rested');
    expect(scale.emoji).toBe('🌟');
    expect(scale.level).toBe('wypoczęty');
  });

  it('getReadinessLevelLabel formats new levels with emoji', () => {
    expect(getReadinessLevelLabel('wypoczęty')).toBe('🌟 Wypoczęty');
    expect(getReadinessLevelLabel('świeży')).toBe('💚 Świeży');
    expect(getReadinessLevelLabel('regeneracja')).toBe('🔄 Regeneracja');
  });

  it('getReadinessLevelLabel still works for original levels', () => {
    expect(getReadinessLevelLabel('pełna moc')).toBe('🔥 Pełna moc');
    expect(getReadinessLevelLabel('energia')).toBe('⚡ Energia');
    expect(getReadinessLevelLabel('dobra')).toBe('💪 Dobra');
    expect(getReadinessLevelLabel('zmęczenie')).toBe('😓 Zmęczenie');
    expect(getReadinessLevelLabel('trudność')).toBe('🥵 Trudność');
    expect(getReadinessLevelLabel('wyczerpanie')).toBe('😴 Wyczerpanie');
  });
});
