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
  interactive?: boolean;
  showAttribution?: boolean;
  preview?: boolean;
}

function MapLifecycleSync({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    const bounds = getRouteBounds(positions);

    const syncMapSize = () => {
      map.invalidateSize(false);
      if (bounds) {
        map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
      }
    };

    const frameId = window.requestAnimationFrame(syncMapSize);
    const timeoutId = window.setTimeout(syncMapSize, 140);

    window.addEventListener('resize', syncMapSize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', syncMapSize);
    };
  }, [map, positions]);

  return null;
}

export default function ActivityMap({
  geoJson,
  latStream,
  lngStream,
  summaryPolyline,
  minHeight = 300,
  interactive = true,
  showAttribution = interactive,
  preview = false,
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
      data-testid="activity-map-shell"
      sx={{
        height: minHeight > 0 ? minHeight : '100%',
        minHeight: minHeight > 0 ? minHeight : 0,
        '.leaflet-container': { height: '100%', borderRadius: preview ? 0 : 1 },
        ...(preview ? {
          '.leaflet-tile': {
            filter: 'contrast(1.18) saturate(0.78) brightness(0.72)',
          },
        } : {}),
      }}
    >
      <MapContainer
        center={positions[Math.floor(positions.length / 2)] ?? [50.0, 19.9]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        preferCanvas={true}
        zoomControl={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        scrollWheelZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        attributionControl={showAttribution}
      >
        <TileLayer
          attribution={MAP_TILE_CONFIG[DEFAULT_MAP_TILE_VARIANT].attribution}
          url={MAP_TILE_CONFIG[DEFAULT_MAP_TILE_VARIANT].url}
        />
        <Polyline
          positions={positions}
          pathOptions={{
            color: ROUTE_COLORS.path,
            weight: preview ? 4.5 : 4,
            opacity: 0.96,
          }}
        />
        <MapLifecycleSync positions={positions} />
      </MapContainer>
    </Box>
  );
}
