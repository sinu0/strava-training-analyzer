import { describe, expect, it } from 'vitest';

import {
  decodePolyline,
  extractActivityRoutePositions,
  extractGeoJsonRoutePositions,
} from '../utils/map';

import type { GeoJsonFeature } from '../types/activity';

describe('map utils', () => {
  it('extracts coordinates from a feature collection', () => {
    const geoJson: GeoJsonFeature = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [19.94, 50.06],
              [19.95, 50.07],
            ],
          },
          properties: {},
        },
      ],
    };

    expect(extractGeoJsonRoutePositions(geoJson)).toEqual([
      [50.06, 19.94],
      [50.07, 19.95],
    ]);
  });

  it('falls back to GPS streams when geojson is missing', () => {
    expect(
      extractActivityRoutePositions({
        geoJson: null,
        latStream: [50.06, 50.07, 50.08],
        lngStream: [19.94, 19.95, 19.96],
        summaryPolyline: null,
      }),
    ).toEqual([
      [50.06, 19.94],
      [50.07, 19.95],
      [50.08, 19.96],
    ]);
  });

  it('falls back to summary polyline when no richer route data exists', () => {
    const positions = extractActivityRoutePositions({
      geoJson: null,
      latStream: null,
      lngStream: null,
      summaryPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    });

    expect(positions).toEqual(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@'));
  });
});
