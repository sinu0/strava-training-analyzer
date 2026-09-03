import { describe, expect, it } from 'vitest';

import { speedChartDomain } from '@/features/matched-rides/chartScale';

describe('speedChartDomain', () => {
  it('uses the observed min and max with a small readable margin', () => {
    expect(speedChartDomain([25.1, 25.8, 26.2])).toEqual([25, 26.3]);
  });

  it('still creates a useful range for equal and missing values', () => {
    expect(speedChartDomain([26, 26])).toEqual([25.5, 26.5]);
    expect(speedChartDomain([null, undefined])).toEqual(['auto', 'auto']);
  });
});
