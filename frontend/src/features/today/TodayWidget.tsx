import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataUsageOutlinedIcon from '@mui/icons-material/DataUsageOutlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';


import LightweightRoutePreview from '@/components/activity/LightweightRoutePreview';
import { LoadDotMatrix, RecoveryFormGauge } from '@/components/today/TrainingVisualizations';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import type { DashboardWidget } from '@/types/uiPreferences';
import { getCyclingHeroIllustrationPath } from '@/utils/illustrationAssets';

import type { TodayResponse } from './types';
import type { NavigateFunction } from 'react-router-dom';

interface TodayWidgetProps {
  widget: DashboardWidget;
  data: TodayResponse;
  navigate: NavigateFunction;
}

const DEFAULT_TITLES: Record<DashboardWidget['type'], string> = {
  decision: 'Rekomendacja dnia',
  recovery: 'Regeneracja',
  load: 'Obciążenie 7/42 dni',
  lastActivity: 'Ostatni trening',
  nextWorkout: 'Następny trening',
  weather: 'Pogoda treningowa',
  weeklyVolume: 'Objętość tygodnia',
  goal: 'Cel treningowy',
};

function formatDuration(seconds?: number | null) {
  if (!seconds) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function WidgetHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center">
      <Box
        sx={{
          width: 38,
          height: 38,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: (currentTheme) => currentTheme.tokens?.surfaceSubtle ?? 'rgba(255,255,255,0.04)',
          border: '1px solid',
          borderColor: (currentTheme) => currentTheme.tokens?.surfaceBorder ?? currentTheme.palette.divider,
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" fontWeight={760}>{title}</Typography>
    </Stack>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        minWidth: 92,
        px: 1.25,
        py: 0.9,
        borderRadius: 2.5,
        bgcolor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 850 }}>
        {value}
      </Typography>
    </Box>
  );
}

function RouteMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h6" noWrap sx={{ fontWeight: 820, lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {label}
      </Typography>
    </Box>
  );
}

export default function TodayWidget({ widget, data, navigate }: TodayWidgetProps) {
  const title = widget.settings.title || DEFAULT_TITLES[widget.type];
  const recommendation = data.recommendation;
  const theme = useTheme();

  if (widget.type === 'decision') {
    return (
      <PerformanceSurface accent sx={{ p: 0, minHeight: { xs: 340, md: 410 }, height: '100%' }}>
        <Box sx={{ position: 'relative', minHeight: 'inherit', height: '100%', display: 'flex', overflow: 'hidden' }}>
          <Box
            component="img"
            src={getCyclingHeroIllustrationPath('today')}
            alt="Kolarz na górskiej szosie o poranku"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <Box sx={{ position: 'absolute', inset: 0, background: theme.tokens?.heroScrim ?? 'linear-gradient(90deg, rgba(5,10,16,0.86), rgba(5,10,16,0.18))' }} />
          <Stack
            spacing={1.35}
            sx={{
              position: 'relative',
              zIndex: 1,
              justifyContent: 'flex-end',
              width: '100%',
              p: { xs: 2.25, sm: 3, md: 3.5 },
              color: '#fff',
            }}
          >
            <Chip
              label="DZISIAJ · KOLARSTWO"
              size="small"
              sx={{ alignSelf: 'flex-start', color: '#fff', bgcolor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}
            />
            <Box>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.76)', fontWeight: 850, letterSpacing: '0.1em' }}>
                {title}
              </Typography>
              <Typography component="h2" variant="h3" sx={{ mt: 0.25, color: '#fff', fontWeight: 850, maxWidth: 680 }}>
                {recommendation?.sessionType ?? recommendation?.decision ?? 'Najpierw uzupełnij dane'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, maxWidth: 620, color: 'rgba(255,255,255,0.82)' }}>
                {recommendation?.description ?? 'Po synchronizacji system pokaże rekomendację wraz ze źródłami i zastrzeżeniami.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {recommendation?.durationMinutes != null && <HeroMetric label="CZAS" value={`${recommendation.durationMinutes} min`} />}
              {recommendation?.targetTss != null && <HeroMetric label="CEL" value={`${Math.round(recommendation.targetTss)} TSS`} />}
              {!!data.nextTraining?.plannedDurationMin && <HeroMetric label="NASTĘPNIE" value={`${data.nextTraining.plannedDurationMin} min`} />}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
              <Button variant="contained" color="primary" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/training')} sx={{ alignSelf: 'flex-start', boxShadow: '0 10px 24px rgba(0,0,0,0.18)' }}>
                Otwórz plan
              </Button>
              {!!data.evidence[0] && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', maxWidth: 460 }}>
                  {data.evidence[0].message}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Box>
      </PerformanceSurface>
    );
  }

  if (widget.type === 'recovery') {
    const form = data.load?.form;
    const readiness = form == null ? 'Brak oceny' : form >= 5 ? 'Świeżość' : form >= -10 ? 'Równowaga' : 'Regeneracja';
    return (
      <PerformanceSurface interactive sx={{ p: 2.25, height: '100%' }}>
        <WidgetHeader icon={<HotelOutlinedIcon color="primary" />} title={title} />
        <Typography variant="h4" sx={{ mt: 2, fontWeight: 850 }}>
          {readiness}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.1 }}>
          {form == null ? 'Brakuje historii do oceny gotowości.' : `Forma ${form.toFixed(1)} · ocena na podstawie obciążenia treningowego.`}
        </Typography>
        {form != null && <RecoveryFormGauge form={form} />}
      </PerformanceSurface>
    );
  }

  if (widget.type === 'load') {
    return (
      <PerformanceSurface interactive sx={{ p: 2.25, height: '100%' }}>
        <WidgetHeader icon={<DataUsageOutlinedIcon color="primary" />} title={title} />
        {data.load ? (
          <>
            <Stack direction="row" spacing={2.5} sx={{ mt: 2 }}>
              <MetricReadout label="CTL" value={data.load.ctl42.toFixed(1)} tone="primary" />
              <MetricReadout label="ATL" value={data.load.atl7.toFixed(1)} tone="warning" />
              <MetricReadout label="Forma" value={data.load.form.toFixed(1)} tone={data.load.form < -10 ? 'warning' : 'success'} />
            </Stack>
            <LoadDotMatrix ctl={data.load.ctl42} atl={data.load.atl7} form={data.load.form} />
          </>
        ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Brak historii wymaganej do obliczenia obciążenia.</Typography>}
      </PerformanceSurface>
    );
  }

  if (widget.type === 'lastActivity') {
    return (
      <PerformanceSurface sx={{ p: 0, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2.25, pb: 1.5 }}>
          <WidgetHeader icon={<DirectionsBikeOutlinedIcon color="primary" />} title={title} />
          {data.lastActivity ? (
            <>
              <Typography variant="h5" sx={{ mt: 1.45, fontWeight: 820 }} noWrap>{data.lastActivity.name}</Typography>
              <Stack direction="row" spacing={{ xs: 1.5, md: 3 }} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
                <RouteMetric label="Dystans" value={data.lastActivity.distanceM ? `${(data.lastActivity.distanceM / 1000).toFixed(1)} km` : '—'} />
                <RouteMetric label="Przewyższenie" value={data.lastActivity.elevationGainM ? `${Math.round(data.lastActivity.elevationGainM)} m` : '—'} />
                <RouteMetric label="Czas jazdy" value={formatDuration(data.lastActivity.movingTimeSec)} />
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ mt: 1.6, fontWeight: 800 }}>Zaplanuj następny przejazd</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7 }}>Po synchronizacji pojawi się tutaj ostatnia trasa i jej parametry.</Typography>
              <Button size="small" endIcon={<ArrowForwardIcon fontSize="small" />} onClick={() => navigate('/routes')} sx={{ mt: 1.1, px: 0 }}>Otwórz trasy</Button>
            </>
          )}
        </Box>
        {!!data.lastActivity && (
          <Box sx={{ position: 'relative', mt: 'auto', borderTop: '1px solid', borderColor: (currentTheme) => alpha(currentTheme.palette.text.primary, 0.07) }}>
            <LightweightRoutePreview
              activityName={data.lastActivity.name}
              summaryPolyline={data.lastActivity.summaryPolyline}
              height={250}
            />
            <Button
              size="small"
              endIcon={<ArrowForwardIcon fontSize="small" />}
              onClick={() => navigate(`/activities/${data.lastActivity?.id}`)}
              sx={{
                position: 'absolute',
                right: 16,
                bottom: 14,
                px: 1.25,
                bgcolor: (currentTheme) => alpha(currentTheme.palette.background.paper, 0.9),
                boxShadow: (currentTheme) => currentTheme.tokens?.cardShadow ?? '0 12px 34px rgba(0,0,0,0.18)',
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              Szczegóły
            </Button>
          </Box>
        )}
      </PerformanceSurface>
    );
  }

  if (widget.type === 'nextWorkout') {
    return (
      <PerformanceSurface interactive sx={{ p: 2.25, height: '100%' }}>
        <WidgetHeader icon={<EventOutlinedIcon color="primary" />} title={title} />
        {data.nextTraining ? (
          <>
            <Typography variant="h5" sx={{ mt: 2, fontWeight: 800 }}>{data.nextTraining.plannedType}</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(data.nextTraining.date).toLocaleDateString('pl-PL')} · {data.nextTraining.plannedDurationMin ?? '—'} min
            </Typography>
          </>
        ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Brak zaplanowanej sesji.</Typography>}
      </PerformanceSurface>
    );
  }

  if (widget.type === 'weather') {
    return (
      <PerformanceSurface sx={{ p: 2.25, height: '100%' }}>
        <WidgetHeader icon={<CloudOutlinedIcon color="primary" />} title={title} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Sprawdź okno pogodowe, wiatr i opady przed wyborem godziny wyjazdu.
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/weather')} sx={{ mt: 2 }}>Otwórz pogodę</Button>
      </PerformanceSurface>
    );
  }

  if (widget.type === 'weeklyVolume') {
    return (
      <PerformanceSurface sx={{ p: 2.25, height: '100%' }}>
        <WidgetHeader icon={<InsightsOutlinedIcon color="primary" />} title={title} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Szczegółowa objętość tygodnia jest dostępna w analizie obciążenia.
        </Typography>
        <Button onClick={() => navigate('/analytics')} sx={{ mt: 1 }}>Otwórz analizę</Button>
      </PerformanceSurface>
    );
  }

  return (
    <PerformanceSurface sx={{ p: 2.25, height: '100%' }}>
      <WidgetHeader icon={<FlagOutlinedIcon color="primary" />} title={title} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Ustaw priorytet sezonu i monitoruj drogę do celu w widoku planu.
      </Typography>
      <Button onClick={() => navigate('/training')} sx={{ mt: 1 }}>Otwórz plan</Button>
    </PerformanceSurface>
  );
}
