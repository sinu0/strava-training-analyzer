import { describe, expect, it } from 'vitest';

import {
  buildRouteWeatherStops,
  findRouteInsertionIndex,
} from '../utils/routePlannerMap';

describe('route planner map utils', () => {
  it('builds weather stops across the route', () => {
    const stops = buildRouteWeatherStops(
      [
        [50.06, 19.94],
        [50.08, 19.98],
      ],
      [
        [50.06, 19.94],
        [50.065, 19.95],
        [50.07, 19.96],
        [50.075, 19.97],
        [50.08, 19.98],
      ],
    );

    expect(stops[0]?.label).toBe('Start');
    expect(stops[stops.length - 1]?.label).toBe('Meta');
    expect(stops.length).toBeGreaterThanOrEqual(3);
  });

  it('finds the waypoint segment where a clicked midpoint should be inserted', () => {
    const waypoints: [number, number][] = [
      [50.06, 19.94],
      [50.07, 19.96],
      [50.08, 19.99],
    ];
    const polyline: [number, number][] = [
      [50.06, 19.94],
      [50.065, 19.95],
      [50.07, 19.96],
      [50.075, 19.975],
      [50.08, 19.99],
    ];

    const firstSegmentIndex = findRouteInsertionIndex(waypoints, polyline, [50.066, 19.951]);
    const secondSegmentIndex = findRouteInsertionIndex(waypoints, polyline, [50.077, 19.98]);

    expect(firstSegmentIndex).toBe(0);
    expect(secondSegmentIndex).toBe(1);
  });
});
