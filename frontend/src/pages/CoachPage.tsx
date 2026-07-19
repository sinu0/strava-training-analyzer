import { AutoAwesome, Bolt, FitnessCenter, Hotel, Psychology, SelfImprovement } from '@mui/icons-material';
import {
  Box, Button, Chip, Divider, Grid, Paper, Skeleton, Stack, Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EditorialHero from '@/components/common/EditorialHero';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import PageContainer from '@/components/common/PageContainer';
import { useAiPredict } from '@/hooks/useAi';
import { useCoachToday } from '@/hooks/useCoach';
import type { SessionOptionDto } from '@/types/adaptiveCoach';
import type { PredictionResponse } from '@/types/ai';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';
import { getPageHeroIllustrationPath } from '@/utils/illustrationAssets';

const DECISION_ICONS: Record<string, React.ReactElement> = {
  TRAIN: <FitnessCenter sx={{ fontSize: 28 }} />,
  RECOVER: <Hotel sx={{ fontSize: 28 }} />,
  ACTIVE_RECOVERY: <SelfImprovement sx={{ fontSize: 28 }} />,
  REST: <Hotel sx={{ fontSize: 28 }} />,
};

const DECISION_LABELS: Record<string, string> = {
  TRAIN: 'Trenuj',
  RECOVER: 'Regeneracja',
  ACTIVE_RECOVERY: 'Aktywna regeneracja',
  REST: 'Odpoczynek',
};

const DECISION_COLORS: Record<string, string> = {
  TRAIN: STATUS_COLORS.success,
  RECOVER: STATUS_COLORS.warning,
  ACTIVE_RECOVERY: STATUS_COLORS.info,
  REST: STATUS_COLORS.error,
};

function SessionCard({ session, selected }: { session: SessionOptionDto; selected?: boolean }) {
  const color = DECISION_COLORS.TRAIN!;
  return (
    <Paper
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected ? alphaColor(color, 0.4) : 'divider',
        bgcolor: selected ? alphaColor(color, 0.06) : 'background.paper',
      }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" fontWeight={800}>{session.type}</Typography>
          <Chip label={`${session.durationMinutes} min`} size="small" variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary" fontSize="0.78rem">
          {session.description}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={`TSS ${Math.round(session.targetTss)}`} size="small" sx={{ fontSize: '0.65rem' }} />
          {session.score > 0 && (
            <Chip label={`Score ${session.score.toFixed(2)}`} size="small" sx={{ fontSize: '0.65rem' }} />
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function CoachPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useCoachToday();
  const [aiInsight, setAiInsight] = useState<PredictionResponse | null>(null);
  const predictAi = useAiPredict();

  if (isLoading) {
    return (
      <PageContainer title="Coach">
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer title="Coach">
        <ErrorState message={error instanceof Error ? error.message : 'Nie można załadować danych coacha.'} />
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer title="Coach">
        <EmptyState
          title="Brak danych treningowych"
          description="Zsynchronizuj aktywności ze Stravy, aby Coach Engine mógł przeanalizować Twój stan i zaproponować optymalny trening."
          illustration="/illustrations/empty-coach.png"
        />
      </PageContainer>
    );
  }

  const decision = data.decision;
  const bestSession = data.bestSession;
  const allScored = data.allScoredSessions ?? [];

  return (
    <PageContainer
      title="Coach"
      subtitle="Inteligentny system decyzyjny — analiza Twojego stanu i celu treningowego"
    >
      <EditorialHero
        eyebrow="AI Coach"
        title="Coach Engine"
        description="System codziennie analizuje Twoj stan, cel i historie treningowa aby wybrac optymalna sesje."
        accentColor={STATUS_COLORS.accent}
        imageSrc={getPageHeroIllustrationPath('training')}
        imageAlt="Coach"
        imagePosition="center 40%"
        highlights={['Decyzja dnia', 'Scoring sesji', 'Model zmeczenia', 'Analiza ryzyka']}
      />

      <Grid container spacing={2.5}>
        {/* Decision card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: alphaColor(DECISION_COLORS[decision] ?? STATUS_COLORS.accent, 0.2),
              background: `linear-gradient(135deg, ${alphaColor(DECISION_COLORS[decision] ?? STATUS_COLORS.accent, 0.08)}, transparent)`,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Psychology sx={{ color: STATUS_COLORS.accent, fontSize: 28 }} />
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={800}>
                    Decyzja na dziś
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {DECISION_ICONS[decision]}
                    <Typography variant="h4" fontWeight={900} color={DECISION_COLORS[decision]}>
                      {DECISION_LABELS[decision] ?? decision}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>

              {!!data.insight && (
                <Typography variant="body2" color="text.secondary" fontSize="0.82rem">
                  {data.insight}
                </Typography>
              )}

              {!!bestSession && (
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alphaColor(STATUS_COLORS.accent, 0.05) }}>
                  <Typography variant="caption" fontWeight={700} color={STATUS_COLORS.accent}>
                    Rekomendowana sesja
                  </Typography>
                  <Typography fontWeight={800} fontSize="1.1rem" mt={0.25}>
                    {bestSession.type} · {bestSession.durationMinutes} min
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                    {bestSession.description}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                startIcon={<FitnessCenter />}
                onClick={() => navigate('/training')}
                sx={{ fontWeight: 700, bgcolor: STATUS_COLORS.accent }}
              >
                Przejdz do treningu
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Goal + AI insights */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2}>
            {!!data.goalProgress && (
              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Bolt sx={{ color: STATUS_COLORS.warning }} />
                  <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight={800}>Cel</Typography>
                    <Typography fontWeight={800}>
                      {data.goalProgress.currentValue} → {data.goalProgress.targetValue}
                      <Chip
                        label={`${data.goalProgress.gapPercent}%`}
                        size="small"
                        sx={{ ml: 1, fontSize: '0.65rem' }}
                        color={data.goalProgress.status === 'ON_TRACK' ? 'success' : 'warning'}
                      />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Faza: {data.goalProgress.phase} · Status: {data.goalProgress.status}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}

            {!!data.fatigue && (
              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="overline" color="text.secondary" fontWeight={800}>Zmeczenie</Typography>
                <Typography variant="body2">
                  ATL: {data.fatigue.currentAtl?.toFixed(1)} · TSB: {data.fatigue.currentTsb?.toFixed(1)}
                </Typography>
              </Paper>
            )}

            <Button
              variant="outlined"
              startIcon={predictAi.isPending ? undefined : <AutoAwesome />}
              onClick={() => predictAi.mutate(
                { predictionType: 'TRAINING_COACH_SUMMARY' },
                { onSuccess: (d) => setAiInsight(d) }
              )}
              disabled={predictAi.isPending}
              fullWidth
            >
              {predictAi.isPending ? 'Analizuję...' : aiInsight ? 'Odśwież analizę AI' : 'Analizuj z AI'}
            </Button>

            {!!aiInsight && (
              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: alphaColor(STATUS_COLORS.info, 0.2), bgcolor: alphaColor(STATUS_COLORS.info, 0.04) }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AutoAwesome sx={{ color: STATUS_COLORS.info, fontSize: 16 }} />
                    <Typography variant="overline" color={STATUS_COLORS.info} fontWeight={800}>AI Coach</Typography>
                    <Chip label={`${Math.round(aiInsight.confidence * 100)}%`} size="small" sx={{ fontSize: '0.6rem' }} />
                  </Stack>
                  <Divider />
                  <Typography variant="body2" fontWeight={700}>{aiInsight.summary}</Typography>
                  {!!aiInsight.detail && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                      {aiInsight.detail}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>

        {/* All scored sessions */}
        {allScored.length > 0 && (
          <Grid size={12}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
              Wszystkie opcje ({allScored.length})
            </Typography>
            <Grid container spacing={1.5}>
              {allScored.map((session) => (
                <Grid key={session.type} size={{ xs: 12, sm: 6, md: 4 }}>
                  <SessionCard session={session} selected={session.type === bestSession?.type} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
      </Grid>
    </PageContainer>
  );
}
