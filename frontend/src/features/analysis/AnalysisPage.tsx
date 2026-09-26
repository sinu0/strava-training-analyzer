
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Alert, Box, Checkbox, FormControlLabel, Grid, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import PolishDateField from '@/components/common/PolishDateField';
import PMChart from '@/components/PMChart';
import PowerCurveChart from '@/components/PowerCurveChart';
import { EmptyState, ErrorState, HeroCard, LoadingState, Metric, Page, Surface } from '@/ui';
import { getCyclingHeroIllustrationPath } from '@/utils/illustrationAssets';
import { localDate } from '@/utils/localDate';

import { analysisPageMessages } from './messages';
import { useLoadAnalytics, usePeriodComparison, usePowerAnalytics } from './useV2Analytics';

type AnalysisTab = 'compare' | 'load' | 'power';

function dateOffset(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function defaultTo() {
  return localDate();
}

function formatSummary(value: number, kind: 'distance' | 'time' | 'elevation') {
  if (kind === 'distance') return `${(value / 1000).toFixed(1)} km`;
  if (kind === 'time') return `${Math.round(value / 3600)} h`;
  return `${Math.round(value)} m`;
}

export default function AnalysisPage() {
  const t = analysisPageMessages.useT();
  const changeLabel = (current: number, previous: number) => {
    if (previous === 0) return t('noComparableBase');
    const change = ((current - previous) / previous) * 100;
    return t('vsPreviousPeriod', { value: `${change >= 0 ? '+' : ''}${change.toFixed(0)}` });
  };
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
  const includeUnverified = params.get('powerSources') === 'all';
  const power = usePowerAnalytics(from, to, tab === 'power', includeUnverified);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (key === 'tab' && value === 'compare') next.delete('tab'); else next.set(key, value);
    setParams(next);
  };

  const renderContent = () => {
    const active = tab === 'compare' ? comparison : tab === 'load' ? load : power;
    if (active.isLoading) return <LoadingState message={t('loadingView')} />;
    if (active.isError) return <ErrorState message={t('loadError')} onRetry={() => void active.refetch()} />;

    if (tab === 'compare' && comparison.data) {
      if (comparison.data.availability === 'UNKNOWN') return <EmptyState title={t('noComparablePeriods')} />;
      return (
        <Grid container spacing={2}>
          {[comparison.data.period1, comparison.data.period2].map((period, index) => (
            <Grid
              key={period.from}
              size={{
                xs: 12,
                md: 6
              }}>
              <Surface variant={index === 0 ? 'accent' : 'default'} sx={{ height: '100%' }}>
                <Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>{index === 0 ? t('selectedPeriod') : t('previousPeriod')}</Typography>
                <Typography variant="h6">{period.from} — {period.to}</Typography>
                <Grid container spacing={2.25} sx={{ mt: 0.75 }}>
                  <Grid size={6}>
                    <Metric
                      icon={<DirectionsBikeOutlinedIcon />}
                      label={t('metricActivities')}
                      value={period.activityCount}
                      hint={index === 0 ? changeLabel(period.activityCount, comparison.data.period2.activityCount) : undefined}
                      tone={index === 0 ? 'primary' : undefined}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Metric
                      icon={<StraightenOutlinedIcon />}
                      label={t('metricDistance')}
                      value={formatSummary(period.totalDistanceM, 'distance')}
                      hint={index === 0 ? changeLabel(period.totalDistanceM, comparison.data.period2.totalDistanceM) : undefined}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Metric icon={<TimerOutlinedIcon />} label={t('metricTime')} value={formatSummary(period.totalTimeSec, 'time')} />
                  </Grid>
                  <Grid size={6}>
                    <Metric icon={<LandscapeOutlinedIcon />} label={t('metricElevation')} value={formatSummary(period.totalElevationM, 'elevation')} />
                  </Grid>
                </Grid>
              </Surface>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (tab === 'load' && load.data) {
      return load.data.availability === 'UNKNOWN'
        ? <EmptyState title={t('noLoadTitle')} description={t('noLoadDescription')} />
        : (
          <Surface padding="sm">
            {load.data.availability === 'PARTIAL' ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('partialDataAlert', {
                  coverage: load.data.coverage == null ? t('coverageUnknown') : `${Math.round(load.data.coverage * 100)}%`,
                  temporalDays: load.data.temporalCoverage == null ? t('temporalUnknown') : `${Math.round(load.data.temporalCoverage * 100)}%`,
                  asOf: load.data.asOf ?? t('asOfNone'),
                })}
              </Alert>
            ) : null}
            <PMChart data={load.data.points} />
          </Surface>
        );
    }

    if (tab === 'power' && power.data) {
      return <Surface padding="sm">
        <Alert severity={includeUnverified ? 'warning' : 'info'} sx={{ mb: 2 }}>{includeUnverified ? t('powerMixedWarning') : t('powerVerifiedInfo')} {t('powerActivitiesSummary', {
          measured: power.data.curve.measuredActivities ?? t('noInfo'),
          estimated: power.data.curve.estimatedActivities ?? t('noInfo'),
          unknown: power.data.curve.unknownSourceActivities ?? t('noInfo'),
        })}</Alert>
        {power.data.availability === 'UNKNOWN'
          ? <EmptyState title={t('noPowerCurveTitle')} description={t('noPowerCurveDescription')} />
          : <PowerCurveChart data={power.data.curve} />}
      </Surface>;
    }
    return null;
  };

  return (
    <Page title={t('pageTitle')} subtitle={t('pageSubtitle')} maxWidth={1320}>
      <HeroCard
        layout="split"
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        description={t('heroDescription')}
        image={{ src: getCyclingHeroIllustrationPath('analytics'), alt: t('heroImageAlt') }}
        tags={[t('tagDays', { count: dayCount }), t('tagCompare'), t('tagPower')]}
        headingComponent="h2"
      />
      <Surface padding="none" sx={{ mb: 2.5 }}>
        <Tabs
          value={tab}
          onChange={(_, value: AnalysisTab) => update('tab', value)}
          variant="fullWidth"
          aria-label={t('tabsAriaLabel')}
          sx={{
            '& .MuiTab-root': {
              minWidth: 0,
              px: { xs: 0.5, sm: 1.5 },
              fontSize: { xs: '0.68rem', sm: '0.8rem' },
              lineHeight: 1.15,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 0.4, sm: 0.75 },
            },
            "& .MuiTab-icon": { m: '0 !important' },
          }}
        >
          <Tab value="compare" icon={<CompareArrowsOutlinedIcon />} iconPosition="start" label={t('tabCompare')} />
          <Tab value="load" icon={<TimelineOutlinedIcon />} iconPosition="start" label={t('tabLoad')} />
          <Tab value="power" icon={<ShowChartOutlinedIcon />} iconPosition="start" label={t('tabPower')} />
        </Tabs>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <PolishDateField size="small" label={t('fromLabel')} value={from} onChange={value => update('from', value)} slotProps={{ inputLabel: { shrink: true } }} />
          <PolishDateField size="small" label={t('toLabel')} value={to} onChange={value => update('to', value)} slotProps={{ inputLabel: { shrink: true } }} />
          {tab === 'power' && <FormControlLabel control={<Checkbox checked={includeUnverified} onChange={(_, checked) => update('powerSources', checked ? 'all' : 'measured')} />} label={t('showUnverifiedSources')} />}
          <Box sx={{ flex: 1 }} />
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              alignSelf: "center"
            }}>{t('rangeSavedNote')}</Typography>
        </Stack>
      </Surface>
      {renderContent()}
    </Page>
  );
}
