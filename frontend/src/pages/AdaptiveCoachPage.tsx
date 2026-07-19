import { AutoMode, Bolt, Psychology, Schedule, Send } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';

import AdaptiveCoachCard from '@/components/adaptive-coach/AdaptiveCoachCard';
import SessionOptionsList from '@/components/adaptive-coach/SessionOptionsList';
import EditorialHero from '@/components/common/EditorialHero';
import PageContainer from '@/components/common/PageContainer';
import TabsNav from '@/components/common/TabsNav';
import { useAdaptiveCoachToday } from '@/hooks/useAdaptiveCoach';
import { useReadiness, useProfile, useFatigueState } from '@/hooks/useAnalytics';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';
import { getPageHeroIllustrationPath } from '@/utils/illustrationAssets';

const GOAL_TYPES = [
  { value: 'FTP', label: 'FTP' },
  { value: 'VO2MAX', label: 'VO2max' },
  { value: 'POWER_DURATION', label: 'Power Duration' },
  { value: 'DISTANCE', label: 'Dystans' },
  { value: 'DURABILITY', label: 'Wytrzymalosc zmeczeniowa' },
  { value: 'POWER_TO_WEIGHT', label: 'Power-to-Weight' },
  { value: 'TIME_ON_SEGMENT', label: 'Czas na odcinku' },
];

const OVERRIDE_STATES = [
  { value: 'NONE', label: 'Brak' },
  { value: 'HIGH_LOAD', label: 'Wysokie obciazenie (oboz)' },
  { value: 'LOW_LOAD', label: 'Niskie obciazenie (luzny tydzien)' },
  { value: 'INTENT', label: 'Chce cisnac' },
];

const QUICK_TIME_PRESETS = [30, 45, 60, 75, 90, 120, 150, 180];

const tabs = [
  { label: 'Decyzja', value: 0 },
  { label: 'Wszystkie opcje', value: 1 },
];

function autoDetectGoal(fatigueLevel: string | undefined, readinessScore: number | undefined): string {
  if (fatigueLevel === 'HIGH' || (readinessScore != null && readinessScore < 50)) return 'DURABILITY';
  if (readinessScore != null && readinessScore >= 75) return 'FTP';
  if (fatigueLevel === 'MODERATE') return 'VO2MAX';
  return 'FTP';
}

function autoDetectTime(tsb: number | undefined): number {
  if (tsb == null) return 60;
  if (tsb > 5) return 120;
  if (tsb > -10) return 90;
  if (tsb > -20) return 60;
  return 45;
}

export default function AdaptiveCoachPage() {
  const [tab, setTab] = useState(0);
  const [quickMode, setQuickMode] = useState(false);

  const [goalType, setGoalType] = useState('FTP');
  const [targetValue, setTargetValue] = useState(300);
  const [aiInput, setAiInput] = useState('');
  const [overrideState, setOverrideState] = useState('NONE');
  const [timeAvailable, setTimeAvailable] = useState(90);
  const [quickTime, setQuickTime] = useState(60);

  const [queryGoal, setQueryGoal] = useState('FTP');
  const [queryTarget, setQueryTarget] = useState(300);
  const [queryAiInput, setQueryAiInput] = useState<string | undefined>(undefined);
  const [queryOverride, setQueryOverride] = useState<string | undefined>(undefined);
  const [queryTime, setQueryTime] = useState(90);

  const { data: readiness, isLoading: readinessLoading } = useReadiness();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: fatigueState } = useFatigueState();

  const effectiveGoal = quickMode
    ? autoDetectGoal(fatigueState?.level, readiness?.score)
    : queryGoal;

  const effectiveTime = quickMode ? quickTime : queryTime;

  const { data, isLoading } = useAdaptiveCoachToday(
    effectiveGoal,
    effectiveGoal === 'FTP' ? (profile?.ftpWatts ?? 300) : queryTarget,
    undefined,
    queryAiInput,
    queryOverride,
    effectiveTime,
  );

  const autoSuggestion = useMemo(() => {
    if (!readiness) return null;

    if (readiness.score >= 75 && !(fatigueState?.level === 'HIGH')) {
      return 'Dzis jestes w dobrej formie. Sprobuj THRESHOLD lub VO2MAX, 75-90 min.';
    }
    if (fatigueState?.level === 'HIGH') {
      return 'Wysokie zmeczenie. Zalecam RECOVERY 45-60 min lub dzien wolny.';
    }
    if (readiness.score < 50) {
      return 'Niska gotowosc. Rozwaz ENDURANCE 60 min lub aktywna regeneracje.';
    }
    return 'Umiarkowana forma. ENDURANCE lub SWEET SPOT 60-90 min.';
  }, [readiness, fatigueState]);

  const handleSubmit = useCallback(() => {
    if (quickMode) {
      const detectedGoal = autoDetectGoal(fatigueState?.level, readiness?.score);
      const detectedTime = autoDetectTime(readiness?.tsb);
      setQuickTime(detectedTime);
      setQueryGoal(detectedGoal);
      setQueryTarget(profile?.ftpWatts ?? 300);
      setQueryAiInput(aiInput.trim() || undefined);
      setQueryOverride(overrideState !== 'NONE' ? overrideState : undefined);
      setQueryTime(detectedTime);
    } else {
      setQueryGoal(goalType);
      setQueryTarget(targetValue);
      setQueryAiInput(aiInput.trim() || undefined);
      setQueryOverride(overrideState !== 'NONE' ? overrideState : undefined);
      setQueryTime(timeAvailable);
    }
  }, [quickMode, goalType, targetValue, aiInput, timeAvailable, overrideState, fatigueState, readiness, profile]);

  useEffect(() => {
    if (quickMode && readiness) {
      const detectedGoal = autoDetectGoal(fatigueState?.level, readiness.score);
      const detectedTime = autoDetectTime(readiness.tsb);
      setQuickTime(detectedTime);
      setQueryGoal(detectedGoal);
      setQueryTarget(profile?.ftpWatts ?? 300);
      setQueryTime(detectedTime);
      setQueryAiInput(undefined);
      setQueryOverride(undefined);
    }
  }, [fatigueState?.level, profile?.ftpWatts, quickMode, readiness]);

  return (
    <PageContainer
      title="Adaptive Coach"
      subtitle="Inteligentny system decyzyjny — dane z Twojego profilu + AI"
    >
      <EditorialHero
        eyebrow="AI Coach"
        title="Adaptive Training Engine"
        description="System codziennie analizuje Twoj stan, cel i historie treningowa aby wybrac optymalna sesje. Tryb szybki lub konfigurowalny — pelna kontrola."
        accentColor={STATUS_COLORS.accent}
        imageSrc={getPageHeroIllustrationPath('training')}
        imageAlt="Adaptive Coach"
        imagePosition="center 40%"
        highlights={['Dane z systemu', 'Silnik scoringowy', 'Model zmeczenia', 'Analiza ryzyka', 'Tryb szybki']}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Stack spacing={2}>
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Aktualny stan
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={quickMode}
                      onChange={(e) => setQuickMode(e.target.checked)}
                      color="info"
                      size="small"
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <AutoMode sx={{ fontSize: 16, color: STATUS_COLORS.accent }} />
                      <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: STATUS_COLORS.accent }}>
                        Szybka decyzja
                      </Typography>
                    </Stack>
                  }
                  sx={{ mr: 0 }}
                />
              </Stack>

              {(readinessLoading || profileLoading) ? (
                <CircularProgress size={24} />
              ) : (
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`CTL: ${readiness?.ctl?.toFixed(0) ?? '-'}`} size="small" />
                    <Chip label={`ATL: ${readiness?.atl?.toFixed(0) ?? '-'}`} size="small" />
                    <Chip
                      label={`TSB: ${readiness?.tsb?.toFixed(0) ?? '-'}`}
                      size="small"
                      color={(readiness?.tsb ?? 0) < -10 ? 'warning' : (readiness?.tsb ?? 0) < -20 ? 'error' : 'default'}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={`Gotowosc: ${readiness?.score ?? '-'}`}
                      size="small"
                      color={(readiness?.score ?? 0) >= 75 ? 'success' : (readiness?.score ?? 0) >= 55 ? 'info' : 'warning'}
                    />
                    <Chip label={`FTP: ${profile?.ftpWatts ?? '-'}W`} size="small" />
                    <Chip label={`Waga: ${profile?.weightKg ?? '-'}kg`} size="small" />
                    <Chip label={`HR spocz.: ${profile?.restingHrBpm ?? '-'}`} size="small" />
                  </Stack>
                  {!!fatigueState && (
                    <Chip
                      label={`Zmeczenie: ${fatigueState.level}`}
                      size="small"
                      color={fatigueState.level === 'HIGH' ? 'error' : fatigueState.level === 'MODERATE' ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  )}
                  {!!quickMode && !!autoSuggestion && (
                    <Box sx={{
                      mt: 1, p: 1.5, borderRadius: 2,
                      bgcolor: alphaColor(STATUS_COLORS.accent, 0.08),
                      border: `1px solid ${alphaColor(STATUS_COLORS.accent, 0.18)}`,
                    }}>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Bolt sx={{ color: STATUS_COLORS.accent, fontSize: 18, mt: 0.3 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {autoSuggestion}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {quickMode ? 'Szybka konfiguracja' : 'Konfiguracja'}
              </Typography>

              <Stack spacing={2.5}>
                {quickMode ? (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Dostepny czas (min)
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {QUICK_TIME_PRESETS.map((t) => (
                          <Chip
                            key={t}
                            label={`${t} min`}
                            size="small"
                            onClick={() => setQuickTime(t)}
                            variant={quickTime === t ? 'filled' : 'outlined'}
                            color={quickTime === t ? 'primary' : 'default'}
                            sx={{
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: '0.72rem',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <Psychology sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="subtitle2">Input (opcjonalny)</Typography>
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder='"Czuje sie zmeczony", "Chce krotka jazde", "Mam powera"...'
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSubmit();
                        }}
                      />
                    </Box>
                    <AlertBadge
                      goal={effectiveGoal}
                      time={quickTime}
                      readiness={readiness?.score}
                      fatigue={fatigueState?.level}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSubmit}
                      disabled={isLoading}
                      startIcon={<Bolt />}
                      sx={{ fontWeight: 700 }}
                    >
                      {isLoading ? 'Analizuje...' : 'Szybka decyzja'}
                    </Button>
                  </>
                ) : (
                  <>
                    <FormControl fullWidth size="small">
                      <InputLabel>Cel</InputLabel>
                      <Select value={goalType} label="Cel" onChange={(e) => setGoalType(e.target.value)}>
                        {GOAL_TYPES.map((g) => (
                          <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Wartosc docelowa"
                      type="number"
                      size="small"
                      fullWidth
                      value={targetValue}
                      onChange={(e) => setTargetValue(Number(e.target.value))}
                    />
                    <TextField
                      label="Dostepny czas (min)"
                      type="number"
                      size="small"
                      fullWidth
                      value={timeAvailable}
                      onChange={(e) => setTimeAvailable(Number(e.target.value))}
                    />
                    <FormControl fullWidth size="small">
                      <InputLabel>Tryb</InputLabel>
                      <Select
                        value={overrideState}
                        label="Tryb"
                        onChange={(e) => setOverrideState(e.target.value)}
                      >
                        {OVERRIDE_STATES.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <Psychology sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="subtitle2">Input (jezyk naturalny)</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <OutlinedInput
                          size="small"
                          fullWidth
                          placeholder='"Czuje sie zmeczony", "Chce krotka jazde", "Mam powera"...'
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                          }}
                        />
                        <IconButton color="primary" onClick={handleSubmit} disabled={isLoading}>
                          <Send />
                        </IconButton>
                      </Stack>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSubmit}
                      disabled={isLoading}
                      startIcon={<Psychology />}
                    >
                      {isLoading ? 'Analizuje...' : 'Generuj decyzje'}
                    </Button>
                  </>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <TabsNav tabs={tabs} value={tab} onChange={setTab} />

          {tab === 0 && (
            <Box sx={{ mt: 2 }}>
              <AdaptiveCoachCard data={data ?? null} isLoading={isLoading} />
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ mt: 2 }}>
              <SessionOptionsList
                sessions={data?.allScoredSessions || []}
                bestSessionType={data?.bestSession?.type || ''}
              />
            </Box>
          )}
        </Grid>
      </Grid>
    </PageContainer>
  );
}

function AlertBadge({
  goal,
  time,
  readiness,
  fatigue,
}: {
  goal: string;
  time: number;
  readiness: number | undefined;
  fatigue: string | undefined;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: alphaColor(STATUS_COLORS.info, 0.06),
        border: `1px solid ${alphaColor(STATUS_COLORS.info, 0.16)}`,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Schedule sx={{ fontSize: 16, color: STATUS_COLORS.info }} />
        <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
          Auto: <strong>{goal}</strong> · {time} min
          {readiness != null ? ` · Gotowosc ${readiness}` : ''}
          {fatigue ? ` · Zmeczenie ${fatigue}` : ''}
        </Typography>
      </Stack>
    </Box>
  );
}
