import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Grid, Radio, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import SegmentComparisonVisual from '@/components/segments/SegmentComparisonVisual';
import SegmentProgressChart from '@/components/segments/SegmentProgressChart';
import SegmentRankTrophy from '@/components/segments/SegmentRankTrophy';
import SegmentRouteMap from '@/components/segments/SegmentRouteMap';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import { useSegment, useSegmentComparison } from '@/hooks/useSegments';

function duration(seconds?: number | null) { return seconds == null ? '—' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }

export default function SegmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const detail = useSegment(id);
  const initialEffort = params.get('effort');
  const fromActivity = params.get('fromActivity');
  const [selected, setSelected] = useState<string[]>([]);
  const [reference, setReference] = useState<string>();
  useEffect(() => {
    if (!detail.data || selected.length) return;
    const first = initialEffort && detail.data.efforts.some(effort => effort.id === initialEffort)
      ? initialEffort : detail.data.efforts[0]?.id;
    if (first) { setSelected([first]); setReference(first); }
  }, [detail.data, initialEffort, selected.length]);
  const comparison = useSegmentComparison(id, selected, reference);
  const backPath = fromActivity ? `/activities/${fromActivity}?tab=segments` : '/segments';
  const toggle = (effortId: string) => {
    setSelected(current => {
      if (current.includes(effortId)) {
        const next = current.filter(idValue => idValue !== effortId);
        if (reference === effortId) setReference(next[0]);
        return next;
      }
      return current.length < 3 ? [...current, effortId] : current;
    });
  };
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  if (detail.isLoading) return <LoadingState message="Ładowanie segmentu…" />;
  if (detail.isError || !detail.data) return <ErrorState title="Nie znaleziono segmentu" message="Nie udało się wczytać danych segmentu." />;
  const { segment, efforts } = detail.data;
  return (
    <PageContainer title={segment.name} subtitle={[segment.city, segment.country].filter(Boolean).join(' · ') || 'Własne próby segmentowe'} maxWidth={1200}
      breadcrumbs={[{ label: 'Segmenty', href: '/segments' }, { label: segment.name }]}
      actions={<Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(backPath)}>{fromActivity ? 'Wróć do aktywności' : 'Katalog'}</Button>}>
      {!detail.data.personalBestConfirmed && <Alert severity="warning" sx={{ mb: 2 }}>Historyczny backfill nie jest ukończony. Rekordy oznaczamy jako „najlepsze w dostępnych danych”.</Alert>}
      <PerformanceSurface accent sx={{ p: { xs: 2, md: 2.5 }, mb: 2 }}>
        <Grid container spacing={2}><Grid size={{ xs: 6, md: 2.4 }}><MetricReadout label="Dystans" value={segment.distanceM != null ? `${(segment.distanceM / 1000).toFixed(2)} km` : '—'} /></Grid>
          <Grid size={{ xs: 6, md: 2.4 }}><MetricReadout label="Najlepszy czas" value={duration(segment.bestElapsedTimeSec)} tone="primary" /></Grid>
          <Grid size={{ xs: 6, md: 2.4 }}><MetricReadout label="Własne próby" value={String(segment.effortCount)} /></Grid>
          <Grid size={{ xs: 6, md: 2.4 }}><MetricReadout label="Śr. nachylenie" value={segment.averageGrade != null ? `${segment.averageGrade.toFixed(1)}%` : '—'} /></Grid>
          <Grid size={{ xs: 6, md: 2.4 }}><MetricReadout label="Różnica wysokości" value={segment.elevationHighM != null && segment.elevationLowM != null ? `${Math.round(segment.elevationHighM - segment.elevationLowM)} m` : '—'} /></Grid>
        </Grid>
      </PerformanceSurface>
      {!!segment.routePolyline && <PerformanceSurface sx={{ mb: 2 }}><SegmentRouteMap routes={[{ id: segment.id, label: segment.name, polyline: segment.routePolyline }]} ariaLabel={`Mapa segmentu ${segment.name}`} /></PerformanceSurface>}
      {efforts.length > 0 && <PerformanceSurface sx={{ p: { xs: 1.5, md: 2.5 }, mb: 2 }}>
        <SegmentProgressChart efforts={efforts} />
      </PerformanceSurface>}
      <PerformanceSurface sx={{ p: { xs: 1.5, md: 2.5 }, mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}><CompareArrowsRoundedIcon color="primary" /><Typography variant="h6">Porównanie prób</Typography><Chip size="small" label={`${selected.length}/3`} /></Stack>
        {!!comparison.isLoading && <LoadingState message="Wyrównywanie prób po dystansie…" />}
        {!!comparison.isError && <ErrorState message="Nie udało się porównać prób." onRetry={() => void comparison.refetch()} />}
        {!!comparison.data && <SegmentComparisonVisual comparison={comparison.data} />}
      </PerformanceSurface>
      <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>Historia własnych prób</Typography>
      {efforts.length === 0 ? <EmptyState title="Brak prób" /> : <Stack spacing={1}>
        {efforts.map(effort => <PerformanceSurface key={effort.id} sx={{ p: 1.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1.5}>
            <FormControlLabel control={<Checkbox checked={selectedSet.has(effort.id)} disabled={!selectedSet.has(effort.id) && selected.length >= 3} onChange={() => toggle(effort.id)} />} label="Porównaj" />
            <FormControlLabel control={<Radio checked={reference === effort.id} disabled={!selectedSet.has(effort.id)} onChange={() => setReference(effort.id)} />} label="Odniesienie" />
            <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>{new Date(effort.startedAt).toLocaleString('pl-PL')}</Typography><Typography variant="body2" color="text.secondary">{effort.activityName}</Typography></Box>
            <SegmentRankTrophy rank={effort.personalRank} />
            <Typography sx={{ minWidth: 72, fontWeight: 900 }}>{duration(effort.elapsedTimeSec)}</Typography>
            <Typography variant="body2">{effort.averagePowerW ?? '—'} W · {effort.averageHeartrate ?? '—'} bpm · {effort.averageCadence ?? '—'} rpm</Typography>
            <Button onClick={() => navigate(`/activities/${effort.activityId}?tab=segments`)}>Aktywność</Button>
          </Stack>
        </PerformanceSurface>)}
      </Stack>}
    </PageContainer>
  );
}
