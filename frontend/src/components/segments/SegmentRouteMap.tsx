import { Box, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';

import { DEFAULT_MAP_TILE_VARIANT, MAP_TILE_CONFIG } from '@/constants/mapTiles';
import { decodePolyline } from '@/utils/map';

import 'leaflet/dist/leaflet.css';

interface RouteItem {
  id: string | number;
  label: string;
  polyline?: string | null;
  positions?: [number, number][];
  color?: string;
  weight?: number;
  interactive?: boolean;
}

interface SegmentRouteMapProps {
  routes: RouteItem[];
  highlightedId?: string | number | null;
  markers?: { id: string | number; position: [number, number]; color: string }[];
  onOpen?: (id: string | number) => void;
  height?: number;
  ariaLabel?: string;
}

function FitRoutes({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) map.fitBounds(positions, { padding: [24, 24], maxZoom: 16 });
    window.requestAnimationFrame(() => map.invalidateSize(false));
  }, [map, positions]);
  return null;
}

export default function SegmentRouteMap({
  routes,
  highlightedId,
  markers = [],
  onOpen,
  height = 340,
  ariaLabel = 'Mapa segmentów',
}: SegmentRouteMapProps) {
  const decoded = useMemo(() => routes.map(route => ({
    ...route,
    positions: route.positions ?? (route.polyline ? decodePolyline(route.polyline) : []),
  })).filter(route => route.positions.length > 1), [routes]);
  const allPositions = useMemo(() => decoded.flatMap(route => route.positions), [decoded]);

  if (allPositions.length < 2) {
    return <Box sx={{ height, display: 'grid', placeItems: 'center' }}><Typography color="text.secondary">Brak geometrii segmentu</Typography></Box>;
  }

  return (
    <Box role="img" aria-label={ariaLabel} sx={{ height, '.leaflet-container': { height: '100%', borderRadius: 2 } }}>
      <MapContainer center={allPositions[0]} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer {...MAP_TILE_CONFIG[DEFAULT_MAP_TILE_VARIANT]} />
        {decoded.map((route, index) => {
          const active = route.interactive !== false && String(route.id) === String(highlightedId);
          return (
            <Polyline
              key={route.id}
              positions={route.positions}
              pathOptions={{ color: active ? '#ff6b35' : route.color ?? ['#31c4f3', '#8b5cf6', '#22c55e'][index % 3], weight: active ? 8 : route.weight ?? 5, opacity: active ? 1 : route.interactive === false ? 0.5 : 0.82 }}
              eventHandlers={onOpen && route.interactive !== false ? { click: () => onOpen(route.id) } : undefined}
            ><Tooltip>{route.label}</Tooltip></Polyline>
          );
        })}
        {markers.map(marker => <CircleMarker key={marker.id} center={marker.position} radius={7} pathOptions={{ color: marker.color, fillOpacity: 1 }} />)}
        <FitRoutes positions={allPositions} />
      </MapContainer>
    </Box>
  );
}
