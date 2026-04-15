export interface RouteWaypoint {
  index: number;
  lat: number;
  lng: number;
  elevationM?: number;
  label?: string;
}

export interface PlannedRoute {
  id: string;
  name: string;
  description?: string;
  waypoints: RouteWaypoint[];
  polyline: [number, number][];
  totalDistanceM: number;
  totalElevationGainM: number;
  totalElevationLossM: number;
  estimatedTimeSec: number;
  estimatedTss: number;
  createdAt: string;
  updatedAt: string;
}

export type RouteTrafficPreference = 'quieter' | 'balanced' | 'direct';
export type RouteSurfacePreference = 'asphalt' | 'balanced' | 'gravel';
export type RouteDistancePreference = 'shortest' | 'balanced' | 'longer';
export type RouteClimbPreference = 'flatter' | 'balanced' | 'hillier';
export type GeneratedRouteStyle = 'balanced' | 'longer' | 'harder' | 'easier';

export interface RoutePlanningPreferences {
  trafficPreference: RouteTrafficPreference;
  surfacePreference: RouteSurfacePreference;
  distancePreference: RouteDistancePreference;
  climbPreference: RouteClimbPreference;
}

export interface RoutePreview {
  polyline: [number, number][];
  distanceM: number;
  elevationGainM: number;
  estimatedTimeSec: number;
  estimatedTss: number;
  provider: string;
  profile: string;
  pavedDistanceM?: number | null;
  unpavedDistanceM?: number | null;
  cyclewayDistanceM?: number | null;
  quietDistanceM?: number | null;
  notices: string[];
}

export interface GeneratedRouteRequest {
  startPoint: [number, number] | null;
  targetDistanceKm: number;
  style: GeneratedRouteStyle;
  variationLevel: number;
  seed: number;
  routePlanningPreferences: RoutePlanningPreferences;
}

export interface GeneratedRouteSuggestion {
  waypoints: [number, number][];
  preview: RoutePreview;
  sourceName: string;
  sourceType: string;
  strategy: string;
  style: GeneratedRouteStyle;
  seed: number;
}

export interface CreateRouteRequest {
  name: string;
  description?: string;
  waypoints: RouteWaypoint[];
  polyline: [number, number][];
  elevations: number[];
}

export interface ElevationPoint {
  distance: number;
  elevation: number;
  gradient: number;
}
