import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HotelIcon from '@mui/icons-material/Hotel';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import apiClient from '@/api/client';
import PageContainer from '@/components/common/PageContainer';
import PullToRefreshPanel from '@/components/common/PullToRefreshPanel';
import Section from '@/components/common/Section';
import SkeletonCard from '@/components/common/SkeletonCard';
import SwipeableContent from '@/components/common/SwipeableContent';
import TabsNav from '@/components/common/TabsNav';
import { useHealthOverview, useHealthTimeline, useRecoveryStatus } from '@/hooks/useHealth';
import { CHART_ACTIVE_DOT, getChartVisuals } from '@/utils/chartStyles';
import {
  HEALTH_COLORS,
  STATUS_COLORS,
  alphaColor,
} from '@/utils/colors';

function TrendIcon({ direction }: { direction: string }) {
  if (direction === 'rosnący') {
    return <TrendingUpIcon sx={{ fontSize: 16, color: STATUS_COLORS.success }} />;
  }
  if (direction === 'malejący') {
    return <TrendingDownIcon sx={{ fontSize: 16, color: STATUS_COLORS.error }} />;
  }
  return <TrendingFlatIcon sx={{ fontSize: 16, color: STATUS_COLORS.neutral }} />;
}

function RecoveryGauge({ score }: { score: number }) {
  const color =
    score >= 80
      ? STATUS_COLORS.success
      : score >= 60
        ? STATUS_COLORS.info
        : score >= 40
          ? STATUS_COLORS.warning
          : STATUS_COLORS.error;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={score}
        size={150}
        thickness={5}
        sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, color, lineHeight: 1 }}>
          {score}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          Poziom regeneracji
        </Typography>
      </Box>
    </Box>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
}

function formatSleepHours(seconds: number | null): string {
  if (seconds == null) {
    return '—';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function MetricSummary({
  title,
  primary,
  secondary,
  icon,
  trend,
  color,
}: {
  title: string;
  primary: string;
  secondary: string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 180,
        p: 1.5,
        borderRadius: 2.5,
        bgcolor: alphaColor(color, 0.08),
        border: `1px solid ${alphaColor(color, 0.18)}`,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        {trend ? <TrendIcon direction={trend} /> : null}
      </Stack>
      <Typography variant="h5" sx={{ fontWeight: 800, color }}>
        {primary}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {secondary}
      </Typography>
    </Box>
  );
}

export default function HealthPage() {
  const chart = getChartVisuals(useTheme());
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);

  const today = new Date();
  const from30 = new Date(today);
  from30.setDate(from30.getDate() - 30);
  const fromStr = from30.toISOString().slice(0, 10);
  const toStr = today.toISOString().slice(0, 10);

  const { data: overview, isLoading: loadingOverview } = useHealthOverview(30);
  const { data: timeline, isLoading: loadingTimeline } = useHealthTimeline(fromStr, toStr);
  const { data: recovery, isLoading: loadingRecovery } = useRecoveryStatus();

  const chartData = useMemo(() => {
    if (!timeline) {
      return [];
    }

    return timeline.map((day) => ({
      date: formatDate(day.date),
      fullDate: day.date,
      hrv: day.hrvRmssd != null ? Math.round(day.hrvRmssd) : null,
      restingHr: day.restingHrBpm,
      sleepScore: day.sleepScore,
      sleepHours: day.sleepDurationSeconds != null ? +(day.sleepDurationSeconds / 3600).toFixed(1) : null,
      bodyBattery: day.bodyBattery,
      stress: day.stressAvg,
      steps: day.steps,
    }));
  }, [timeline]);

  const sleepStageData = useMemo(() => {
    if (!timeline) {
      return [];
    }

    return timeline
      .filter((day) => day.deepSleepSeconds != null)
      .map((day) => ({
        date: formatDate(day.date),
        deep: day.deepSleepSeconds != null ? +(day.deepSleepSeconds / 3600).toFixed(1) : 0,
        light: day.lightSleepSeconds != null ? +(day.lightSleepSeconds / 3600).toFixed(1) : 0,
        rem: day.remSleepSeconds != null ? +(day.remSleepSeconds / 3600).toFixed(1) : 0,
        awake: day.awakeSleepSeconds != null ? +(day.awakeSleepSeconds / 3600).toFixed(1) : 0,
      }));
  }, [timeline]);

  const isLoading = loadingOverview || loadingTimeline || loadingRecovery;

  const groupCards = overview
    ? [
        {
          title: 'Serce',
          accentColor: STATUS_COLORS.success,
          items: (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <MetricSummary
                title="HRV (RMSSD)"
                primary={overview.hrvTrend.current != null ? `${Math.round(overview.hrvTrend.current)} ms` : '—'}
                secondary="Dzienna gotowość układu nerwowego"
                icon={<MonitorHeartIcon />}
                trend={overview.hrvTrend.direction}
                color={STATUS_COLORS.successLight}
              />
              <MetricSummary
                title="Tętno spoczynkowe"
                primary={overview.restingHrTrend.current != null ? `${overview.restingHrTrend.current} bpm` : '—'}
                secondary="Najbardziej czytelny wskaźnik zmęczenia ogólnego"
                icon={<FavoriteIcon />}
                trend={overview.restingHrTrend.direction}
                color={STATUS_COLORS.error}
              />
            </Stack>
          ),
        },
        {
          title: 'Sen',
          accentColor: STATUS_COLORS.info,
          items: (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <MetricSummary
                title="Wynik snu"
                primary={overview.sleepTrend.latestScore != null ? `${overview.sleepTrend.latestScore}` : '—'}
                secondary="Jakość nocnej regeneracji"
                icon={<HotelIcon />}
                color={STATUS_COLORS.info}
              />
              <MetricSummary
                title="Czas snu"
                primary={formatSleepHours(overview.sleepTrend.avgDurationSeconds)}
                secondary="Średnia z ostatnich dni"
                icon={<HotelIcon />}
                color={STATUS_COLORS.highlight}
              />
            </Stack>
          ),
        },
        {
          title: 'Energia',
          accentColor: STATUS_COLORS.warning,
          items: (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <MetricSummary
                title="Body Battery"
                primary={overview.latest?.bodyBattery != null ? `${overview.latest.bodyBattery}` : '—'}
                secondary="Ile energii masz na dziś"
                icon={<BatteryChargingFullIcon />}
                color={STATUS_COLORS.warningStrong}
              />
              <MetricSummary
                title="Stres"
                primary={overview.stressTrend.current != null ? `${overview.stressTrend.current}` : '—'}
                secondary="Średnie obciążenie autonomiczne"
                icon={<SelfImprovementIcon />}
                color={STATUS_COLORS.warning}
              />
            </Stack>
          ),
        },
      ]
    : [];

  const tabs = [
    { label: 'Serce', value: 0, icon: <FavoriteIcon fontSize="small" /> },
    { label: 'Sen', value: 1, icon: <HotelIcon fontSize="small" /> },
    { label: 'Energia', value: 2, icon: <BatteryChargingFullIcon fontSize="small" /> },
  ];

  const nextTab = () => setTab((current) => Math.min(current + 1, tabs.length - 1));
  const prevTab = () => setTab((current) => Math.max(current - 1, 0));

  const [hrvVal, setHrvVal] = useState('');
  const [rhrVal, setRhrVal] = useState('');
  const [sleepVal, setSleepVal] = useState('');
  const [bodyBatteryVal, setBodyBatteryVal] = useState('');
  const [stressVal, setStressVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveMetrics = async () => {
    setSaving(true);
    setSaveError(null);
    const body: Record<string, number> = {};
    const h = parseFloat(hrvVal); if (!isNaN(h)) body.hrvRmssd = h;
    const r = parseInt(rhrVal); if (!isNaN(r)) body.restingHrBpm = r;
    const s = parseInt(sleepVal); if (!isNaN(s)) body.sleepScore = s;
    const b = parseInt(bodyBatteryVal); if (!isNaN(b)) body.bodyBattery = b;
    const st = parseInt(stressVal); if (!isNaN(st)) body.stressAvg = st;
    if (Object.keys(body).length > 0) {
      try {
        await apiClient.put('/health/metrics', body);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Nie udało się zapisać danych zdrowotnych.');
      }
    }
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['healthOverview'] });
    queryClient.invalidateQueries({ queryKey: ['healthTimeline'] });
  };

  if (isLoading) {
    return (
      <PageContainer title="Zdrowie">
        <Stack spacing={2.5}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress />
          </Box>
          <Grid container spacing={2.5}>
            <Grid size={12}>
              <SkeletonCard height={240} />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <SkeletonCard height={220} />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <SkeletonCard height={220} />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <SkeletonCard height={220} />
            </Grid>
            <Grid size={12}>
              <SkeletonCard height={360} />
            </Grid>
          </Grid>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Zdrowie"
      subtitle="Regeneracja, sen i energia są rozdzielone na krótsze sekcje z szybszym odczytem trendów."
    >
      <PullToRefreshPanel
        onRefresh={async () => {
          await queryClient.refetchQueries();
        }}
      >
        <Stack spacing={2.5}>
          <Section
            title="Regeneracja dziś"
            subtitle="Najważniejsza odpowiedź brzmi: czy dziś dowieźć jakość, czy chronić zasoby."
            accentColor={
              recovery?.score != null && recovery.score >= 70
                ? STATUS_COLORS.success
                : STATUS_COLORS.warning
            }
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', flex: '0 0 auto', width: { xs: '100%', md: 'auto' } }}>
                {recovery?.score != null ? (
                  <RecoveryGauge score={recovery.score} />
                ) : (
                  <Box sx={{ minWidth: 150, textAlign: 'center', p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Brak danych do oceny</Typography>
                    <Typography variant="body2" color="text.secondary">Dodaj check-in, aby obliczyć regenerację.</Typography>
                  </Box>
                )}
              </Box>
              <Stack spacing={1.25} sx={{ flex: 1, minWidth: 240 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {recovery?.level ?? 'Brak danych'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {recovery?.description ?? 'Brak opisu regeneracji.'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Przeciągnij w dół na telefonie, aby szybko odświeżyć stan zdrowia z ostatniej synchronizacji.
                </Typography>
              </Stack>
            </Box>
          </Section>

          {recovery?.alerts.length ? (
            <Stack spacing={1}>
              {saveError ? <Alert severity="error">{saveError}</Alert> : null}
              {recovery.alerts.map((alert) => (
                <Alert key={alert} severity="warning" icon={<WarningAmberIcon />}>
                  {alert}
                </Alert>
              ))}
            </Stack>
          ) : null}

          <Section title="Wprowadź metryki" subtitle="Ręczne uzupełnienie dzisiejszych danych zdrowotnych" accentColor={STATUS_COLORS.info}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField label="HRV (ms)" size="small" type="number" value={hrvVal} onChange={e => setHrvVal(e.target.value)} sx={{ flex: 1 }} />
                <TextField label="HR spocz. (bpm)" size="small" type="number" value={rhrVal} onChange={e => setRhrVal(e.target.value)} sx={{ flex: 1 }} />
                <TextField label="Sen (0-100)" size="small" type="number" value={sleepVal} onChange={e => setSleepVal(e.target.value)} sx={{ flex: 1 }} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField label="Body Battery" size="small" type="number" value={bodyBatteryVal} onChange={e => setBodyBatteryVal(e.target.value)} sx={{ flex: 1 }} />
                <TextField label="Stres (0-100)" size="small" type="number" value={stressVal} onChange={e => setStressVal(e.target.value)} sx={{ flex: 1 }} />
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Button variant="outlined" disabled={saving} onClick={handleSaveMetrics} fullWidth size="small">
                    {saving ? <CircularProgress size={14} /> : 'Zapisz'}
                  </Button>
                </Box>
              </Stack>
            </Stack>
          </Section>

          <Grid container spacing={2.5}>
            {groupCards.map((group) => (
              <Grid
                key={group.title}
                size={{
                  xs: 12,
                  md: 4
                }}>
                <Section title={group.title} accentColor={group.accentColor}>
                  {group.items}
                </Section>
              </Grid>
            ))}
          </Grid>

          <TabsNav tabs={tabs} value={tab} onChange={setTab} />

          <SwipeableContent onSwipeLeft={nextTab} onSwipeRight={prevTab}>
            {tab === 0 && (
              <Grid container spacing={2.5}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Section title="HRV (RMSSD) — 30 dni" accentColor={STATUS_COLORS.successLight}>
                    <Box sx={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={HEALTH_COLORS.hrv} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={HEALTH_COLORS.hrv} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...chart.grid} />
                          <XAxis dataKey="date" {...chart.axis} />
                          <YAxis {...chart.axis} />
                          <RechartsTooltip {...chart.tooltip} />
                          {overview?.hrvTrend.periodAvg != null && (
                            <ReferenceLine y={Math.round(overview.hrvTrend.periodAvg)} stroke={STATUS_COLORS.success} strokeDasharray="5 5" />
                          )}
                          <Area
                            type="monotone"
                            dataKey="hrv"
                            stroke={STATUS_COLORS.successLight}
                            strokeWidth={2.5}
                            fill="url(#hrvGrad)"
                            name="HRV (ms)"
                            connectNulls
                            activeDot={CHART_ACTIVE_DOT}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Section>
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Section title="Tętno spoczynkowe — 30 dni" accentColor={STATUS_COLORS.error}>
                    <Box sx={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={HEALTH_COLORS.restingHeartRate} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={HEALTH_COLORS.restingHeartRate} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...chart.grid} />
                          <XAxis dataKey="date" {...chart.axis} />
                          <YAxis {...chart.axis} domain={['dataMin - 2', 'dataMax + 2']} />
                          <RechartsTooltip {...chart.tooltip} />
                          {overview?.restingHrTrend.avg != null && (
                            <ReferenceLine y={Math.round(overview.restingHrTrend.avg)} stroke={STATUS_COLORS.error} strokeDasharray="5 5" />
                          )}
                          <Area
                            type="monotone"
                            dataKey="restingHr"
                            stroke={STATUS_COLORS.error}
                            strokeWidth={2.5}
                            fill="url(#hrGrad)"
                            name="HR (bpm)"
                            connectNulls
                            activeDot={CHART_ACTIVE_DOT}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Section>
                </Grid>
              </Grid>
            )}

            {tab === 1 && (
              <Grid container spacing={2.5}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Section title="Wynik snu — 30 dni" accentColor={STATUS_COLORS.info}>
                    <Box sx={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={HEALTH_COLORS.sleepScore} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={HEALTH_COLORS.sleepScore} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...chart.grid} />
                          <XAxis dataKey="date" {...chart.axis} />
                          <YAxis {...chart.axis} domain={[0, 100]} />
                          <RechartsTooltip {...chart.tooltip} />
                          <ReferenceLine y={80} stroke={STATUS_COLORS.info} strokeDasharray="5 5" />
                          <Area
                            type="monotone"
                            dataKey="sleepScore"
                            stroke={STATUS_COLORS.info}
                            strokeWidth={2.5}
                            fill="url(#sleepGrad)"
                            name="Wynik snu"
                            connectNulls
                            activeDot={CHART_ACTIVE_DOT}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Section>
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Section title="Fazy snu — 30 dni" accentColor={STATUS_COLORS.highlight}>
                    <Box sx={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sleepStageData}>
                          <CartesianGrid {...chart.grid} />
                          <XAxis dataKey="date" {...chart.axis} />
                          <YAxis {...chart.axis} unit="h" />
                          <RechartsTooltip {...chart.tooltip} />
                          <Legend {...chart.legend} />
                          <Bar dataKey="deep" stackId="sleep" fill={STATUS_COLORS.highlight} radius={[0, 0, 0, 0]} name="Deep" />
                          <Bar dataKey="light" stackId="sleep" fill={STATUS_COLORS.info} radius={[0, 0, 0, 0]} name="Light" />
                          <Bar dataKey="rem" stackId="sleep" fill={STATUS_COLORS.secondary} radius={[0, 0, 0, 0]} name="REM" />
                          <Bar dataKey="awake" stackId="sleep" fill={STATUS_COLORS.warning} radius={chart.barRadius} name="Awake" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Section>
                </Grid>
              </Grid>
            )}

            {tab === 2 && (
              <Grid container spacing={2.5}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Section title="Body Battery — 30 dni" accentColor={STATUS_COLORS.warningStrong}>
                    <Box sx={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={HEALTH_COLORS.bodyBattery} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={HEALTH_COLORS.bodyBattery} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...chart.grid} />
                          <XAxis dataKey="date" {...chart.axis} />
                          <YAxis {...chart.axis} domain={[0, 100]} />
                          <RechartsTooltip {...chart.tooltip} />
                          <ReferenceLine y={70} stroke={STATUS_COLORS.warningStrong} strokeDasharray="5 5" />
                          <Area
                            type="monotone"
                            dataKey="bodyBattery"
                            stroke={STATUS_COLORS.warningStrong}
                            strokeWidth={2.5}
                            fill="url(#batteryGrad)"
                            name="Body Battery"
                            connectNulls
                            activeDot={CHART_ACTIVE_DOT}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Section>
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Section title="Stres — 30 dni" accentColor={STATUS_COLORS.warning}>
                    <Box sx={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={STATUS_COLORS.warning} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={STATUS_COLORS.warning} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...chart.grid} />
                          <XAxis dataKey="date" {...chart.axis} />
                          <YAxis {...chart.axis} domain={[0, 100]} />
                          <RechartsTooltip {...chart.tooltip} />
                          <ReferenceLine y={40} stroke={STATUS_COLORS.warning} strokeDasharray="5 5" />
                          <Area
                            type="monotone"
                            dataKey="stress"
                            stroke={STATUS_COLORS.warning}
                            strokeWidth={2.5}
                            fill="url(#stressGrad)"
                            name="Stres"
                            connectNulls
                            activeDot={CHART_ACTIVE_DOT}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Section>
                </Grid>
              </Grid>
            )}
          </SwipeableContent>
        </Stack>
      </PullToRefreshPanel>
    </PageContainer>
  );
}
