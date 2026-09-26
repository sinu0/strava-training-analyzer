import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import BoltIcon from '@mui/icons-material/Bolt';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Box, Button, CssBaseline, Stack, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useMemo } from 'react';

import { designSystemMessages } from '@/features/design-system/messages';
import { createAppTheme, getThemeTokens, type AppColorMode } from '@/theme/theme';
import {
  DotMatrixChart, DotMatrixRow, EmptyState, HeroCard, LegendStat, Metric, PageHeader, ProgressTrack, RoundAction,
  SectionHeader, SkeletonCard, Sparkline, StatRow, StatusPill, Surface, Widget, WidgetCell, WidgetGrid,
} from '@/ui';
import { getCyclingHeroIllustrationPath } from '@/utils/illustrationAssets';

const HOURLY = [1, 2, 1, 3, 4, 3, 2, 2, 3, 5, 6, 7, 5, 4].map((value, hour) => ({ id: `h${hour}`, value }));
const ZONES = getThemeTokens('dark').chart.zone;

function Catalog({ mode }: { mode: AppColorMode }) {
  const tokens = getThemeTokens(mode);
  const t = designSystemMessages.useT();
  return (
    <Box data-testid={`catalog-${mode}`} sx={{ bgcolor: 'background.default', color: 'text.primary', p: { xs: 2, md: 4 }, minWidth: 0 }}>
      <PageHeader
        eyebrow={mode === 'light' ? t('themeLight') : t('themeDark')}
        title={t('header.title')}
        description={t('header.description')}
        meta={<><StatusPill label={t('header.dataFresh')} tone="success" variant="outline" /><StatusPill label="LOCAL" tone="success" size="sm" /></>}
      />

      <SectionHeader eyebrow={t('sections.surfaces.eyebrow')} title={t('sections.surfaces.title')} />
      <WidgetGrid>
        <WidgetCell span={8}>
          <HeroCard
            image={{ src: getCyclingHeroIllustrationPath('today'), alt: t('hero.alt') }}
            eyebrow={t('hero.eyebrow')}
            title="Threshold"
            caption={t('hero.caption')}
            description={t('hero.description')}
            stat={{ label: t('hero.sessionTime'), value: '90', unit: 'min' }}
            metrics={[{ id: 'tss', label: t('hero.loadTarget'), value: '84 TSS' }]}
            action={{ label: t('hero.openPlan'), onClick: () => undefined }}
            minHeight={360}
          />
        </WidgetCell>
        <WidgetCell span={4}>
          <Widget title={t('lastRide.title')} icon={<DirectionsBikeOutlinedIcon />}>
            <Typography variant="h5">{t('lastRide.name')}</Typography>
            <Stack direction="row" useFlexGap sx={{ mt: 1.5, gap: 2.5, flexWrap: 'wrap' }}>
              <Metric variant="stat" label={t('lastRide.distance')} value="57.5" unit="km" />
              <Metric variant="stat" label={t('lastRide.elevation')} value="186" unit="m" />
              <Metric variant="stat" label={t('lastRide.time')} value="2:06" unit="h" />
            </Stack>
            <Box sx={{ mt: 3 }}>
              <StatRow items={[
                { id: 'km', icon: <RouteOutlinedIcon />, value: '63.71', unit: 'km' },
                { id: 'min', icon: <TimerOutlinedIcon />, value: '298', unit: 'min' },
                { id: 'kcal', icon: <LocalFireDepartmentOutlinedIcon />, value: '9277', unit: 'kcal' },
              ]} />
            </Box>
          </Widget>
        </WidgetCell>
        <WidgetCell span={4}>
          <Widget title={t('activity.title')} icon={<LocalFireDepartmentOutlinedIcon />} action={<StatusPill label="87%" tone="primary" variant="solid" dot />}>
            <Metric variant="hero" label={t('activity.hero')} value="2.780" unit="kcal" />
            <Box sx={{ my: 2 }}><Sparkline values={[3, 4, 3, 6, 8, 5, 4, 6, 7, 5]} markerIndex={4} ariaLabel={t('activity.trend')} /></Box>
            <Stack direction="row" useFlexGap sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <LegendStat label={t('activity.road')} value="127" unit="kcal" color={tokens.chart.primary} />
              <LegendStat label={t('activity.trainer')} value="386" unit="kcal" color={tokens.chart.secondary} />
              <LegendStat label={t('activity.strength')} value="249" unit="kcal" color={tokens.chart.tertiary} />
            </Stack>
          </Widget>
        </WidgetCell>
        <WidgetCell span={4}>
          <Widget title={t('workout.title')} icon={<BoltIcon />} action={<Box sx={{ width: 110 }}><ProgressTrack value={24} size="xs" ariaLabel={t('workout.weekGoal')} valueLabel="2.32 h" /></Box>}>
            <Metric variant="hero" label={t('workout.hero')} value="142" unit="TSS" />
            <Box sx={{ mt: 2 }}>
              <DotMatrixChart columns={HOURLY} color={tokens.chart.secondary} activeId="h11" axis={['00:00', '12:00', '21:00']} ariaLabel={t('workout.hourlyLoad')} />
            </Box>
          </Widget>
        </WidgetCell>
        <WidgetCell span={4}>
          <Widget title={t('sleep.title')} icon={<BedtimeOutlinedIcon />} action={<StatusPill label={t('sleep.battery')} icon={<BoltIcon />} variant="outline" tone="success" />}>
            <Typography variant="h6">{t('sleep.heading')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('sleep.description')}</Typography>
            <Surface variant="muted" padding="sm" sx={{ mt: 2 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Metric variant="hero" size="lg" label={t('sleep.quality')} value="89%" />
                <Box sx={{ width: 120 }}><ProgressTrack value={70} ariaLabel={t('sleep.sleepLabel')} valueLabel="4.32 h" /></Box>
              </Stack>
            </Surface>
          </Widget>
        </WidgetCell>
      </WidgetGrid>

      <SectionHeader eyebrow={t('sections.progress.eyebrow')} title={t('sections.progress.title')} />
      <WidgetGrid>
        <WidgetCell span={6}>
          <Widget title={t('load.title')} icon={<BoltIcon />}>
            <Stack direction="row" spacing={3}>
              <Metric label="CTL" value="31.6" tone="primary" />
              <Metric label="ATL" value="40.0" tone="warning" />
              <Metric label={t('load.form')} value="-14.2" tone="warning" />
            </Stack>
            <Stack spacing={1} sx={{ mt: 2.5 }}>
              <DotMatrixRow label="CTL" valueLabel="31.6" filled={9} color={tokens.chart.secondary} />
              <DotMatrixRow label="ATL" valueLabel="40.0" filled={12} color={tokens.chart.primary} />
              <DotMatrixRow label={t('load.formCaps')} valueLabel="-14.2" filled={6} color={tokens.status.warning} />
            </Stack>
          </Widget>
        </WidgetCell>
        <WidgetCell span={6}>
          <Widget title={t('step.title')} icon={<TimerOutlinedIcon />} action={<StatusPill label="ERG" tone="primary" dot />}>
            <ProgressTrack value={62} label={t('step.label')} valueLabel="14:49 / 15:11" ariaLabel={t('step.progress')} size="md" />
            <Box sx={{ mt: 3 }}>
              <ProgressTrack mode="marker" value={27} size="md" ariaLabel={t('step.form')} scale={[t('step.fatigue'), t('step.freshness')]} tone="warning" />
            </Box>
            <Box sx={{ mt: 3 }}>
              <ProgressTrack
                value={40}
                ariaLabel={t('step.profile')}
                segments={[
                  { weight: 15, color: ZONES.Z2, label: 'Z2' }, { weight: 16, color: ZONES.Z4, label: 'Z4' },
                  { weight: 5, color: ZONES.Z1, label: 'Z1' }, { weight: 16, color: ZONES.Z4, label: 'Z4' },
                  { weight: 12, color: ZONES.Z1, label: 'Z1' },
                ]}
              />
            </Box>
          </Widget>
        </WidgetCell>
      </WidgetGrid>

      <SectionHeader eyebrow={t('sections.status.eyebrow')} title={t('sections.status.title')} />
      <Surface>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {(['neutral', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] as const).map((tone) => (
            <StatusPill key={tone} label={tone} tone={tone} dot />
          ))}
          <StatusPill label="solid" tone="primary" variant="solid" />
          <StatusPill label="outline" tone="success" variant="outline" />
          <Button variant="contained">{t('actions.primary')}</Button>
          <Button variant="outlined">{t('actions.secondary')}</Button>
          <Button>{t('actions.text')}</Button>
          <RoundAction aria-label={t('actions.start')} variant="accent" />
          <RoundAction aria-label={t('actions.more')} variant="bubble" size="md" />
        </Stack>
      </Surface>
      <WidgetGrid sx={{ mt: 3 }}>
        <WidgetCell span={6}><Surface><EmptyState title={t('empty.title')} description={t('empty.description')} /></Surface></WidgetCell>
        <WidgetCell span={6}><SkeletonCard height={200} /></WidgetCell>
      </WidgetGrid>
    </Box>
  );
}

/** Living catalogue of `@/ui`, rendered in both colour modes for review and visual regression. */
export default function DesignSystemPage() {
  const light = useMemo(() => createAppTheme('light'), []);
  const dark = useMemo(() => createAppTheme('dark'), []);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
      <ThemeProvider theme={light}><CssBaseline /><Catalog mode="light" /></ThemeProvider>
      <ThemeProvider theme={dark}><Catalog mode="dark" /></ThemeProvider>
    </Box>
  );
}
