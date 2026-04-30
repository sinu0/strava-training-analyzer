import { describe, expect, it } from 'vitest';

import {
  createRoutePlannerInitialState,
  routePlannerReducer,
  type RoutePlannerState,
  type RoutePoint,
} from '@/pages/route-planner/routePlannerReducer';

describe('routePlannerReducer', () => {
  it('applies generated alternatives and keeps selected index in sync', () => {
    const initialState = createRoutePlannerInitialState(false);

    const nextState = routePlannerReducer(initialState, {
      type: 'apply-generated-alternative',
      suggestion: {
        waypoints: [
          [50.06, 19.94],
          [50.08, 19.99],
        ],
        preview: {
          polyline: [
            [50.06, 19.94],
            [50.08, 19.99],
          ],
          distanceM: 38_000,
          elevationGainM: 420,
          estimatedTimeSec: 5_100,
          estimatedTss: 98,
          provider: 'BRouter',
          profile: 'safety',
          pavedDistanceM: 25_000,
          unpavedDistanceM: 3_000,
          cyclewayDistanceM: 9_000,
          quietDistanceM: 21_000,
          notices: [],
        },
        sourceName: 'Weekend Loop',
        sourceType: 'planned-route',
        strategy: 'Wariant bazowy',
        style: 'balanced',
        seed: 123,
      },
      routedLine: [
        [50.06, 19.94],
        [50.08, 19.99],
      ],
      alternativeIndex: 1,
    });

    expect(nextState.waypoints).toEqual([
      [50.06, 19.94],
      [50.08, 19.99],
    ]);
    expect(nextState.routeName).toBe('Inspiracja: Weekend Loop');
    expect(nextState.routeDesc).toBe('Wariant bazowy');
    expect(nextState.selectedAlternativeIndex).toBe(1);
    expect(nextState.generationInfo).toEqual({
      sourceName: 'Weekend Loop',
      sourceType: 'planned-route',
      strategy: 'Wariant bazowy',
      style: 'balanced',
      seed: 123,
    });
  });

  it('clears route-specific state without losing generator defaults', () => {
    const initialState: RoutePlannerState = {
      ...createRoutePlannerInitialState(true),
      waypoints: [[50.06, 19.94] as RoutePoint],
      routeName: 'Test',
      routeDesc: 'Opis',
      selectedRouteId: 'route-1',
      highlightIdx: 7,
      generatedAlternatives: [
        {
          waypoints: [] as RoutePoint[],
          preview: {
            polyline: [] as RoutePoint[],
            distanceM: 0,
            elevationGainM: 0,
            estimatedTimeSec: 0,
            estimatedTss: 0,
            provider: 'BRouter',
            profile: 'safety',
            pavedDistanceM: 0,
            unpavedDistanceM: 0,
            cyclewayDistanceM: 0,
            quietDistanceM: 0,
            notices: [],
          },
          sourceName: 'Alt',
          sourceType: 'activity',
          strategy: 'Alt',
          style: 'balanced',
          seed: 1,
        },
      ],
      generationInfo: {
        sourceName: 'Alt',
        sourceType: 'activity',
        strategy: 'Alt',
        style: 'balanced' as const,
        seed: 1,
      },
    };

    const nextState = routePlannerReducer(initialState, {
      type: 'clear-route',
    });

    expect(nextState.waypoints).toEqual([]);
    expect(nextState.routeName).toBe('');
    expect(nextState.routeDesc).toBe('');
    expect(nextState.selectedRouteId).toBeNull();
    expect(nextState.highlightIdx).toBeNull();
    expect(nextState.generatedAlternatives).toEqual([]);
    expect(nextState.generationInfo).toBeNull();
    expect(nextState.showWeather).toBe(true);
    expect(nextState.generatorDistanceKm).toBe(40);
    expect(nextState.generatorVariationLevel).toBe(35);
  });

  it('preserves existing polyline when routing fails', () => {
    const initialState: RoutePlannerState = {
      ...createRoutePlannerInitialState(false),
      waypoints: [
        [50.06, 19.94] as RoutePoint,
        [50.08, 19.99] as RoutePoint,
      ],
      polyline: [
        [50.06, 19.94] as RoutePoint,
        [50.065, 19.945] as RoutePoint,
        [50.07, 19.96] as RoutePoint,
        [50.075, 19.98] as RoutePoint,
        [50.08, 19.99] as RoutePoint,
      ],
      totalDistance: 5000,
      totalGain: 100,
      routePreview: {
        polyline: [],
        distanceM: 5000,
        elevationGainM: 100,
        estimatedTimeSec: 1200,
        estimatedTss: 50,
        provider: 'BRouter',
        profile: 'safety',
        pavedDistanceM: 4000,
        unpavedDistanceM: 500,
        cyclewayDistanceM: 1000,
        quietDistanceM: 3000,
        notices: [],
      },
    };

    const nextState = routePlannerReducer(initialState, {
      type: 'routing-failed',
    });

    // Polyline should be preserved, not replaced with waypoints
    expect(nextState.polyline).toEqual(initialState.polyline);
    expect(nextState.polyline.length).toBe(5);
    // Elevation data should be cleared
    expect(nextState.elevations).toEqual([]);
    expect(nextState.elevationPoints).toEqual([]);
  });

  it('preserves existing polyline when apply-route-preview has no routedLine', () => {
    const existingPolyline: RoutePoint[] = [
      [50.06, 19.94],
      [50.065, 19.945],
      [50.07, 19.96],
      [50.075, 19.98],
      [50.08, 19.99],
    ];

    const initialState: RoutePlannerState = {
      ...createRoutePlannerInitialState(false),
      waypoints: [
        [50.06, 19.94] as RoutePoint,
        [50.08, 19.99] as RoutePoint,
      ],
      polyline: existingPolyline,
    };

    const nextState = routePlannerReducer(initialState, {
      type: 'apply-route-preview',
      preview: {
        polyline: [],
        distanceM: 0,
        elevationGainM: 0,
        estimatedTimeSec: 0,
        estimatedTss: 0,
        provider: 'MANUAL',
        profile: 'manual',
        pavedDistanceM: 0,
        unpavedDistanceM: 0,
        cyclewayDistanceM: 0,
        quietDistanceM: 0,
        notices: ['Nie udało się pobrać routingu'],
      },
    });

    // Polyline should be preserved when routedLine is not provided
    expect(nextState.polyline).toEqual(existingPolyline);
  });
});
