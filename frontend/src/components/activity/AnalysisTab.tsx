import { Box, Typography } from '@mui/material';
import { useState, useCallback } from 'react';

import ActivityMap from '@/components/ActivityMap';
import type { ActivityDetail, GeoJsonFeature } from '@/types/activity';
import { extractActivityRoutePositions } from '@/utils/map';

import InteractiveStreamsChart, {
  type BrushRange,
  type SelectionStats,
} from './InteractiveStreamsChart';
import SyncedMap from './SyncedMap';

interface AnalysisTabProps {
  activity: ActivityDetail;
  geoJson: GeoJsonFeature | null;
  hoverIndex?: number | null;
  onHoverIndex?: (idx: number | null) => void;
  selection?: BrushRange | null;
  onSelectionChange?: (range: BrushRange | null, stats: SelectionStats | null) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: '1rem',
        fontWeight: 700,
        color: '#E6EDF3',
        mb: 2,
        mt: 1,
      }}
    >
      {children}
    </Typography>
  );
}

export default function AnalysisTab({
  activity,
  geoJson,
  hoverIndex: hoverIndexProp,
  onHoverIndex: onHoverIndexProp,
  selection: selectionProp,
  onSelectionChange: onSelectionChangeProp,
}: AnalysisTabProps) {
  const hasGps = !!activity.latStream && !!activity.lngStream && activity.latStream.length > 1;
  const fallbackRoutePositions = extractActivityRoutePositions({
    geoJson,
    summaryPolyline: activity.summaryPolyline,
  });
  const hasMap = !hasGps && fallbackRoutePositions.length >= 2;
  const hasStreams = activity.powerStream || activity.heartrateStream || activity.altitudeStream || activity.cadenceStream;

  // local fallback state (when parent does not provide handlers)
  const [localHoverIndex, setLocalHoverIndex] = useState<number | null>(null);
  const [localSelection, setLocalSelection] = useState<BrushRange | null>(null);

  const hoverIndex = hoverIndexProp !== undefined ? hoverIndexProp : localHoverIndex;
  const selection = selectionProp !== undefined ? selectionProp : localSelection;

  const handleHoverIndex = useCallback((idx: number | null) => {
    if (onHoverIndexProp) onHoverIndexProp(idx);
    else setLocalHoverIndex(idx);
  }, [onHoverIndexProp]);

  const handleSelectionChange = useCallback((range: BrushRange | null, stats: SelectionStats | null) => {
    if (onSelectionChangeProp) onSelectionChangeProp(range, stats);
    else setLocalSelection(range);
  }, [onSelectionChangeProp]);

  return (
    <Box>
      {/* Interactive GPS map (synced with chart) */}
      {!!hasGps && (
        <Box
          sx={{
            mb: 3,
            bgcolor: '#161B22',
            borderRadius: 3,
            border: '1px solid #30363D',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, pb: 0 }}>
            <SectionTitle>Mapa trasy</SectionTitle>
          </Box>
          <Box sx={{ p: 1 }}>
            <SyncedMap
              latStream={activity.latStream}
              lngStream={activity.lngStream}
              powerStream={activity.powerStream}
              hoverIndex={hoverIndex}
              selection={selection}
            />
          </Box>
        </Box>
      )}

      {/* Fallback: GeoJSON-based map (no sync) */}
      {!hasGps && !!hasMap && (
        <Box
          sx={{
            mb: 3,
            bgcolor: '#161B22',
            borderRadius: 3,
            border: '1px solid #30363D',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, pb: 0 }}>
            <SectionTitle>Mapa trasy</SectionTitle>
          </Box>
          <Box sx={{ height: 400, '.leaflet-container': { height: '100%' } }}>
            <ActivityMap geoJson={geoJson} summaryPolyline={activity.summaryPolyline} minHeight={400} />
          </Box>
        </Box>
      )}

      {/* Interactive Stream Charts */}
      {!!hasStreams && (
        <Box
          sx={{
            mb: 3,
            bgcolor: '#161B22',
            borderRadius: 3,
            border: '1px solid #30363D',
            p: 3,
          }}
        >
          <SectionTitle>Dane ze strumieni</SectionTitle>
          <InteractiveStreamsChart
            timeStream={activity.timeStream}
            powerStream={activity.powerStream}
            heartrateStream={activity.heartrateStream}
            cadenceStream={activity.cadenceStream}
            altitudeStream={activity.altitudeStream}
            velocityStream={activity.velocityStream}
            distanceStream={activity.distanceStream}
            onHoverIndex={handleHoverIndex}
            onSelectionChange={handleSelectionChange}
          />
        </Box>
      )}

      {/* Empty state */}
      {!hasGps && !hasMap && !hasStreams && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography sx={{ color: '#8B949E' }}>
            Brak danych do analizy dla tej aktywności.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
