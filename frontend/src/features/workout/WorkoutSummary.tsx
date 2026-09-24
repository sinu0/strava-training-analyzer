import DownloadIcon from '@mui/icons-material/Download';
import { Alert, Box, Button, Container, Slider, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';

import type { WorkoutExecution } from '@/types/training';
import { Metric, Surface } from '@/ui';

import { formatClock } from './cockpit/format';

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
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>{execution.status === 'COMPLETED' ? 'Trening ukończony' : 'Trening przerwany'}</Typography>
        <Typography variant="h3" component="h1" sx={{ mt: 0.5 }}>{execution.workoutNameSnapshot}</Typography>
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 3, my: 3 }}>
          <Metric label="Zrealizowany czas" value={formatClock(execution.workoutElapsedMs)} />
          <Metric label="Pominięte kroki" value={execution.skippedStepIndexes.length} />
          <Metric label="Zgodność" value={execution.complianceScore ?? '—'} unit={execution.complianceScore != null ? '%' : undefined} hint={execution.complianceStatus} />
        </Stack>
        {hasRide ? (
          <Surface variant="muted" padding="sm" radius="panel" sx={{ mb: 3 }} aria-label="Dane z trenażera">
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 3 }}>
              <Metric variant="stat" label="Średnia moc" value={ride.avgPower ?? '—'} unit="W" />
              <Metric variant="stat" label="NP" value={ride.normalizedPower ?? '—'} unit="W" />
              <Metric variant="stat" label="IF" value={ride.intensityFactor != null ? ride.intensityFactor.toFixed(2) : '—'} />
              <Metric variant="stat" label="TSS" value={ride.tss != null ? Math.round(ride.tss) : '—'} />
              <Metric variant="stat" label="Śr. tętno" value={ride.avgHeartRate ?? '—'} unit="bpm" />
              <Metric variant="stat" label="Śr. kadencja" value={ride.avgCadence ?? '—'} unit="rpm" />
              <Metric variant="stat" label="Praca" value={Math.round(ride.kilojoules)} unit="kJ" />
            </Stack>
          </Surface>
        ) : null}
        {recordingState === 'ready' && fitDownloadUrl ? (
          <Button component="a" href={fitDownloadUrl} download variant="outlined" startIcon={<DownloadIcon />} fullWidth sx={{ mb: 2 }}>
            Pobierz plik FIT
          </Button>
        ) : null}
        {recordingState === 'uploading' ? <Alert severity="info" sx={{ mb: 2 }}>Wysyłam nagranie przejazdu… Plik FIT pojawi się po zapisaniu.</Alert> : null}
        {recordingState === 'failed' ? <Alert severity="warning" sx={{ mb: 2 }}>Nagranie jest bezpieczne na tym urządzeniu i zostanie wysłane po odzyskaniu połączenia.</Alert> : null}
        <Alert severity="info" sx={{ mb: 3 }}>Dokładna ocena zostanie uzupełniona po synchronizacji aktywności i strumieni ze Stravy.</Alert>
        <Typography id="rpe-label" gutterBottom>{rpe == null ? 'RPE: nie podano' : `RPE: ${rpe}/10`}</Typography>
        <Slider value={rpe ?? 5} min={1} max={10} marks onChange={(_, value) => setRpe(value as number)} aria-labelledby="rpe-label" sx={{ minHeight: 44 }} />
        <ToggleButtonGroup exclusive value={feeling} onChange={(_, value) => value && setFeeling(value)} fullWidth sx={{ my: 2 }}>
          <ToggleButton value="BAD">Słabo</ToggleButton>
          <ToggleButton value="OK">OK</ToggleButton>
          <ToggleButton value="GOOD">Dobrze</ToggleButton>
        </ToggleButtonGroup>
        <TextField label="Notatka" multiline minRows={3} fullWidth value={notes} onChange={(event) => setNotes(event.target.value)} />
        {error ? <Alert severity="error" sx={{ mt: 2 }}>Nie udało się zapisać podsumowania. Twoje odczucia pozostały w formularzu; spróbuj ponownie.</Alert> : null}
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" fullWidth disabled={saving} onClick={() => void save()} sx={{ minHeight: 48 }}>Zapisz podsumowanie</Button>
        </Box>
      </Surface>
    </Container>
  );
}
