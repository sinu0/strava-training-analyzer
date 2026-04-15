import { describe, it, expect } from 'vitest';

import { findRouteInsertionIndex, buildRouteWeatherStops } from '../utils/routePlannerMap';

describe('routePlannerMap additional tests', () => {
  it('returns 0 when waypoints less than 2', () => {
    expect(findRouteInsertionIndex([], [[50,19],[51,20]], [50.1,19.1])).toBe(0);
    expect(findRouteInsertionIndex([[50,19]], [[50,19],[51,20]], [50.1,19.1])).toBe(0);
  });

  it('returns last allowed index for click beyond last segment', () => {
    const waypoints: [number, number][] = [[50,19],[50.5,19.5],[51,20]];
    const polyline: [number, number][] = [[50,19],[50.25,19.25],[50.5,19.5],[50.75,19.75],[51,20]];
    const idx = findRouteInsertionIndex(waypoints, polyline, [50.9,19.9]);
    expect(idx).toBe(1); // waypoints.length - 2
  });

  it('buildRouteWeatherStops returns empty for empty sources', () => {
    expect(buildRouteWeatherStops([], [], 4)).toEqual([]);
  });

  it('buildRouteWeatherStops avoids duplicate stops', () => {
    const waypoints: [number, number][] = [[50.06, 19.94]];
    const polyline: [number, number][] = [[50.06,19.94],[50.06,19.94],[50.06,19.94]];
    const stops = buildRouteWeatherStops(waypoints, polyline, 3);
    expect(stops.length).toBe(1);
    expect(stops[0]?.label).toBe('Start');
  });
});
