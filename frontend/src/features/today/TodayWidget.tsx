import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataUsageOutlinedIcon from '@mui/icons-material/DataUsageOutlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
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
          bgcolor: (currentTheme) => currentTheme.tokens?.iconBubble ?? 'rgba(255,255,255,0.05)',
          color: 'text.primary',
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
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
        bgcolor: 'rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.22)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.72)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
  );
}

function RouteMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h6" noWrap sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
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
    const heroMetrics = [
      recommendation?.durationMinutes != null
        ? { label: 'Czas sesji', value: `${recommendation.durationMinutes}`, unit: 'min' }
        : null,
      recommendation?.targetTss != null
        ? { label: 'Cel obciążenia', value: `${Math.round(recommendation.targetTss)}`, unit: 'TSS' }
        : null,
      data.nextTraining?.plannedDurationMin
        ? { label: 'Następna sesja', value: `${data.nextTraining.plannedDurationMin}`, unit: 'min' }
        : null,
    ].filter((metric): metric is { label: string; value: string; unit: string } => metric !== null);
    const primaryMetric = heroMetrics[0] ?? null;
    const secondaryMetrics = heroMetrics.slice(1);
    // Noon keeps the calendar day stable regardless of the runtime timezone.
    const todayCaption = new Date(`${data.asOf}T12:00:00`).toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return (
      <PerformanceSurface accent sx={{ p: 0, minHeight: { xs: 380, md: 440 }, height: '100%' }}>
        <Box sx={{ position: 'relative', minHeight: 'inherit', height: '100%', overflow: 'hidden' }}>
          <Box
            component="img"
            src={getCyclingHeroIllustrationPath('today')}
            alt="Kolarz na górskiej szosie o poranku"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <Box sx={{ position: 'absolute', inset: 0, background: theme.tokens?.heroScrim ?? 'linear-gradient(90deg, rgba(5,10,16,0.86), rgba(5,10,16,0.18))' }} />

          {/* Lewy górny róg — szklana pigułka z labelem */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 16, md: 22 },
              left: { xs: 16, md: 22 },
              zIndex: 1,
              px: 1.6,
              py: 0.7,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {title}
            </Typography>
          </Box>

          {/* Prawy górny róg — szklana karta kluczowej metryki */}
          {primaryMetric !== null && (
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 16, md: 22 },
                right: { xs: 16, md: 22 },
                zIndex: 1,
                px: 2,
                py: 1.4,
                minWidth: 108,
                borderRadius: '20px',
                bgcolor: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <Stack direction="row" spacing={0.5} alignItems="baseline">
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.65rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {primaryMetric.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                  {primaryMetric.unit}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.2, color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {primaryMetric.label}
              </Typography>
            </Box>
          )}

          {/* Dolny pas — wielki tytuł, caption i okrągłe CTA */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="flex-end"
            justifyContent="space-between"
            sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1, p: { xs: 2.5, sm: 3, md: 3.5 }, color: '#fff' }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h2"
                variant="h3"
                sx={{ color: '#fff', fontWeight: 800, maxWidth: 640, fontSize: 'clamp(2rem, 1.55rem + 1.5vw, 2.6rem)', letterSpacing: '-0.03em' }}
              >
                {recommendation?.sessionType ?? recommendation?.decision ?? 'Najpierw uzupełnij dane'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.6, color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Dzisiaj · {todayCaption}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1.1, maxWidth: 600, color: 'rgba(255,255,255,0.82)' }}>
                {recommendation?.description ?? 'Po synchronizacji system pokaże rekomendację wraz ze źródłami i zastrzeżeniami.'}
              </Typography>
              {secondaryMetrics.length > 0 && (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                  {secondaryMetrics.map((metric) => (
                    <HeroMetric key={metric.label} label={metric.label} value={`${metric.value} ${metric.unit}`} />
                  ))}
                </Stack>
              )}
              {!!data.evidence[0] && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: 'rgba(255,255,255,0.72)', maxWidth: 460 }}>
                  {data.evidence[0].message}
                </Typography>
              )}
            </Box>
            <IconButton
              aria-label="Otwórz plan"
              onClick={() => navigate('/training')}
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                bgcolor: '#FFFFFF',
                color: '#111827',
                boxShadow: '0 14px 30px rgba(5,10,16,0.35)',
                transition: theme.tokens?.transition ?? 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)', transform: 'translateY(-2px)' },
              }}
            >
              <ArrowOutwardIcon />
            </IconButton>
          </Stack>
        </Box>
      </PerformanceSurface>
    );
  }

  if (widget.type === 'recovery') {
    const form = data.load?.form;
    const readiness = form == null ? 'Brak oceny' : form >= 5 ? 'Świeżość' : form >= -10 ? 'Równowaga' : 'Regeneracja';
    return (
      <PerformanceSurface interactive sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
        <WidgetHeader icon={<HotelOutlinedIcon />} title={title} />
        <Box sx={{ mt: 2 }}>
          <MetricReadout label="Ocena gotowości" value={readiness} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.1 }}>
          {form == null ? 'Brakuje historii do oceny gotowości.' : `Forma ${form.toFixed(1)} · ocena na podstawie obciążenia treningowego.`}
        </Typography>
        {form != null && <RecoveryFormGauge form={form} />}
      </PerformanceSurface>
    );
  }

  if (widget.type === 'load') {
    return (
      <PerformanceSurface interactive sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
        <WidgetHeader icon={<DataUsageOutlinedIcon />} title={title} />
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
        <Box sx={{ p: { xs: 2.5, md: 3 }, pb: 1.5 }}>
          <WidgetHeader icon={<DirectionsBikeOutlinedIcon />} title={title} />
          {data.lastActivity ? (
            <>
              <Typography variant="h5" sx={{ mt: 1.45, fontWeight: 800, letterSpacing: '-0.02em' }} noWrap>{data.lastActivity.name}</Typography>
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
      <PerformanceSurface interactive sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
        <WidgetHeader icon={<EventOutlinedIcon />} title={title} />
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
      <PerformanceSurface sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
        <WidgetHeader icon={<CloudOutlinedIcon />} title={title} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Sprawdź okno pogodowe, wiatr i opady przed wyborem godziny wyjazdu.
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/weather')} sx={{ mt: 2 }}>Otwórz pogodę</Button>
      </PerformanceSurface>
    );
  }

  if (widget.type === 'weeklyVolume') {
    return (
      <PerformanceSurface sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
        <WidgetHeader icon={<InsightsOutlinedIcon />} title={title} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Szczegółowa objętość tygodnia jest dostępna w analizie obciążenia.
        </Typography>
        <Button onClick={() => navigate('/analytics')} sx={{ mt: 1 }}>Otwórz analizę</Button>
      </PerformanceSurface>
    );
  }

  return (
    <PerformanceSurface sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
      <WidgetHeader icon={<FlagOutlinedIcon />} title={title} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Ustaw priorytet sezonu i monitoruj drogę do celu w widoku planu.
      </Typography>
      <Button onClick={() => navigate('/training')} sx={{ mt: 1 }}>Otwórz plan</Button>
    </PerformanceSurface>
  );
}
