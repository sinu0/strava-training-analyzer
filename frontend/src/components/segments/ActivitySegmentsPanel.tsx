import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Box, Button, Chip, Collapse, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import { useActivitySegments } from '@/hooks/useSegments';

import SegmentRankTrophy from './SegmentRankTrophy';
import SegmentRouteMap from './SegmentRouteMap';

interface ActivitySegmentsPanelProps { activityId: string }

function duration(seconds?: number | null) {
  if (seconds == null) return '—';
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}:${String(seconds % 60).padStart(2, '0')}` : `${seconds} s`;
}

export default function ActivitySegmentsPanel({ activityId }: ActivitySegmentsPanelProps) {
  const query = useActivitySegments(activityId);
  const navigate = useNavigate();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState<string | null>(null);
  if (query.isLoading) return <LoadingState message="Ładowanie segmentów aktywności…" />;
  if (query.isError) return <ErrorState message="Nie udało się pobrać segmentów." onRetry={() => void query.refetch()} />;
  const data = query.data;
  if (!data || data.efforts.length === 0) {
    return <EmptyState title="Brak segmentów" description={data?.availability === 'PENDING'
      ? 'Ta aktywność czeka na historyczny backfill segmentów.'
      : 'Strava nie udostępniła prób segmentowych dla tej aktywności.'} />;
  }
  const openEffort = (effortId: string) => {
    const effort = data.efforts.find(item => item.id === effortId);
    if (effort) navigate(`/segments/${effort.segmentId}?effort=${effort.id}&fromActivity=${activityId}`);
  };
  return (
    <Stack spacing={2}>
      {!data.personalBestConfirmed && <Chip color="warning" variant="outlined" label="Rekordy: najlepsze w dostępnych danych — backfill trwa" sx={{ alignSelf: 'flex-start' }} />}
      <PerformanceSurface sx={{ overflow: 'hidden' }}>
        <SegmentRouteMap
          routes={[
            ...(data.routePolyline ? [{ id: 'activity-route', label: 'Pełna trasa aktywności', polyline: data.routePolyline, color: '#64748b', weight: 4, interactive: false }] : []),
            ...data.efforts.map(item => ({ id: item.id, label: item.segmentName, polyline: item.routePolyline })),
          ]}
          highlightedId={highlighted}
          onOpen={id => openEffort(String(id))}
          ariaLabel="Segmenty na trasie aktywności"
        />
      </PerformanceSurface>
      <Stack spacing={1} component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {data.efforts.map((effort, index) => (
          <PerformanceSurface
            key={effort.id}
            component="li"
            onMouseEnter={() => setHighlighted(effort.id)}
            onMouseLeave={() => setHighlighted(null)}
            sx={{ p: 2, borderColor: highlighted === effort.id ? 'primary.main' : undefined }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                  <Typography variant="overline" color="text.secondary">#{index + 1}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{effort.segmentName}</Typography>
                  <SegmentRankTrophy rank={effort.personalRank} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {duration(effort.elapsedTimeSec)} · {effort.personalRank ? `${effort.personalRank}. wśród własnych prób` : 'pozycja nieznana'}
                  {effort.differenceToBestSec != null ? ` · +${effort.differenceToBestSec} s do najlepszego` : ''}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                <Typography variant="body2"><b>{effort.averagePowerW ?? '—'}</b> W</Typography>
                <Typography variant="body2"><b>{effort.averageHeartrate ?? '—'}</b> bpm</Typography>
                <Typography variant="body2"><b>{effort.averageSpeedMs != null ? (effort.averageSpeedMs * 3.6).toFixed(1) : '—'}</b> km/h</Typography>
                <Typography variant="body2"><b>{effort.averageCadence ?? '—'}</b> rpm</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Button
                  aria-label={`${previewed === effort.id ? 'Ukryj' : 'Pokaż'} szybki podgląd segmentu ${effort.segmentName}`}
                  aria-expanded={previewed === effort.id}
                  aria-controls={`segment-preview-${effort.id}`}
                  endIcon={<ExpandMoreRoundedIcon sx={{ transform: previewed === effort.id ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }} />}
                  onClick={() => setPreviewed(current => current === effort.id ? null : effort.id)}
                >Podgląd</Button>
                <Button aria-label={`Otwórz segment ${effort.segmentName}`} endIcon={<ArrowForwardRoundedIcon />} onClick={() => openEffort(effort.id)}>Analizuj</Button>
              </Stack>
            </Stack>
            <Collapse in={previewed === effort.id} unmountOnExit>
              <Box id={`segment-preview-${effort.id}`} sx={{ pt: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Szybki podgląd odcinka</Typography>
                <SegmentRouteMap
                  routes={[{ id: effort.id, label: effort.segmentName, polyline: effort.routePolyline }]}
                  onOpen={() => openEffort(effort.id)}
                  height={220}
                  ariaLabel={`Podgląd mapy segmentu ${effort.segmentName}`}
                />
              </Box>
            </Collapse>
          </PerformanceSurface>
        ))}
      </Stack>
    </Stack>
  );
}
