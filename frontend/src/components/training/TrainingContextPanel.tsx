import { Alert, Box, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import { useSaveTrainingContext, useTrainingContext } from '@/hooks/useTrainingContext';
import type { TrainingConstraint, TrainingContext } from '@/types/trainingContext';
import { localDate } from '@/utils/localDate';

const days = [['MONDAY', 'Poniedziałek'], ['TUESDAY', 'Wtorek'], ['WEDNESDAY', 'Środa'], ['THURSDAY', 'Czwartek'], ['FRIDAY', 'Piątek'], ['SATURDAY', 'Sobota'], ['SUNDAY', 'Niedziela']] as const;

function ContextForm({ initial }: { initial: TrainingContext }) {
  const [form, setForm] = useState(initial);
  const [constraint, setConstraint] = useState<TrainingConstraint>({ from: initial.asOf ?? localDate(), to: initial.asOf ?? localDate(), type: 'BLOCKED', note: '' });
  const save = useSaveTrainingContext();
  const set = <K extends keyof TrainingContext>(key: K, value: TrainingContext[K]) => setForm(current => ({ ...current, [key]: value }));

  return (
    <Stack component="form" spacing={2.5} onSubmit={event => {
      event.preventDefault();
      save.mutate(form, { onSuccess: saved => setForm(saved) });
    }}>
      <Typography variant="h6">Cel i dostępność</Typography>
      <Typography color="text.secondary">Strefa treningowa: {initial.timezone ?? 'lokalna'}. Puste pole czasu oznacza brak informacji, a 0 — dzień wolny.</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth select label="Cel" value={form.goalType ?? ''} onChange={e => set('goalType', (e.target.value || undefined) as TrainingContext['goalType'])}>
          <MenuItem value="">Wybierz cel</MenuItem><MenuItem value="FTP">Rozwój FTP</MenuItem><MenuItem value="ENDURANCE">Wytrzymałość</MenuItem><MenuItem value="CONSISTENCY">Regularność</MenuItem><MenuItem value="EVENT">Wydarzenie</MenuItem>
        </TextField></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={form.goalType === 'FTP' ? 'Cel FTP (W)' : 'Wartość celu (opcjonalnie)'} type="number" value={form.targetValue ?? ''} onChange={e => set('targetValue', e.target.value === '' ? undefined : Number(e.target.value))} slotProps={{ htmlInput: { min: 1, step: 'any' } }} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Termin celu" type="date" value={form.deadline ?? ''} onChange={e => set('deadline', e.target.value || undefined)} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
        {days.map(([key, label]) => <Grid key={key} size={{ xs: 6, sm: 3 }}><TextField fullWidth label={`${label} (min)`} type="number" value={form.availableMinutes[key] ?? ''} slotProps={{ htmlInput: { min: 0, max: 720 } }} onChange={e => {
          const next = { ...form.availableMinutes };
          if (e.target.value === '') delete next[key]; else next[key] = Number(e.target.value);
          set('availableMinutes', next);
        }} /></Grid>)}
        <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth select label="Preferencja" value={form.environment} onChange={e => set('environment', e.target.value as TrainingContext['environment'])}>
          <MenuItem value="MIXED">Dowolnie</MenuItem><MenuItem value="INDOOR">Trenażer</MenuItem><MenuItem value="OUTDOOR">Na zewnątrz</MenuItem>
        </TextField></Grid>
      </Grid>
      <Typography variant="h6">Ograniczenia w kalendarzu</Typography>
      <Typography variant="body2" color="text.secondary">Zaznacz dni wyłączone lub okres spokojnego powrotu do treningu. Uwzględnij własne zalecenia dotyczące zdrowia.</Typography>
      {form.constraints.map((item, index) => <Stack key={`${item.from}-${item.to}-${item.type}-${item.note ?? ''}`} direction="row" spacing={1} alignItems="center">
        <Typography sx={{ flex: 1 }}>{item.from} – {item.to}: {item.type === 'BLOCKED' ? 'Dni wolne' : 'Spokojny powrót'}{item.note ? ` · ${item.note}` : ''}</Typography>
        <Button type="button" onClick={() => set('constraints', form.constraints.filter((_, i) => i !== index))} aria-label={`Usuń ograniczenie od ${item.from}`}>Usuń</Button>
      </Stack>)}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth type="date" label="Od" value={constraint.from} onChange={e => setConstraint(c => ({ ...c, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth type="date" label="Do" value={constraint.to} onChange={e => setConstraint(c => ({ ...c, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label="Ograniczenie" value={constraint.type} onChange={e => setConstraint(c => ({ ...c, type: e.target.value as TrainingConstraint['type'] }))}>
          <MenuItem value="BLOCKED">Dni wolne</MenuItem><MenuItem value="RETURN_TO_TRAINING">Spokojny powrót</MenuItem>
        </TextField></Grid>
        <Grid size={12}><TextField fullWidth label="Notatka (opcjonalnie)" value={constraint.note ?? ''} onChange={e => setConstraint(c => ({ ...c, note: e.target.value }))} slotProps={{ htmlInput: { maxLength: 500 } }} /></Grid>
      </Grid>
      <Box><Button type="button" variant="outlined" disabled={!constraint.from || !constraint.to || constraint.from > constraint.to || form.constraints.some(item => item.from === constraint.from && item.to === constraint.to && item.type === constraint.type && item.note === constraint.note)} onClick={() => set('constraints', [...form.constraints, { ...constraint }])}>Dodaj ograniczenie</Button></Box>
      {!!save.isError && <Alert severity="error">Nie udało się zapisać. Sprawdź zakresy i odśwież dane, jeśli zmieniono je w innym oknie.</Alert>}
      {!!save.isSuccess && <Alert severity="success">Zapisano kontekst treningowy.</Alert>}
      <Box><Button type="submit" variant="contained" disabled={save.isPending}>Zapisz kontekst</Button></Box>
    </Stack>
  );
}

export default function TrainingContextPanel() {
  const context = useTrainingContext();
  if (context.isLoading) return <LoadingState message="Wczytywanie kontekstu treningowego…" />;
  if (context.isError || !context.data) return <ErrorState message="Nie udało się pobrać kontekstu treningowego." onRetry={() => void context.refetch()} />;
  return <PerformanceSurface sx={{ p: { xs: 2, md: 3 } }}><ContextForm initial={context.data} /></PerformanceSurface>;
}
