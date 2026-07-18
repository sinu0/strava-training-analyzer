import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import { Box, Grid, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import PMChart from '@/components/PMChart';
import PowerCurveChart from '@/components/PowerCurveChart';

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
              <Paper sx={{ p: 2.5, border: '1px solid', borderColor: index === 0 ? 'primary.main' : 'divider', borderRadius: 3 }}>
                <Typography variant="overline" color="text.secondary">{index === 0 ? 'Wybrany okres' : 'Poprzedni okres'}</Typography>
                <Typography variant="h6" fontWeight={750}>{period.from} — {period.to}</Typography>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}><Typography variant="h5" fontWeight={800}>{period.activityCount}</Typography><Typography variant="caption" color="text.secondary">aktywności</Typography></Grid>
                  <Grid item xs={6}><Typography variant="h5" fontWeight={800}>{formatSummary(period.totalDistanceM, 'distance')}</Typography><Typography variant="caption" color="text.secondary">dystans</Typography></Grid>
                  <Grid item xs={6}><Typography variant="h5" fontWeight={800}>{formatSummary(period.totalTimeSec, 'time')}</Typography><Typography variant="caption" color="text.secondary">czas</Typography></Grid>
                  <Grid item xs={6}><Typography variant="h5" fontWeight={800}>{formatSummary(period.totalElevationM, 'elevation')}</Typography><Typography variant="caption" color="text.secondary">przewyższenie</Typography></Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (tab === 'load' && load.data) {
      return load.data.availability === 'UNKNOWN'
        ? <EmptyState title="Brak obciążenia" description="Brak danych nie jest prezentowany jako zerowa forma." />
        : <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}><PMChart data={load.data.points} /></Paper>;
    }

    if (tab === 'power' && power.data) {
      return power.data.availability === 'UNKNOWN'
        ? <EmptyState title="Brak krzywej mocy" description="Wybierz okres z aktywnościami zawierającymi pomiar mocy." />
        : <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}><PowerCurveChart data={power.data.curve} /></Paper>;
    }
    return null;
  };

  return (
    <PageContainer title="Analiza" subtitle="Porównania, obciążenie i moc są ładowane dopiero po otwarciu wybranego obszaru." maxWidth={1280}>
      <Paper sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
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
      </Paper>
      {renderContent()}
    </PageContainer>
  );
}
