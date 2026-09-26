import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Box, Button, Chip, FormControl, FormControlLabel, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Pagination, Select, Stack, Switch, TextField, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import { segmentsMessages } from '@/features/segments/messages';
import { useBackfillStatus, useSegments, useSetSegmentFavorite, useStartBackfill } from '@/hooks/useSegments';
import { EmptyState, ErrorState, LoadingState, Metric, Page, Surface } from '@/ui';
import { describeBackfillStatus, isBackfillBusy } from '@/utils/backfillStatus';

function duration(seconds?: number | null) {
  if (seconds == null) return '—';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function SegmentsPage() {
  const t = segmentsMessages.useT();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const favorite = params.get('favorite') === 'true';
  const distance = params.get('distance') ?? 'all';
  const climbs = params.get('climbs') === 'true';
  const sort = params.get('sort') ?? 'recent';
  const page = Math.max(0, Number(params.get('page') ?? 0));
  const segments = useSegments({
    q: query || undefined,
    favorite: favorite || undefined,
    minDistanceM: distance === 'medium' ? 1000 : distance === 'long' ? 5000 : undefined,
    maxDistanceM: distance === 'short' ? 1000 : distance === 'medium' ? 5000 : undefined,
    minAverageGrade: climbs ? 3 : undefined,
    sort,
    page,
    size: 30,
  });
  const backfill = useBackfillStatus('segments');
  const routeBackfill = useBackfillStatus('routes');
  const startBackfill = useStartBackfill();
  const favoriteMutation = useSetSegmentFavorite();
  const update = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key); else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <Page title={t('list.title')} subtitle={t('list.subtitle')} maxWidth={1200}>
      <Surface padding="sm" sx={{ mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{
          alignItems: { md: 'center' }
        }}>
          <TextField fullWidth label={t('list.searchLabel')} value={query} onChange={event => update('q', event.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} />
          <FormControl sx={{ minWidth: 190 }}><InputLabel id="segment-sort-label">{t('list.sortLabel')}</InputLabel>
            <Select labelId="segment-sort-label" label={t('list.sortLabel')} value={sort} onChange={event => update('sort', event.target.value)}>
              <MenuItem value="recent">{t('list.sortOptions.recent')}</MenuItem><MenuItem value="attempts">{t('list.sortOptions.attempts')}</MenuItem>
              <MenuItem value="distance">{t('list.sortOptions.distance')}</MenuItem><MenuItem value="best">{t('list.sortOptions.best')}</MenuItem><MenuItem value="name">{t('list.sortOptions.name')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 175 }}><InputLabel id="segment-distance-label">{t('list.distanceLabel')}</InputLabel>
            <Select labelId="segment-distance-label" label={t('list.distanceLabel')} value={distance} onChange={event => update('distance', event.target.value === 'all' ? undefined : event.target.value)}>
              <MenuItem value="all">{t('list.distanceOptions.all')}</MenuItem><MenuItem value="short">{t('list.distanceOptions.short')}</MenuItem>
              <MenuItem value="medium">{t('list.distanceOptions.medium')}</MenuItem><MenuItem value="long">{t('list.distanceOptions.long')}</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel control={<Switch checked={favorite} onChange={event => update('favorite', event.target.checked ? 'true' : undefined)} />} label={t('list.favoriteOnly')} />
          <FormControlLabel control={<Switch checked={climbs} onChange={event => update('climbs', event.target.checked ? 'true' : undefined)} />} label={t('list.climbsOnly')} />
        </Stack>
      </Surface>

      {!!backfill.data && backfill.data.status !== 'COMPLETED' && (
        <Surface padding="sm" sx={{ mb: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{
            alignItems: { sm: 'center' }
          }}>
            <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>{t('list.segmentsBackfillTitle', { status: describeBackfillStatus(backfill.data) })}</Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>{t('list.progressCapability', { processed: backfill.data.processed, total: backfill.data.total, capability: backfill.data.capability })}</Typography></Box>
            <Button variant="contained" disabled={isBackfillBusy(backfill.data.status) || startBackfill.isPending} onClick={() => startBackfill.mutate('segments')}>{t('list.runResume')}</Button>
          </Stack>
        </Surface>
      )}

      {!!routeBackfill.data && routeBackfill.data.status !== 'COMPLETED' && (
        <Surface padding="sm" sx={{ mb: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{
            alignItems: { sm: 'center' }
          }}>
            <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>{t('list.routesBackfillTitle', { status: describeBackfillStatus(routeBackfill.data) })}</Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>{t('list.progressLocal', { processed: routeBackfill.data.processed, total: routeBackfill.data.total })}</Typography></Box>
            <Button variant="outlined" disabled={isBackfillBusy(routeBackfill.data.status) || startBackfill.isPending} onClick={() => startBackfill.mutate('routes')}>{t('list.runResume')}</Button>
          </Stack>
        </Surface>
      )}

      {!!segments.isLoading && <LoadingState message={t('list.loading')} />}
      {!!segments.isError && <ErrorState message={t('list.loadError')} onRetry={() => void segments.refetch()} />}
      {segments.data?.items.length === 0 && <EmptyState title={t('list.emptyTitle')} description={t('list.emptyDescription')} />}
      <Grid container spacing={1.5}>
        {segments.data?.items.map(segment => (
          <Grid key={segment.id} size={{ xs: 12, md: 6 }}>
            <Surface padding="sm" interactive sx={{ height: '100%' }}>
              <Stack direction="row" spacing={1} sx={{
                alignItems: "flex-start"
              }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography component="h2" variant="h6"><Box component="a" href={`/segments/${segment.id}`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>{segment.name}</Box></Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    useFlexGap
                    sx={{
                      flexWrap: "wrap",
                      mt: 0.5
                    }}>
                    {!!segment.city && <Chip size="small" label={segment.city} />}
                    <Chip size="small" variant="outlined" label={t('list.attempts', { count: segment.effortCount })} />
                  </Stack>
                </Box>
                <IconButton aria-label={segment.localFavorite ? t('list.removeFavorite', { name: segment.name }) : t('list.addFavorite', { name: segment.name })} onClick={() => favoriteMutation.mutate({ id: segment.id, favorite: !segment.localFavorite })}>
                  {segment.localFavorite ? <StarRoundedIcon color="warning" /> : <StarBorderRoundedIcon />}
                </IconButton>
              </Stack>
              <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                <Grid size={4}><Metric label={t('list.metricDistance')} value={segment.distanceM != null ? `${(segment.distanceM / 1000).toFixed(2)} km` : '—'} /></Grid>
                <Grid size={4}><Metric label={t('list.metricGrade')} value={segment.averageGrade != null ? `${segment.averageGrade.toFixed(1)}%` : '—'} /></Grid>
                <Grid size={4}><Metric label={t('list.metricBest')} value={duration(segment.bestElapsedTimeSec)} tone="primary" /></Grid>
              </Grid>
            </Surface>
          </Grid>
        ))}
      </Grid>
      {(segments.data?.totalPages ?? 0) > 1 && <Pagination sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} page={page + 1} count={segments.data?.totalPages ?? 1} onChange={(_, value) => update('page', String(value - 1))} />}
    </Page>
  );
}
