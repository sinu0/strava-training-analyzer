import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  TextField,
  Typography,
  Alert,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import type { OptimizePlanResponse, PlanType } from '@/types/trainingOptimizer';
import { useOptimizePlan, useApplyOptimizedPlan } from '@/hooks/useTrainingOptimizer';
import { useCurrentPerformanceState } from '@/hooks/usePerformancePrediction';
import { tokens } from '@/theme/theme';

const PLAN_TYPE_CONFIG: Record<PlanType, { color: string; label: string }> = {
  CONSERVATIVE: { color: tokens.status.warning, label: 'Konserwatywny' },
  BALANCED: { color: tokens.chart.primary, label: 'Zrownowazony' },
  AGGRESSIVE: { color: tokens.status.error, label: 'Agresywny' },
};

const INTENSITY_COLORS: Record<string, string> = {
  HIGH: tokens.status.error,
  MODERATE: tokens.status.warning,
  LOW: tokens.status.success,
};

function defaultNumber(value: number | undefined, fallback: number): number {
  return value != null ? value : fallback;
}

export default function PlanOptimizer() {
  const { mutate, isPending, isError, error } = useOptimizePlan();
  const applyMutation = useApplyOptimizedPlan();
  const { data: currentState, isLoading: isLoadingState } = useCurrentPerformanceState();
  const [result, setResult] = useState<OptimizePlanResponse | null>(null);
  const [applied, setApplied] = useState(false);
  const [selectedType, setSelectedType] = useState<PlanType>('BALANCED');
  const [initialized, setInitialized] = useState(false);

  const [weeks, setWeeks] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [weeklyTss, setWeeklyTss] = useState(450);
  const [currentCtl, setCurrentCtl] = useState(55);
  const [currentAtl, setCurrentAtl] = useState(50);
  const [ftp, setFtp] = useState(250);
  const [eventDate, setEventDate] = useState('');
  const [goalPriority, setGoalPriority] = useState('B');

  useEffect(() => {
    if (currentState && !initialized) {
      setCurrentCtl(Math.round(defaultNumber(currentState.ctl, 55)));
      setCurrentAtl(Math.round(defaultNumber(currentState.atl, 50)));
      setFtp(defaultNumber(currentState.ftp, 250));
      setInitialized(true);
    }
  }, [currentState, initialized]);

  const selectedPlan = useMemo(
    () => result?.plans?.find((p) => p.type === selectedType) ?? null,
    [result, selectedType],
  );

  const handleRun = () => {
    setApplied(false);
    setResult(null);
    setSelectedType('BALANCED');
    mutate(
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
      { onSuccess: (res) => setResult(res) },
    );
  };

  const handleApply = () => {
    if (!selectedPlan) return;
    applyMutation.mutate(
      {
        name: `Zoptymalizowany ${selectedType} ${weeks}tyg`,
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

  const weeksValid = weeks >= 1 && weeks <= 16;
  const daysValid = daysPerWeek >= 3 && daysPerWeek <= 7;
  const tssValid = weeklyTss >= 100 && weeklyTss <= 1500;
  const ctlValid = currentCtl >= 0 && currentCtl <= 150;
  const atlValid = currentAtl >= 0 && currentAtl <= 200;
  const ftpValid = ftp >= 100 && ftp <= 500;
  const formValid = weeksValid && daysValid && tssValid && ctlValid && atlValid && ftpValid;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {isLoadingState && <LinearProgress sx={{ borderRadius: 2 }} />}

      <Card>
        <CardHeader
          title="Parametry planu"
          titleTypographyProps={{ variant: 'subtitle2' }}
          subheader={initialized ? 'CTL, ATL i FTP zaciagnieto z aktualnych wyliczen' : undefined}
          subheaderTypographyProps={{ variant: 'caption' }}
        />
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="Tygodnie"
                value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}
                error={!weeksValid} helperText={!weeksValid ? '1-16' : undefined}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="Dni/tydz."
                value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                error={!daysValid} helperText={!daysValid ? '3-7' : undefined}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="TSS/tydz."
                value={weeklyTss} onChange={(e) => setWeeklyTss(Number(e.target.value))}
                error={!tssValid} helperText={!tssValid ? '100-1500' : undefined}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="CTL"
                value={currentCtl} onChange={(e) => setCurrentCtl(Number(e.target.value))}
                error={!ctlValid}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="ATL"
                value={currentAtl} onChange={(e) => setCurrentAtl(Number(e.target.value))}
                error={!atlValid}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="FTP"
                value={ftp} onChange={(e) => setFtp(Number(e.target.value))}
                error={!ftpValid} helperText={!ftpValid ? '100-500' : undefined}
              />
            </Grid>
            <Grid item xs={4} sm={3}>
              <TextField
                fullWidth size="small" type="date" label="Data eventu"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth select size="small" label="Priorytet"
                value={goalPriority} onChange={(e) => setGoalPriority(e.target.value)}
                slotProps={{ select: { native: true } }}
              >
                <option value="A">A (glowny)</option>
                <option value="B">B (wazny)</option>
                <option value="C">C (kontrolny)</option>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
        onClick={handleRun}
        disabled={!formValid || isPending}
        sx={{ alignSelf: 'flex-start' }}
      >
        {isPending ? 'Optymalizuje...' : 'Generuj zoptymalizowany plan'}
      </Button>

      {isError && (
        <Alert severity="error">
          {(error as Error)?.message ?? 'Blad podczas optymalizacji planu.'}
        </Alert>
      )}

      {result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Apply success */}
          {applied && (
            <Alert severity="success">
              Plan <strong>{PLAN_TYPE_CONFIG[selectedType].label.toLowerCase()}</strong> zapisany jako program treningowy. Przejdz do zakladki <strong>Kalendarz</strong> lub <strong>Programy</strong> aby go zobaczyc.
            </Alert>
          )}
          {applyMutation.isError && (
            <Alert severity="error">
              Nie udalo sie zapisac planu: {(applyMutation.error as Error)?.message ?? 'Nieznany blad'}
            </Alert>
          )}

          {/* Strategy */}
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

          {/* Plan selector + scores */}
          <Card>
            <CardHeader
              title="Wybierz wariant planu"
              titleTypographyProps={{ variant: 'subtitle2' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                {result.plans.map((plan) => {
                  const isSelected = plan.type === selectedType;
                  return (
                    <Grid item xs={12} md={4} key={plan.type}>
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
                            {isSelected && (
                              <Chip label="Wybrany" size="small" color="primary" variant="outlined" />
                            )}
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

              {/* Apply button */}
              {!applied && (
                <Button
                  variant="contained"
                  startIcon={applyMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveAltIcon />}
                  onClick={handleApply}
                  disabled={applyMutation.isPending}
                  sx={{ mt: 2 }}
                >
                  {applyMutation.isPending ? 'Zapisuje...' : `Zastosuj ${PLAN_TYPE_CONFIG[selectedType].label.toLowerCase()} w kalendarzu`}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Selected plan sessions */}
          {selectedPlan && (
            <Card>
              <CardHeader
                title={`Sesje: ${PLAN_TYPE_CONFIG[selectedType].label}`}
                titleTypographyProps={{ variant: 'subtitle2' }}
              />
              <CardContent>
                <Stack spacing={2}>
                  {/* Intensity distribution bar */}
                  <Box>
                    <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
                      Rozklad intensywnosci
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, borderRadius: 2, overflow: 'hidden', height: 24 }}>
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

                  {/* Sessions table */}
                  <Box>
                    <Typography variant="caption" fontWeight={600} display="block" mb={1}>
                      {selectedPlan.sessions.length} sesji | Pewnosc: {result.confidence}%
                    </Typography>
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
                          {selectedPlan.sessions.map((s, i) => (
                            <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                              <TableCell>{s.day}</TableCell>
                              <TableCell>
                                <Chip label={s.type} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell>{s.durationMinutes}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Box sx={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    bgcolor: INTENSITY_COLORS[s.intensity] ?? tokens.status.neutral,
                                  }} />
                                  <Typography variant="body2">{s.intensity}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{s.tss}</TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, display: 'block', whiteSpace: 'normal' }}>
                                  {s.goal}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}
