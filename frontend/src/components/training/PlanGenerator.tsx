import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

import { useGenerateProgram } from '../../hooks/useTrainingPlan';

const GOALS = [
  { value: 'MAINTAIN_FITNESS', label: 'Utrzymanie formy' },
  { value: 'BUILD_BASE', label: 'Budowa bazy' },
  { value: 'BUILD_PEAK', label: 'Budowa szczytu' },
  { value: 'TAPER', label: 'Tapering' },
  { value: 'RECOVERY_BLOCK', label: 'Blok regeneracyjny' },
];

const GOAL_PRIORITIES = [
  { value: 'A', label: 'Cel A - priorytet główny' },
  { value: 'B', label: 'Cel B - ważny, ale bez pełnego taperu' },
  { value: 'C', label: 'Cel C - trening kontrolny' },
];

const LONG_RIDE_DAYS = [
  { value: 'SATURDAY', label: 'Sobota' },
  { value: 'SUNDAY', label: 'Niedziela' },
];

const ENVIRONMENT_PREFERENCES = [
  { value: 'MIXED', label: 'Mieszany' },
  { value: 'INDOOR_FRIENDLY', label: 'Raczej indoor w tygodniu' },
  { value: 'OUTDOOR_FOCUSED', label: 'Raczej outdoor' },
];

const STEPS = ['Cel i ramy', 'Ograniczenia tygodnia', 'Podsumowanie'];

interface PlanGeneratorProps {
  onGenerated?: () => void;
}

export default function PlanGenerator({ onGenerated }: PlanGeneratorProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [goal, setGoal] = useState('BUILD_BASE');
  const [goalPriority, setGoalPriority] = useState('B');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventDate, setEventDate] = useState('');
  const [weeks, setWeeks] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [weeklyTss, setWeeklyTss] = useState(500);
  const [weekdayAvailabilityMinutes, setWeekdayAvailabilityMinutes] = useState(75);
  const [weekendAvailabilityMinutes, setWeekendAvailabilityMinutes] = useState(180);
  const [preferredLongRideDay, setPreferredLongRideDay] = useState('SATURDAY');
  const [environmentPreference, setEnvironmentPreference] = useState('MIXED');

  const generate = useGenerateProgram();

  const weeksValid = weeks >= 1 && weeks <= 52;
  const daysValid = daysPerWeek >= 2 && daysPerWeek <= 7;
  const tssValid = weeklyTss >= 100 && weeklyTss <= 2000;
  const weekdayAvailabilityValid = weekdayAvailabilityMinutes >= 30 && weekdayAvailabilityMinutes <= 300;
  const weekendAvailabilityValid = weekendAvailabilityMinutes >= 60 && weekendAvailabilityMinutes <= 480;
  const eventDateValid = !eventDate || eventDate >= startDate;

  const payload = useMemo(() => ({
    goal,
    goalPriority,
    startDate,
    eventDate: eventDate || null,
    weeks,
    trainingDaysPerWeek: daysPerWeek,
    targetWeeklyTss: weeklyTss,
    weekdayAvailabilityMinutes,
    weekendAvailabilityMinutes,
    preferredLongRideDay,
    environmentPreference,
  }), [
    daysPerWeek,
    environmentPreference,
    eventDate,
    goal,
    goalPriority,
    preferredLongRideDay,
    startDate,
    weekdayAvailabilityMinutes,
    weekendAvailabilityMinutes,
    weeklyTss,
    weeks,
  ]);

  const canProceed = activeStep === 0
    ? weeksValid && daysValid && tssValid && eventDateValid
    : weekdayAvailabilityValid && weekendAvailabilityValid;

  const handleSubmit = () => {
    generate.mutate(payload, {
      onSuccess: () => {
        setActiveStep(STEPS.length - 1);
        onGenerated?.();
      },
    });
  };

  return (
    <Card>
      <CardHeader title={<Typography variant="h6">Wizard planu</Typography>} />
      <CardContent>
        <Stack spacing={3}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">Ustal cel bloku i podstawowe ramy planu.</Typography>
              <TextField select label="Cel" value={goal} onChange={(e) => setGoal(e.target.value)} size="small" fullWidth>
                {GOALS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </TextField>
              <TextField select label="Priorytet celu" value={goalPriority} onChange={(e) => setGoalPriority(e.target.value)} size="small" fullWidth>
                {GOAL_PRIORITIES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </TextField>
              <TextField
                label="Data rozpoczęcia"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Data startu docelowego"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                size="small"
                fullWidth
                error={!eventDateValid}
                helperText={!eventDateValid ? 'Data celu nie może być wcześniejsza niż start planu' : 'Opcjonalnie — uruchamia prosty taper pod start'}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Liczba tygodni"
                type="number"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                size="small"
                fullWidth
                error={!weeksValid}
                helperText={!weeksValid ? '1–52' : ''}
                slotProps={{ htmlInput: { min: 1, max: 52 } }}
              />
              <TextField
                label="Dni treningowe/tydzień"
                type="number"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                size="small"
                fullWidth
                error={!daysValid}
                helperText={!daysValid ? '2–7' : ''}
                slotProps={{ htmlInput: { min: 2, max: 7 } }}
              />
              <TextField
                label="Docelowy TSS/tydzień"
                type="number"
                value={weeklyTss}
                onChange={(e) => setWeeklyTss(Number(e.target.value))}
                size="small"
                fullWidth
                error={!tssValid}
                helperText={!tssValid ? '100–2000' : ''}
                slotProps={{ htmlInput: { min: 100, max: 2000 } }}
              />
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">Powiedz plannerowi, ile realnie masz czasu i w jakim środowisku trenujesz.</Typography>
              <TextField
                label="Okno w dzień roboczy (min)"
                type="number"
                value={weekdayAvailabilityMinutes}
                onChange={(e) => setWeekdayAvailabilityMinutes(Number(e.target.value))}
                size="small"
                fullWidth
                error={!weekdayAvailabilityValid}
                helperText={!weekdayAvailabilityValid ? '30–300 min' : 'Planner przytnie czas sesji do tego limitu'}
                slotProps={{ htmlInput: { min: 30, max: 300 } }}
              />
              <TextField
                label="Okno weekendowe (min)"
                type="number"
                value={weekendAvailabilityMinutes}
                onChange={(e) => setWeekendAvailabilityMinutes(Number(e.target.value))}
                size="small"
                fullWidth
                error={!weekendAvailabilityValid}
                helperText={!weekendAvailabilityValid ? '60–480 min' : 'Tu planner szuka miejsca na długi tlen'}
                slotProps={{ htmlInput: { min: 60, max: 480 } }}
              />
              <TextField
                select
                label="Preferowany dzień długiej jazdy"
                value={preferredLongRideDay}
                onChange={(e) => setPreferredLongRideDay(e.target.value)}
                size="small"
                fullWidth
              >
                {LONG_RIDE_DAYS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </TextField>
              <TextField
                select
                label="Środowisko treningu"
                value={environmentPreference}
                onChange={(e) => setEnvironmentPreference(e.target.value)}
                size="small"
                fullWidth
              >
                {ENVIRONMENT_PREFERENCES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </TextField>
            </Stack>
          )}

          {activeStep === 2 && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">Sprawdź, czy plan ma sens zanim go wygenerujesz.</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={GOALS.find((item) => item.value === goal)?.label ?? goal} color="primary" />
                <Chip label={`Priorytet ${goalPriority}`} variant="outlined" />
                <Chip label={`${weeks} tyg.`} variant="outlined" />
                <Chip label={`${daysPerWeek} dni/tydz.`} variant="outlined" />
                <Chip label={`${weeklyTss} TSS/tydz.`} variant="outlined" />
                <Chip label={`${weekdayAvailabilityMinutes} min w tygodniu`} variant="outlined" />
                <Chip label={`${weekendAvailabilityMinutes} min w weekend`} variant="outlined" />
                <Chip label={`Długi trening: ${LONG_RIDE_DAYS.find((item) => item.value === preferredLongRideDay)?.label}`} variant="outlined" />
                <Chip label={ENVIRONMENT_PREFERENCES.find((item) => item.value === environmentPreference)?.label ?? environmentPreference} variant="outlined" />
              </Stack>
              <Alert severity="info">
                Generator zbuduje tydzień wokół głównego celu, limitu jakości i dostępnych okien czasowych zamiast układać luźny zestaw sesji.
              </Alert>
              {!!eventDate && (
                <Typography variant="body2" color="text.secondary">
                  Start docelowy: {eventDate}. Planner uwzględni taper, jeśli blok dochodzi do tej daty.
                </Typography>
              )}
            </Stack>
          )}

          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button disabled={activeStep === 0 || generate.isPending} onClick={() => setActiveStep((step) => step - 1)}>
              Wstecz
            </Button>
            {activeStep < STEPS.length - 1 ? (
              <Button variant="contained" disabled={!canProceed || generate.isPending} onClick={() => setActiveStep((step) => step + 1)}>
                Dalej
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit} disabled={generate.isPending || !canProceed}>
                {generate.isPending ? 'Generowanie...' : 'Generuj plan'}
              </Button>
            )}
          </Stack>

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
