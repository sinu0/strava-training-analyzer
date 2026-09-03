import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Box, Button, Chip, FormControl, FormControlLabel, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Pagination, Select, Stack, Switch, TextField, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import { useBackfillStatus, useSegments, useSetSegmentFavorite, useStartBackfill } from '@/hooks/useSegments';

function duration(seconds?: number | null) {
  if (seconds == null) return '—';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function SegmentsPage() {
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
    <PageContainer title="Segmenty" subtitle="Katalog wszystkich segmentów napotkanych w Twoich aktywnościach" maxWidth={1200}>
      <PerformanceSurface sx={{ p: 2, mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField fullWidth label="Szukaj segmentu" value={query} onChange={event => update('q', event.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} />
          <FormControl sx={{ minWidth: 190 }}><InputLabel id="segment-sort-label">Sortowanie</InputLabel>
            <Select labelId="segment-sort-label" label="Sortowanie" value={sort} onChange={event => update('sort', event.target.value)}>
              <MenuItem value="recent">Ostatnio przejechane</MenuItem><MenuItem value="attempts">Liczba prób</MenuItem>
              <MenuItem value="distance">Dystans</MenuItem><MenuItem value="best">Najlepszy czas</MenuItem><MenuItem value="name">Nazwa</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 175 }}><InputLabel id="segment-distance-label">Dystans</InputLabel>
            <Select labelId="segment-distance-label" label="Dystans" value={distance} onChange={event => update('distance', event.target.value === 'all' ? undefined : event.target.value)}>
              <MenuItem value="all">Każdy dystans</MenuItem><MenuItem value="short">Do 1 km</MenuItem>
              <MenuItem value="medium">1–5 km</MenuItem><MenuItem value="long">Powyżej 5 km</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel control={<Switch checked={favorite} onChange={event => update('favorite', event.target.checked ? 'true' : undefined)} />} label="Tylko ulubione" />
          <FormControlLabel control={<Switch checked={climbs} onChange={event => update('climbs', event.target.checked ? 'true' : undefined)} />} label="Podjazdy ≥ 3%" />
        </Stack>
      </PerformanceSurface>

      {!!backfill.data && backfill.data.status !== 'COMPLETED' && (
        <PerformanceSurface sx={{ p: 2, mb: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>Backfill historycznych segmentów: {backfill.data.status}</Typography>
              <Typography variant="body2" color="text.secondary">{backfill.data.processed}/{backfill.data.total} aktywności · capability: {backfill.data.capability}</Typography></Box>
            <Button variant="contained" disabled={['RUNNING', 'RATE_LIMITED'].includes(backfill.data.status) || startBackfill.isPending} onClick={() => startBackfill.mutate('segments')}>Uruchom / wznów</Button>
          </Stack>
        </PerformanceSurface>
      )}

      {!!routeBackfill.data && routeBackfill.data.status !== 'COMPLETED' && (
        <PerformanceSurface sx={{ p: 2, mb: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>Lokalny backfill dopasowanych tras: {routeBackfill.data.status}</Typography>
              <Typography variant="body2" color="text.secondary">{routeBackfill.data.processed}/{routeBackfill.data.total} aktywności · bez wywołań Stravy</Typography></Box>
            <Button variant="outlined" disabled={routeBackfill.data.status === 'RUNNING' || startBackfill.isPending} onClick={() => startBackfill.mutate('routes')}>Uruchom / wznów</Button>
          </Stack>
        </PerformanceSurface>
      )}

      {!!segments.isLoading && <LoadingState message="Ładowanie katalogu segmentów…" />}
      {!!segments.isError && <ErrorState message="Nie udało się pobrać segmentów." onRetry={() => void segments.refetch()} />}
      {segments.data?.items.length === 0 && <EmptyState title="Brak segmentów" description="Uruchom backfill lub zsynchronizuj nową jazdę ze Stravy." />}
      <Grid container spacing={1.5}>
        {segments.data?.items.map(segment => (
          <Grid key={segment.id} size={{ xs: 12, md: 6 }}>
            <PerformanceSurface interactive sx={{ p: 2, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography component="h2" variant="h6"><Box component="a" href={`/segments/${segment.id}`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>{segment.name}</Box></Typography>
                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {!!segment.city && <Chip size="small" label={segment.city} />}
                    <Chip size="small" variant="outlined" label={`${segment.effortCount} ${segment.effortCount === 1 ? 'próba' : 'prób'}`} />
                  </Stack>
                </Box>
                <IconButton aria-label={segment.localFavorite ? `Usuń ${segment.name} z ulubionych` : `Dodaj ${segment.name} do ulubionych`} onClick={() => favoriteMutation.mutate({ id: segment.id, favorite: !segment.localFavorite })}>
                  {segment.localFavorite ? <StarRoundedIcon color="warning" /> : <StarBorderRoundedIcon />}
                </IconButton>
              </Stack>
              <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                <Grid size={4}><MetricReadout label="Dystans" value={segment.distanceM != null ? `${(segment.distanceM / 1000).toFixed(2)} km` : '—'} /></Grid>
                <Grid size={4}><MetricReadout label="Nachylenie" value={segment.averageGrade != null ? `${segment.averageGrade.toFixed(1)}%` : '—'} /></Grid>
                <Grid size={4}><MetricReadout label="Najlepszy" value={duration(segment.bestElapsedTimeSec)} tone="primary" /></Grid>
              </Grid>
            </PerformanceSurface>
          </Grid>
        ))}
      </Grid>
      {(segments.data?.totalPages ?? 0) > 1 && <Pagination sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} page={page + 1} count={segments.data?.totalPages ?? 1} onChange={(_, value) => update('page', String(value - 1))} />}
    </PageContainer>
  );
}
