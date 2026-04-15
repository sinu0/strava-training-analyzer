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

export async function searchGeocodingLocations(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=pl&format=json`;
  const resp = await fetch(url, { signal });

  if (!resp.ok) {
    throw new Error(`Błąd wyszukiwania lokalizacji: ${resp.status}`);
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
    throw new Error(`Błąd pobierania wysokości: ${resp.status}`);
  }

  const data: ElevationApiResponse = await resp.json();
  return data.results.map((r) => r.elevation);
}
