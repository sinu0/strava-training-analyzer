import { DEFAULT_MAP_TILE_VARIANT, type MapTileVariant } from '@/constants/mapTiles';
import type {
  ElevationPoint,
  GeneratedRouteStyle,
  GeneratedRouteSuggestion,
  PlannedRoute,
  RoutePlanningPreferences,
  RoutePreview,
} from '@/types/route';

export const DEFAULT_ROUTE_PREFERENCES: RoutePlanningPreferences = {
  trafficPreference: 'quieter',
  surfacePreference: 'asphalt',
  distancePreference: 'balanced',
  climbPreference: 'balanced',
};

export const DEFAULT_GENERATOR_DISTANCE_KM = 40;
export const DEFAULT_GENERATOR_VARIATION = 35;
export const DEFAULT_GENERATOR_STYLE: GeneratedRouteStyle = 'balanced';

export type RoutePoint = [number, number];

export interface RouteGenerationInfo {
  sourceName: string;
  sourceType: string;
  strategy: string;
  style: GeneratedRouteStyle;
  seed: number;
}

export interface RoutePlannerState {
  waypoints: RoutePoint[];
  polyline: RoutePoint[];
  elevations: number[];
  elevationPoints: ElevationPoint[];
  routeName: string;
  routeDesc: string;
  isRouting: boolean;
  highlightIdx: number | null;
  selectedRouteId: string | null;
  totalDistance: number;
  totalGain: number;
  estimatedTimeSec: number;
  estimatedTss: number;
  mapVariant: MapTileVariant;
  showWeather: boolean;
  routingPreferences: RoutePlanningPreferences;
  routePreview: RoutePreview | null;
  generatorDistanceKm: number;
  generatorStyle: GeneratedRouteStyle;
  generatorVariationLevel: number;
  isGenerating: boolean;
  generationInfo: RouteGenerationInfo | null;
  generatedAlternatives: GeneratedRouteSuggestion[];
  selectedAlternativeIndex: number;
  generationError: string | null;
}

export type RoutePlannerAction =
  | { type: 'set-waypoints'; waypoints: RoutePoint[] }
  | { type: 'set-route-name'; routeName: string }
  | { type: 'set-route-desc'; routeDesc: string }
  | { type: 'set-map-variant'; mapVariant: MapTileVariant }
  | { type: 'set-show-weather'; showWeather: boolean }
  | { type: 'set-routing-preferences'; routingPreferences: RoutePlanningPreferences }
  | { type: 'set-generator-distance-km'; generatorDistanceKm: number }
  | { type: 'set-generator-style'; generatorStyle: GeneratedRouteStyle }
  | { type: 'set-generator-variation-level'; generatorVariationLevel: number }
  | { type: 'set-highlight-index'; highlightIdx: number | null }
  | { type: 'set-selected-route-id'; selectedRouteId: string | null }
  | { type: 'set-routing'; isRouting: boolean }
  | { type: 'set-generating'; isGenerating: boolean }
  | { type: 'set-generation-error'; generationError: string | null }
  | { type: 'reset-generated-alternatives' }
  | { type: 'reset-route-metrics'; polyline: RoutePoint[] }
  | {
      type: 'apply-route-preview';
      preview: RoutePreview;
      routedLine: RoutePoint[];
    }
  | { type: 'routing-failed'; fallbackPolyline: RoutePoint[] }
  | {
      type: 'set-elevation-profile';
      elevations: number[];
      elevationPoints: ElevationPoint[];
      totalGain?: number;
    }
  | {
      type: 'load-saved-route';
      route: PlannedRoute;
      waypoints: RoutePoint[];
    }
  | {
      type: 'set-generated-alternatives';
      suggestions: GeneratedRouteSuggestion[];
    }
  | {
      type: 'apply-generated-alternative';
      suggestion: GeneratedRouteSuggestion;
      routedLine: RoutePoint[];
      alternativeIndex?: number;
    }
  | { type: 'clear-route' };

export function createRoutePlannerInitialState(showWeather: boolean): RoutePlannerState {
  return {
    waypoints: [],
    polyline: [],
    elevations: [],
    elevationPoints: [],
    routeName: '',
    routeDesc: '',
    isRouting: false,
    highlightIdx: null,
    selectedRouteId: null,
    totalDistance: 0,
    totalGain: 0,
    estimatedTimeSec: 0,
    estimatedTss: 0,
    mapVariant: DEFAULT_MAP_TILE_VARIANT,
    showWeather,
    routingPreferences: DEFAULT_ROUTE_PREFERENCES,
    routePreview: null,
    generatorDistanceKm: DEFAULT_GENERATOR_DISTANCE_KM,
    generatorStyle: DEFAULT_GENERATOR_STYLE,
    generatorVariationLevel: DEFAULT_GENERATOR_VARIATION,
    isGenerating: false,
    generationInfo: null,
    generatedAlternatives: [],
    selectedAlternativeIndex: 0,
    generationError: null,
  };
}

function clearGeneratedAlternatives(state: RoutePlannerState): RoutePlannerState {
  return {
    ...state,
    generationInfo: null,
    generatedAlternatives: [],
    selectedAlternativeIndex: 0,
    generationError: null,
  };
}

function buildSavedRoutePreview(route: PlannedRoute): RoutePreview {
  return {
    polyline: route.polyline || [],
    distanceM: route.totalDistanceM,
    elevationGainM: route.totalElevationGainM,
    estimatedTimeSec: route.estimatedTimeSec,
    estimatedTss: route.estimatedTss,
    provider: 'saved',
    profile: 'saved-route',
    pavedDistanceM: null,
    unpavedDistanceM: null,
    cyclewayDistanceM: null,
    quietDistanceM: null,
    notices: [],
  };
}

export function routePlannerReducer(
  state: RoutePlannerState,
  action: RoutePlannerAction,
): RoutePlannerState {
  switch (action.type) {
    case 'set-waypoints':
      return {
        ...state,
        waypoints: action.waypoints,
      };
    case 'set-route-name':
      return {
        ...state,
        routeName: action.routeName,
      };
    case 'set-route-desc':
      return {
        ...state,
        routeDesc: action.routeDesc,
      };
    case 'set-map-variant':
      return {
        ...state,
        mapVariant: action.mapVariant,
      };
    case 'set-show-weather':
      return {
        ...state,
        showWeather: action.showWeather,
      };
    case 'set-routing-preferences':
      return {
        ...state,
        routingPreferences: action.routingPreferences,
      };
    case 'set-generator-distance-km':
      return {
        ...state,
        generatorDistanceKm: action.generatorDistanceKm,
      };
    case 'set-generator-style':
      return {
        ...state,
        generatorStyle: action.generatorStyle,
      };
    case 'set-generator-variation-level':
      return {
        ...state,
        generatorVariationLevel: action.generatorVariationLevel,
      };
    case 'set-highlight-index':
      return {
        ...state,
        highlightIdx: action.highlightIdx,
      };
    case 'set-selected-route-id':
      return {
        ...state,
        selectedRouteId: action.selectedRouteId,
      };
    case 'set-routing':
      return {
        ...state,
        isRouting: action.isRouting,
      };
    case 'set-generating':
      return {
        ...state,
        isGenerating: action.isGenerating,
      };
    case 'set-generation-error':
      return {
        ...state,
        generationError: action.generationError,
      };
    case 'reset-generated-alternatives':
      return clearGeneratedAlternatives(state);
    case 'reset-route-metrics':
      return {
        ...state,
        polyline: action.polyline,
        elevations: [],
        elevationPoints: [],
        totalDistance: 0,
        totalGain: 0,
        estimatedTimeSec: 0,
        estimatedTss: 0,
        routePreview: null,
      };
    case 'apply-route-preview':
      return {
        ...state,
        routePreview: action.preview,
        polyline: action.routedLine,
        totalDistance: action.preview.distanceM,
        totalGain: action.preview.elevationGainM,
        estimatedTimeSec: action.preview.estimatedTimeSec,
        estimatedTss: action.preview.estimatedTss,
      };
    case 'routing-failed':
      return {
        ...state,
        polyline: action.fallbackPolyline,
        elevations: [],
        elevationPoints: [],
        totalDistance: 0,
        totalGain: 0,
        estimatedTimeSec: 0,
        estimatedTss: 0,
        routePreview: null,
      };
    case 'set-elevation-profile':
      return {
        ...state,
        elevations: action.elevations,
        elevationPoints: action.elevationPoints,
        totalGain: action.totalGain ?? state.totalGain,
      };
    case 'load-saved-route':
      return {
        ...clearGeneratedAlternatives(state),
        selectedRouteId: action.route.id,
        waypoints: action.waypoints,
        polyline: action.route.polyline || [],
        routeName: action.route.name,
        routeDesc: action.route.description || '',
        totalDistance: action.route.totalDistanceM,
        totalGain: action.route.totalElevationGainM,
        estimatedTimeSec: action.route.estimatedTimeSec,
        estimatedTss: action.route.estimatedTss,
        routePreview: buildSavedRoutePreview(action.route),
      };
    case 'set-generated-alternatives':
      return {
        ...state,
        generatedAlternatives: action.suggestions,
        selectedAlternativeIndex: 0,
      };
    case 'apply-generated-alternative':
      return {
        ...state,
        selectedRouteId: null,
        waypoints: action.suggestion.waypoints ?? [],
        routePreview: action.suggestion.preview,
        polyline: action.routedLine,
        totalDistance: action.suggestion.preview.distanceM,
        totalGain: action.suggestion.preview.elevationGainM,
        estimatedTimeSec: action.suggestion.preview.estimatedTimeSec,
        estimatedTss: action.suggestion.preview.estimatedTss,
        generationInfo: {
          sourceName: action.suggestion.sourceName,
          sourceType: action.suggestion.sourceType,
          strategy: action.suggestion.strategy,
          style: action.suggestion.style,
          seed: action.suggestion.seed,
        },
        selectedAlternativeIndex:
          action.alternativeIndex ?? state.selectedAlternativeIndex,
        routeName: `Inspiracja: ${action.suggestion.sourceName}`,
        routeDesc: action.suggestion.strategy,
      };
    case 'clear-route': {
      const clearedState = createRoutePlannerInitialState(state.showWeather);
      return {
        ...clearedState,
        mapVariant: state.mapVariant,
        routingPreferences: state.routingPreferences,
        generatorDistanceKm: state.generatorDistanceKm,
        generatorStyle: state.generatorStyle,
        generatorVariationLevel: state.generatorVariationLevel,
      };
    }
    default:
      return state;
  }
}
