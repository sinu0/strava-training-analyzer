import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import ErrorState from '@/components/common/ErrorState';
import PageContainer from '@/components/common/PageContainer';
import PullToRefreshPanel from '@/components/common/PullToRefreshPanel';
import Section from '@/components/common/Section';
import SkeletonCard from '@/components/common/SkeletonCard';
import AddWeightDialog from '@/components/weight/AddWeightDialog';
import WeightChart from '@/components/weight/WeightChart';
import WeightGoalDialog from '@/components/weight/WeightGoalDialog';
import WeightHistoryTable from '@/components/weight/WeightHistoryTable';
import WeightOverviewCards from '@/components/weight/WeightOverviewCards';
import { useFormDialog } from '@/hooks/useFormDialog';
import {
  useAddWeight,
  useDeleteWeightGoal,
  useSetWeightGoal,
  useWeightOverview,
} from '@/hooks/useWeight';
import { getApiErrorMessage } from '@/utils/errorHandling';

import type { FormEvent } from 'react';

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WeightPage() {
  const queryClient = useQueryClient();
  const overviewQuery = useWeightOverview();
  const addWeight = useAddWeight();
  const setGoal = useSetWeightGoal();
  const deleteGoal = useDeleteWeightGoal();

  const addWeightDialog = useFormDialog({
    weightKg: '',
    recordedDate: getTodayDate(),
    notes: '',
  });
  const goalDialog = useFormDialog({
    targetWeightKg: '',
    targetDate: '',
  });

  const overview = overviewQuery.data;
  const goal = overview?.goal ?? null;
  const history = overview?.history ?? [];

  const latestWeight = history[history.length - 1];
  const weeklyChange = overview?.weeklyWeightChange ?? null;

  const openAddWeightDialog = () => {
    addWeightDialog.openDialog({ recordedDate: getTodayDate() });
  };

  const openGoalDialog = () => {
    goalDialog.openDialog(
      goal
        ? {
            targetWeightKg: Number(goal.targetWeightKg).toString(),
            targetDate: goal.targetDate.slice(0, 10),
          }
        : undefined,
    );
  };

  const handleAddWeightSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const weightKg = Number.parseFloat(addWeightDialog.values.weightKg);
    if (!Number.isFinite(weightKg) || weightKg <= 0 || !addWeightDialog.values.recordedDate) {
      return;
    }

    addWeight.mutate(
      {
        weightKg,
        recordedDate: addWeightDialog.values.recordedDate,
        notes: addWeightDialog.values.notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          addWeightDialog.closeDialog();
        },
      },
    );
  };

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const targetWeightKg = Number.parseFloat(goalDialog.values.targetWeightKg);
    if (!Number.isFinite(targetWeightKg) || targetWeightKg <= 0 || !goalDialog.values.targetDate) {
      return;
    }

    setGoal.mutate(
      {
        targetWeightKg,
        targetDate: goalDialog.values.targetDate,
      },
      {
        onSuccess: () => {
          goalDialog.closeDialog();
        },
      },
    );
  };

  const handleDeleteGoal = () => {
    if (!goal) {
      return;
    }

    deleteGoal.mutate(goal.id);
  };

  if (overviewQuery.isLoading) {
    return (
      <PageContainer
        title="Waga"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Waga' },
        ]}
      >
        <Grid container spacing={3}>
          <Grid size={12}>
            <SkeletonCard height={220} />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 4
            }}>
            <SkeletonCard height={260} />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 4
            }}>
            <SkeletonCard height={260} />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 4
            }}>
            <SkeletonCard height={260} />
          </Grid>
        </Grid>
      </PageContainer>
    );
  }

  if (overviewQuery.isError) {
    return (
      <PageContainer title="Waga">
        <ErrorState
          message={getApiErrorMessage(
            overviewQuery.error,
            'Nie udało się wczytać danych wagi.',
          )}
          onRetry={() => {
            void overviewQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Waga"
      subtitle="Stan dziś, cel i historia są rozdzielone na krótsze sekcje z czytelniejszym trendem."
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Waga' },
      ]}
      actions={(
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FlagIcon />}
            onClick={openGoalDialog}
            size="small"
          >
            {goal ? 'Zmień cel' : 'Ustaw cel'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddWeightDialog}
            size="small"
          >
            Dodaj wagę
          </Button>
        </Stack>
      )}
    >
      <PullToRefreshPanel
        onRefresh={async () => {
          await queryClient.refetchQueries();
        }}
      >
        <Grid container spacing={3}>
          <Grid size={12}>
            <Section title="Stan dziś" subtitle="Najważniejszy status: aktualna waga, tempo zmian i cel." accentColor="primary.main">
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>
                    {overview?.currentWeightKg != null ? `${Number(overview.currentWeightKg).toFixed(1)} kg` : '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Ostatni pomiar: {latestWeight ? new Date(latestWeight.recordedDate).toLocaleDateString('pl-PL') : 'brak danych'}
                  </Typography>
                </Box>
                <Stack spacing={0.5} sx={{ minWidth: { xs: '100%', sm: 280 } }}>
                  <Typography variant="body2" color="text.secondary">
                    {goal
                      ? `Cel: ${Number(goal.targetWeightKg).toFixed(1)} kg do ${new Date(goal.targetDate).toLocaleDateString('pl-PL')}`
                      : 'Brak ustawionego celu wagowego'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {weeklyChange != null
                      ? `${weeklyChange > 0 ? '+' : ''}${weeklyChange.toFixed(1)} kg / tydzień`
                      : 'Brak trendu tygodniowego'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Odśwież, gdy chcesz szybko porównać dzisiejszy stan z ostatnim pomiarem.
                  </Typography>
                </Stack>
              </Box>
            </Section>
          </Grid>
          <WeightOverviewCards
            overview={overview}
            isDeletingGoal={deleteGoal.isPending}
            onOpenGoalDialog={openGoalDialog}
            onDeleteGoal={handleDeleteGoal}
          />
          <WeightChart history={history} goal={goal} />
          <WeightHistoryTable history={history} />
        </Grid>
      </PullToRefreshPanel>
      <AddWeightDialog
        dialog={addWeightDialog}
        pending={addWeight.isPending}
        onSubmit={handleAddWeightSubmit}
      />
      <WeightGoalDialog
        dialog={goalDialog}
        pending={setGoal.isPending}
        onSubmit={handleGoalSubmit}
      />
    </PageContainer>
  );
}
