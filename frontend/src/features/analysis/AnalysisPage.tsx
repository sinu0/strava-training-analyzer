import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Box, Grid, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import PMChart from '@/components/PMChart';
import PowerCurveChart from '@/components/PowerCurveChart';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';

import { useLoadAnalytics, usePeriodComparison, usePowerAnalytics } from './useV2Analytics';

type AnalysisTab = 'compare' | 'load' | 'power';

function dateOffset(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

function formatSummary(value: number, kind: 'distance' | 'time' | 'elevation') {
  if (kind === 'distance') return `${(value / 1000).toFixed(1)} km`;
  if (kind === 'time') return `${Math.round(value / 3600)} h`;
  return `${Math.round(value)} m`;
}

function changeLabel(current: number, previous: number) {
  if (previous === 0) return 'brak porównywalnej bazy';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(0)}% vs poprzedni okres`;
}

export default function AnalysisPage() {
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab');
  const tab: AnalysisTab = rawTab === 'load' || rawTab === 'power' ? rawTab : 'compare';
  const to = params.get('to') ?? defaultTo();
  const from = params.get('from') ?? dateOffset(to, -83);
  const dayCount = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1);
  const period2To = dateOffset(from, -1);
  const period2From = dateOffset(period2To, -(dayCount - 1));

  const comparison = usePeriodComparison({
    period1From: from,
    period1To: to,
    period2From,
    period2To,
  }, tab === 'compare');
  const load = useLoadAnalytics(from, to, tab === 'load');
  const power = usePowerAnalytics(from, to, tab === 'power');

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (key === 'tab' && value === 'compare') next.delete('tab'); else next.set(key, value);
    setParams(next);
  };

  const renderContent = () => {
    const active = tab === 'compare' ? comparison : tab === 'load' ? load : power;
    if (active.isLoading) return <LoadingState message="Ładowanie aktywnego widoku analizy…" />;
    if (active.isError) return <ErrorState message="Nie udało się pobrać analizy." onRetry={() => void active.refetch()} />;

    if (tab === 'compare' && comparison.data) {
      if (comparison.data.availability === 'UNKNOWN') return <EmptyState title="Brak okresów do porównania" />;
      return (
        <Grid container spacing={2}>
          {[comparison.data.period1, comparison.data.period2].map((period, index) => (
            <Grid item xs={12} md={6} key={period.from}>
              <PerformanceSurface accent={index === 0} sx={{ p: { xs: 2, md: 2.75 }, height: '100%' }}>
                <Typography variant="overline" color="text.secondary">{index === 0 ? 'Wybrany okres' : 'Poprzedni okres'}</Typography>
                <Typography variant="h6" fontWeight={750}>{period.from} — {period.to}</Typography>
                <Grid container spacing={2.25} sx={{ mt: 0.75 }}>
                  <Grid item xs={6}>
                    <MetricReadout
                      icon={<DirectionsBikeOutlinedIcon />}
                      label="Aktywności"
                      value={period.activityCount}
                      hint={index === 0 ? changeLabel(period.activityCount, comparison.data.period2.activityCount) : undefined}
                      tone={index === 0 ? 'primary' : undefined}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <MetricReadout
                      icon={<StraightenOutlinedIcon />}
                      label="Dystans"
                      value={formatSummary(period.totalDistanceM, 'distance')}
                      hint={index === 0 ? changeLabel(period.totalDistanceM, comparison.data.period2.totalDistanceM) : undefined}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <MetricReadout icon={<TimerOutlinedIcon />} label="Czas" value={formatSummary(period.totalTimeSec, 'time')} />
                  </Grid>
                  <Grid item xs={6}>
                    <MetricReadout icon={<LandscapeOutlinedIcon />} label="Przewyższenie" value={formatSummary(period.totalElevationM, 'elevation')} />
                  </Grid>
                </Grid>
              </PerformanceSurface>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (tab === 'load' && load.data) {
      return load.data.availability === 'UNKNOWN'
        ? <EmptyState title="Brak obciążenia" description="Brak danych nie jest prezentowany jako zerowa forma." />
        : <PerformanceSurface sx={{ p: { xs: 1.25, md: 2.25 } }}><PMChart data={load.data.points} /></PerformanceSurface>;
    }

    if (tab === 'power' && power.data) {
      return power.data.availability === 'UNKNOWN'
        ? <EmptyState title="Brak krzywej mocy" description="Wybierz okres z aktywnościami zawierającymi pomiar mocy." />
        : <PerformanceSurface sx={{ p: { xs: 1.25, md: 2.25 } }}><PowerCurveChart data={power.data.curve} /></PerformanceSurface>;
    }
    return null;
  };

  return (
    <PageContainer title="Laboratorium wydolności" subtitle="Porównuj okresy, obserwuj obciążenie i analizuj moc bez ukrywania jakości danych." maxWidth={1320}>
      <PerformanceSurface sx={{ mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, value: AnalysisTab) => update('tab', value)} variant="scrollable" scrollButtons="auto">
          <Tab value="compare" icon={<CompareArrowsOutlinedIcon />} iconPosition="start" label="Porównaj" />
          <Tab value="load" icon={<TimelineOutlinedIcon />} iconPosition="start" label="Obciążenie i regeneracja" />
          <Tab value="power" icon={<ShowChartOutlinedIcon />} iconPosition="start" label="Moc i trwałość" />
        </Tabs>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <TextField type="date" size="small" label="Od" value={from} onChange={event => update('from', event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField type="date" size="small" label="Do" value={to} onChange={event => update('to', event.target.value)} InputLabelProps={{ shrink: true }} />
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" alignSelf="center">Zakres jest zapisany w URL</Typography>
        </Stack>
      </PerformanceSurface>
      {renderContent()}
    </PageContainer>
  );
}
