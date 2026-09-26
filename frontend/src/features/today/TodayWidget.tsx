import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataUsageOutlinedIcon from '@mui/icons-material/DataUsageOutlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';

import LightweightRoutePreview from '@/components/activity/LightweightRoutePreview';
import { LoadDotMatrix, RecoveryFormGauge } from '@/components/today/TrainingVisualizations';
import { getLocale, useI18n } from '@/i18n';
import type { DashboardWidget } from '@/types/uiPreferences';
import { HeroCard, Metric, Widget } from '@/ui';
import { getCyclingHeroIllustrationPath } from '@/utils/illustrationAssets';

import { todayMessages } from './messages';

import type { TodayResponse } from './types';
import type { NavigateFunction } from 'react-router-dom';

interface TodayWidgetProps {
  widget: DashboardWidget;
  data: TodayResponse;
  navigate: NavigateFunction;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function DecisionWidget({ title, data, navigate }: { title: string; data: TodayResponse; navigate: NavigateFunction }) {
  const t = todayMessages.useT();
  const { t: common } = useI18n();
  const recommendation = data.recommendation;
  const heroMetrics = [
    recommendation?.durationMinutes != null
      ? { id: 'duration', label: t('decision.sessionDuration'), value: `${recommendation.durationMinutes}`, unit: 'min' }
      : null,
    recommendation?.targetTss != null
      ? { id: 'tss', label: t('decision.loadTarget'), value: `${Math.round(recommendation.targetTss)}`, unit: 'TSS' }
      : null,
    data.nextTraining?.plannedDurationMin
      ? { id: 'next', label: t('decision.nextSession'), value: `${data.nextTraining.plannedDurationMin}`, unit: 'min' }
      : null,
  ].filter((metric): metric is { id: string; label: string; value: string; unit: string } => metric !== null);
  const [primaryMetric, ...secondaryMetrics] = heroMetrics;
  // Noon keeps the calendar day stable regardless of the runtime timezone.
  const todayCaption = new Date(`${data.asOf}T12:00:00`).toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long' });
  const needsInput = recommendation?.decision === 'NEEDS_INPUT';
  const heading = needsInput ? t('decision.setAvailability')
    : recommendation?.decision === 'REST' ? t('decision.rest')
      : recommendation?.sessionType ?? t('decision.fillDataFirst');

  return (
    <HeroCard
      image={{ src: getCyclingHeroIllustrationPath('today'), alt: t('decision.heroAlt') }}
      eyebrow={title}
      title={heading}
      caption={`${common('nav.today.label')} · ${todayCaption}`}
      description={recommendation?.description ?? t('decision.description')}
      stat={primaryMetric ? { label: primaryMetric.label, value: primaryMetric.value, unit: primaryMetric.unit } : undefined}
      metrics={secondaryMetrics.map((metric) => ({ id: metric.id, label: metric.label, value: `${metric.value} ${metric.unit}` }))}
      footnote={data.evidence[0]?.message}
      action={{
        label: needsInput ? t('decision.setGoalAndAvailability') : t('decision.openPlan'),
        onClick: () => navigate(needsInput ? '/training?tab=context' : '/training'),
      }}
    />
  );
}

export default function TodayWidget({ widget, data, navigate }: TodayWidgetProps) {
  const t = todayMessages.useT();
  const title = widget.settings.title || t(`widgetTitles.${widget.type}`);

  if (widget.type === 'decision') {
    return <DecisionWidget title={title} data={data} navigate={navigate} />;
  }

  if (widget.type === 'recovery') {
    const form = data.load?.form;
    const readiness = form == null ? t('recovery.noAssessment')
      : form >= 5 ? t('recovery.freshness')
        : form >= -10 ? t('recovery.balance') : t('recovery.recovering');
    return (
      <Widget interactive title={title} icon={<HotelOutlinedIcon />}>
        <Metric label={t('recovery.readinessLabel')} value={readiness} />
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.1 }}>
          {form == null ? t('recovery.missingHistory') : t('recovery.formSummary', { form: form.toFixed(1) })}
        </Typography>
        {form != null && <RecoveryFormGauge form={form} />}
      </Widget>
    );
  }

  if (widget.type === 'load') {
    return (
      <Widget interactive title={title} icon={<DataUsageOutlinedIcon />}>
        {data.load ? (
          <>
            <Stack direction="row" spacing={2.5}>
              <Metric label="CTL" value={data.load.ctl42.toFixed(1)} tone="primary" />
              <Metric label="ATL" value={data.load.atl7.toFixed(1)} tone="warning" />
              <Metric label={t('load.form')} value={data.load.form.toFixed(1)} tone={data.load.form < -10 ? 'warning' : 'success'} />
            </Stack>
            <LoadDotMatrix ctl={data.load.ctl42} atl={data.load.atl7} form={data.load.form} />
          </>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('load.noHistory')}</Typography>
        )}
      </Widget>
    );
  }

  if (widget.type === 'lastActivity') {
    const activity = data.lastActivity;
    return (
      <Widget
        title={title}
        icon={<DirectionsBikeOutlinedIcon />}
        media={activity ? (
          <Box sx={{ position: 'relative', borderTop: '1px solid', borderColor: 'divider' }}>
            <LightweightRoutePreview activityName={activity.name} summaryPolyline={activity.summaryPolyline} height={250} />
            <Button
              size="small"
              variant="contained"
              color="inherit"
              endIcon={<ArrowForwardIcon fontSize="small" />}
              onClick={() => navigate(`/activities/${activity.id}`)}
              sx={{ position: 'absolute', right: 16, bottom: 14, bgcolor: 'background.paper', color: 'primary.main', '&:hover': { bgcolor: 'background.paper' } }}
            >
              {t('lastActivity.details')}
            </Button>
          </Box>
        ) : undefined}
      >
        {activity ? (
          <>
            <Typography variant="h5" noWrap>{activity.name}</Typography>
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: { xs: 2, md: 3 }, mt: 1.25 }}>
              <Metric variant="stat" label={t('lastActivity.distance')} value={activity.distanceM ? (activity.distanceM / 1000).toFixed(1) : '—'} unit={activity.distanceM ? 'km' : undefined} />
              <Metric variant="stat" label={t('lastActivity.elevationGain')} value={activity.elevationGainM ? Math.round(activity.elevationGainM) : '—'} unit={activity.elevationGainM ? 'm' : undefined} />
              <Metric variant="stat" label={t('lastActivity.rideTime')} value={formatDuration(activity.movingTimeSec)} />
            </Stack>
          </>
        ) : (
          <>
            <Typography variant="h6">{t('lastActivity.planNextTitle')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.7 }}>{t('lastActivity.planNextDescription')}</Typography>
            <Button size="small" endIcon={<ArrowForwardIcon fontSize="small" />} onClick={() => navigate('/routes')} sx={{ mt: 1.1, px: 0 }}>{t('lastActivity.openRoutes')}</Button>
          </>
        )}
      </Widget>
    );
  }

  if (widget.type === 'nextWorkout') {
    const next = data.nextTraining;
    return (
      <Widget interactive title={title} icon={<EventOutlinedIcon />}>
        {next ? (
          <>
            <Typography variant="h5">{next.plannedType}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {new Date(`${next.date}T12:00:00`).toLocaleDateString(getLocale())} · {next.plannedDurationMin ?? '—'} min
            </Typography>
            <Button variant="contained" startIcon={<DirectionsBikeOutlinedIcon />} onClick={() => navigate(`/training/workouts/${next.id}`)} sx={{ mt: 2 }}>
              {t('nextWorkout.openWorkout')}
            </Button>
          </>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('nextWorkout.noSession')}</Typography>
        )}
      </Widget>
    );
  }

  if (widget.type === 'weather') {
    return (
      <Widget title={title} icon={<CloudOutlinedIcon />}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('weather.description')}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/weather')} sx={{ mt: 2 }}>{t('weather.open')}</Button>
      </Widget>
    );
  }

  if (widget.type === 'weeklyVolume') {
    return (
      <Widget title={title} icon={<InsightsOutlinedIcon />}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('weeklyVolume.description')}
        </Typography>
        <Button onClick={() => navigate('/analytics')} sx={{ mt: 1 }}>{t('weeklyVolume.open')}</Button>
      </Widget>
    );
  }

  return (
    <Widget title={title} icon={<FlagOutlinedIcon />}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {t('goal.description')}
      </Typography>
      <Button onClick={() => navigate('/training')} sx={{ mt: 1 }}>{t('goal.open')}</Button>
    </Widget>
  );
}
