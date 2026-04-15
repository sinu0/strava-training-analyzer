import type { GeoJsonFeature } from '../types/activity';

interface ActivityRouteSource {
  geoJson?: GeoJsonFeature | null;
  latStream?: number[] | null;
  lngStream?: number[] | null;
  summaryPolyline?: string | null;
}

function isFiniteCoordinate(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toLatLng(coordinate: number[] | undefined): [number, number] | null {
  const lng = coordinate?.[0];
  const lat = coordinate?.[1];
  if (!isFiniteCoordinate(lat) || !isFiniteCoordinate(lng)) {
    return null;
  }
  return [lat, lng];
}

export function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

export function extractGeoJsonRoutePositions(geoJson?: GeoJsonFeature | null): [number, number][] {
  if (!geoJson) {
    return [];
  }

  if (geoJson.geometry?.coordinates?.length) {
    return geoJson.geometry.coordinates
      .map((coordinate) => toLatLng(coordinate))
      .filter((coordinate): coordinate is [number, number] => coordinate !== null);
  }

  if (geoJson.features?.length) {
    return geoJson.features.flatMap((feature) => extractGeoJsonRoutePositions(feature));
  }

  return [];
}

export function extractStreamRoutePositions(
  latStream?: number[] | null,
  lngStream?: number[] | null,
  maxPoints = 1800,
): [number, number][] {
  if (!latStream || !lngStream) {
    return [];
  }

  const length = Math.min(latStream.length, lngStream.length);
  if (length < 2) {
    return [];
  }

  const positions: [number, number][] = [];
  const step = Math.max(1, Math.floor((length - 1) / Math.max(1, maxPoints - 1)));

  for (let index = 0; index < length; index += step) {
    const lat = latStream[index];
    const lng = lngStream[index];
    if (!isFiniteCoordinate(lat) || !isFiniteCoordinate(lng)) {
      continue;
    }
    positions.push([lat, lng]);
  }

  const lastLat = latStream[length - 1];
  const lastLng = lngStream[length - 1];
  if (
    isFiniteCoordinate(lastLat) &&
    isFiniteCoordinate(lastLng) &&
    (positions.length === 0 ||
      positions[positions.length - 1]?.[0] !== lastLat ||
      positions[positions.length - 1]?.[1] !== lastLng)
  ) {
    positions.push([lastLat, lastLng]);
  }

  return positions;
}

export function extractActivityRoutePositions({
  geoJson,
  latStream,
  lngStream,
  summaryPolyline,
}: ActivityRouteSource): [number, number][] {
  const fromGeoJson = extractGeoJsonRoutePositions(geoJson);
  if (fromGeoJson.length >= 2) {
    return fromGeoJson;
  }

  const fromStreams = extractStreamRoutePositions(latStream, lngStream);
  if (fromStreams.length >= 2) {
    return fromStreams;
  }

  if (summaryPolyline) {
    try {
      const decoded = decodePolyline(summaryPolyline);
      if (decoded.length >= 2) {
        return decoded;
      }
    } catch {
      return [];
    }
  }

  return [];
}

export function getRouteBounds(
  positions: [number, number][],
): [[number, number], [number, number]] | null {
  if (positions.length === 0) {
    return null;
  }

  const latitudes = positions.map(([lat]) => lat);
  const longitudes = positions.map(([, lng]) => lng);

  return [
    [Math.min(...latitudes), Math.min(...longitudes)],
    [Math.max(...latitudes), Math.max(...longitudes)],
  ];
}
