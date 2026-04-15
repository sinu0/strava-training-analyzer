import { describe, it, expect } from 'vitest';

import {
  formatDuration,
  formatPace,
  formatDistance,
  formatPower,
  formatDate,
  formatNumber,
} from '../utils/formatters';

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });
  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });
  it('formats hours and minutes', () => {
    expect(formatDuration(3725)).toBe('1h 2m');
  });
});

describe('formatPace', () => {
  it('formats pace per km', () => {
    expect(formatPace(3.33)).toBe('5:00 /km');
  });
  it('returns dash for zero speed', () => {
    expect(formatPace(0)).toBe('-');
  });
});

describe('formatDistance', () => {
  it('formats meters for short distances', () => {
    expect(formatDistance(500)).toBe('500 m');
  });
  it('formats km for long distances', () => {
    expect(formatDistance(10500)).toBe('10.5 km');
  });
});

describe('formatPower', () => {
  it('rounds and adds unit', () => {
    expect(formatPower(256.7)).toBe('257 W');
  });
});

describe('formatDate', () => {
  it('formats ISO date to Polish locale', () => {
    const result = formatDate('2024-03-15');
    expect(result).toContain('15');
    expect(result).toContain('03');
    expect(result).toContain('2024');
  });
});

describe('formatNumber', () => {
  it('formats with default 1 decimal', () => {
    expect(formatNumber(3.456)).toBe('3.5');
  });
  it('formats with custom decimals', () => {
    expect(formatNumber(3.456, 2)).toBe('3.46');
  });
});
