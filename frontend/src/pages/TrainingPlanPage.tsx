import { Grid2 as Grid } from '@mui/material';
import { useState } from 'react';

import PageContainer from '../components/common/PageContainer';
import TabsNav from '../components/common/TabsNav';
import PlanGenerator from '../components/training/PlanGenerator';
import ProgramsList from '../components/training/ProgramsList';
import TrainingCalendar from '../components/training/TrainingCalendar';
import WorkoutLibrary from '../components/training/WorkoutLibrary';

const tabs = [
  { label: 'Biblioteka', value: 0 },
  { label: 'Kalendarz', value: 1 },
  { label: 'Programy', value: 2 },
];

export default function TrainingPlanPage() {
  const [tab, setTab] = useState(0);

  return (
    <PageContainer title="Planer treningowy">
      <TabsNav tabs={tabs} value={tab} onChange={setTab} />

      {tab === 0 && <WorkoutLibrary />}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 9 }}>
            <TrainingCalendar />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <PlanGenerator onGenerated={() => {}} />
          </Grid>
        </Grid>
      )}
      {tab === 2 && <ProgramsList />}
    </PageContainer>
  );
}
