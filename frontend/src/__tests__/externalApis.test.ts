import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { searchGeocodingLocations, lookupElevation } from '../api/externalApis';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('searchGeocodingLocations', () => {
  it('returns empty array for short queries', async () => {
    const result = await searchGeocodingLocations('a');
    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls geocoding API and returns results', async () => {
    const mockResults = [
      { name: 'Warszawa', latitude: 52.23, longitude: 21.01, country: 'Polska' },
    ];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockResults }),
    });

    const result = await searchGeocodingLocations('Warszawa');

    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0]!;
    expect(call[0]).toContain('geocoding-api.open-meteo.com');
    expect(call[0]).toContain('name=Warszawa');
    expect(call[0]).toContain('language=pl');
    expect(call[1]).toEqual({ signal: undefined });
    expect(result).toEqual(mockResults);
  });

  it('returns empty array when API returns no results key', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await searchGeocodingLocations('xyz');
    expect(result).toEqual([]);
  });

  it('throws on non-200 response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(searchGeocodingLocations('Kraków')).rejects.toThrow(
      'Błąd wyszukiwania lokalizacji: 500',
    );
  });

  it('forwards AbortSignal to fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await searchGeocodingLocations('test', controller.signal);

    expect(fetchMock.mock.calls[0]![1]).toEqual({ signal: controller.signal });
  });

  it('trims whitespace from query', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await searchGeocodingLocations('  Gdańsk  ');

    const url: string = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain('name=Gda%C5%84sk');
  });
});

describe('lookupElevation', () => {
  it('returns empty array for empty points', async () => {
    const result = await lookupElevation([]);
    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls elevation API and returns elevations', async () => {
    const mockResponse = {
      results: [{ elevation: 120 }, { elevation: 340 }],
    };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await lookupElevation([
      { lat: 52.23, lng: 21.01 },
      { lat: 50.06, lng: 19.94 },
    ]);

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain('api.open-elevation.com');
    expect(url).toContain('52.23,21.01|50.06,19.94');
    expect(result).toEqual([120, 340]);
  });

  it('throws on non-200 response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });

    await expect(
      lookupElevation([{ lat: 52.23, lng: 21.01 }]),
    ).rejects.toThrow('Błąd pobierania wysokości: 503');
  });

  it('forwards AbortSignal to fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [{ elevation: 100 }] }),
    });

    await lookupElevation([{ lat: 1, lng: 2 }], controller.signal);

    expect(fetchMock.mock.calls[0]![1]).toEqual({ signal: controller.signal });
  });
});
