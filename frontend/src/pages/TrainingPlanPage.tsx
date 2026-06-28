import { Grid2 as Grid } from '@mui/material';
import { useState } from 'react';

import AdaptiveTrainingPanel from '../components/AdaptiveTrainingPanel';
import EditorialHero from '../components/common/EditorialHero';
import PageContainer from '../components/common/PageContainer';
import TabsNav from '../components/common/TabsNav';
import PlanBuilder from '../components/training/PlanBuilder';
import TrainingCalendar from '../components/training/TrainingCalendar';
import WeeklyCoachCockpit from '../components/training/WeeklyCoachCockpit';
import WorkoutLibrary from '../components/training/WorkoutLibrary';
import { STATUS_COLORS } from '../utils/colors';
import { getPageHeroIllustrationPath } from '../utils/illustrationAssets';

const tabs = [
  { label: 'Kalendarz', value: 0 },
  { label: 'Biblioteka', value: 1 },
  { label: 'Plan Builder', value: 2 },
  { label: 'Adaptacja', value: 3 },
];

export default function TrainingPlanPage() {
  const [tab, setTab] = useState(0);

  return (
    <PageContainer
      title="Planer treningowy"
      subtitle="Kalendarz, biblioteka workoutów, plan builder i adaptacja."
    >
      <EditorialHero
        eyebrow="Plan tygodnia"
        title="Zarządzanie treningami"
        description="Przeglądaj kalendarz, buduj plany, korzystaj z biblioteki workoutów i adaptuj trening do aktualnego stanu."
        accentColor={STATUS_COLORS.success}
        imageSrc={getPageHeroIllustrationPath('training')}
        imageAlt="Planer hero"
        imagePosition="center 52%"
        highlights={['Kalendarz tygodniowy', 'Biblioteka workoutów', 'Plan Builder', 'Adaptacja do stanu']}
      />
      <TabsNav tabs={tabs} value={tab} onChange={setTab} />

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TrainingCalendar />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <WeeklyCoachCockpit />
          </Grid>
        </Grid>
      )}
      {tab === 1 && <WorkoutLibrary />}
      {tab === 2 && <PlanBuilder />}
      {tab === 3 && <AdaptiveTrainingPanel />}
    </PageContainer>
  );
}
