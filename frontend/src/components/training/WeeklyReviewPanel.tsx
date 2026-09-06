import { Alert, Grid, Stack, Typography } from '@mui/material';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import { useWeeklyReview } from '@/hooks/useTrainingContext';

export default function WeeklyReviewPanel() {
  const review = useWeeklyReview();
  if (review.isLoading) return <LoadingState message="Przygotowanie przeglądu tygodnia…" />;
  if (review.isError || !review.data) return <ErrorState message="Nie udało się pobrać przeglądu tygodnia." onRetry={() => void review.refetch()} />;
  const data = review.data;
  return <PerformanceSurface sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={2.5}>
    <Typography variant="h6">Przegląd tygodnia · {data.from} – {data.to}</Typography>
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, md: 3 }}><MetricReadout label="Sesje wykonane / plan" value={`${data.completedSessions} / ${data.plannedSessions}`} /></Grid>
      <Grid size={{ xs: 6, md: 3 }}><MetricReadout label="Zapisane aktywności" value={data.activityCount} /></Grid>
      <Grid size={{ xs: 6, md: 3 }}><MetricReadout label="Minuty wykonane / plan" value={`${data.actualMinutes ?? 'brak danych'} / ${data.plannedMinutes ?? 'brak danych'}`} /></Grid>
      <Grid size={{ xs: 6, md: 3 }}><MetricReadout label="Średni RPE" value={data.averageRpe?.toFixed(1) ?? 'Brak danych'} hint={`${data.feedbackCount} zapisanych ocen`} /></Grid>
    </Grid>
    {data.reasons.length > 0 && <Alert severity="info">{data.reasons.join(' ')}</Alert>}
    <Typography>{data.recommendation}</Typography>
    <Typography variant="caption" color="text.secondary">Wnioski uwzględniają zapisane wykonania i odczucia. Zmiana planu wymaga Twojej decyzji.</Typography>
  </Stack></PerformanceSurface>;
}
