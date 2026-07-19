import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataUsageOutlinedIcon from '@mui/icons-material/DataUsageOutlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';


import LightweightRoutePreview from '@/components/activity/LightweightRoutePreview';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import type { DashboardWidget } from '@/types/uiPreferences';

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
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Typography variant="subtitle1" fontWeight={760}>{title}</Typography>
    </Stack>
  );
}

export default function TodayWidget({ widget, data, navigate }: TodayWidgetProps) {
  const title = widget.settings.title || DEFAULT_TITLES[widget.type];
  const recommendation = data.recommendation;

  if (widget.type === 'decision') {
    return (
      <PerformanceSurface accent sx={{ p: { xs: 2.5, md: 3.5 }, minHeight: 300, height: '100%' }}>
        <Typography variant="overline" color="primary" sx={{ fontWeight: 850, letterSpacing: '0.1em' }}>
          {title}
        </Typography>
        <Typography component="h2" variant="h3" sx={{ mt: 1, fontWeight: 850, maxWidth: 760 }}>
          {recommendation?.sessionType ?? recommendation?.decision ?? 'Najpierw uzupełnij dane'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 780 }}>
          {recommendation?.description
            ?? 'Po synchronizacji system pokaże rekomendację wraz ze źródłami i zastrzeżeniami.'}
        </Typography>
        {!!data.evidence.length && (
          <Stack spacing={0.75} sx={{ mt: 2.5 }}>
            {data.evidence.slice(0, 3).map((evidence) => (
              <Typography key={`${evidence.code}-${evidence.message}`} variant="body2">
                • {evidence.message}
              </Typography>
            ))}
          </Stack>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 3 }}>
          {recommendation?.durationMinutes != null && <Chip label={`${recommendation.durationMinutes} min`} color="primary" />}
          {recommendation?.targetTss != null && <Chip label={`${Math.round(recommendation.targetTss)} TSS`} />}
          <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/training')} sx={{ ml: { sm: 'auto' } }}>
            Otwórz plan
          </Button>
        </Stack>
      </PerformanceSurface>
    );
  }

  if (widget.type === 'recovery') {
    const form = data.load?.form;
    return (
      <PerformanceSurface sx={{ p: 2.25, height: '100%' }}>
        <WidgetHeader icon={<HotelOutlinedIcon color="primary" />} title={title} />
        <Typography variant="h4" sx={{ mt: 2, fontWeight: 850 }}>
          {form == null ? '—' : form >= 0 ? 'Gotowy' : form > -10 ? 'Umiarkowanie' : 'Regeneracja'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Podstawa danych: {data.confidence.level === 'HIGH' ? 'pełna' : data.confidence.level === 'MEDIUM' ? 'częściowa' : 'niska'}.
        </Typography>
      </PerformanceSurface>
    );
  }

  if (widget.type === 'load') {
    return (
      <PerformanceSurface sx={{ p: 2.25, height: '100%' }}>
        <WidgetHeader icon={<DataUsageOutlinedIcon color="primary" />} title={title} />
        {data.load ? (
          <Stack direction="row" spacing={2.5} sx={{ mt: 2 }}>
            <MetricReadout label="CTL" value={data.load.ctl42.toFixed(1)} tone="primary" />
            <MetricReadout label="ATL" value={data.load.atl7.toFixed(1)} tone="warning" />
            <MetricReadout label="Forma" value={data.load.form.toFixed(1)} tone={data.load.form < -10 ? 'warning' : 'success'} />
          </Stack>
        ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Brak historii wymaganej do obliczenia obciążenia.</Typography>}
      </PerformanceSurface>
    );
  }

  if (widget.type === 'lastActivity') {
    return (
      <PerformanceSurface sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2.25 }}>
          <WidgetHeader icon={<DirectionsBikeOutlinedIcon color="primary" />} title={title} />
          {data.lastActivity ? (
            <>
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 760 }}>{data.lastActivity.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDuration(data.lastActivity.movingTimeSec)} · {data.lastActivity.distanceM ? `${(data.lastActivity.distanceM / 1000).toFixed(1)} km` : 'dystans —'}
              </Typography>
              <Button size="small" onClick={() => navigate(`/activities/${data.lastActivity?.id}`)} sx={{ mt: 1 }}>
                Zobacz aktywność
              </Button>
            </>
          ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Brak zsynchronizowanej aktywności.</Typography>}
        </Box>
        {!!data.lastActivity && (
          <LightweightRoutePreview
            activityName={data.lastActivity.name}
            summaryPolyline={data.lastActivity.summaryPolyline}
          />
        )}
      </PerformanceSurface>
    );
  }

  if (widget.type === 'nextWorkout') {
    return (
      <PerformanceSurface sx={{ p: 2.25, height: '100%' }}>
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
