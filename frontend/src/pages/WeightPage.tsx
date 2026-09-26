
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import PullToRefreshPanel from '@/components/common/PullToRefreshPanel';
import AddWeightDialog from '@/components/weight/AddWeightDialog';
import { weightMessages } from '@/components/weight/messages';
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
import { getLocale } from '@/i18n';
import { getAppThemeTokens } from '@/theme/theme';
import { ErrorState, Page, SkeletonCard, Widget } from '@/ui';
import { getApiErrorMessage } from '@/utils/errorHandling';
import { localDate } from '@/utils/localDate';

import type { FormEvent } from 'react';

function getTodayDate(): string {
  return localDate();
}

export default function WeightPage() {
  const t = weightMessages.useT();
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
      <Page
        title={t('page.title')}
        breadcrumbs={[
          { label: t('page.breadcrumbDashboard'), href: '/' },
          { label: t('page.title') },
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
      </Page>
    );
  }

  if (overviewQuery.isError) {
    return (
      <Page title={t('page.title')}>
        <ErrorState
          message={getApiErrorMessage(
            overviewQuery.error,
            t('page.loadError'),
          )}
          onRetry={() => {
            void overviewQuery.refetch();
          }}
        />
      </Page>
    );
  }

  return (
    <Page
      title={t('page.title')}
      subtitle={t('page.subtitle')}
      breadcrumbs={[
        { label: t('page.breadcrumbDashboard'), href: '/' },
        { label: t('page.title') },
      ]}
      actions={(
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FlagIcon />}
            onClick={openGoalDialog}
            size="small"
          >
            {goal ? t('page.changeGoal') : t('page.setGoal')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddWeightDialog}
            size="small"
          >
            {t('page.addWeight')}
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
            <Widget title={t('page.todayTitle')} subtitle={t('page.todaySubtitle')}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">
                    {overview?.currentWeightKg != null ? `${Number(overview.currentWeightKg).toFixed(1)} kg` : '—'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mt: 0.5
                    }}>
                    {t('page.lastMeasurement', { date: latestWeight ? new Date(latestWeight.recordedDate).toLocaleDateString(getLocale()) : t('page.noData') })}
                  </Typography>
                </Box>
                <Stack spacing={0.5} sx={{ minWidth: { xs: '100%', sm: 280 } }}>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    {goal
                      ? t('page.goalSummary', { weight: Number(goal.targetWeightKg).toFixed(1), date: new Date(goal.targetDate).toLocaleDateString(getLocale()) })
                      : t('page.noGoalSet')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: (theme) => getAppThemeTokens(theme).type.weight.label }}>
                    {weeklyChange != null
                      ? t('page.weeklyChange', { sign: weeklyChange > 0 ? '+' : '', value: weeklyChange.toFixed(1) })
                      : t('page.noWeeklyTrend')}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: "text.secondary"
                  }}>
                    {t('page.refreshHint')}
                  </Typography>
                </Stack>
              </Box>
            </Widget>
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
    </Page>
  );
}
