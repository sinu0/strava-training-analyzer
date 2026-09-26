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
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ActivityListCardV2 from '@/components/activity/ActivityListCardV2';
import PolishDateField from '@/components/common/PolishDateField';
import { getLocale } from '@/i18n';
import { EmptyState, ErrorState, LoadingState, Page, Surface } from '@/ui';
import { getPolishPaginationAriaLabel } from '@/utils/accessibility';

import { historyMessages } from './messages';
import { useHistoryActivities } from './useHistory';

const RouteHeatmap = lazy(() => import('@/components/RouteHeatmap'));
type HistoryView = 'list' | 'calendar' | 'map';

function dateBoundary(value: string | null, end = false) {
  if (!value) return undefined;
  return `${value}T${end ? '23:59:59' : '00:00:00'}Z`;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const t = historyMessages.useT();
  const [params, setParams] = useSearchParams();
  const rawView = params.get('view');
  const view: HistoryView = rawView === 'calendar' || rawView === 'map' ? rawView : 'list';
  const page = Math.max(0, Number(params.get('page') ?? 0));
  const sportType = params.get('sportType') ?? '';
  const query = params.get('q')?.trim() ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const activities = useHistoryActivities({
    page,
    size: view === 'calendar' ? 100 : 20,
    sportType: sportType || undefined,
    query: query || undefined,
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
        <Suspense fallback={<LoadingState message={t('page.loadingMap')} />}>
          <RouteHeatmap />
        </Suspense>
      );
    }
    if (activities.isLoading) return <LoadingState message={t('page.loading')} />;
    if (activities.isError) return <ErrorState message={t('page.fetchError')} onRetry={() => void activities.refetch()} />;
    if (!activities.data?.items.length) return <EmptyState title={t('page.emptyTitle')} description={t('page.emptyDescription')} />;

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
            <Grid
              key={date}
              size={{
                xs: 12,
                sm: 6,
                lg: 4
              }}>
              <Surface padding="sm" sx={{ height: '100%' }}>
                <Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>{new Date(date).toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {items.map(item => (
                    <Button key={item.id} variant="text" onClick={() => navigate(`/activities/${item.id}`)} sx={{ justifyContent: 'flex-start' }}>
                      {item.name}
                    </Button>
                  ))}
                </Stack>
              </Surface>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Stack spacing={2}>
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            px: 0.5
          }}>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {t('page.activitiesTotal', { count: activities.data.total })} · {t('page.summaryNote')}
          </Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>{t('page.pageOf', { page: page + 1, total: activities.data.totalPages })}</Typography>
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
            getItemAriaLabel={getPolishPaginationAriaLabel}
            sx={{ alignSelf: 'center', pt: 2 }}
          />
        )}
      </Stack>
    );
  };

  return (
    <Page
      title={t('page.title')}
      subtitle={t('page.subtitle')}
      maxWidth={1320}
    >
      <Surface sx={{ mb: 2.5 }}>
        {query ? (
          <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 700 }}>
            {t('page.resultsFor', { query })}
          </Typography>
        ) : null}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            mb: 1.5
          }}>
          <TuneOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('page.viewAndFilters')}</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
          <ToggleButtonGroup
            exclusive
            value={view}
            onChange={(_, value: HistoryView | null) => value && updateParam('view', value)}
            size="small"
            aria-label={t('page.presentationAriaLabel')}
          >
            <ToggleButton value="list"><ListAltOutlinedIcon sx={{ mr: 0.75 }} />{t('page.viewList')}</ToggleButton>
            <ToggleButton value="calendar"><CalendarMonthOutlinedIcon sx={{ mr: 0.75 }} />{t('page.viewCalendar')}</ToggleButton>
            <ToggleButton value="map"><MapOutlinedIcon sx={{ mr: 0.75 }} />{t('page.viewMap')}</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sport-filter-label">{t('page.sport')}</InputLabel>
            <Select labelId="sport-filter-label" label={t('page.sport')} value={sportType} onChange={event => updateParam('sportType', event.target.value)}>
              <MenuItem value="">{t('page.sportAll')}</MenuItem>
              <MenuItem value="cycling">{t('page.sportCycling')}</MenuItem>
              <MenuItem value="virtual_ride">{t('page.sportVirtualRide')}</MenuItem>
            </Select>
          </FormControl>
          <PolishDateField size="small" label={t('page.from')} value={from} onChange={value => updateParam('from', value)} slotProps={{ inputLabel: { shrink: true } }} />
          <PolishDateField size="small" label={t('page.to')} value={to} onChange={value => updateParam('to', value)} slotProps={{ inputLabel: { shrink: true } }} />
          {(sportType || from || to) ? (
            <Button
              startIcon={<RestartAltOutlinedIcon />}
              onClick={() => setParams(view === 'list' ? {} : { view })}
              sx={{ ml: { lg: 'auto' } }}
            >
              {t('page.clearFilters')}
            </Button>
          ) : null}
        </Stack>
      </Surface>
      {content()}
    </Page>
  );
}
