import { Button, CircularProgress, Grid, Typography } from '@mui/material';

import { adminMessages } from '@/components/admin/messages';
import TrainingEffectsSection from '@/components/admin/TrainingEffectsSection';
import { useRebuildFtpHistory, useRebuildHeatmap, useRecalculateAllTrainingEffects } from '@/hooks/useAnalytics';
import { Widget } from '@/ui';

interface RebuildActionProps {
  title: string;
  subtitle: string;
  pending: boolean;
  success: boolean;
  idleLabel: string;
  pendingLabel: string;
  successLabel: string;
  onClick: () => void;
}

function RebuildAction({ title, subtitle, pending, success, idleLabel, pendingLabel, successLabel, onClick }: RebuildActionProps) {
  return (
    <Widget title={title} subtitle={subtitle} sx={{ height: '100%' }}>
      <Button
        variant="outlined"
        disabled={pending}
        startIcon={pending ? <CircularProgress size={16} /> : null}
        onClick={onClick}
      >
        {pending ? pendingLabel : idleLabel}
      </Button>
      {!!success && (
        <Typography component="span" variant="body2" sx={{ ml: 1.5, color: 'success.main' }}>
          {successLabel}
        </Typography>
      )}
    </Widget>
  );
}

export default function MaintenanceTab() {
  const t = adminMessages.useT();
  const rebuildHeatmap = useRebuildHeatmap();
  const rebuildFtpHistory = useRebuildFtpHistory();
  const recalculateAllTe = useRecalculateAllTrainingEffects();

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <RebuildAction
          title={t('page.heatmap.title')} subtitle={t('page.heatmap.subtitle')}
          pending={rebuildHeatmap.isPending} success={rebuildHeatmap.isSuccess}
          idleLabel={t('page.heatmap.idle')} pendingLabel={t('page.heatmap.pending')} successLabel={t('page.heatmap.success')}
          onClick={() => rebuildHeatmap.mutate()}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <RebuildAction
          title={t('page.ftpHistory.title')} subtitle={t('page.ftpHistory.subtitle')}
          pending={rebuildFtpHistory.isPending} success={rebuildFtpHistory.isSuccess}
          idleLabel={t('page.ftpHistory.idle')} pendingLabel={t('page.ftpHistory.pending')} successLabel={t('page.ftpHistory.success')}
          onClick={() => rebuildFtpHistory.mutate()}
        />
      </Grid>
      <Grid size={12}>
        <TrainingEffectsSection
          pending={recalculateAllTe.isPending}
          data={recalculateAllTe.data}
          error={recalculateAllTe.error}
          onRecalculate={() => recalculateAllTe.mutate()}
        />
      </Grid>
    </Grid>
  );
}
