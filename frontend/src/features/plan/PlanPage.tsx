import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import { Box, Grid, List, ListItem, ListItemText, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import EditorialHero from '@/components/common/EditorialHero';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import TrainingCalendar from '@/components/training/TrainingCalendar';
import WorkoutLibrary from '@/components/training/WorkoutLibrary';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import { PMC_COLORS } from '@/utils/colors';
import { getCyclingHeroIllustrationPath } from '@/utils/illustrationAssets';

import { useLoadScenario } from './useLoadScenario';

type PlanTab = 'calendar' | 'library' | 'scenario';

export default function PlanPage() {
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab: PlanTab = requestedTab === 'library' || requestedTab === 'scenario' ? requestedTab : 'calendar';
  const from = params.get('from') ?? new Date().toISOString().slice(0, 10);
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
    <PageContainer title="Plan treningowy" subtitle="Zbuduj tydzień, wybierz jednostkę i zobacz matematyczny scenariusz obciążenia." maxWidth={1320}>
      <EditorialHero
        compact
        eyebrow="Kierunek sezonu"
        title="Trening, który ma swoje miejsce w planie"
        description="Zbuduj tydzień, wybierz sesję i sprawdź konsekwencje dla obciążenia, zanim wsiądziesz na rower."
        accentColor="#FC4C02"
        imageSrc={getCyclingHeroIllustrationPath('training')}
        imageAlt="Przygotowane akcesoria kolarskie i mapa trasy"
        highlights={['Kalendarz', 'Biblioteka sesji', 'Scenariusz CTL / ATL']}
      />
      <PerformanceSurface sx={{ mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, value: PlanTab) => changeTab(value)} variant="fullWidth">
          <Tab value="calendar" icon={<CalendarMonthOutlinedIcon />} iconPosition="start" label="Kalendarz" />
          <Tab value="library" icon={<FitnessCenterOutlinedIcon />} iconPosition="start" label="Biblioteka" />
          <Tab value="scenario" icon={<AutoGraphOutlinedIcon />} iconPosition="start" label="Scenariusz obciążenia" />
        </Tabs>
      </PerformanceSurface>
      {tab === 'calendar' && <TrainingCalendar />}
      {tab === 'library' && <WorkoutLibrary />}
      {tab === 'scenario' && (
        <PerformanceSurface accent sx={{ p: { xs: 1.5, md: 2.75 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }} sx={{ mb: 2.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={780}>Scenariusz przyszłego obciążenia</Typography>
              <Typography variant="body2" color="text.secondary">Zakres pozostaje w URL i może zostać odtworzony po powrocie.</Typography>
            </Box>
            <TextField size="small" type="date" label="Od" value={from} onChange={event => changeRange('from', event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField size="small" type="date" label="Do" value={to} onChange={event => changeRange('to', event.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
          {scenario.isLoading ? <LoadingState message="Liczenie scenariusza…" /> : null}
          {scenario.isError ? <ErrorState message="Nie udało się policzyć scenariusza." onRetry={() => void scenario.refetch()} /> : null}
          {scenario.data?.availability === 'UNKNOWN' ? (
            <EmptyState title="Brak punktu początkowego" description={scenario.data.assumptions[0]} />
          ) : null}
          {scenario.data?.availability === 'AVAILABLE' ? (
            <>
              <Typography variant="h6" fontWeight={750}>Jeśli wykonasz obecny plan</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                To scenariusz matematyczny CTL/ATL, a nie obietnica wyniku sportowego.
              </Typography>
              {lastPoint ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={4}><MetricReadout label="CTL na końcu" value={lastPoint.ctl.toFixed(1)} tone="primary" /></Grid>
                  <Grid size={4}><MetricReadout label="ATL na końcu" value={lastPoint.atl.toFixed(1)} tone="warning" /></Grid>
                  <Grid size={4}><MetricReadout label="Forma" value={lastPoint.form.toFixed(1)} tone={lastPoint.form < -10 ? 'warning' : 'success'} /></Grid>
                </Grid>
              ) : null}
              <Box
                role="img"
                aria-label={`Scenariusz obciążenia od ${from} do ${to}.${lastPoint ? ` Wartości końcowe: CTL ${lastPoint.ctl.toFixed(1)}, ATL ${lastPoint.atl.toFixed(1)}, forma ${lastPoint.form.toFixed(1)}.` : ''}`}
                sx={{ height: 400, mt: 2 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scenario.data.points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={value => new Date(value).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ctl" name="CTL 42 dni" stroke={PMC_COLORS.CTL} dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="atl" name="ATL 7 dni" stroke={PMC_COLORS.ATL} dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="form" name="Forma" stroke={PMC_COLORS.TSB} dot={false} strokeDasharray="5 4" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <List dense>
                {scenario.data.assumptions.map(assumption => <ListItem key={assumption}><ListItemText primary={assumption} /></ListItem>)}
              </List>
            </>
          ) : null}
        </PerformanceSurface>
      )}
    </PageContainer>
  );
}
