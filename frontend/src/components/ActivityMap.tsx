import { Box, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';


import { MAP_TILE_CONFIG, DEFAULT_MAP_TILE_VARIANT } from '../constants/mapTiles';
import { ROUTE_COLORS } from '../utils/colors';
import {
  extractActivityRoutePositions,
  getRouteBounds,
} from '../utils/map';

import type { GeoJsonFeature } from '../types/activity';
import 'leaflet/dist/leaflet.css';

interface ActivityMapProps {
  geoJson?: GeoJsonFeature | null;
  latStream?: number[] | null;
  lngStream?: number[] | null;
  summaryPolyline?: string | null;
  minHeight?: number;
}

function BoundsFitter({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = getRouteBounds(positions);
    if (bounds) {
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
    }
  }, [map, positions]);
  return null;
}

export default function ActivityMap({
  geoJson,
  latStream,
  lngStream,
  summaryPolyline,
  minHeight = 300,
}: ActivityMapProps) {
  const positions = useMemo(
    () => extractActivityRoutePositions({ geoJson, latStream, lngStream, summaryPolyline }),
    [geoJson, latStream, lngStream, summaryPolyline],
  );

  if (positions.length < 2) {
    return (
      <Box
        sx={{
          height: minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">Brak danych mapy</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        minHeight,
        '.leaflet-container': { height: '100%', borderRadius: 1 },
      }}
    >
      <MapContainer
        center={positions[Math.floor(positions.length / 2)] ?? [50.0, 19.9]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        preferCanvas={true}
      >
        <TileLayer
          attribution={MAP_TILE_CONFIG[DEFAULT_MAP_TILE_VARIANT].attribution}
          url={MAP_TILE_CONFIG[DEFAULT_MAP_TILE_VARIANT].url}
        />
        <Polyline positions={positions} pathOptions={{ color: ROUTE_COLORS.path, weight: 4, opacity: 0.92 }} />
        <BoundsFitter positions={positions} />
      </MapContainer>
    </Box>
  );
}
