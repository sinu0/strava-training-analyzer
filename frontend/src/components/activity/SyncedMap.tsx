import { Box, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { DEFAULT_MAP_TILE_VARIANT, MAP_TILE_CONFIG } from '@/constants/mapTiles';

import type { BrushRange } from './InteractiveStreamsChart';
import type { LatLngBoundsExpression } from 'leaflet';

interface SyncedMapProps {
  latStream: number[] | null;
  lngStream: number[] | null;
  powerStream?: number[] | null;
  hoverIndex: number | null;
  selection: BrushRange | null;
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
  }, [map, bounds]);
  return null;
}

export default function SyncedMap({ latStream, lngStream, powerStream, hoverIndex, selection }: SyncedMapProps) {
  if (!latStream || !lngStream || latStream.length < 2) {
    return (
      <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Brak danych GPS</Typography>
      </Box>
    );
  }

  // After the null check above, latStream and lngStream are guaranteed non-null
  const lat = latStream;
  const lng = lngStream;

  // Build a sampled route and sampled power values (when available)
  const sampled = useMemo(() => {
    const positions: [number, number][] = [];
    const powerSamples: number[] = [];
    const indices: number[] = [];
    const step = Math.max(1, Math.floor(lat.length / 2000));
    for (let i = 0; i < lat.length; i += step) {
      indices.push(i);
      positions.push([lat[i]!, lng[i]!]);
      powerSamples.push(0);
    }
    const last = lat.length - 1;
    if (indices[indices.length - 1] !== last) {
      indices.push(last);
      positions.push([lat[last]!, lng[last]!]);
      powerSamples.push(0);
    }

    return { positions, powerSamples, indices };
  }, [lat, lng, powerStream]);

  // now populate powerSamples based on provided powerStream (matching sampled indices)
  const sampledWithPower = useMemo(() => {
    if (!Array.isArray(powerStream)) return sampled;
    const ps = sampled.powerSamples.slice();
    const stream = powerStream as number[];
    for (let i = 0; i < sampled.indices.length; i++) {
      const idx = sampled.indices[i]!;
      ps[i] = stream[idx] ?? 0;
    }
    return { positions: sampled.positions, powerSamples: ps, indices: sampled.indices };
  }, [sampled, powerStream]);

  const fullRoute = sampledWithPower.positions;

  // Build colored segments based on sampled power
  const segments = useMemo(() => {
    const segs: { points: [number, number][]; value: number; color: string }[] = [];
    if (!sampledWithPower.positions.length) return segs;
    const values = sampledWithPower.powerSamples;
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    const low = { r: 59, g: 130, b: 246 }; // #3B82F6
    const mid = { r: 255, g: 107, b: 53 }; // #FF6B35
    const high = { r: 217, g: 4, b: 41 }; // #d90429
    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
    const valueToColor = (v: number) => {
      if (maxVal <= minVal) return `rgb(${mid.r},${mid.g},${mid.b})`;
      const t = Math.max(0, Math.min(1, (v - minVal) / (maxVal - minVal)));
      if (t <= 0.5) {
        const tt = t * 2;
        return `rgb(${lerp(low.r, mid.r, tt)},${lerp(low.g, mid.g, tt)},${lerp(low.b, mid.b, tt)})`;
      }
      const tt = (t - 0.5) * 2;
      return `rgb(${lerp(mid.r, high.r, tt)},${lerp(mid.g, high.g, tt)},${lerp(mid.b, high.b, tt)})`;
    };

    for (let i = 0; i < sampledWithPower.positions.length - 1; i++) {
      const p1 = sampledWithPower.positions[i]!;
      const p2 = sampledWithPower.positions[i + 1]!;
      const val = ((sampledWithPower.powerSamples[i] ?? 0) + (sampledWithPower.powerSamples[i + 1] ?? 0)) / 2;
      segs.push({ points: [p1, p2], value: val, color: valueToColor(val) });
    }
    return segs;
  }, [sampledWithPower]);


  const bounds = useMemo((): LatLngBoundsExpression => {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const [la, ln] of fullRoute) {
      if (la < minLat) minLat = la;
      if (la > maxLat) maxLat = la;
      if (ln < minLng) minLng = ln;
      if (ln > maxLng) maxLng = ln;
    }
    return [[minLat, minLng], [maxLat, maxLng]];
  }, [fullRoute]);

  const hoverPoint = useMemo((): [number, number] | null => {
    if (hoverIndex == null || hoverIndex < 0 || hoverIndex >= lat.length) return null;
    return [lat[hoverIndex]!, lng[hoverIndex]!];
  }, [hoverIndex, lat, lng]);

  const selectedSegment = useMemo((): [number, number][] | null => {
    if (!selection) return null;
    const { startIndex, endIndex } = selection;
    const start = Math.max(0, startIndex);
    const end = Math.min(lat.length - 1, endIndex);
    if (end <= start) return null;

    const points: [number, number][] = [];
    const segLen = end - start;
    const step = Math.max(1, Math.floor(segLen / 500));
    for (let i = start; i <= end; i += step) {
      points.push([lat[i]!, lng[i]!]);
    }
    if (points[points.length - 1]?.[0] !== lat[end]) {
      points.push([lat[end]!, lng[end]!]);
    }
    return points;
  }, [selection, lat, lng]);

  return (
    <Box sx={{ height: 350, '.leaflet-container': { height: '100%', borderRadius: '8px' } }}>
      <MapContainer
        center={fullRoute[0]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        preferCanvas={true}
      >
        {/* Use non-interactive static layers for background tiles when zoom/pan is active to improve perf */}
        <TileLayer
          attribution={MAP_TILE_CONFIG[DEFAULT_MAP_TILE_VARIANT].attribution}
          url={MAP_TILE_CONFIG[DEFAULT_MAP_TILE_VARIANT].url}
        />
        <FitBounds bounds={bounds} />

        {/* Full route - colored by sampled power (segmented) */}
        {segments.length > 0 ? (
          segments.map((s) => (
            <Polyline
              key={`${s.points[0]?.join(',')}-${s.points[s.points.length - 1]?.join(',')}`}
              positions={s.points}
              pathOptions={{
                color: s.color,
                weight: selection ? 2 : 3,
                opacity: selection ? 0.85 : 1,
              }}
            />
          ))
        ) : (
          <Polyline
            positions={fullRoute}
            pathOptions={{
              color: selection ? '#8B949E' : '#FF6B35',
              weight: selection ? 2 : 3,
              opacity: selection ? 0.4 : 0.8,
            }}
          />
        )}

        {/* Selected segment - highlighted */}
        {!!selectedSegment && (
          <Polyline
            positions={selectedSegment}
            pathOptions={{
              color: '#FF6B35',
              weight: 4,
              opacity: 1,
            }}
          />
        )}

        {/* Hover marker */}
        {!!hoverPoint && (
          <CircleMarker
            center={hoverPoint}
            radius={6}
            pathOptions={{
              color: '#FF6B35',
              fillColor: '#FF6B35',
              fillOpacity: 1,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </Box>
  );
}
