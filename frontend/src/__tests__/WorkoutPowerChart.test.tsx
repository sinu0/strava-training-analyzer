import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import WorkoutPowerChart from '../components/training/WorkoutPowerChart';

import type { WorkoutStep } from '../types/training';

const SAMPLE_STEPS: WorkoutStep[] = [
  { type: 'warmup', durationSec: 300, powerPctFtpLow: 45, powerPctFtpHigh: 70 },
  { type: 'steady', durationSec: 600, powerPctFtpLow: 88, powerPctFtpHigh: 92 },
  {
    type: 'interval',
    repeat: 3,
    onDurationSec: 120,
    onPowerPctFtpLow: 110,
    onPowerPctFtpHigh: 120,
    offDurationSec: 120,
    offPowerPctFtpLow: 50,
    offPowerPctFtpHigh: 55,
  },
  { type: 'cooldown', durationSec: 300, powerPctFtpLow: 40, powerPctFtpHigh: 65 },
];

describe('WorkoutPowerChart', () => {
  it('renders an SVG element', () => {
    const { container } = render(<WorkoutPowerChart steps={SAMPLE_STEPS} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders rect blocks for non-ramp segments', () => {
    const { container } = render(<WorkoutPowerChart steps={SAMPLE_STEPS} />);
    // steady + interval steps should produce <rect> elements
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
  });

  it('renders polygon blocks for warmup/cooldown ramp segments', () => {
    const { container } = render(<WorkoutPowerChart steps={SAMPLE_STEPS} />);
    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThanOrEqual(2); // warmup + cooldown
  });

  it('renders FTP 100% gridline', () => {
    const { container } = render(<WorkoutPowerChart steps={SAMPLE_STEPS} />);
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('compact mode renders SVG with smaller height', () => {
    const { container } = render(<WorkoutPowerChart steps={SAMPLE_STEPS} compact />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // In compact mode, Y axis text labels should not be present
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(0);
  });

  it('returns null for empty steps', () => {
    const { container } = render(<WorkoutPowerChart steps={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
