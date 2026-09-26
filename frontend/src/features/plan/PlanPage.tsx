
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import { Box, Grid, List, ListItem, ListItemText, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import PolishDateField from '@/components/common/PolishDateField';
import TrainingCalendar from '@/components/training/TrainingCalendar';
import TrainingContextPanel from '@/components/training/TrainingContextPanel';
import WeeklyReviewPanel from '@/components/training/WeeklyReviewPanel';
import WorkoutLibrary from '@/components/training/WorkoutLibrary';
import { getLocale } from '@/i18n';
import { EmptyState, ErrorState, HeroCard, LoadingState, Metric, Page, Surface } from '@/ui';
import { getChartVisuals } from '@/utils/chartStyles';
import { PMC_COLORS } from '@/utils/colors';
import { getCyclingHeroIllustrationPath } from '@/utils/illustrationAssets';
import { localDate } from '@/utils/localDate';

import { planMessages } from './messages';
import { useLoadScenario } from './useLoadScenario';

type PlanTab = 'calendar' | 'library' | 'scenario' | 'context' | 'review';

export default function PlanPage() {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const t = planMessages.useT();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab: PlanTab = requestedTab === 'library' || requestedTab === 'scenario' || requestedTab === 'context' || requestedTab === 'review' ? requestedTab : 'calendar';
  const from = params.get('from') ?? localDate();
  const scenarioTo = new Date(`${from}T12:00:00Z`);
  scenarioTo.setUTCDate(scenarioTo.getUTCDate() + 41);
  const to = params.get('to') ?? scenarioTo.toISOString().slice(0, 10);
  const scenario = useLoadScenario(from, to, tab === 'scenario');
  const lastPoint = scenario.data?.points[scenario.data.points.length - 1];

  const changeTab = (next: PlanTab) => {
    const updated = new URLSearchParams(params);
    if (next === 'calendar') updated.delete('tab'); else updated.set('tab', next);
    setParams(updated);
  };

  const changeRange = (key: 'from' | 'to', value: string) => {
    const updated = new URLSearchParams(params);
    updated.set('tab', 'scenario');
    updated.set(key, value);
    setParams(updated);
  };

  return (
    <Page title={t('pageTitle')} subtitle={t('pageSubtitle')} maxWidth={1320}>
      <HeroCard
        layout="split"
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        description={t('heroDescription')}
        image={{ src: getCyclingHeroIllustrationPath('training'), alt: t('heroImageAlt') }}
        tags={[t('heroTags.calendar'), t('heroTags.library'), t('heroTags.scenario')]}
        headingComponent="h2"
      />
      <Surface padding="none" sx={{ mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, value: PlanTab) => changeTab(value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab value="calendar" icon={<CalendarMonthOutlinedIcon />} iconPosition="start" label={t('tabs.calendar')} />
          <Tab value="library" icon={<FitnessCenterOutlinedIcon />} iconPosition="start" label={t('tabs.library')} />
          <Tab value="scenario" icon={<AutoGraphOutlinedIcon />} iconPosition="start" label={t('tabs.scenario')} />
          <Tab value="context" label={t('tabs.context')} />
          <Tab value="review" label={t('tabs.review')} />
        </Tabs>
      </Surface>
      {tab === 'calendar' && <TrainingCalendar />}
      {tab === 'context' && <TrainingContextPanel />}
      {tab === 'review' && <WeeklyReviewPanel />}
      {tab === 'library' && <WorkoutLibrary />}
      {tab === 'scenario' && (
        <Surface variant="accent">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.25}
            sx={{
              alignItems: { sm: 'center' },
              mb: 2.5
            }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">{t('scenarioTitle')}</Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>{t('scenarioUrlHint')}</Typography>
            </Box>
            <PolishDateField size="small" label={t('fromLabel')} value={from} onChange={value => changeRange('from', value)} slotProps={{ inputLabel: { shrink: true } }} />
            <PolishDateField size="small" label={t('toLabel')} value={to} onChange={value => changeRange('to', value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          {scenario.isLoading ? <LoadingState message={t('loadingScenario')} /> : null}
          {scenario.isError ? <ErrorState message={t('scenarioError')} onRetry={() => void scenario.refetch()} /> : null}
          {scenario.data?.availability === 'UNKNOWN' ? (
            <EmptyState title={t('noStartingPoint')} description={scenario.data.assumptions[0]} />
          ) : null}
          {scenario.data?.availability === 'AVAILABLE' ? (
            <>
              <Typography variant="h6">{t('ifCurrentPlanTitle')}</Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 0.5
                }}>
                {t('ifCurrentPlanSubtitle')}
              </Typography>
              {lastPoint ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={4}><Metric label={t('ctlFinal')} value={lastPoint.ctl.toFixed(1)} tone="primary" /></Grid>
                  <Grid size={4}><Metric label={t('atlFinal')} value={lastPoint.atl.toFixed(1)} tone="warning" /></Grid>
                  <Grid size={4}><Metric label={t('formFinal')} value={lastPoint.form.toFixed(1)} tone={lastPoint.form < -10 ? 'warning' : 'success'} /></Grid>
                </Grid>
              ) : null}
              <Box
                role="img"
                aria-label={`${t('chartAriaLabelBase', { from, to })}${lastPoint ? t('chartAriaLabelValues', { ctl: lastPoint.ctl.toFixed(1), atl: lastPoint.atl.toFixed(1), form: lastPoint.form.toFixed(1) }) : ''}`}
                sx={{ height: 400, mt: 2 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scenario.data.points}>
                    <CartesianGrid {...chart.grid} />
                    <XAxis dataKey="date" tickFormatter={value => new Date(value).toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' })} {...chart.axis} />
                    <YAxis {...chart.axis} />
                    <Tooltip {...chart.tooltip} />
                    <Legend {...chart.legend} />
                    <Line type="monotone" dataKey="ctl" name={t('ctlLegend')} stroke={PMC_COLORS.CTL} dot={false} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="atl" name={t('atlLegend')} stroke={PMC_COLORS.ATL} dot={false} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="form" name={t('formLegend')} stroke={PMC_COLORS.TSB} dot={false} strokeWidth={2.25} strokeDasharray="5 4" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <List dense>
                {scenario.data.assumptions.map(assumption => <ListItem key={assumption}><ListItemText primary={assumption} /></ListItem>)}
              </List>
            </>
          ) : null}
        </Surface>
      )}
    </Page>
  );
}
