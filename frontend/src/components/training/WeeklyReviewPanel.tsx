import { Alert, Grid, Stack, Typography } from '@mui/material';

import { useWeeklyReview } from '@/hooks/useTrainingContext';
import { useI18n } from '@/i18n';
import { ErrorState, LoadingState, Metric, Surface } from '@/ui';

import { trainingMessages } from './messages';

export default function WeeklyReviewPanel() {
  const t = trainingMessages.useT();
  const { t: common } = useI18n();
  const review = useWeeklyReview();
  if (review.isLoading) return <LoadingState message={t('weeklyReviewPanel.loading')} />;
  if (review.isError || !review.data) return <ErrorState message={t('weeklyReviewPanel.error')} onRetry={() => void review.refetch()} />;
  const data = review.data;
  return (
    <Surface><Stack spacing={2.5}>
      <Typography variant="h6">{t('weeklyReviewPanel.title', { from: data.from, to: data.to })}</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}><Metric label={t('weeklyReviewPanel.sessionsMetric')} value={`${data.completedSessions} / ${data.plannedSessions}`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Metric label={t('weeklyReviewPanel.activitiesMetric')} value={data.activityCount} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Metric label={t('weeklyReviewPanel.minutesMetric')} value={`${data.actualMinutes ?? common('common.noData')} / ${data.plannedMinutes ?? common('common.noData')}`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Metric label={t('weeklyReviewPanel.avgRpeMetric')} value={data.averageRpe?.toFixed(1) ?? common('common.noData')} hint={t('weeklyReviewPanel.feedbackCount', { count: data.feedbackCount })} /></Grid>
      </Grid>
      {data.reasons.length > 0 && <Alert severity="info">{data.reasons.join(' ')}</Alert>}
      <Typography>{data.recommendation}</Typography>
      <Typography variant="caption" sx={{
        color: "text.secondary"
      }}>{t('weeklyReviewPanel.footerNote')}</Typography>
    </Stack></Surface>
  );
}
