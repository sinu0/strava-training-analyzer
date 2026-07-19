
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid2 as Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { useCreateEvent, useEvents } from '@/hooks/useAnalytics';
import { useCurrentPerformanceState } from '@/hooks/usePerformancePrediction';
import { useApplyOptimizedPlan, useOptimizePlan } from '@/hooks/useTrainingOptimizer';
import { useGenerateProgram } from '@/hooks/useTrainingPlan';
import type { OptimizePlanResponse, PlanType } from '@/types/trainingOptimizer';
import { STATUS_COLORS } from '@/utils/colors';

const STEPS = ['Stan & kontekst', 'Cel i ograniczenia', 'Optymalizacja', 'Podglad i zastosuj'];

const GOALS = [
  { value: 'MAINTAIN_FITNESS', label: 'Utrzymanie formy' },
  { value: 'BUILD_BASE', label: 'Budowa bazy' },
  { value: 'BUILD_PEAK', label: 'Budowa szczytu' },
  { value: 'TAPER', label: 'Tapering' },
  { value: 'RECOVERY_BLOCK', label: 'Blok regeneracyjny' },
];

const GOAL_PRIORITIES = [
  { value: 'A', label: 'Cel A — priorytet glowny' },
  { value: 'B', label: 'Cel B — wazny' },
  { value: 'C', label: 'Cel C — kontrolny' },
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

const PLAN_TYPE_CONFIG: Record<PlanType, { color: string; label: string }> = {
  CONSERVATIVE: { color: STATUS_COLORS.warning, label: 'Konserwatywny' },
  BALANCED: { color: '#58A6FF', label: 'Zrownowazony' },
  AGGRESSIVE: { color: STATUS_COLORS.error, label: 'Agresywny' },
};

const INTENSITY_COLORS: Record<string, string> = {
  HIGH: STATUS_COLORS.error,
  MODERATE: STATUS_COLORS.warning,
  LOW: STATUS_COLORS.success,
};

function defaultNumber(value: number | undefined, fallback: number): number {
  return value != null ? value : fallback;
}

export default function PlanBuilder() {
  const [activeStep, setActiveStep] = useState(0);

  const { data: currentState, isLoading: isLoadingState } = useCurrentPerformanceState();
  const { data: events } = useEvents();
  const createEvent = useCreateEvent();

  const { mutate: runOptimizer, isPending: isOptimizing, isError: isOptimizerError, error: optimizerError } = useOptimizePlan();
  const applyMutation = useApplyOptimizedPlan();
  const generate = useGenerateProgram();

  const [initialized, setInitialized] = useState(false);
  const [result, setResult] = useState<OptimizePlanResponse | null>(null);
  const [applied, setApplied] = useState(false);
  const [selectedType, setSelectedType] = useState<PlanType>('BALANCED');
  const [generatedProgram, setGeneratedProgram] = useState(false);

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

  const [currentCtl, setCurrentCtl] = useState(55);
  const [currentAtl, setCurrentAtl] = useState(50);
  const [ftp, setFtp] = useState(250);

  const [quickEventName, setQuickEventName] = useState('');
  const [quickEventType, setQuickEventType] = useState('ROAD_RACE');
  const [quickEventPriority, setQuickEventPriority] = useState('B');

  useEffect(() => {
    if (currentState && !initialized) {
      setCurrentCtl(Math.round(defaultNumber(currentState.ctl, 55)));
      setCurrentAtl(Math.round(defaultNumber(currentState.atl, 50)));
      setFtp(defaultNumber(currentState.ftp, 250));
      setInitialized(true);
    }
  }, [currentState, initialized]);

  useEffect(() => {
    if (events && events.length > 0) {
      const activeEvents = events.filter((e) => e.active);
      if (activeEvents.length > 0 && !eventDate) {
        const sorted = [...activeEvents].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        const nextEvent = sorted[0];
        if (nextEvent) {
          setEventDate(nextEvent.eventDate.slice(0, 10));
          setGoalPriority(nextEvent.priority);
          setGoal(nextEvent.priority === 'A' ? 'BUILD_PEAK' : 'BUILD_BASE');
        }
      }
    }
  }, [events, eventDate]);

  const selectedPlan = useMemo(
    () => result?.plans?.find((p) => p.type === selectedType) ?? null,
    [result, selectedType],
  );

  const weeksValid = weeks >= 1 && weeks <= 16;
  const daysValid = daysPerWeek >= 2 && daysPerWeek <= 7;
  const tssValid = weeklyTss >= 100 && weeklyTss <= 1500;
  const ctlValid = currentCtl >= 0 && currentCtl <= 150;
  const atlValid = currentAtl >= 0 && currentAtl <= 200;
  const ftpValid = ftp >= 100 && ftp <= 500;
  const weekdayAvailValid = weekdayAvailabilityMinutes >= 30 && weekdayAvailabilityMinutes <= 300;
  const weekendAvailValid = weekendAvailabilityMinutes >= 60 && weekendAvailabilityMinutes <= 480;

  const step1Valid = weeksValid && daysValid && tssValid && ctlValid && atlValid && ftpValid;
  const step2Valid = weekdayAvailValid && weekendAvailValid;
  const allValid = step1Valid && !!goal;

  const handleOptimize = () => {
    setApplied(false);
    setResult(null);
    setSelectedType('BALANCED');
    setGeneratedProgram(false);
    runOptimizer(
      {
        weeks,
        trainingDaysPerWeek: daysPerWeek,
        targetWeeklyTss: weeklyTss,
        currentCtl,
        currentAtl,
        ftp,
        eventDate: eventDate || null,
        goalPriority,
      },
      {
        onSuccess: (res) => {
          setResult(res);
          setActiveStep(3);
        },
      },
    );
  };

  const handleApply = () => {
    if (!selectedPlan) return;
    applyMutation.mutate(
      {
        name: `${PLAN_TYPE_CONFIG[selectedType].label} ${weeks}tyg`,
        goalPriority,
        targetWeeklyTss: weeklyTss,
        sessions: selectedPlan.sessions.map((s) => ({
          day: s.day,
          type: s.type,
          durationMinutes: s.durationMinutes,
          tss: s.tss,
          goal: s.goal,
        })),
      },
      { onSuccess: () => setApplied(true) },
    );
  };

  const handleGenerateLegacy = () => {
    generate.mutate(
      {
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
      },
      {
        onSuccess: () => setGeneratedProgram(true),
      },
    );
  };

  const handleQuickCreateEvent = () => {
    if (quickEventName && eventDate) {
      createEvent.mutate({
        name: quickEventName,
        eventDate,
        type: quickEventType,
        priority: quickEventPriority,
      });
      setQuickEventName('');
    }
  };

  const activeEvents = events?.filter((e) => e.active).slice(0, 3) ?? [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {!!isLoadingState && <LinearProgress sx={{ borderRadius: 2 }} />}

      <Card>
        <CardHeader
          title="Plan Builder"
          titleTypographyProps={{ variant: 'h6' }}
          subheader="Polaczony wizard z optymalizacja algorytmiczna. Stan atlety zaciagany automatycznie."
        />
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.72rem', fontWeight: 600 } }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* STEP 1: Athlete state & context */}
          {activeStep === 0 && (
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Stan atlety zaciagniety z danych treningowych. Mozesz go poprawic. Eventy zaciagane automatycznie.
              </Typography>

              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Parametry PMC (auto-wypelnione)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label="CTL"
                      value={currentCtl} onChange={(e) => setCurrentCtl(Number(e.target.value))}
                      error={!ctlValid} slotProps={{ htmlInput: { min: 0, max: 150 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label="ATL"
                      value={currentAtl} onChange={(e) => setCurrentAtl(Number(e.target.value))}
                      error={!atlValid} slotProps={{ htmlInput: { min: 0, max: 200 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label="FTP (W)"
                      value={ftp} onChange={(e) => setFtp(Number(e.target.value))}
                      error={!ftpValid} slotProps={{ htmlInput: { min: 100, max: 500 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label="Tygodnie"
                      value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}
                      error={!weeksValid} helperText={!weeksValid ? '1-16' : undefined}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label="Dni/tydz."
                      value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                      error={!daysValid} helperText={!daysValid ? '2-7' : undefined}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label="TSS/tydz."
                      value={weeklyTss} onChange={(e) => setWeeklyTss(Number(e.target.value))}
                      error={!tssValid} helperText={!tssValid ? '100-1500' : undefined}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <EmojiEventsIcon sx={{ color: STATUS_COLORS.warning, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Wydarzenia
                  </Typography>
                </Stack>

                {activeEvents.length > 0 ? (
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    {activeEvents.map((e) => (
                      <Chip
                        key={e.id}
                        icon={<EmojiEventsIcon />}
                        label={`${e.name} — ${new Date(e.eventDate).toLocaleDateString('pl-PL')} (priorytet ${e.priority})`}
                        size="small"
                        color={e.priority === 'A' ? 'error' : e.priority === 'B' ? 'warning' : 'default'}
                        variant="outlined"
                        onClick={() => {
                          setEventDate(e.eventDate.slice(0, 10));
                          setGoalPriority(e.priority);
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Brak wydarzen. Dodaj szybko ponizej lub w panelu bocznym.
                  </Typography>
                )}

                <Grid container spacing={1} alignItems="center">
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth size="small" label="Event date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth size="small" label="Nazwa wydarzenia"
                      value={quickEventName}
                      onChange={(e) => setQuickEventName(e.target.value)}
                      placeholder="np. Maraton Karkonoski"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      select fullWidth size="small" label="Typ"
                      value={quickEventType}
                      onChange={(e) => setQuickEventType(e.target.value)}
                    >
                      <MenuItem value="ROAD_RACE">Wyscig</MenuItem>
                      <MenuItem value="TT">Time Trial</MenuItem>
                      <MenuItem value="GRAN_FONDO">Gran Fondo</MenuItem>
                      <MenuItem value="CRIT">Kryterium</MenuItem>
                      <MenuItem value="TRIATHLON">Triathlon</MenuItem>
                      <MenuItem value="OTHER">Inny</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      select fullWidth size="small" label="Priorytet"
                      value={quickEventPriority}
                      onChange={(e) => setQuickEventPriority(e.target.value)}
                    >
                      <MenuItem value="A">A - kluczowy</MenuItem>
                      <MenuItem value="B">B - wazny</MenuItem>
                      <MenuItem value="C">C - kontrolny</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleQuickCreateEvent}
                      disabled={!quickEventName || !eventDate}
                      fullWidth
                      sx={{ minWidth: 70 }}
                    >
                      Dodaj
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          )}

          {/* STEP 2: Goal & constraints */}
          {activeStep === 1 && (
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Powiedz plannerowi, co chcesz osiagnac i ile masz czasu.
              </Typography>

              <TextField
                select label="Cel bloku" value={goal} onChange={(e) => setGoal(e.target.value)}
                size="small" fullWidth
              >
                {GOALS.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
              </TextField>

              <TextField
                select label="Priorytet celu" value={goalPriority} onChange={(e) => setGoalPriority(e.target.value)}
                size="small" fullWidth
              >
                {GOAL_PRIORITIES.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
              </TextField>

              <TextField
                label="Data rozpoczecia" type="date"
                value={startDate} onChange={(e) => setStartDate(e.target.value)}
                size="small" fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="Okno w dzien roboczy (min)" type="number"
                value={weekdayAvailabilityMinutes} onChange={(e) => setWeekdayAvailabilityMinutes(Number(e.target.value))}
                size="small" fullWidth
                error={!weekdayAvailValid}
                helperText={!weekdayAvailValid ? '30-300' : 'Planner przytnie czas sesji do limitu'}
                slotProps={{ htmlInput: { min: 30, max: 300 } }}
              />

              <TextField
                label="Okno weekendowe (min)" type="number"
                value={weekendAvailabilityMinutes} onChange={(e) => setWeekendAvailabilityMinutes(Number(e.target.value))}
                size="small" fullWidth
                error={!weekendAvailValid}
                helperText={!weekendAvailValid ? '60-480' : 'Tu planner szuka miejsca na dlugi tlen'}
                slotProps={{ htmlInput: { min: 60, max: 480 } }}
              />

              <TextField
                select label="Preferowany dzien dlugiej jazdy"
                value={preferredLongRideDay} onChange={(e) => setPreferredLongRideDay(e.target.value)}
                size="small" fullWidth
              >
                {LONG_RIDE_DAYS.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
              </TextField>

              <TextField
                select label="Srodowisko treningu"
                value={environmentPreference} onChange={(e) => setEnvironmentPreference(e.target.value)}
                size="small" fullWidth
              >
                {ENVIRONMENT_PREFERENCES.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
              </TextField>
            </Stack>
          )}

          {/* STEP 3: Summary & run */}
          {activeStep === 2 && (
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Sprawdz parametry przed optymalizacja.
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={GOALS.find((g) => g.value === goal)?.label ?? goal} color="primary" />
                <Chip label={`Priorytet ${goalPriority}`} variant="outlined" />
                <Chip label={`${weeks} tyg.`} variant="outlined" />
                <Chip label={`${daysPerWeek} dni/tydz.`} variant="outlined" />
                <Chip label={`${weeklyTss} TSS/tydz.`} variant="outlined" />
                <Chip label={`CTL: ${currentCtl} | ATL: ${currentAtl} | FTP: ${ftp}W`} variant="outlined" color="info" />
                {!!eventDate && <Chip label={`Event: ${eventDate}`} color="warning" variant="outlined" />}
              </Stack>

              {!!eventDate && (
                <Alert severity="info">
                  Event {eventDate}. Planner uwzgledni taper i progresywny ramp TSS.
                </Alert>
              )}

              <Button
                variant="contained"
                size="large"
                startIcon={isOptimizing ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleOptimize}
                disabled={!allValid || isOptimizing}
              >
                {isOptimizing ? 'Optymalizuje...' : 'Uruchom optymalizacje'}
              </Button>
            </Stack>
          )}

          {/* STEP 4: Results */}
          {activeStep === 3 && (
            <Stack spacing={2.5}>
              {!!isOptimizerError && (
                <Alert severity="error">
                  {(optimizerError as Error)?.message ?? 'Blad optymalizacji.'}
                </Alert>
              )}

              {!!isOptimizing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
                  <CircularProgress />
                  <Typography color="text.secondary">Optymalizuje plan z Monte Carlo...</Typography>
                </Box>
              )}

              {!!result && <>
                  {/* Strategy */}
                  {result.plans.length === 0 ? (
                    <Alert severity="warning">
                      Nie udalo sie wygenerowac zadnego planu. Sprobuj zwiekszyc liczbe tygodni lub TSS.
                    </Alert>
                  ) : (
                    <Stack spacing={2}>
                      <Card>
                        <CardHeader title="Strategia" titleTypographyProps={{ variant: 'subtitle2' }} />
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Chip
                              icon={<WhatshotIcon />}
                              label={result.strategy.focus}
                              sx={{ fontWeight: 700, px: 1.5, py: 2.5 }}
                              color={result.strategy.focus === 'TAPER' ? 'warning' : result.strategy.focus === 'BUILD' ? 'primary' : 'default'}
                              variant="outlined"
                            />
                            <Typography variant="body2" color="text.secondary">
                              {result.strategy.reasoning}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* Plan selector */}
                      <Card>
                        <CardHeader title="Wybierz wariant planu" titleTypographyProps={{ variant: 'subtitle2' }} />
                        <CardContent>
                          <Grid container spacing={2}>
                            {result.plans.map((plan) => {
                              const isSelected = plan.type === selectedType;
                              return (
                                <Grid size={{ xs: 12, md: 4 }} key={plan.type}>
                                  <Box
                                    onClick={() => { setSelectedType(plan.type); setApplied(false); }}
                                    sx={{
                                      cursor: 'pointer',
                                      border: '2px solid',
                                      borderColor: isSelected ? PLAN_TYPE_CONFIG[plan.type].color : 'divider',
                                      borderRadius: 2,
                                      p: 2,
                                      bgcolor: isSelected ? `${PLAN_TYPE_CONFIG[plan.type].color}0D` : 'transparent',
                                      transition: 'border-color 0.2s',
                                      '&:hover': { borderColor: PLAN_TYPE_CONFIG[plan.type].color },
                                    }}
                                  >
                                    <Stack spacing={1}>
                                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Chip
                                          label={PLAN_TYPE_CONFIG[plan.type].label}
                                          size="small"
                                          sx={{
                                            fontWeight: 600,
                                            bgcolor: `${PLAN_TYPE_CONFIG[plan.type].color}22`,
                                            color: PLAN_TYPE_CONFIG[plan.type].color,
                                          }}
                                        />
                                        {!!isSelected && <Chip label="Wybrany" size="small" color="primary" variant="outlined" />}
                                      </Stack>
                                      <Divider />
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">TSS szacowany</Typography>
                                        <Typography variant="h6" fontWeight={700}>{plan.estimatedTss}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Wynik adaptacji</Typography>
                                        <Typography fontWeight={600}>{plan.score}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Zysk adaptacyjny</Typography>
                                        <Typography fontWeight={600} color="success.main">{plan.adaptationGain}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Koszt zmeczenia</Typography>
                                        <Typography fontWeight={600} color="error.main">{plan.fatigueCost}</Typography>
                                      </Box>
                                    </Stack>
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>

                          {!applied && (
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                              <Button
                                variant="contained"
                                startIcon={applyMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveAltIcon />}
                                onClick={handleApply}
                                disabled={applyMutation.isPending}
                              >
                                {applyMutation.isPending ? 'Zapisuje...' : `Zastosuj ${PLAN_TYPE_CONFIG[selectedType].label.toLowerCase()}`}
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={generate.isPending ? <CircularProgress size={16} color="inherit" /> : <CalendarMonthIcon />}
                                onClick={handleGenerateLegacy}
                                disabled={generate.isPending}
                              >
                                {generate.isPending ? 'Generuje...' : 'Generuj jako program'}
                              </Button>
                            </Stack>
                          )}
                        </CardContent>
                      </Card>

                      {/* Applied success */}
                      {!!applied && (
                        <Alert severity="success">
                          Plan <strong>{PLAN_TYPE_CONFIG[selectedType].label.toLowerCase()}</strong> zapisany w kalendarzu.
                        </Alert>
                      )}
                      {!!applyMutation.isError && (
                        <Alert severity="error">
                          Nie udalo sie zapisac: {(applyMutation.error as Error)?.message ?? 'Nieznany blad'}
                        </Alert>
                      )}
                      {!!generatedProgram && (
                        <Alert severity="success">
                          Wygenerowano program. Przejdz do zakladki <strong>Programy</strong>.
                        </Alert>
                      )}
                      {!!generate.isError && <Alert severity="error">Blad generowania programu</Alert>}

                      {/* Sessions table */}
                      {!!selectedPlan && selectedPlan.sessions.length > 0 && (
                        <Card>
                          <CardHeader
                            title={`Sesje: ${PLAN_TYPE_CONFIG[selectedType].label} (${selectedPlan.sessions.length} sesji | Pewnosc: ${result.confidence}%)`}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                          />
                          <CardContent>
                            <Stack spacing={2}>
                              <Box>
                                <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
                                  Rozklad intensywnosci
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, borderRadius: 2, overflow: 'hidden', height: 28 }}>
                                  <Box sx={{
                                    flex: selectedPlan.intensityDistribution.low,
                                    bgcolor: INTENSITY_COLORS.LOW,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    <Typography variant="caption" fontWeight={700} color="white">
                                      LOW {selectedPlan.intensityDistribution.low}%
                                    </Typography>
                                  </Box>
                                  <Box sx={{
                                    flex: selectedPlan.intensityDistribution.moderate,
                                    bgcolor: INTENSITY_COLORS.MODERATE,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    {selectedPlan.intensityDistribution.moderate > 8 && (
                                      <Typography variant="caption" fontWeight={700} color="white">
                                        MOD {selectedPlan.intensityDistribution.moderate}%
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box sx={{
                                    flex: selectedPlan.intensityDistribution.high,
                                    bgcolor: INTENSITY_COLORS.HIGH,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    {selectedPlan.intensityDistribution.high > 8 && (
                                      <Typography variant="caption" fontWeight={700} color="white">
                                        HIGH {selectedPlan.intensityDistribution.high}%
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </Box>

                              <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'transparent' }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 600 }}>Dzien</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Typ</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Min</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Intens.</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>TSS</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Cel</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {selectedPlan.sessions.map((session) => (
                                      <TableRow key={session.day} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>{session.day}</TableCell>
                                        <TableCell>
                                          <Chip label={session.type} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                                        </TableCell>
                                        <TableCell>{session.durationMinutes}</TableCell>
                                        <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box sx={{
                                              width: 8, height: 8, borderRadius: '50%',
                                              bgcolor: INTENSITY_COLORS[session.intensity] ?? STATUS_COLORS.neutral,
                                            }} />
                                            <Typography variant="body2">{session.intensity}</Typography>
                                          </Box>
                                        </TableCell>
                                        <TableCell>{session.tss}</TableCell>
                                        <TableCell>
                                          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, display: 'block', whiteSpace: 'normal' }}>
                                            {session.goal}
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Stack>
                          </CardContent>
                        </Card>
                      )}

                      {/* Load summary */}
                      {!!result.loadSummary && result.loadSummary.length > 0 && (
                        <Card>
                          <CardHeader title="Podsumowanie obciazenia" titleTypographyProps={{ variant: 'subtitle2' }} />
                          <CardContent>
                            <Stack spacing={0.5}>
                              {result.loadSummary.map((summary) => (
                                <Typography key={summary} variant="body2" color="text.secondary">• {summary}</Typography>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>
                      )}
                    </Stack>
                  )}
                </>}
            </Stack>
          )}

          {/* Navigation */}
          <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 3 }}>
            <Button
              disabled={activeStep === 0 || isOptimizing}
              onClick={() => setActiveStep((s) => s - 1)}
            >
              Wstecz
            </Button>
            {activeStep < STEPS.length - 2 ? (
              <Button
                variant="contained"
                disabled={activeStep === 0 ? !step1Valid : !step2Valid}
                onClick={() => setActiveStep((s) => s + 1)}
              >
                Dalej
              </Button>
            ) : activeStep === STEPS.length - 2 ? (
              <Button
                variant="contained"
                disabled={!allValid || isOptimizing}
                onClick={() => {
                  setActiveStep(2);
                  handleOptimize();
                }}
                startIcon={isOptimizing ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
              >
                {isOptimizing ? 'Optymalizuje...' : 'Generuj plan'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                disabled={!result}
                onClick={() => {
                  setActiveStep(0);
                  setResult(null);
                  setApplied(false);
                }}
              >
                Nowy plan
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
