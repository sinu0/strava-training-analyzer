import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import WhatshotIcon from '@mui/icons-material/Whatshot';
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
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePerformancePrediction, useCurrentPerformanceState } from '@/hooks/usePerformancePrediction';
import { tokens } from '@/theme/theme';
import type {
  PerformancePredictionResponse,
  PerformancePredictionRequest,
  TrendDirection,
  SleepQuality,
} from '@/types/performancePrediction';

const FORM_STATE_CONFIG: Record<string, { color: string; label: string; description: string }> = {
  PEAK: { color: tokens.status.success, label: 'Szczyt', description: 'Optymalna forma — wysokie CTL, niskie zmeczenie' },
  BUILDING: { color: tokens.chart.primary, label: 'Budowanie', description: 'Rosnace CTL, adaptacja w toku' },
  FATIGUED: { color: tokens.status.error, label: 'Zmeczony', description: 'Wysokie ATL, potrzeba regeneracji' },
  DETRAINED: { color: tokens.status.warning, label: 'Roztrenowanie', description: 'Niskie i spadajace CTL' },
};

function defaultNumber(value: number | undefined, fallback: number): number {
  return value != null ? value : fallback;
}

interface Props {
  autoRun?: boolean;
}

export default function PerformancePredictionPanel({ autoRun = true }: Props) {
  const { mutate, isPending, isError, error } = usePerformancePrediction();
  const { data: currentState, isLoading: isLoadingState, isError: isStateError } = useCurrentPerformanceState();
  const [result, setResult] = useState<PerformancePredictionResponse | null>(null);
  const [initialized, setInitialized] = useState(false);
  const hasAutoTriggered = useRef(false);

  const [ctl, setCtl] = useState(0);
  const [atl, setAtl] = useState(0);
  const [tsb, setTsb] = useState(0);
  const [ctlTrend, setCtlTrend] = useState<TrendDirection>('STABLE');
  const [fatigueTrend, setFatigueTrend] = useState<TrendDirection>('STABLE');
  const [ftp, setFtp] = useState(250);
  const [ftpTrend, setFtpTrend] = useState<TrendDirection>('STABLE');
  const [hrvTrend, setHrvTrend] = useState<TrendDirection>('STABLE');
  const [rhrTrend, setRhrTrend] = useState<TrendDirection>('STABLE');
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>('AVERAGE');

  const buildRequest = useCallback((): PerformancePredictionRequest => ({
    trainingLoad: { ctl, atl, tsb },
    recentTrends: { ctlTrend, fatigueTrend },
    performanceIndicators: { ftp, ftpTrend },
    recoverySignals: { hrvTrend, restingHrTrend: rhrTrend, sleepQuality },
    recentWorkouts: [],
  }), [ctl, atl, tsb, ctlTrend, fatigueTrend, ftp, ftpTrend, hrvTrend, rhrTrend, sleepQuality]);

  useEffect(() => {
    if (currentState && !initialized) {
      setCtl(Math.round(defaultNumber(currentState.ctl, 0)));
      setAtl(Math.round(defaultNumber(currentState.atl, 0)));
      setTsb(Math.round(defaultNumber(currentState.tsb, 0)));
      setCtlTrend(currentState.ctlTrend ?? 'STABLE');
      setFatigueTrend(currentState.fatigueTrend ?? 'STABLE');
      setFtp(defaultNumber(currentState.ftp, 250));
      setFtpTrend(currentState.ftpTrend ?? 'STABLE');
      setHrvTrend(currentState.hrvTrend ?? 'STABLE');
      setRhrTrend(currentState.restingHrTrend ?? 'STABLE');
      setSleepQuality(currentState.sleepQuality ?? 'AVERAGE');
      setInitialized(true);
    }
  }, [currentState, initialized]);

  useEffect(() => {
    if (autoRun && initialized && !hasAutoTriggered.current && !isPending && !result) {
      hasAutoTriggered.current = true;
      const request = buildRequest();
      mutate(request, {
        onSuccess: (res) => setResult(res),
      });
    }
  }, [autoRun, initialized, isPending, result, buildRequest, mutate]);

  const handleRun = () => {
    const request = buildRequest();
    mutate(request, {
      onSuccess: (res) => setResult(res),
    });
  };

  const readinessColor = (score: number) => {
    if (score >= 75) return tokens.status.success;
    if (score >= 50) return tokens.status.warning;
    return tokens.status.error;
  };

  const confidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'Wysoka';
    if (confidence >= 60) return 'Umiarkowana';
    return 'Niska';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {!!isLoadingState && <LinearProgress sx={{ borderRadius: 2 }} />}
      {!!isStateError && (
        <Alert severity="warning">
          Nie udalo sie pobrac aktualnych danych treningowych — uzupelnij recznie.
        </Alert>
      )}

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" color="text.secondary">
          {initialized ? (
            <Chip
              icon={<AutoAwesomeIcon />}
              label="Dane z systemu"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            'Ladowanie danych...'
          )}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
          onClick={handleRun}
          disabled={isPending}
        >
          {isPending ? 'Analizuje...' : result ? 'Odswiez prognoze' : 'Prognozuj forme'}
        </Button>
      </Stack>

      <Card>
        <CardHeader
          title="Dane treningowe (PMC)"
          titleTypographyProps={{ variant: 'subtitle2' }}
          subheader={initialized ? 'Zaciagnieto z aktualnych wyliczen — mozesz poprawic przed prognoza' : undefined}
          subheaderTypographyProps={{ variant: 'caption' }}
        />
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="CTL"
                value={ctl} onChange={(e) => setCtl(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="ATL"
                value={atl} onChange={(e) => setAtl(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="TSB"
                value={tsb} onChange={(e) => setTsb(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth select size="small" label="Trend CTL"
                value={ctlTrend}
                onChange={(e) => setCtlTrend(e.target.value as TrendDirection)}
                slotProps={{ select: { native: true } }}
              >
                <option value="UP">UP</option>
                <option value="STABLE">STABLE</option>
                <option value="DOWN">DOWN</option>
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth select size="small" label="Trend ATL"
                value={fatigueTrend}
                onChange={(e) => setFatigueTrend(e.target.value as TrendDirection)}
                slotProps={{ select: { native: true } }}
              >
                <option value="UP">UP</option>
                <option value="STABLE">STABLE</option>
                <option value="DOWN">DOWN</option>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Wskazniki wydajnosci i sygnaly recovery"
          titleTypographyProps={{ variant: 'subtitle2' }}
        />
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth size="small" type="number" label="FTP"
                value={ftp} onChange={(e) => setFtp(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth select size="small" label="Trend FTP"
                value={ftpTrend}
                onChange={(e) => setFtpTrend(e.target.value as TrendDirection)}
                slotProps={{ select: { native: true } }}
              >
                <option value="UP">UP</option>
                <option value="STABLE">STABLE</option>
                <option value="DOWN">DOWN</option>
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth select size="small" label="HRV Trend"
                value={hrvTrend}
                onChange={(e) => setHrvTrend(e.target.value as TrendDirection)}
                slotProps={{ select: { native: true } }}
              >
                <option value="UP">UP</option>
                <option value="STABLE">STABLE</option>
                <option value="DOWN">DOWN</option>
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth select size="small" label="Rest HR"
                value={rhrTrend}
                onChange={(e) => setRhrTrend(e.target.value as TrendDirection)}
                slotProps={{ select: { native: true } }}
              >
                <option value="UP">UP</option>
                <option value="STABLE">STABLE</option>
                <option value="DOWN">DOWN</option>
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth select size="small" label="Sen"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(e.target.value as SleepQuality)}
                slotProps={{ select: { native: true } }}
              >
                <option value="GOOD">DOBRY</option>
                <option value="AVERAGE">SREDNI</option>
                <option value="POOR">SLABY</option>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!!isError && (
        <Alert severity="error">
          {(error as Error)?.message ?? 'Blad podczas prognozowania formy.'}
        </Alert>
      )}

      {!!isPending && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
          <CircularProgress size={24} />
          <Typography color="text.secondary">Analizuje dane treningowe...</Typography>
        </Box>
      )}

      {!!result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card>
            <CardHeader
              title="Stan formy"
              titleTypographyProps={{ variant: 'subtitle2' }}
            />
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="flex-start" flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<WhatshotIcon />}
                  label={FORM_STATE_CONFIG[result.formState]?.label ?? result.formState}
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    px: 1.5,
                    py: 2.5,
                    bgcolor: `${FORM_STATE_CONFIG[result.formState]?.color}22`,
                    color: FORM_STATE_CONFIG[result.formState]?.color,
                    borderColor: `${FORM_STATE_CONFIG[result.formState]?.color}44`,
                  }}
                  variant="outlined"
                />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {FORM_STATE_CONFIG[result.formState]?.description}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Gotowosc"
                  titleTypographyProps={{ variant: 'subtitle2' }}
                  avatar={<SpeedIcon />}
                />
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 900,
                        color: readinessColor(result.readinessScore),
                      }}
                    >
                      {result.readinessScore}
                      <Typography component="span" variant="h5" color="text.secondary" sx={{ ml: 0.5 }}>
                        /100
                      </Typography>
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={result.readinessScore}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#ffffff1a',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: readinessColor(result.readinessScore),
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Okno peak"
                  titleTypographyProps={{ variant: 'subtitle2' }}
                  avatar={<TimerIcon />}
                />
                <CardContent>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight={900} color="primary">
                        {result.peakWindow.startInDays}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        dni do startu
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight={900} color="primary">
                        {result.peakWindow.durationDays}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        dni okna
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Prognoza wydajnosci"
                  titleTypographyProps={{ variant: 'subtitle2' }}
                  avatar={<BoltIcon />}
                />
                <CardContent>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        FTP
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {result.performancePrediction.ftp}W
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        20min Power
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {result.performancePrediction.power20min}W
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Pewnosc prognozy"
                  titleTypographyProps={{ variant: 'subtitle2' }}
                />
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h4" fontWeight={900}>
                      {result.confidence}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {confidenceLabel(result.confidence)} — im wiecej danych treningowych, tym wyzsza pewnosc.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardHeader
              title="Rekomendacje"
              titleTypographyProps={{ variant: 'subtitle2' }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {result.recommendations.map((rec, i) => (
                  <Box key={rec} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Typography
                      component="span"
                      sx={{ color: tokens.chart.primary, fontWeight: 700, minWidth: 16 }}
                    >
                      {i + 1}.
                    </Typography>
                    <Typography variant="body2">{rec}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
