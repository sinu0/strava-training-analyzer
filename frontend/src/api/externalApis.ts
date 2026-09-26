import { defineMessages, getLanguage } from '@/i18n';
export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface GeocodingApiResponse {
  results?: GeocodingResult[];
}

interface ElevationApiResponse {
  results: { elevation: number }[];
}

const { t } = defineMessages({
  pl: {
    geocodingError: 'Błąd wyszukiwania lokalizacji: {status}',
    elevationError: 'Błąd pobierania wysokości: {status}',
  },
  en: {
    geocodingError: 'Location search failed: {status}',
    elevationError: 'Elevation lookup failed: {status}',
  },
});

export async function searchGeocodingLocations(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=${getLanguage()}&format=json`;
  const resp = await fetch(url, { signal });

  if (!resp.ok) {
    throw new Error(t('geocodingError', { status: resp.status }));
  }

  const json: GeocodingApiResponse = await resp.json();
  return json.results ?? [];
}

export async function lookupElevation(
  points: { lat: number; lng: number }[],
  signal?: AbortSignal,
): Promise<number[]> {
  if (points.length === 0) return [];

  const locations = points.map((p) => `${p.lat},${p.lng}`).join('|');
  const url = `https://api.open-elevation.com/api/v1/lookup?locations=${locations}`;
  const resp = await fetch(url, { signal });

  if (!resp.ok) {
    throw new Error(t('elevationError', { status: resp.status }));
  }

  const data: ElevationApiResponse = await resp.json();
  return data.results.map((r) => r.elevation);
}
