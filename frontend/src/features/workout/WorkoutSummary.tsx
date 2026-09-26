import DownloadIcon from '@mui/icons-material/Download';
import { Alert, Box, Button, Container, Slider, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';

import type { WorkoutExecution } from '@/types/training';
import { Metric, Surface } from '@/ui';

import { formatClock } from './cockpit/format';
import { workoutMessages } from './messages';

import type { SessionMetrics } from './devices/liveMetrics';

interface WorkoutSummaryProps {
  execution: WorkoutExecution;
  ride: SessionMetrics | null;
  fitDownloadUrl: string | null;
  recordingState: 'none' | 'uploading' | 'ready' | 'failed';
  saving: boolean;
  onSave(feedback: { rpe: number | null; feeling: string | null; notes: string }): Promise<void>;
}

/** Finished (or aborted) workout: ride figures, optional FIT download and RPE feedback. */
export default function WorkoutSummary({ execution, ride, fitDownloadUrl, recordingState, saving, onSave }: WorkoutSummaryProps) {
  const t = workoutMessages.useT();
  const [rpe, setRpe] = useState<number | null>(execution.rpe ?? null);
  const [feeling, setFeeling] = useState<string | null>(execution.feeling ?? null);
  const [notes, setNotes] = useState(execution.notes ?? '');
  const [error, setError] = useState(false);
  const hasRide = ride != null && ride.durationSec > 0 && (ride.avgPower != null || ride.avgHeartRate != null);

  const save = async () => {
    setError(false);
    try {
      await onSave({ rpe, feeling, notes });
    } catch {
      setError(true);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 6 } }}>
      <Surface variant="accent" radius="hero">
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>{execution.status === 'COMPLETED' ? t('summary.completed') : t('summary.aborted')}</Typography>
        <Typography variant="h3" component="h1" sx={{ mt: 0.5 }}>{execution.workoutNameSnapshot}</Typography>
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 3, my: 3 }}>
          <Metric label={t('summary.elapsedTime')} value={formatClock(execution.workoutElapsedMs)} />
          <Metric label={t('summary.skippedSteps')} value={execution.skippedStepIndexes.length} />
          <Metric label={t('summary.compliance')} value={execution.complianceScore ?? '—'} unit={execution.complianceScore != null ? '%' : undefined} hint={execution.complianceStatus} />
        </Stack>
        {hasRide ? (
          <Surface variant="muted" padding="sm" radius="panel" sx={{ mb: 3 }} aria-label={t('summary.trainerDataAria')}>
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 3 }}>
              <Metric variant="stat" label={t('summary.avgPower')} value={ride.avgPower ?? '—'} unit="W" />
              <Metric variant="stat" label="NP" value={ride.normalizedPower ?? '—'} unit="W" />
              <Metric variant="stat" label="IF" value={ride.intensityFactor != null ? ride.intensityFactor.toFixed(2) : '—'} />
              <Metric variant="stat" label="TSS" value={ride.tss != null ? Math.round(ride.tss) : '—'} />
              <Metric variant="stat" label={t('summary.avgHeartRate')} value={ride.avgHeartRate ?? '—'} unit="bpm" />
              <Metric variant="stat" label={t('summary.avgCadence')} value={ride.avgCadence ?? '—'} unit="rpm" />
              <Metric variant="stat" label={t('summary.work')} value={Math.round(ride.kilojoules)} unit="kJ" />
            </Stack>
          </Surface>
        ) : null}
        {recordingState === 'ready' && fitDownloadUrl ? (
          <Button component="a" href={fitDownloadUrl} download variant="outlined" startIcon={<DownloadIcon />} fullWidth sx={{ mb: 2 }}>
            {t('summary.downloadFit')}
          </Button>
        ) : null}
        {recordingState === 'uploading' ? <Alert severity="info" sx={{ mb: 2 }}>{t('summary.uploading')}</Alert> : null}
        {recordingState === 'failed' ? <Alert severity="warning" sx={{ mb: 2 }}>{t('summary.uploadFailed')}</Alert> : null}
        <Alert severity="info" sx={{ mb: 3 }}>{t('summary.pendingAssessment')}</Alert>
        <Typography id="rpe-label" gutterBottom>{rpe == null ? t('summary.rpeNone') : t('summary.rpeValue', { rpe })}</Typography>
        <Slider value={rpe ?? 5} min={1} max={10} marks onChange={(_, value) => setRpe(value as number)} aria-labelledby="rpe-label" sx={{ minHeight: 44 }} />
        <ToggleButtonGroup exclusive value={feeling} onChange={(_, value) => value && setFeeling(value)} fullWidth sx={{ my: 2 }}>
          <ToggleButton value="BAD">{t('summary.feelingBad')}</ToggleButton>
          <ToggleButton value="OK">OK</ToggleButton>
          <ToggleButton value="GOOD">{t('summary.feelingGood')}</ToggleButton>
        </ToggleButtonGroup>
        <TextField label={t('summary.notes')} multiline minRows={3} fullWidth value={notes} onChange={(event) => setNotes(event.target.value)} />
        {error ? <Alert severity="error" sx={{ mt: 2 }}>{t('summary.saveError')}</Alert> : null}
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" fullWidth disabled={saving} onClick={() => void save()} sx={{ minHeight: 48 }}>{t('summary.save')}</Button>
        </Box>
      </Surface>
    </Container>
  );
}
