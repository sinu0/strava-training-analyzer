import {
  Card, CardContent, CardHeader, Typography, TextField, MenuItem, Button, Stack, Alert,
} from '@mui/material';
import { useState } from 'react';

import { useGenerateProgram } from '../../hooks/useTrainingPlan';

const GOALS = [
  { value: 'MAINTAIN_FITNESS', label: 'Utrzymanie formy' },
  { value: 'BUILD_BASE', label: 'Budowa bazy' },
  { value: 'BUILD_PEAK', label: 'Budowa szczytu' },
  { value: 'TAPER', label: 'Tapering' },
  { value: 'RECOVERY_BLOCK', label: 'Blok regeneracyjny' },
];

interface PlanGeneratorProps {
  onGenerated?: () => void;
}

export default function PlanGenerator({ onGenerated }: PlanGeneratorProps) {
  const [goal, setGoal] = useState('BUILD_BASE');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [weeks, setWeeks] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [weeklyTss, setWeeklyTss] = useState(500);

  const generate = useGenerateProgram();

  const handleSubmit = () => {
    generate.mutate(
      { goal, startDate, weeks, trainingDaysPerWeek: daysPerWeek, targetWeeklyTss: weeklyTss },
      { onSuccess: () => onGenerated?.() },
    );
  };

  const weeksValid = weeks >= 1 && weeks <= 52;
  const daysValid = daysPerWeek >= 2 && daysPerWeek <= 7;
  const tssValid = weeklyTss >= 100 && weeklyTss <= 2000;

  return (
    <Card>
      <CardHeader title={<Typography variant="h6">Generator planu</Typography>} />
      <CardContent>
        <Stack spacing={2}>
          <TextField select label="Cel" value={goal} onChange={(e) => setGoal(e.target.value)} size="small" fullWidth>
            {GOALS.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
          </TextField>

          <TextField label="Data rozpoczęcia" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} />

          <TextField label="Liczba tygodni" type="number" value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            size="small" fullWidth error={!weeksValid} helperText={!weeksValid ? '1–52' : ''}
            slotProps={{ htmlInput: { min: 1, max: 52 } }} />

          <TextField label="Dni treningowe/tydzień" type="number" value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            size="small" fullWidth error={!daysValid} helperText={!daysValid ? '2–7' : ''}
            slotProps={{ htmlInput: { min: 2, max: 7 } }} />

          <TextField label="Docelowy TSS/tydzień" type="number" value={weeklyTss}
            onChange={(e) => setWeeklyTss(Number(e.target.value))}
            size="small" fullWidth error={!tssValid} helperText={!tssValid ? '100–2000' : ''}
            slotProps={{ htmlInput: { min: 100, max: 2000 } }} />

          <Button variant="contained" onClick={handleSubmit}
            disabled={generate.isPending || !weeksValid || !daysValid || !tssValid}>
            {generate.isPending ? 'Generowanie...' : 'Generuj plan'}
          </Button>

          {!!generate.isSuccess && (
            <Alert severity="success">
              Wygenerowano plan {generate.data.name} ({generate.data.startDate} – {generate.data.endDate})
            </Alert>
          )}
          {!!generate.isError && <Alert severity="error">Błąd generowania planu</Alert>}
        </Stack>
      </CardContent>
    </Card>
  );
}
