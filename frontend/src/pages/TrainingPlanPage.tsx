import { Grid2 as Grid } from '@mui/material';
import { useState } from 'react';

import EditorialHero from '../components/common/EditorialHero';
import PageContainer from '../components/common/PageContainer';
import TabsNav from '../components/common/TabsNav';
import PlanGenerator from '../components/training/PlanGenerator';
import ProgramsList from '../components/training/ProgramsList';
import TrainingCalendar from '../components/training/TrainingCalendar';
import WeeklyCoachCockpit from '../components/training/WeeklyCoachCockpit';
import WorkoutLibrary from '../components/training/WorkoutLibrary';
import { STATUS_COLORS } from '../utils/colors';
import { getPageHeroIllustrationPath } from '../utils/illustrationAssets';

const tabs = [
  { label: 'Biblioteka', value: 0 },
  { label: 'Kalendarz', value: 1 },
  { label: 'Programy', value: 2 },
];

export default function TrainingPlanPage() {
  const [tab, setTab] = useState(0);

  return (
    <PageContainer
      title="Planer treningowy"
      subtitle="Biblioteka, kalendarz i programy są teraz osadzone w tym samym spokojniejszym, bardziej osobistym kierunku wizualnym."
    >
      <EditorialHero
        eyebrow="Plan tygodnia"
        title="Program, kalendarz i biblioteka w jednym bardziej uporządkowanym flow."
        description="Planer ma prowadzić przez tydzień jak notes trenera — z większą czytelnością, spokojniejszym obrazem i mniej przypadkowym zlepkiem modułów."
        accentColor={STATUS_COLORS.success}
        imageSrc={getPageHeroIllustrationPath('training')}
        imageAlt="Planer hero"
        imagePosition="center 52%"
        highlights={['Biblioteka jednostek', 'Kalendarz tygodnia', 'Programy i coach']}
      />
      <TabsNav tabs={tabs} value={tab} onChange={setTab} />

      {tab === 0 && <WorkoutLibrary />}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TrainingCalendar />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <WeeklyCoachCockpit />
              </Grid>
              <Grid size={12}>
                <PlanGenerator onGenerated={() => {}} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
      {tab === 2 && <ProgramsList />}
    </PageContainer>
  );
}
