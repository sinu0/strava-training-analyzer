import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import {
  fetchElevation,
  fetchRoute,
  generateRouteAlternativesFromHistory,
  useCreateRoute,
  useDeleteRoute,
  useExportGpx,
  useRouteWeather,
  useRoutes,
} from '@/hooks/useRoutePlanner';
import {
  createRoutePlannerInitialState,
  DEFAULT_GENERATOR_DISTANCE_KM,
  DEFAULT_GENERATOR_VARIATION,
  routePlannerReducer,
  type RoutePoint,
} from '@/pages/route-planner/routePlannerReducer';
import type { WeatherData } from '@/types/analytics';
import type {
  ElevationPoint,
  GeneratedRouteSuggestion,
  PlannedRoute,
  RoutePreview,
  RouteWaypoint,
} from '@/types/route';
import { buildRouteWeatherStops } from '@/utils/routePlannerMap';

type RouteWeatherStopWithStatus = ReturnType<typeof buildRouteWeatherStops>[number] & {
  weather: WeatherData | null;
  isLoading: boolean;
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusM = 6_371_000;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(deltaLon / 2) ** 2;

  return earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildElevationPoints(polyline: RoutePoint[], elevations: number[]): ElevationPoint[] {
  if (polyline.length < 2 || elevations.length < 2) {
    return [];
  }

  const points: ElevationPoint[] = [];
  let cumulativeDistance = 0;

  for (let index = 0; index < polyline.length && index < elevations.length; index += 1) {
    const currentPoint = polyline[index];
    const currentElevation = elevations[index];

    if (!currentPoint || currentElevation == null) {
      continue;
    }

    if (index > 0) {
      const previousPoint = polyline[index - 1];
      if (!previousPoint) {
        continue;
      }

      cumulativeDistance += haversineDistance(
        previousPoint[0],
        previousPoint[1],
        currentPoint[0],
        currentPoint[1],
      );
    }

    const gradient =
      index > 0
        ? (() => {
            const previousPoint = polyline[index - 1];
            const previousElevation = elevations[index - 1];

            if (!previousPoint || previousElevation == null) {
              return 0;
            }

            const distance = haversineDistance(
              previousPoint[0],
              previousPoint[1],
              currentPoint[0],
              currentPoint[1],
            );

            return distance > 0 ? ((currentElevation - previousElevation) / distance) * 100 : 0;
          })()
        : 0;

    points.push({
      distance: cumulativeDistance,
      elevation: currentElevation,
      gradient,
    });
  }

  return points;
}

function samplePoints(points: RoutePoint[], maxCount: number): RoutePoint[] {
  if (points.length <= maxCount) {
    return points;
  }

  const step = (points.length - 1) / (maxCount - 1);
  const sampled: RoutePoint[] = [];

  for (let index = 0; index < maxCount; index += 1) {
    const point = points[Math.round(index * step)];
    if (point) {
      sampled.push(point);
    }
  }

  return sampled;
}

function getDefaultShowWeather(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('showWeather') === '1';
}

function getRouteProviderLabel(routePreview: RoutePreview | null): string | null {
  if (routePreview?.provider === 'saved') {
    return 'Zapisana trasa';
  }

  if (routePreview?.provider) {
    return routePreview.provider.toUpperCase();
  }

  return null;
}

export function useRoutePlannerState() {
  const [state, dispatch] = useReducer(
    routePlannerReducer,
    getDefaultShowWeather(),
    createRoutePlannerInitialState,
  );
  const {
    waypoints,
    polyline,
    elevations,
    elevationPoints,
    routeName,
    routeDesc,
    isRouting,
    highlightIdx,
    selectedRouteId,
    totalDistance,
    totalGain,
    estimatedTimeSec,
    estimatedTss,
    mapVariant,
    showWeather,
    routingPreferences,
    routePreview,
    generatorDistanceKm,
    generatorStyle,
    generatorVariationLevel,
    isGenerating,
    generationInfo,
    generatedAlternatives,
    selectedAlternativeIndex,
    generationError,
  } = state;

  const routingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routingPreferenceKey = useMemo(
    () => Object.values(routingPreferences).join(':'),
    [routingPreferences],
  );
  const previousRoutingPreferenceKeyRef = useRef(routingPreferenceKey);

  const { data: savedRoutes = [], isLoading: routesLoading } = useRoutes();
  const createRoute = useCreateRoute();
  const deleteRoute = useDeleteRoute();
  const exportGpx = useExportGpx();

  const weatherStops = useMemo(
    () => buildRouteWeatherStops(waypoints, polyline),
    [polyline, waypoints],
  );
  const weatherQueries = useRouteWeather(
    weatherStops,
    showWeather && weatherStops.length > 0,
  );
  const routeWeatherStops = useMemo<RouteWeatherStopWithStatus[]>(
    () =>
      weatherStops.map((stop, index) => ({
        ...stop,
        weather: weatherQueries[index]?.data ?? null,
        isLoading: weatherQueries[index]?.isLoading ?? false,
      })),
    [weatherQueries, weatherStops],
  );

  const resetGeneratedAlternatives = useCallback(() => {
    dispatch({ type: 'reset-generated-alternatives' });
  }, []);

  const resetRouteMetrics = useCallback((nextPolyline: RoutePoint[]) => {
    dispatch({ type: 'reset-route-metrics', polyline: nextPolyline });
  }, []);

  const setRouteName = useCallback((value: string) => {
    dispatch({ type: 'set-route-name', routeName: value });
  }, []);

  const setRouteDesc = useCallback((value: string) => {
    dispatch({ type: 'set-route-desc', routeDesc: value });
  }, []);

  const setMapVariant = useCallback((value: typeof mapVariant) => {
    dispatch({ type: 'set-map-variant', mapVariant: value });
  }, []);

  const setShowWeather = useCallback((value: boolean) => {
    dispatch({ type: 'set-show-weather', showWeather: value });
  }, []);

  const setRoutingPreferences = useCallback(
    (
      updater: (current: typeof routingPreferences) => typeof routingPreferences,
    ) => {
      dispatch({
        type: 'set-routing-preferences',
        routingPreferences: updater(routingPreferences),
      });
    },
    [routingPreferences],
  );

  const setGeneratorDistanceKm = useCallback((value: number) => {
    dispatch({
      type: 'set-generator-distance-km',
      generatorDistanceKm: value,
    });
  }, []);

  const setGeneratorStyle = useCallback((value: typeof generatorStyle) => {
    dispatch({ type: 'set-generator-style', generatorStyle: value });
  }, []);

  const setGeneratorVariationLevel = useCallback((value: number) => {
    dispatch({
      type: 'set-generator-variation-level',
      generatorVariationLevel: value,
    });
  }, []);

  const setHighlightIdx = useCallback((value: number | null) => {
    dispatch({ type: 'set-highlight-index', highlightIdx: value });
  }, []);

  useEffect(
    () => () => {
      if (routingTimeout.current) {
        clearTimeout(routingTimeout.current);
      }
    },
    [],
  );

  const loadElevationProfile = useCallback(
    async (routeLine: RoutePoint[], previewElevationGain: number) => {
      if (routeLine.length < 2) {
        dispatch({
          type: 'set-elevation-profile',
          elevations: [],
          elevationPoints: [],
        });
        return;
      }

      const sampled = samplePoints(routeLine, 100);
      const sampledElevations = await fetchElevation(sampled);
      const sampledElevationPoints = buildElevationPoints(sampled, sampledElevations);

      let elevationGain = 0;
      for (let index = 1; index < sampledElevations.length; index += 1) {
        const currentElevation = sampledElevations[index];
        const previousElevation = sampledElevations[index - 1];

        if (currentElevation == null || previousElevation == null) {
          continue;
        }

        const diff = currentElevation - previousElevation;
        if (diff > 0) {
          elevationGain += diff;
        }
      }

      dispatch({
        type: 'set-elevation-profile',
        elevations: sampledElevations,
        elevationPoints: sampledElevationPoints,
        totalGain: previewElevationGain <= 0 ? elevationGain : undefined,
      });
    },
    [],
  );

  const recalculateRoute = useCallback(
    async (nextWaypoints: RoutePoint[]) => {
      if (nextWaypoints.length < 2) {
        resetRouteMetrics(nextWaypoints);
        return;
      }

      dispatch({ type: 'set-routing', isRouting: true });
      dispatch({ type: 'set-generation-error', generationError: null });

      try {
        const preview = await fetchRoute(nextWaypoints, routingPreferences);
        const hasRoutedPolyline = preview.polyline.length > 1 && preview.provider !== 'MANUAL';

        dispatch({
          type: 'apply-route-preview',
          preview,
          ...(hasRoutedPolyline ? { routedLine: preview.polyline } : {}),
        });
        if (hasRoutedPolyline) {
          await loadElevationProfile(preview.polyline, preview.elevationGainM);
        }
      } catch {
        dispatch({ type: 'routing-failed' });
      } finally {
        dispatch({ type: 'set-routing', isRouting: false });
      }
    },
    [loadElevationProfile, resetRouteMetrics, routingPreferences],
  );

  const scheduleRecalculation = useCallback(
    (nextWaypoints: RoutePoint[]) => {
      if (routingTimeout.current) {
        clearTimeout(routingTimeout.current);
      }

      routingTimeout.current = setTimeout(() => {
        void recalculateRoute(nextWaypoints);
      }, 220);
    },
    [recalculateRoute],
  );

  useEffect(() => {
    if (previousRoutingPreferenceKeyRef.current === routingPreferenceKey) {
      return;
    }

    previousRoutingPreferenceKeyRef.current = routingPreferenceKey;
    scheduleRecalculation(waypoints);
  }, [routingPreferenceKey, scheduleRecalculation, waypoints]);

  const handleAddWaypoint = useCallback(
    (latlng: RoutePoint, afterIndex?: number) => {
      const insertAt =
        afterIndex == null ? waypoints.length : Math.min(waypoints.length, afterIndex + 1);
      const nextWaypoints = [
        ...waypoints.slice(0, insertAt),
        latlng,
        ...waypoints.slice(insertAt),
      ];

      dispatch({ type: 'set-waypoints', waypoints: nextWaypoints });
      resetGeneratedAlternatives();
      scheduleRecalculation(nextWaypoints);
    },
    [resetGeneratedAlternatives, scheduleRecalculation, waypoints],
  );

  const handleRemoveWaypoint = useCallback(
    (index: number) => {
      const nextWaypoints = waypoints.filter((_, waypointIndex) => waypointIndex !== index);
      dispatch({ type: 'set-waypoints', waypoints: nextWaypoints });
      resetGeneratedAlternatives();
      void recalculateRoute(nextWaypoints);
    },
    [recalculateRoute, resetGeneratedAlternatives, waypoints],
  );

  const handleMoveWaypoint = useCallback(
    (index: number, latlng: RoutePoint) => {
      const nextWaypoints = waypoints.map((waypoint, waypointIndex) =>
        waypointIndex === index ? latlng : waypoint,
      );

      dispatch({ type: 'set-waypoints', waypoints: nextWaypoints });
      resetGeneratedAlternatives();
      scheduleRecalculation(nextWaypoints);
    },
    [resetGeneratedAlternatives, scheduleRecalculation, waypoints],
  );

  const handleUndo = useCallback(() => {
    if (waypoints.length === 0) {
      return;
    }

    const nextWaypoints = waypoints.slice(0, -1);
    dispatch({ type: 'set-waypoints', waypoints: nextWaypoints });
    resetGeneratedAlternatives();
    void recalculateRoute(nextWaypoints);
  }, [recalculateRoute, resetGeneratedAlternatives, waypoints]);

  const handleClear = useCallback(() => {
    if (routingTimeout.current) {
      clearTimeout(routingTimeout.current);
    }

    dispatch({ type: 'clear-route' });
  }, []);

  const handleSave = useCallback(() => {
    if (!routeName.trim() || waypoints.length < 2) {
      return;
    }

    const waypointModels: RouteWaypoint[] = waypoints.map((waypoint, index) => ({
      index,
      lat: waypoint[0],
      lng: waypoint[1],
    }));

    createRoute.mutate({
      name: routeName,
      description: routeDesc || undefined,
      waypoints: waypointModels,
      polyline,
      elevations,
    });
  }, [createRoute, elevations, polyline, routeDesc, routeName, waypoints]);

  const handleSelectRoute = useCallback(
    (route: PlannedRoute) => {
      const nextWaypoints: RoutePoint[] = route.waypoints.map((waypoint) => [
        waypoint.lat,
        waypoint.lng,
      ]);

      dispatch({
        type: 'load-saved-route',
        route,
        waypoints: nextWaypoints,
      });

      if (route.polyline && route.polyline.length > 0) {
        void loadElevationProfile(route.polyline, route.totalElevationGainM);
      }
    },
    [loadElevationProfile],
  );

  const handleDeleteRoute = useCallback(
    (id: string) => {
      deleteRoute.mutate(id);

      if (selectedRouteId === id) {
        handleClear();
      }
    },
    [deleteRoute, handleClear, selectedRouteId],
  );

  const handleExportGpx = useCallback(
    (id: string) => {
      exportGpx.mutate(id, {
        onSuccess: (blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = 'route.gpx';
          anchor.click();
          URL.revokeObjectURL(url);
        },
      });
    },
    [exportGpx],
  );

  const handleApplyGeneratedAlternative = useCallback(
    async (suggestion: GeneratedRouteSuggestion, alternativeIndex?: number) => {
      dispatch({ type: 'set-generation-error', generationError: null });

      const suggestedWaypoints = suggestion.waypoints ?? [];
      const preview = suggestion.preview;
      const hasRoutedPolyline = preview.polyline.length > 1 && preview.provider !== 'MANUAL';
      const routedLine = hasRoutedPolyline ? preview.polyline : suggestedWaypoints;

      dispatch({
        type: 'apply-generated-alternative',
        suggestion,
        routedLine,
        alternativeIndex,
      });
      await loadElevationProfile(routedLine, preview.elevationGainM);
    },
    [loadElevationProfile],
  );

  const handleGenerateFromHistory = useCallback(async () => {
    dispatch({ type: 'set-generating', isGenerating: true });
    dispatch({ type: 'set-generation-error', generationError: null });

    try {
      const suggestions = await generateRouteAlternativesFromHistory({
        startPoint: waypoints[0] ?? null,
        targetDistanceKm: generatorDistanceKm,
        style: generatorStyle,
        variationLevel: generatorVariationLevel,
        seed: Date.now(),
        routePlanningPreferences: routingPreferences,
      });

      dispatch({
        type: 'set-generated-alternatives',
        suggestions,
      });

      const primarySuggestion = suggestions[0];
      if (!primarySuggestion) {
        dispatch({
          type: 'set-generation-error',
          generationError: 'Generator nie zwrócił żadnej propozycji.',
        });
        return;
      }

      await handleApplyGeneratedAlternative(primarySuggestion, 0);
    } catch (error) {
      dispatch({
        type: 'set-generated-alternatives',
        suggestions: [],
      });
      dispatch({
        type: 'set-generation-error',
        generationError:
          error instanceof Error
            ? error.message
            : 'Nie udało się wygenerować trasy z historii.',
      });
    } finally {
      dispatch({ type: 'set-generating', isGenerating: false });
    }
  }, [
    generatorDistanceKm,
    generatorStyle,
    generatorVariationLevel,
    handleApplyGeneratedAlternative,
    routingPreferences,
    waypoints,
  ]);

  const handleCycleAlternative = useCallback(
    (direction: -1 | 1) => {
      if (generatedAlternatives.length === 0) {
        return;
      }

      const nextIndex =
        (selectedAlternativeIndex + direction + generatedAlternatives.length) %
        generatedAlternatives.length;

      void handleApplyGeneratedAlternative(generatedAlternatives[nextIndex]!, nextIndex);
    },
    [generatedAlternatives, handleApplyGeneratedAlternative, selectedAlternativeIndex],
  );

  const handleSelectAlternative = useCallback(
    (index: number) => {
      const suggestion = generatedAlternatives[index];
      if (!suggestion) {
        return;
      }

      void handleApplyGeneratedAlternative(suggestion, index);
    },
    [generatedAlternatives, handleApplyGeneratedAlternative],
  );

  const handleSaveAlternative = useCallback(
    (suggestion: GeneratedRouteSuggestion) => {
      const waypointModels: RouteWaypoint[] = (suggestion.waypoints ?? []).map(
        (waypoint, index) => ({
          index,
          lat: waypoint[0],
          lng: waypoint[1],
        }),
      );

      createRoute.mutate({
        name: `Sugestia: ${suggestion.sourceName ?? 'generowana'}`,
        description: suggestion.strategy,
        waypoints: waypointModels,
        polyline: suggestion.preview?.polyline ?? suggestion.waypoints ?? [],
        elevations: [],
      });
    },
    [createRoute],
  );

  return {
    waypoints,
    polyline,
    elevationPoints,
    routeName,
    routeDesc,
    isRouting,
    highlightIdx,
    selectedRouteId,
    totalDistance,
    totalGain,
    estimatedTimeSec,
    estimatedTss,
    mapVariant,
    showWeather,
    routingPreferences,
    routePreview,
    generatorDistanceKm,
    generatorStyle,
    generatorVariationLevel,
    isGenerating,
    generationInfo,
    generatedAlternatives,
    selectedAlternativeIndex,
    generationError,
    savedRoutes,
    routesLoading,
    routeWeatherStops,
    routeProviderLabel: getRouteProviderLabel(routePreview),
    createRoutePending: createRoute.isPending,
    defaultGeneratorDistanceKm: DEFAULT_GENERATOR_DISTANCE_KM,
    defaultGeneratorVariation: DEFAULT_GENERATOR_VARIATION,
    setRouteName,
    setRouteDesc,
    setMapVariant,
    setShowWeather,
    setRoutingPreferences,
    setGeneratorDistanceKm,
    setGeneratorStyle,
    setGeneratorVariationLevel,
    setHighlightIdx,
    handleAddWaypoint,
    handleRemoveWaypoint,
    handleMoveWaypoint,
    handleUndo,
    handleClear,
    handleSave,
    handleSelectRoute,
    handleDeleteRoute,
    handleExportGpx,
    handleGenerateFromHistory,
    handleCycleAlternative,
    handleSelectAlternative,
    handleSaveAlternative,
  };
}
