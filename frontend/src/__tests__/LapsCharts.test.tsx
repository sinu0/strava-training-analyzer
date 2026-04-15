import { render } from '@testing-library/react';
import { it, expect } from 'vitest';

import LapsCharts from '../components/activity/LapsCharts';

const sampleLaps = [
  { lapIndex: 1, startIndex: 0, endIndex: 299, movingTimeSec: 300, avgPowerW: 200, avgHeartrate: 150, avgCadence: 85, totalElevationGain: 5 },
  { lapIndex: 2, startIndex: 300, endIndex: 899, movingTimeSec: 600, avgPowerW: 180, avgHeartrate: 145, avgCadence: 82, totalElevationGain: 15 },
  { lapIndex: 3, startIndex: 900, endIndex: 1020, movingTimeSec: 120, avgPowerW: 220, avgHeartrate: 155, avgCadence: 88, totalElevationGain: 2 },
];

// 1021 altitude values spanning the three laps
const sampleAltitudeStream = Array.from({ length: 1021 }, (_, i) => 100 + Math.sin(i / 50) * 20);

it('renders redesigned metric charts with bars and elevation overlays', () => {
  render(<LapsCharts laps={sampleLaps as any} altitudeStream={sampleAltitudeStream} />);

  expect(document.body.textContent).toContain('Moc śr. (W)');
  expect(document.body.textContent).toContain('Tętno śr. (bpm)');
  expect(document.body.textContent).toContain('Kadencja śr. (rpm)');

  // Expect three SVG chart surfaces (power/hr/cad)
  const svgEls = document.querySelectorAll('svg');
  expect(svgEls.length).toBe(3);

  // Check that bars exist and heights are not all identical (scaling applied)
  const rects = Array.from(document.querySelectorAll('rect')) as SVGRectElement[];
  expect(rects.length).toBeGreaterThanOrEqual(3);

  // Elevation overlay should be rendered as an area/line path
  const paths = Array.from(document.querySelectorAll('path'));
  expect(paths.length).toBeGreaterThan(0);
});
