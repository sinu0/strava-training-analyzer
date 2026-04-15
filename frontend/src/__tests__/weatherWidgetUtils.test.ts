import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCyclistForDay, getCyclistType } from '@/components/weather/weatherWidgetUtils';

describe('getCyclistType', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-07-15T14:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns snowy for snow weather codes', () => {
    expect(getCyclistType(71, 10)).toBe('snowy');
    expect(getCyclistType(77, 10)).toBe('snowy');
    expect(getCyclistType(85, 10)).toBe('snowy');
    expect(getCyclistType(86, 10)).toBe('snowy');
  });

  it('returns stormy for thunderstorm codes (≥95)', () => {
    expect(getCyclistType(95, 10)).toBe('stormy');
    expect(getCyclistType(96, 10)).toBe('stormy');
    expect(getCyclistType(99, 10)).toBe('stormy');
  });

  it('returns rainy for rain/drizzle codes', () => {
    expect(getCyclistType(51, 10)).toBe('rainy');
    expect(getCyclistType(61, 10)).toBe('rainy');
    expect(getCyclistType(67, 10)).toBe('rainy');
    expect(getCyclistType(80, 10)).toBe('rainy');
    expect(getCyclistType(82, 10)).toBe('rainy');
  });

  it('returns foggy for fog codes', () => {
    expect(getCyclistType(45, 10)).toBe('foggy');
    expect(getCyclistType(48, 10)).toBe('foggy');
  });

  it('returns windy for wind > 35 km/h', () => {
    expect(getCyclistType(0, 36)).toBe('windy');
    expect(getCyclistType(0, 35)).not.toBe('windy');
  });

  it('returns night_clear for clear sky at night', () => {
    vi.setSystemTime(new Date('2025-07-15T23:00:00'));
    expect(getCyclistType(0, 10)).toBe('night_clear');
    expect(getCyclistType(1, 10)).toBe('night_clear');
  });

  it('returns hot for high temperature with clear sky', () => {
    expect(getCyclistType(0, 10, 33)).toBe('hot');
    expect(getCyclistType(1, 10, 35)).toBe('hot');
    expect(getCyclistType(0, 10, 32)).not.toBe('hot');
  });

  it('returns sunny for clear sky codes ≤1', () => {
    expect(getCyclistType(0, 10)).toBe('sunny');
    expect(getCyclistType(1, 10)).toBe('sunny');
  });

  it('returns partly_cloudy for code 2', () => {
    expect(getCyclistType(2, 10)).toBe('partly_cloudy');
  });

  it('returns cloudy for code 3', () => {
    expect(getCyclistType(3, 10)).toBe('cloudy');
  });

  it('prefers stormy over windy for thunderstorm + high wind', () => {
    expect(getCyclistType(95, 50)).toBe('stormy');
  });

  it('prefers snowy over stormy', () => {
    expect(getCyclistType(85, 10)).toBe('snowy');
  });
});

describe('getCyclistForDay', () => {
  it('returns stormy for thunderstorm codes', () => {
    expect(getCyclistForDay(95, 10)).toBe('stormy');
    expect(getCyclistForDay(99, 10)).toBe('stormy');
  });

  it('returns cloudy for code 3', () => {
    expect(getCyclistForDay(3, 10)).toBe('cloudy');
  });

  it('returns partly_cloudy for code 2', () => {
    expect(getCyclistForDay(2, 10)).toBe('partly_cloudy');
  });

  it('returns hot for high tempMax', () => {
    expect(getCyclistForDay(0, 10, 33)).toBe('hot');
    expect(getCyclistForDay(0, 10, 32)).not.toBe('hot');
  });

  it('returns sunny for code ≤1 without high temp', () => {
    expect(getCyclistForDay(0, 10)).toBe('sunny');
    expect(getCyclistForDay(1, 10)).toBe('sunny');
  });

  it('does not have night_clear (day view has no night concept)', () => {
    expect(getCyclistForDay(0, 10)).toBe('sunny');
  });
});
