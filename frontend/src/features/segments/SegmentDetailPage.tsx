import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Grid, Radio, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import SegmentComparisonVisual from '@/components/segments/SegmentComparisonVisual';
import SegmentProgressChart from '@/components/segments/SegmentProgressChart';
import SegmentRankTrophy from '@/components/segments/SegmentRankTrophy';
import SegmentRouteMap from '@/components/segments/SegmentRouteMap';
import { segmentsMessages } from '@/features/segments/messages';
import { useSegment, useSegmentComparison } from '@/hooks/useSegments';
import { getLocale } from '@/i18n';
import { EmptyState, ErrorState, LoadingState, Metric, Page, Surface } from '@/ui';

function duration(seconds?: number | null) { return seconds == null ? '—' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }

export default function SegmentDetailPage() {
  const t = segmentsMessages.useT();
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
  if (detail.isLoading) return <LoadingState message={t('detail.loading')} />;
  if (detail.isError || !detail.data) return <ErrorState title={t('detail.notFoundTitle')} message={t('detail.notFoundMessage')} />;
  const { segment, efforts } = detail.data;
  return (
    <Page title={segment.name} subtitle={[segment.city, segment.country].filter(Boolean).join(' · ') || t('detail.defaultSubtitle')} maxWidth={1200}
      breadcrumbs={[{ label: t('detail.breadcrumbCatalog'), href: '/segments' }, { label: segment.name }]}
      actions={<Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(backPath)}>{fromActivity ? t('detail.backToActivity') : t('detail.backToCatalog')}</Button>}>
      {!detail.data.personalBestConfirmed && <Alert severity="warning" sx={{ mb: 2 }}>{t('detail.backfillWarning')}</Alert>}
      <Surface variant="accent" sx={{ mb: 2 }}>
        <Grid container spacing={2}><Grid size={{ xs: 6, md: 2.4 }}><Metric label={t('detail.metricDistance')} value={segment.distanceM != null ? `${(segment.distanceM / 1000).toFixed(2)} km` : '—'} /></Grid>
          <Grid size={{ xs: 6, md: 2.4 }}><Metric label={t('detail.metricBestTime')} value={duration(segment.bestElapsedTimeSec)} tone="primary" /></Grid>
          <Grid size={{ xs: 6, md: 2.4 }}><Metric label={t('detail.metricOwnAttempts')} value={String(segment.effortCount)} /></Grid>
          <Grid size={{ xs: 6, md: 2.4 }}><Metric label={t('detail.metricAvgGrade')} value={segment.averageGrade != null ? `${segment.averageGrade.toFixed(1)}%` : '—'} /></Grid>
          <Grid size={{ xs: 6, md: 2.4 }}><Metric label={t('detail.metricElevationDiff')} value={segment.elevationHighM != null && segment.elevationLowM != null ? `${Math.round(segment.elevationHighM - segment.elevationLowM)} m` : '—'} /></Grid>
        </Grid>
      </Surface>
      {!!segment.routePolyline && <Surface padding="none" sx={{ mb: 2 }}><SegmentRouteMap routes={[{ id: segment.id, label: segment.name, polyline: segment.routePolyline }]} ariaLabel={t('detail.mapAriaLabel', { name: segment.name })} /></Surface>}
      {efforts.length > 0 && <Surface sx={{ mb: 2 }}>
        <SegmentProgressChart efforts={efforts} />
      </Surface>}
      <Surface sx={{ mb: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            mb: 2
          }}><CompareArrowsRoundedIcon color="primary" /><Typography variant="h6">{t('detail.comparisonTitle')}</Typography><Chip size="small" label={`${selected.length}/3`} /></Stack>
        {!!comparison.isLoading && <LoadingState message={t('detail.comparisonLoading')} />}
        {!!comparison.isError && <ErrorState message={t('detail.comparisonError')} onRetry={() => void comparison.refetch()} />}
        {!!comparison.data && <SegmentComparisonVisual comparison={comparison.data} />}
      </Surface>
      <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>{t('detail.historyTitle')}</Typography>
      {efforts.length === 0 ? <EmptyState title={t('detail.emptyEfforts')} /> : <Stack spacing={1}>
        {efforts.map(effort => <Surface padding="sm" key={effort.id}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{
            alignItems: { sm: 'center' }
          }}>
            <FormControlLabel control={<Checkbox checked={selectedSet.has(effort.id)} disabled={!selectedSet.has(effort.id) && selected.length >= 3} onChange={() => toggle(effort.id)} />} label={t('detail.compareLabel')} />
            <FormControlLabel control={<Radio checked={reference === effort.id} disabled={!selectedSet.has(effort.id)} onChange={() => setReference(effort.id)} />} label={t('detail.referenceLabel')} />
            <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>{new Date(effort.startedAt).toLocaleString(getLocale())}</Typography><Typography variant="body2" sx={{
              color: "text.secondary"
            }}>{effort.activityName}</Typography></Box>
            <SegmentRankTrophy rank={effort.personalRank} />
            <Typography sx={{ minWidth: 72, fontWeight: 900 }}>{duration(effort.elapsedTimeSec)}</Typography>
            <Typography variant="body2">{effort.averagePowerW ?? '—'} W · {effort.averageHeartrate ?? '—'} bpm · {effort.averageCadence ?? '—'} rpm</Typography>
            <Button onClick={() => navigate(`/activities/${effort.activityId}?tab=segments`)}>{t('detail.activityButton')}</Button>
          </Stack>
        </Surface>)}
      </Stack>}
    </Page>
  );
}
