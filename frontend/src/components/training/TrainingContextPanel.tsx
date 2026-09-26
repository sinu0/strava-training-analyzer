import { Alert, Box, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { useSaveTrainingContext, useTrainingContext } from '@/hooks/useTrainingContext';
import type { TrainingConstraint, TrainingContext } from '@/types/trainingContext';
import { ErrorState, LoadingState, Surface } from '@/ui';
import { localDate } from '@/utils/localDate';

import { trainingMessages } from './messages';

const DAY_LABEL_KEYS = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday',
} as const satisfies Record<string, string>;

const DAY_KEYS = Object.keys(DAY_LABEL_KEYS) as (keyof typeof DAY_LABEL_KEYS)[];

function ContextForm({ initial }: { initial: TrainingContext }) {
  const t = trainingMessages.useT();
  const [form, setForm] = useState(initial);
  const [constraint, setConstraint] = useState<TrainingConstraint>({ from: initial.asOf ?? localDate(), to: initial.asOf ?? localDate(), type: 'BLOCKED', note: '' });
  const save = useSaveTrainingContext();
  const set = <K extends keyof TrainingContext>(key: K, value: TrainingContext[K]) => setForm(current => ({ ...current, [key]: value }));

  return (
    <Stack component="form" spacing={2.5} onSubmit={event => {
      event.preventDefault();
      save.mutate(form, { onSuccess: saved => setForm(saved) });
    }}>
      <Typography variant="h6">{t('trainingContextPanel.title')}</Typography>
      <Typography sx={{
        color: "text.secondary"
      }}>{t('trainingContextPanel.timezoneInfo', { timezone: initial.timezone ?? t('trainingContextPanel.timezoneLocal') })}</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth select label={t('trainingContextPanel.goalLabel')} value={form.goalType ?? ''} onChange={e => set('goalType', (e.target.value || undefined) as TrainingContext['goalType'])}>
          <MenuItem value="">{t('trainingContextPanel.goalSelectPlaceholder')}</MenuItem><MenuItem value="FTP">{t('trainingContextPanel.goalOptions.ftp')}</MenuItem><MenuItem value="ENDURANCE">{t('trainingContextPanel.goalOptions.endurance')}</MenuItem><MenuItem value="CONSISTENCY">{t('trainingContextPanel.goalOptions.consistency')}</MenuItem><MenuItem value="EVENT">{t('trainingContextPanel.goalOptions.event')}</MenuItem>
        </TextField></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={form.goalType === 'FTP' ? t('trainingContextPanel.targetFtpLabel') : t('trainingContextPanel.targetValueLabel')} type="number" value={form.targetValue ?? ''} onChange={e => set('targetValue', e.target.value === '' ? undefined : Number(e.target.value))} slotProps={{ htmlInput: { min: 1, step: 'any' } }} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={t('trainingContextPanel.deadlineLabel')} type="date" value={form.deadline ?? ''} onChange={e => set('deadline', e.target.value || undefined)} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
        {DAY_KEYS.map((key) => {
          const label = t(`trainingContextPanel.days.${DAY_LABEL_KEYS[key]}` as Parameters<typeof t>[0]);
          return (
            <Grid key={key} size={{ xs: 6, sm: 3 }}><TextField fullWidth label={t('trainingContextPanel.minutesFieldLabel', { label })} type="number" value={form.availableMinutes[key] ?? ''} slotProps={{ htmlInput: { min: 0, max: 720 } }} onChange={e => {
              const next = { ...form.availableMinutes };
              if (e.target.value === '') delete next[key]; else next[key] = Number(e.target.value);
              set('availableMinutes', next);
            }} /></Grid>
          );
        })}
        <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth select label={t('trainingContextPanel.environmentLabel')} value={form.environment} onChange={e => set('environment', e.target.value as TrainingContext['environment'])}>
          <MenuItem value="MIXED">{t('trainingContextPanel.environmentOptions.mixed')}</MenuItem><MenuItem value="INDOOR">{t('trainingContextPanel.environmentOptions.indoor')}</MenuItem><MenuItem value="OUTDOOR">{t('trainingContextPanel.environmentOptions.outdoor')}</MenuItem>
        </TextField></Grid>
      </Grid>
      <Typography variant="h6">{t('trainingContextPanel.constraintsTitle')}</Typography>
      <Typography variant="body2" sx={{
        color: "text.secondary"
      }}>{t('trainingContextPanel.constraintsHint')}</Typography>
      {form.constraints.map((item, index) => <Stack key={`${item.from}-${item.to}-${item.type}-${item.note ?? ''}`} direction="row" spacing={1} sx={{
        alignItems: "center"
      }}>
        <Typography sx={{ flex: 1 }}>{item.from} – {item.to}: {item.type === 'BLOCKED' ? t('trainingContextPanel.constraintTypeBlocked') : t('trainingContextPanel.constraintTypeReturn')}{item.note ? ` · ${item.note}` : ''}</Typography>
        <Button type="button" onClick={() => set('constraints', form.constraints.filter((_, i) => i !== index))} aria-label={t('trainingContextPanel.removeConstraintAria', { from: item.from })}>{t('trainingContextPanel.removeButton')}</Button>
      </Stack>)}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth type="date" label={t('trainingContextPanel.fromLabel')} value={constraint.from} onChange={e => setConstraint(c => ({ ...c, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth type="date" label={t('trainingContextPanel.toLabel')} value={constraint.to} onChange={e => setConstraint(c => ({ ...c, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label={t('trainingContextPanel.constraintTypeLabel')} value={constraint.type} onChange={e => setConstraint(c => ({ ...c, type: e.target.value as TrainingConstraint['type'] }))}>
          <MenuItem value="BLOCKED">{t('trainingContextPanel.constraintTypeBlocked')}</MenuItem><MenuItem value="RETURN_TO_TRAINING">{t('trainingContextPanel.constraintTypeReturn')}</MenuItem>
        </TextField></Grid>
        <Grid size={12}><TextField fullWidth label={t('trainingContextPanel.noteLabel')} value={constraint.note ?? ''} onChange={e => setConstraint(c => ({ ...c, note: e.target.value }))} slotProps={{ htmlInput: { maxLength: 500 } }} /></Grid>
      </Grid>
      <Box><Button type="button" variant="outlined" disabled={!constraint.from || !constraint.to || constraint.from > constraint.to || form.constraints.some(item => item.from === constraint.from && item.to === constraint.to && item.type === constraint.type && item.note === constraint.note)} onClick={() => set('constraints', [...form.constraints, { ...constraint }])}>{t('trainingContextPanel.addConstraint')}</Button></Box>
      {!!save.isError && <Alert severity="error">{t('trainingContextPanel.saveError')}</Alert>}
      {!!save.isSuccess && <Alert severity="success">{t('trainingContextPanel.saveSuccess')}</Alert>}
      <Box><Button type="submit" variant="contained" disabled={save.isPending}>{t('trainingContextPanel.saveButton')}</Button></Box>
    </Stack>
  );
}

export default function TrainingContextPanel() {
  const t = trainingMessages.useT();
  const context = useTrainingContext();
  if (context.isLoading) return <LoadingState message={t('trainingContextPanel.loadingContext')} />;
  if (context.isError || !context.data) return <ErrorState message={t('trainingContextPanel.errorContext')} onRetry={() => void context.refetch()} />;
  return <Surface><ContextForm initial={context.data} /></Surface>;
}
