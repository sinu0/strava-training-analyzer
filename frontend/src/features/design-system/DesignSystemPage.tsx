import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import BoltIcon from '@mui/icons-material/Bolt';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Box, Button, CssBaseline, Stack, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useMemo } from 'react';

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
  return (
    <Box data-testid={`catalog-${mode}`} sx={{ bgcolor: 'background.default', color: 'text.primary', p: { xs: 2, md: 4 }, minWidth: 0 }}>
      <PageHeader
        eyebrow={`Motyw ${mode === 'light' ? 'jasny' : 'ciemny'}`}
        title="System komponentów"
        description="Każdy ekran składa się z tych części. Wartości pochodzą z tokenów motywu."
        meta={<><StatusPill label="Dane aktualne" tone="success" variant="outline" /><StatusPill label="LOCAL" tone="success" size="sm" /></>}
      />

      <SectionHeader eyebrow="Powierzchnie" title="Hero i widgety" />
      <WidgetGrid>
        <WidgetCell span={8}>
          <HeroCard
            image={{ src: getCyclingHeroIllustrationPath('today'), alt: 'Kolarz na szosie' }}
            eyebrow="Rekomendacja dnia"
            title="Threshold"
            caption="Dzisiaj · środa, 24 września"
            description="15 min rozgrzewki, 3×16 min Z4 z 5 min przerwy, 12 min schłodzenia."
            stat={{ label: 'Czas sesji', value: '90', unit: 'min' }}
            metrics={[{ id: 'tss', label: 'Cel obciążenia', value: '84 TSS' }]}
            action={{ label: 'Otwórz plan', onClick: () => undefined }}
            minHeight={360}
          />
        </WidgetCell>
        <WidgetCell span={4}>
          <Widget title="Ostatni trening" icon={<DirectionsBikeOutlinedIcon />}>
            <Typography variant="h5">Morning Ride</Typography>
            <Stack direction="row" useFlexGap sx={{ mt: 1.5, gap: 2.5, flexWrap: 'wrap' }}>
              <Metric variant="stat" label="Dystans" value="57.5" unit="km" />
              <Metric variant="stat" label="Przewyższenie" value="186" unit="m" />
              <Metric variant="stat" label="Czas" value="2:06" unit="h" />
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
          <Widget title="Aktywność" icon={<LocalFireDepartmentOutlinedIcon />} action={<StatusPill label="87%" tone="primary" variant="solid" dot />}>
            <Metric variant="hero" label="Poprawiasz ogólną formę" value="2.780" unit="kcal" />
            <Box sx={{ my: 2 }}><Sparkline values={[3, 4, 3, 6, 8, 5, 4, 6, 7, 5]} markerIndex={4} ariaLabel="Trend aktywności" /></Box>
            <Stack direction="row" useFlexGap sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <LegendStat label="Szosa" value="127" unit="kcal" color={tokens.chart.primary} />
              <LegendStat label="Trenażer" value="386" unit="kcal" color={tokens.chart.secondary} />
              <LegendStat label="Siła" value="249" unit="kcal" color={tokens.chart.tertiary} />
            </Stack>
          </Widget>
        </WidgetCell>
        <WidgetCell span={4}>
          <Widget title="Trening" icon={<BoltIcon />} action={<Box sx={{ width: 110 }}><ProgressTrack value={24} size="xs" ariaLabel="Cel tygodnia" valueLabel="2.32 h" /></Box>}>
            <Metric variant="hero" label="Utrzymaj regularność w tym tygodniu" value="142" unit="TSS" />
            <Box sx={{ mt: 2 }}>
              <DotMatrixChart columns={HOURLY} color={tokens.chart.secondary} activeId="h11" axis={['00:00', '12:00', '21:00']} ariaLabel="Obciążenie godzinowe" />
            </Box>
          </Widget>
        </WidgetCell>
        <WidgetCell span={4}>
          <Widget title="Sen" icon={<BedtimeOutlinedIcon />} action={<StatusPill label="Bateria 75" icon={<BoltIcon />} variant="outline" tone="success" />}>
            <Typography variant="h6">Regeneracja</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Lepszy sen poprawia gotowość do jakości.</Typography>
            <Surface variant="muted" padding="sm" sx={{ mt: 2 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Metric variant="hero" size="lg" label="Jakość snu" value="89%" />
                <Box sx={{ width: 120 }}><ProgressTrack value={70} ariaLabel="Sen" valueLabel="4.32 h" /></Box>
              </Stack>
            </Surface>
          </Widget>
        </WidgetCell>
      </WidgetGrid>

      <SectionHeader eyebrow="Postęp i skale" title="Paski, markery, macierze" />
      <WidgetGrid>
        <WidgetCell span={6}>
          <Widget title="Obciążenie 7/42 dni" icon={<BoltIcon />}>
            <Stack direction="row" spacing={3}>
              <Metric label="CTL" value="31.6" tone="primary" />
              <Metric label="ATL" value="40.0" tone="warning" />
              <Metric label="Forma" value="-14.2" tone="warning" />
            </Stack>
            <Stack spacing={1} sx={{ mt: 2.5 }}>
              <DotMatrixRow label="CTL" valueLabel="31.6" filled={9} color={tokens.chart.secondary} />
              <DotMatrixRow label="ATL" valueLabel="40.0" filled={12} color={tokens.chart.primary} />
              <DotMatrixRow label="FORMA" valueLabel="-14.2" filled={6} color={tokens.status.warning} />
            </Stack>
          </Widget>
        </WidgetCell>
        <WidgetCell span={6}>
          <Widget title="Krok treningu" icon={<TimerOutlinedIcon />} action={<StatusPill label="ERG" tone="primary" dot />}>
            <ProgressTrack value={62} label="30 min @ 105–140 W · Rozgrzewka" valueLabel="14:49 / 15:11" ariaLabel="Postęp kroku" size="md" />
            <Box sx={{ mt: 3 }}>
              <ProgressTrack mode="marker" value={27} size="md" ariaLabel="Forma -14" scale={['Zmęczenie −30', 'Świeżość +30']} tone="warning" />
            </Box>
            <Box sx={{ mt: 3 }}>
              <ProgressTrack
                value={40}
                ariaLabel="Profil treningu"
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

      <SectionHeader eyebrow="Status i akcje" title="Pigułki, przyciski, stany" />
      <Surface>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {(['neutral', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] as const).map((tone) => (
            <StatusPill key={tone} label={tone} tone={tone} dot />
          ))}
          <StatusPill label="solid" tone="primary" variant="solid" />
          <StatusPill label="outline" tone="success" variant="outline" />
          <Button variant="contained">Główna akcja</Button>
          <Button variant="outlined">Druga akcja</Button>
          <Button>Tekstowa</Button>
          <RoundAction aria-label="Start treningu" variant="accent" />
          <RoundAction aria-label="Więcej" variant="bubble" size="md" />
        </Stack>
      </Surface>
      <WidgetGrid sx={{ mt: 3 }}>
        <WidgetCell span={6}><Surface><EmptyState title="Brak aktywności" description="Zsynchronizuj Stravę, aby zobaczyć historię." /></Surface></WidgetCell>
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
