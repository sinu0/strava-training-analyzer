import BarChartIcon from '@mui/icons-material/BarChart';
import BoltIcon from '@mui/icons-material/Bolt';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import {
  Box, Typography, Avatar, Button, Chip, Divider, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
} from '@mui/material';
import { useMemo, lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ErrorBoundary from '../components/common/ErrorBoundary';
import PageContainer from '../components/common/PageContainer';
import Section from '../components/common/Section';
import AchievementsSection from '../components/profile/AchievementsSection';
import FourWeekCyclingSummary from '../components/profile/FourWeekCyclingSummary';
import ProfileGallery from '../components/profile/ProfileGallery';
import SummaryStoryModal from '../components/profile/SummaryStoryModal';
import WeeklyKmBarChart from '../components/profile/WeeklyKmBarChart';
import { useProfile, useUpdateProfile, useWeeklySummaries, useFtpProgress, useReadiness } from '../hooks/useAnalytics';
import {
  BRAND_COLORS,
  CHART_COLORS,
  GRADIENTS,
  PROFILE_GRADIENTS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
} from '../utils/colors';
import { formatDistance } from '../utils/formatters';

const MmpTrendChart = lazy(() => import('../components/analytics/MmpTrendChart'));

function StatPill({
  icon,
  label,
  value,
  tooltip,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tooltip?: string;
  color?: string;
}) {
  const pill = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 1.5, sm: 2.5 },
        py: 1.5,
        minWidth: 72,
      }}
    >
      <Box sx={{ color: color ?? 'primary.main', mb: 0.25 }}>{icon}</Box>
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.78rem',
          color: alphaColor(CHART_COLORS.tooltipText, 0.55),
          mt: 0.25,
          textAlign: 'center',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
  if (tooltip) {
    return <Tooltip title={tooltip} placement="top">{pill}</Tooltip>;
  }
  return pill;
}

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const { data: ftpProgress } = useFtpProgress();
  const { data: weekly = [] } = useWeeklySummaries(12);
  const { data: readiness } = useReadiness();
  const latestWeek = weekly.length ? weekly[0] : undefined;
  const navigate = useNavigate();
  const [storyOpen, setStoryOpen] = useState(false);
  const [ftpDialogOpen, setFtpDialogOpen] = useState(false);
  const [ftpInput, setFtpInput] = useState('');
  const updateProfile = useUpdateProfile();

  // Training streak: consecutive weeks with at least one activity
  const streak = useMemo(() => {
    let count = 0;
    for (const w of weekly) {
      if (w.activityCount > 0) count++;
      else break;
    }
    return count;
  }, [weekly]);

  const fromTo = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7 * 12);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { from: fmt(from), to: fmt(to) };
  }, []);

  const initials = profile?.name
    ? profile.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'KP';

  return (
    <PageContainer
      title="Profil"
      subtitle="Kluczowe statystyki są uproszczone, a podsumowanie treningowe wychodzi nad galerię i dodatki."
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Profil' },
      ]}
      maxWidth={900}
    >
      <Box sx={{ px: { xs: 1, sm: 2 }, pb: 4, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>

      {/* ── Hero ─────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: PROFILE_GRADIENTS.hero,
          border: `1px solid ${SURFACE_COLORS.strongBorder}`,
        }}
      >
        {/* Decorative background pattern */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              `radial-gradient(ellipse at 80% 20%, ${alphaColor(STATUS_COLORS.accent, 0.12)} 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, ${alphaColor(STATUS_COLORS.info, 0.1)} 0%, transparent 55%)`,
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ position: 'relative', p: { xs: 2.5, sm: 3 } }}>
          {/* Top row: avatar + name + action */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, flexWrap: 'wrap' }}>
            <Avatar
              sx={{
                width: { xs: 72, sm: 88 },
                height: { xs: 72, sm: 88 },
                fontSize: { xs: 26, sm: 32 },
                fontWeight: 700,
                background: GRADIENTS.strava,
                border: `3px solid ${alphaColor(BRAND_COLORS.strava, 0.4)}`,
                boxShadow: `0 0 24px ${alphaColor(BRAND_COLORS.strava, 0.25)}`,
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: 'white', lineHeight: 1.2, mb: 0.5 }}
              >
                {profile?.name ?? 'Kolarz'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}>
                <Chip
                  size="small"
                  label={profile?.stravaConnected ? 'Strava połączona' : 'Brak Strava'}
                  sx={{
                    bgcolor: profile?.stravaConnected
                      ? alphaColor(STATUS_COLORS.success, 0.15)
                      : alphaColor(STATUS_COLORS.neutral, 0.12),
                    color: profile?.stravaConnected ? STATUS_COLORS.success : STATUS_COLORS.neutral,
                    border: `1px solid ${
                      profile?.stravaConnected
                        ? alphaColor(STATUS_COLORS.success, 0.3)
                        : alphaColor(STATUS_COLORS.neutral, 0.2)
                    }`,
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
                {!!profile?.createdAt && (
                  <Chip
                    size="small"
                    label={`od ${new Date(profile.createdAt).getFullYear()}`}
                    sx={{
                      bgcolor: SURFACE_COLORS.subtle,
                      color: CHART_COLORS.tickText,
                      border: `1px solid ${alphaColor(CHART_COLORS.tooltipText, 0.08)}`,
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                )}
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<BarChartIcon />}
              onClick={() => navigate('/analytics')}
              sx={{ flexShrink: 0, alignSelf: 'flex-start' }}
            >
              Pełna analiza
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setStoryOpen(true)}
              sx={{ flexShrink: 0, alignSelf: 'flex-start' }}
            >
              Podsumowanie tygodnia
            </Button>
          </Box>

          {/* Stats band */}
          <Divider sx={{ my: 2.5, borderColor: alphaColor(CHART_COLORS.tooltipText, 0.08) }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0, justifyContent: 'space-around' }}>
            <Box sx={{ cursor: 'pointer' }} onClick={() => {
              setFtpInput(String(profile?.ftpWatts ?? ftpProgress?.currentFtp ?? ''));
              setFtpDialogOpen(true);
            }}>
              <StatPill
                icon={<BoltIcon fontSize="small" />}
                label="FTP"
                tooltip="Kliknij, aby edytować"
                value={
                  profile?.ftpWatts != null
                    ? `${profile.ftpWatts} W`
                    : ftpProgress?.currentFtp != null
                    ? `${ftpProgress.currentFtp} W`
                    : '—'
                }
              />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: alphaColor(CHART_COLORS.tooltipText, 0.08) }} />
            <StatPill
              icon={<FitnessCenterIcon fontSize="small" />}
              label="Waga"
              value={profile?.weightKg ? `${profile.weightKg} kg` : '—'}
            />
            {!!readiness && <>
              <Divider orientation="vertical" flexItem sx={{ borderColor: alphaColor(CHART_COLORS.tooltipText, 0.08) }} />
              <StatPill
                icon={<TrendingUpIcon fontSize="small" />}
                label="CTL"
                tooltip="Chronic Training Load – kondycja długoterminowa"
                value={Math.round(readiness.ctl)}
                color={STATUS_COLORS.info}
              />
            </>}
            {!!latestWeek && <>
                <Divider orientation="vertical" flexItem sx={{ borderColor: alphaColor(CHART_COLORS.tooltipText, 0.08) }} />
                <StatPill
                  icon={<DirectionsBikeIcon fontSize="small" />}
                  label="Dystans (tydz.)"
                  value={formatDistance(latestWeek.totalDistanceM)}
                />
              </>}
            {streak > 0 && (
              <>
                <Divider orientation="vertical" flexItem sx={{ borderColor: alphaColor(CHART_COLORS.tooltipText, 0.08) }} />
                <StatPill
                  icon={<WhatshotIcon fontSize="small" />}
                  label="Seria (tygodnie)"
                  tooltip="Ile tygodni z rzędu masz aktywności?"
                  value={`${streak} 🔥`}
                  color={STATUS_COLORS.accent}
                />
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── 4-week cycling summary ────────────────────── */}
      <Section title="Podsumowanie treningowe" subtitle="Najważniejsze liczby i kontekst z ostatnich czterech tygodni." accentColor={STATUS_COLORS.accent}>
        <FourWeekCyclingSummary />
      </Section>

      {/* ── Gallery ──────────────────────────────────── */}
      <Section title="Galeria zdjęć">
        <ProfileGallery />
      </Section>

      {/* ── Weekly km bar chart ──────────────────────── */}
      <Section title="Tygodniowe wolumeny">
        <WeeklyKmBarChart />
      </Section>

      {/* ── MMP Trend ─────────────────────────────────── */}
      <Section title="Krzywa mocy – trend">
        <ErrorBoundary>
          <Suspense fallback={<Box sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>Ładowanie wykresu…</Box>}>
            <MmpTrendChart from={fromTo.from} to={fromTo.to} />
          </Suspense>
        </ErrorBoundary>
      </Section>

      {/* ── Achievements ─────────────────────────── */}
      <Section title="Odznaki i osiągnięcia">
        <AchievementsSection />
      </Section>

      <SummaryStoryModal
        open={storyOpen}
        onClose={() => setStoryOpen(false)}
        weeklySummaries={weekly}
        readiness={readiness}
        streak={streak}
      />

      <Dialog open={ftpDialogOpen} onClose={() => setFtpDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edytuj FTP</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="FTP (W)"
            type="number"
            fullWidth
            value={ftpInput}
            onChange={(e) => setFtpInput(e.target.value)}
            slotProps={{ htmlInput: { min: 50, max: 600 } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFtpDialogOpen(false)}>Anuluj</Button>
          <Button
            variant="contained"
            disabled={updateProfile.isPending}
            onClick={() => {
              const val = parseInt(ftpInput, 10);
              if (val > 0) {
                updateProfile.mutate(
                  { ftpWatts: val },
                  { onSuccess: () => setFtpDialogOpen(false) },
                );
              }
            }}
          >
            {updateProfile.isPending ? <CircularProgress size={18} /> : 'Zapisz'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </PageContainer>
  );
}
