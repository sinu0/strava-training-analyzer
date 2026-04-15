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
});
