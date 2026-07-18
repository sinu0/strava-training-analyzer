import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import { Box, List, ListItem, ListItemText, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import TrainingCalendar from '@/components/training/TrainingCalendar';
import WorkoutLibrary from '@/components/training/WorkoutLibrary';
import { PMC_COLORS } from '@/utils/colors';

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

  const changeTab = (next: PlanTab) => {
    const updated = new URLSearchParams(params);
    if (next === 'calendar') updated.delete('tab'); else updated.set('tab', next);
    setParams(updated);
  };

  return (
    <PageContainer title="Plan" subtitle="Kalendarz, biblioteka treningów i jawny scenariusz przyszłego obciążenia." maxWidth={1320}>
      <Paper sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, value: PlanTab) => changeTab(value)} variant="fullWidth">
          <Tab value="calendar" icon={<CalendarMonthOutlinedIcon />} iconPosition="start" label="Kalendarz" />
          <Tab value="library" icon={<FitnessCenterOutlinedIcon />} iconPosition="start" label="Biblioteka" />
          <Tab value="scenario" icon={<AutoGraphOutlinedIcon />} iconPosition="start" label="Scenariusz obciążenia" />
        </Tabs>
      </Paper>

      {tab === 'calendar' && <TrainingCalendar />}
      {tab === 'library' && <WorkoutLibrary />}
      {tab === 'scenario' && (
        <Paper sx={{ p: { xs: 1.5, md: 2.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
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
              <Box sx={{ height: 400, mt: 2 }}>
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
        </Paper>
      )}
    </PageContainer>
  );
}
