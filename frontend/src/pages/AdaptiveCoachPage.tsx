import { Psychology, Send } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid2 as Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import AdaptiveCoachCard from '@/components/adaptive-coach/AdaptiveCoachCard';
import SessionOptionsList from '@/components/adaptive-coach/SessionOptionsList';
import EditorialHero from '@/components/common/EditorialHero';
import PageContainer from '@/components/common/PageContainer';
import TabsNav from '@/components/common/TabsNav';
import { useReadiness, useProfile } from '@/hooks/useAnalytics';
import { useAdaptiveCoachToday } from '@/hooks/useAdaptiveCoach';
import { STATUS_COLORS } from '@/utils/colors';
import { getPageHeroIllustrationPath } from '@/utils/illustrationAssets';

const GOAL_TYPES = [
  { value: 'FTP', label: 'FTP' },
  { value: 'VO2MAX', label: 'VO2max' },
  { value: 'POWER_DURATION', label: 'Power Duration' },
  { value: 'DISTANCE', label: 'Dystans' },
  { value: 'DURABILITY', label: 'Wytrzymałość zmęczeniowa' },
  { value: 'POWER_TO_WEIGHT', label: 'Power-to-Weight' },
  { value: 'TIME_ON_SEGMENT', label: 'Czas na odcinku' },
];

const OVERRIDE_STATES = [
  { value: 'NONE', label: 'Brak' },
  { value: 'HIGH_LOAD', label: 'Wysokie obciążenie (obóz)' },
  { value: 'LOW_LOAD', label: 'Niskie obciążenie (luźny tydzień)' },
  { value: 'INTENT', label: 'Chcę cisnąć' },
];

const tabs = [
  { label: 'Decyzja', value: 0 },
  { label: 'Wszystkie opcje', value: 1 },
];

export default function AdaptiveCoachPage() {
  const [tab, setTab] = useState(0);
  const [goalType, setGoalType] = useState('FTP');
  const [targetValue, setTargetValue] = useState(300);
  const [aiInput, setAiInput] = useState('');
  const [overrideState, setOverrideState] = useState('NONE');
  const [timeAvailable, setTimeAvailable] = useState(90);

  const [queryGoal, setQueryGoal] = useState('FTP');
  const [queryTarget, setQueryTarget] = useState(300);
  const [queryAiInput, setQueryAiInput] = useState<string | undefined>(undefined);
  const [queryOverride, setQueryOverride] = useState<string | undefined>(undefined);
  const [queryTime, setQueryTime] = useState(90);

  const { data: readiness, isLoading: readinessLoading } = useReadiness();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const { data, isLoading } = useAdaptiveCoachToday(
    queryGoal,
    queryTarget,
    undefined,
    queryAiInput,
    queryOverride,
    queryTime,
  );

  const handleSubmit = () => {
    setQueryGoal(goalType);
    setQueryTarget(targetValue);
    setQueryAiInput(aiInput.trim() || undefined);
    setQueryOverride(overrideState !== 'NONE' ? overrideState : undefined);
    setQueryTime(timeAvailable);
  };

  return (
    <PageContainer
      title="Adaptive Coach"
      subtitle="Inteligentny system decyzyjny — dane z Twojego profilu"
    >
      <EditorialHero
        eyebrow="AI Coach"
        title="Adaptive Training Engine"
        description="System codziennie analizuje Twój stan z bazy danych, cel i historię aby wybrać optymalną sesję. Koniec ze sztywnymi planami."
        accentColor={STATUS_COLORS.success}
        imageSrc={getPageHeroIllustrationPath('training')}
        imageAlt="Adaptive Coach"
        imagePosition="center 40%"
        highlights={['Dane z systemu', 'Silnik scoringowy', 'Model zmęczenia', 'Analiza ryzyka']}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Stack spacing={2}>
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Aktualny stan
              </Typography>
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
                      label={`Gotowość: ${readiness?.score ?? '-'}`}
                      size="small"
                      color={(readiness?.score ?? 0) >= 75 ? 'success' : (readiness?.score ?? 0) >= 55 ? 'info' : 'warning'}
                    />
                    <Chip label={`FTP: ${profile?.ftpWatts ?? '-'}W`} size="small" />
                    <Chip label={`Waga: ${profile?.weightKg ?? '-'}kg`} size="small" />
                    <Chip label={`HR spocz.: ${profile?.restingHrBpm ?? '-'}`} size="small" />
                  </Stack>
                  {readiness?.dayLabel && (
                    <Typography variant="caption" color="text.secondary">
                      {readiness.description}
                    </Typography>
                  )}
                </Stack>
              )}
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Konfiguracja
              </Typography>

              <Stack spacing={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Cel</InputLabel>
                  <Select value={goalType} label="Cel" onChange={(e) => setGoalType(e.target.value)}>
                    {GOAL_TYPES.map((g) => (
                      <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Wartość docelowa"
                  type="number"
                  size="small"
                  fullWidth
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                />

                <TextField
                  label="Dostępny czas (min)"
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
                    <Typography variant="subtitle2">Input (język naturalny)</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <OutlinedInput
                      size="small"
                      fullWidth
                      placeholder='"Czuję się zmęczony", "Chcę krótką jazdę", "Mam powera"...'
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
                  {isLoading ? 'Analizuję...' : 'Generuj decyzję'}
                </Button>
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
