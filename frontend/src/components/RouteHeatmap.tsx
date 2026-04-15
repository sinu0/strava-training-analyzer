import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import * as L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import { MAP_TILE_CONFIG } from '../constants/mapTiles';
import { useRouteHeatmap } from '../hooks/useActivities';
import {
  ROUTE_HEATMAP_COLORS,
  STATUS_COLORS,
  UI_COLORS,
  alphaColor,
} from '../utils/colors';

import type { HeatmapSegmentData } from '../types/activity';

const DEFAULT_CENTER: [number, number] = [50.0647, 19.945];

const COLOR_STOPS = ROUTE_HEATMAP_COLORS;

interface ChainedSegment {
  path: [number, number][];
  count: number;
}

// Kept as exported utility for backward compatibility
export function toRelativeLayerPoint(
  point: { x: number; y: number },
  topLeft: { x: number; y: number },
) {
  return { x: point.x - topLeft.x, y: point.y - topLeft.y };
}

// ── colour helpers ────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const n = hex.replace('#', '');
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function toHex(v: number) {
  return Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
}

export function colorForCount(count: number, maxCount: number): string {
  const ratio = maxCount > 1 ? (count - 1) / (maxCount - 1) : 0;
  const upperIdx = COLOR_STOPS.findIndex(s => ratio <= s.stop);
  if (upperIdx === 0) return COLOR_STOPS[0]!.color;
  if (upperIdx === -1) return COLOR_STOPS[COLOR_STOPS.length - 1]!.color;
  const lo = COLOR_STOPS[upperIdx - 1]!;
  const hi = COLOR_STOPS[upperIdx]!;
  const t = hi.stop > lo.stop ? (ratio - lo.stop) / (hi.stop - lo.stop) : 0;
  const a = hexToRgb(lo.color);
  const b = hexToRgb(hi.color);
  return `#${toHex(a.r + (b.r - a.r) * t)}${toHex(a.g + (b.g - a.g) * t)}${toHex(a.b + (b.b - a.b) * t)}`;
}

// ── chainSegments — kept exported for tests ───────────────────────────────────
function endpointKey(lat: number, lon: number): string {
  return `${lat.toFixed(5)}|${lon.toFixed(5)}`;
}

export function chainSegments(rawSegments: HeatmapSegmentData[]): ChainedSegment[] {
  if (rawSegments.length === 0) return [];

  const adjacency = new Map<string, { neighborKey: string; segIdx: number }[]>();
  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i]!;
    const keyA = endpointKey(seg.lat1, seg.lon1);
    const keyB = endpointKey(seg.lat2, seg.lon2);
    if (!adjacency.has(keyA)) adjacency.set(keyA, []);
    if (!adjacency.has(keyB)) adjacency.set(keyB, []);
    adjacency.get(keyA)!.push({ neighborKey: keyB, segIdx: i });
    adjacency.get(keyB)!.push({ neighborKey: keyA, segIdx: i });
  }

  const coordByKey = new Map<string, [number, number]>();
  for (const seg of rawSegments) {
    coordByKey.set(endpointKey(seg.lat1, seg.lon1), [seg.lat1, seg.lon1]);
    coordByKey.set(endpointKey(seg.lat2, seg.lon2), [seg.lat2, seg.lon2]);
  }

  const isStartPoint = (key: string) => (adjacency.get(key)?.length ?? 0) !== 2;
  const visitedEdges = new Set<number>();
  const chains: ChainedSegment[] = [];

  const traceChain = (startKey: string, firstEdgeIdx: number): ChainedSegment => {
    const path: [number, number][] = [];
    let maxCount = 0;
    let currentKey = startKey;
    let edgeIdx = firstEdgeIdx;
    path.push(coordByKey.get(currentKey)!);

    while (true) {
      visitedEdges.add(edgeIdx);
      const seg = rawSegments[edgeIdx]!;
      maxCount = Math.max(maxCount, seg.count);
      const keyA = endpointKey(seg.lat1, seg.lon1);
      const keyB = endpointKey(seg.lat2, seg.lon2);
      const nextKey = currentKey === keyA ? keyB : keyA;
      path.push(coordByKey.get(nextKey)!);
      if (isStartPoint(nextKey)) break;
      const nextEdge = adjacency.get(nextKey)!.find(n => !visitedEdges.has(n.segIdx));
      if (!nextEdge) break;
      currentKey = nextKey;
      edgeIdx = nextEdge.segIdx;
    }
    return { path, count: maxCount };
  };

  for (const [key, neighbors] of adjacency.entries()) {
    if (!isStartPoint(key)) continue;
    for (const { segIdx } of neighbors) {
      if (visitedEdges.has(segIdx)) continue;
      chains.push(traceChain(key, segIdx));
    }
  }

  for (let i = 0; i < rawSegments.length; i++) {
    if (visitedEdges.has(i)) continue;
    const seg = rawSegments[i]!;
    chains.push(traceChain(endpointKey(seg.lat1, seg.lon1), i));
  }

  chains.sort((a, b) => a.count - b.count);
  return chains;
}

// ── BoundsFitter ──────────────────────────────────────────────────────────────
function BoundsFitter({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);
  return null;
}

// ── StatsOverlay ──────────────────────────────────────────────────────────────
interface StatsOverlayProps {
  routeCount: number;
  totalDistanceKm: number;
  uniqueKm: number;
  maxCount: number;
}

function StatsOverlay({ routeCount, totalDistanceKm, uniqueKm, maxCount }: StatsOverlayProps) {
  const rows = [
    { label: 'Łącznie', value: `${Math.round(totalDistanceKm)} km` },
    { label: 'Unikalne drogi', value: `~${uniqueKm} km` },
    { label: 'Tras', value: String(routeCount) },
    { label: 'Maks. freq.', value: `${maxCount}×` },
  ];

  return (
    <Box
      data-testid="heatmap-stats"
      sx={{
        position: 'absolute',
        bottom: 20,
        left: 12,
        zIndex: 1000,
        bgcolor: alphaColor(UI_COLORS.backgroundDefault, 0.88),
        border: `1px solid ${alphaColor(STATUS_COLORS.accent, 0.35)}`,
        borderRadius: 2.5,
        p: 1.5,
        backdropFilter: 'blur(8px)',
        minWidth: 160,
      }}
    >
      <Stack spacing={0.5}>
        {rows.map(({ label, value }) => (
          <Stack key={label} direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              {label}
            </Typography>
            <Typography variant="caption" sx={{ color: STATUS_COLORS.accent, fontWeight: 600, fontSize: '0.7rem' }}>
              {value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function LegendOverlay() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1000,
        bgcolor: alphaColor(UI_COLORS.backgroundDefault, 0.88),
        border: `1px solid ${alphaColor(STATUS_COLORS.accent, 0.2)}`,
        borderRadius: 2.5,
        p: 1.5,
        backdropFilter: 'blur(8px)',
        minWidth: 220,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Intensywność odcinków
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
        {COLOR_STOPS.map((stop) => (
          <Box
            key={stop.stop}
            sx={{
              flex: 1,
              height: 10,
              borderRadius: 999,
              bgcolor: stop.color,
            }}
          />
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          Rzadziej
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Częściej
        </Typography>
      </Stack>
    </Box>
  );
}

// ── RouteHeatmap (default export) ─────────────────────────────────────────────
export default function RouteHeatmap() {
  const { data, isLoading } = useRouteHeatmap();

  if (isLoading) {
    return (
      <Box
        data-testid="heatmap-loading"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 500 }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={40} sx={{ color: STATUS_COLORS.accent }} />
          <Typography variant="body2" color="text.secondary">
            Ładowanie mapy…
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (data?.status === 'rebuilding') {
    return (
      <Box
        data-testid="heatmap-rebuilding"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 500 }}
        >
          <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} sx={{ color: STATUS_COLORS.accent }} />
          <Typography variant="body2" color="text.secondary">
            Przebudowuję heatmapę…
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Pierwsze uruchomienie może potrwać kilka minut
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!data || data.segments.length === 0) {
    return (
      <Box
        data-testid="heatmap-empty"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 500 }}
      >
        <Stack alignItems="center" spacing={1}>
          <Typography variant="h6" color="text.secondary">Brak tras</Typography>
          <Typography variant="body2" color="text.secondary">
            Zsynchronizuj aktywności, aby zobaczyć mapę.
          </Typography>
        </Stack>
      </Box>
    );
  }

  const uniqueKm = Math.round(data.segments.length * 0.00027 * 111.32);
  const leafletBounds: L.LatLngBoundsExpression | null = data.bounds
    ? [[data.bounds.south, data.bounds.west], [data.bounds.north, data.bounds.east]]
    : null;

  return (
    <Box data-testid="route-heatmap" sx={{ position: 'relative', height: '100%', minHeight: 500 }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url={MAP_TILE_CONFIG.standard.url}
          attribution={MAP_TILE_CONFIG.standard.attribution}
        />
        <TileLayer
          url="/api/activities/heatmap/tile/{z}/{x}/{y}.png"
          opacity={0.85}
          maxZoom={18}
        />
        {!!leafletBounds && <BoundsFitter bounds={leafletBounds} />}
      </MapContainer>
      <StatsOverlay
        routeCount={data.routeCount}
        totalDistanceKm={data.totalDistanceKm}
        uniqueKm={uniqueKm}
        maxCount={data.maxCount}
      />
      <LegendOverlay />
    </Box>
  );
}
