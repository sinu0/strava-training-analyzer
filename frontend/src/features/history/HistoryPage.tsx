import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ActivityListCardV2 from '@/components/activity/ActivityListCardV2';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';

import { useHistoryActivities } from './useHistory';

const RouteHeatmap = lazy(() => import('@/components/RouteHeatmap'));
type HistoryView = 'list' | 'calendar' | 'map';

function dateBoundary(value: string | null, end = false) {
  if (!value) return undefined;
  return `${value}T${end ? '23:59:59' : '00:00:00'}Z`;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const rawView = params.get('view');
  const view: HistoryView = rawView === 'calendar' || rawView === 'map' ? rawView : 'list';
  const page = Math.max(0, Number(params.get('page') ?? 0));
  const sportType = params.get('sportType') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const activities = useHistoryActivities({
    page,
    size: view === 'calendar' ? 100 : 20,
    sportType: sportType || undefined,
    from: dateBoundary(from),
    to: dateBoundary(to, true),
  }, view !== 'map');

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const content = () => {
    if (view === 'map') {
      return (
        <Suspense fallback={<LoadingState message="Ładowanie mapy historii…" />}>
          <RouteHeatmap />
        </Suspense>
      );
    }
    if (activities.isLoading) return <LoadingState message="Ładowanie historii…" />;
    if (activities.isError) return <ErrorState message="Nie udało się pobrać aktywności." onRetry={() => void activities.refetch()} />;
    if (!activities.data?.items.length) return <EmptyState title="Brak aktywności" description="Zmień filtry albo uruchom synchronizację Stravy." />;

    if (view === 'calendar') {
      const grouped = activities.data.items.reduce((result, item) => {
        const date = item.startedAt.slice(0, 10);
        const entries = result.get(date) ?? [];
        entries.push(item);
        result.set(date, entries);
        return result;
      }, new Map<string, typeof activities.data.items>());
      return (
        <Grid container spacing={1.5}>
          {Array.from(grouped.entries()).map(([date, items]) => (
            <Grid item xs={12} sm={6} lg={4} key={date}>
              <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <Typography variant="overline" color="text.secondary">{new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {items.map(item => (
                    <Button key={item.id} variant="text" onClick={() => navigate(`/activities/${item.id}`)} sx={{ justifyContent: 'flex-start' }}>
                      {item.name}
                    </Button>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {activities.data.total} aktywności · mapy wykorzystują lekką geometrię podsumowania
          </Typography>
          <Typography variant="caption" color="text.secondary">Strona {page + 1} z {activities.data.totalPages}</Typography>
        </Stack>
        {activities.data.items.map((activity, index) => (
          <ActivityListCardV2
            key={activity.id}
            activity={activity}
            priority={index < 2}
            onOpen={activityId => navigate(`/activities/${activityId}`)}
          />
        ))}
        {activities.data.totalPages > 1 && (
          <Pagination
            count={activities.data.totalPages}
            page={page + 1}
            onChange={(_, value) => updateParam('page', String(value - 1))}
            sx={{ alignSelf: 'center', pt: 2 }}
          />
        )}
      </Stack>
    );
  };

  return (
    <PageContainer
      title="Historia treningów"
      subtitle="Trasy, liczby i kontekst każdej sesji. Mapa jest widoczna od razu, strumienie dopiero w szczególe."
      maxWidth={1320}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          mb: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <TuneOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Widok i filtry</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
          <ToggleButtonGroup
            exclusive
            value={view}
            onChange={(_, value: HistoryView | null) => value && updateParam('view', value)}
            size="small"
            aria-label="Sposób prezentacji historii"
          >
            <ToggleButton value="list"><ListAltOutlinedIcon sx={{ mr: 0.75 }} />Lista</ToggleButton>
            <ToggleButton value="calendar"><CalendarMonthOutlinedIcon sx={{ mr: 0.75 }} />Kalendarz</ToggleButton>
            <ToggleButton value="map"><MapOutlinedIcon sx={{ mr: 0.75 }} />Mapa</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sport-filter-label">Sport</InputLabel>
            <Select labelId="sport-filter-label" label="Sport" value={sportType} onChange={event => updateParam('sportType', event.target.value)}>
              <MenuItem value="">Wszystkie</MenuItem>
              <MenuItem value="cycling">Rower</MenuItem>
              <MenuItem value="virtual_ride">Wirtualna jazda</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="Od" value={from} onChange={event => updateParam('from', event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="Do" value={to} onChange={event => updateParam('to', event.target.value)} InputLabelProps={{ shrink: true }} />
          {(sportType || from || to) ? (
            <Button
              startIcon={<RestartAltOutlinedIcon />}
              onClick={() => setParams(view === 'list' ? {} : { view })}
              sx={{ ml: { lg: 'auto' } }}
            >
              Wyczyść filtry
            </Button>
          ) : null}
        </Stack>
      </Paper>
      {content()}
    </PageContainer>
  );
}
