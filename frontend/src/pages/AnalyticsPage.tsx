import BarChartIcon from '@mui/icons-material/BarChart';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SpeedIcon from '@mui/icons-material/Speed';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import DateRangePicker from '@/components/common/DateRangePicker';
import EditorialHero from '@/components/common/EditorialHero';
import PageContainer from '@/components/common/PageContainer';
import PullToRefreshPanel from '@/components/common/PullToRefreshPanel';
import Section from '@/components/common/Section';
import SwipeableContent from '@/components/common/SwipeableContent';
import TabsNav from '@/components/common/TabsNav';
import DailyOptimalLoadChart from '@/components/DailyOptimalLoadChart';
import EfficiencyTrend from '@/components/EfficiencyTrend';
import FtpTrendChart from '@/components/FtpTrendChart';
import OptimalLoadChart from '@/components/OptimalLoadChart';
import PerformancePredictionPanel from '@/components/PerformancePredictionPanel';
import PMChart from '@/components/PMChart';
import PowerCurveChart, { type PowerCurveComparisonSeries } from '@/components/PowerCurveChart';
import SeasonComparison from '@/components/SeasonComparison';
import TrainingLoadFocus from '@/components/TrainingLoadFocus';
import WeeklyStressBudget from '@/components/WeeklyStressBudget';
import ZoneDistributionChart from '@/components/ZoneDistributionChart';
import {
  useDailyOptimalLoad,
  useFatigueState,
  useLoadFocus,
  usePmc,
  usePowerCurve,
  useTrends,
  useWeeklyOptimalLoad,
  useWeeklySummaries,
  useZoneDistribution,
} from '@/hooks/useAnalytics';
import { CHART_COLORS, STATUS_COLORS } from '@/utils/colors';
import { getPageHeroIllustrationPath } from '@/utils/illustrationAssets';

function defaultRange(): { from: string; to: string } {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

type CurveComparisonMode = 'none' | 'year-ago' | 'prev-12-weeks' | 'prev-4-weeks' | 'custom';

function parseDate(value: string): Date {
  const [year = 1970, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function addYears(value: string, years: number): string {
  const date = parseDate(value);
  date.setFullYear(date.getFullYear() + years);
  return formatDate(date);
}

function buildCurveComparisonRange(
  mode: CurveComparisonMode,
  range: { from: string; to: string },
  customRange: { from: string; to: string },
) {
  switch (mode) {
    case 'year-ago':
      return { from: addYears(range.from, -1), to: addYears(range.to, -1) };
    case 'prev-12-weeks': {
      const to = addDays(range.from, -1);
      return { from: addDays(to, -83), to };
    }
    case 'prev-4-weeks': {
      const to = addDays(range.from, -1);
      return { from: addDays(to, -27), to };
    }
    case 'custom':
      return customRange;
    default:
      return null;
  }
}

function getCurveComparisonLabel(mode: CurveComparisonMode, range: { from: string; to: string } | null) {
  if (!range) {
    return '';
  }

  switch (mode) {
    case 'year-ago':
      return 'Ten sam zakres rok temu';
    case 'prev-12-weeks':
      return 'Poprzednie 12 tygodni';
    case 'prev-4-weeks':
      return 'Poprzednie 4 tygodnie';
    case 'custom':
      return `Custom: ${range.from} – ${range.to}`;
    default:
      return '';
  }
}

export default function AnalyticsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);
  const [range, setRange] = useState(defaultRange());
  const [curveComparisonMode, setCurveComparisonMode] = useState<CurveComparisonMode>('none');
  const [customCurveRange, setCustomCurveRange] = useState(() => {
    const current = defaultRange();
    return { from: addYears(current.from, -1), to: addYears(current.to, -1) };
  });

  const comparisonRange = useMemo(
    () => buildCurveComparisonRange(curveComparisonMode, range, customCurveRange),
    [curveComparisonMode, customCurveRange, range],
  );
  const comparisonLabel = useMemo(
    () => getCurveComparisonLabel(curveComparisonMode, comparisonRange),
    [comparisonRange, curveComparisonMode],
  );

  const { data: pmcData } = usePmc(range);
  const { data: powerCurve } = usePowerCurve(range);
  const { data: comparisonPowerCurve } = usePowerCurve(comparisonRange ?? range, {
    enabled: !!comparisonRange,
  });
  const { data: zoneData } = useZoneDistribution('power', range);

  const weeks = useMemo(() => {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.max(4, Math.ceil((Date.now() - parseDate(range.from).getTime()) / msPerWeek));
  }, [range.from]);

  const pastDays = useMemo(() => {
    return Math.max(14, Math.ceil((Date.now() - parseDate(range.from).getTime()) / 86400000));
  }, [range.from]);

  const { data: weeklyOptimalLoad } = useWeeklyOptimalLoad(weeks);
  const { data: dailyOptimalLoad } = useDailyOptimalLoad(pastDays, 21);
  const { data: ftpTrend } = useTrends('ftp', range);
  const { data: efTrend } = useTrends('efficiency_factor', range);
  const { data: fatigueState } = useFatigueState();
  const { data: loadFocus, isLoading: loadFocusLoading } = useLoadFocus(4);
  const { data: weeklySummaries } = useWeeklySummaries(12);

  const powerCurveComparisonSeries = useMemo<PowerCurveComparisonSeries[]>(
    () =>
      comparisonRange
        ? [
            {
              key: 'comparison',
              label: comparisonLabel,
              data: comparisonPowerCurve,
              color: CHART_COLORS.secondary,
              dashed: true,
            },
          ]
        : [],
    [comparisonLabel, comparisonPowerCurve, comparisonRange],
  );

  const tabs = [
    { label: 'PMC', value: 0, icon: <TimelineIcon fontSize="small" /> },
    { label: 'Krzywa mocy', value: 1, icon: <ShowChartIcon fontSize="small" /> },
    { label: 'Obciążenie', value: 2, icon: <BarChartIcon fontSize="small" /> },
    { label: 'Trendy', value: 3, icon: <TuneIcon fontSize="small" /> },
    { label: 'Zmęczenie', value: 4, icon: <BatteryAlertIcon fontSize="small" /> },
    { label: 'Prognoza', value: 5, icon: <TrendingUpIcon fontSize="small" /> },
    { label: 'Forma', value: 6, icon: <SpeedIcon fontSize="small" /> },
  ];

  const filtersContent = (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }}>
      <Box sx={{ minWidth: { xs: '100%', md: 'auto' } }}>
        <DateRangePicker
          startDate={range.from}
          endDate={range.to}
          onChange={(from, to) => setRange({ from, to })}
        />
      </Box>
      {tab === 1 && (
        <>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 240 } }}>
            <InputLabel id="power-curve-compare-label">Porównanie</InputLabel>
            <Select
              labelId="power-curve-compare-label"
              value={curveComparisonMode}
              label="Porównanie"
              onChange={(event) => setCurveComparisonMode(event.target.value as CurveComparisonMode)}
            >
              <MenuItem value="none">Bez porównania</MenuItem>
              <MenuItem value="year-ago">Ten sam zakres rok temu</MenuItem>
              <MenuItem value="prev-12-weeks">Poprzednie 12 tygodni</MenuItem>
              <MenuItem value="prev-4-weeks">Poprzednie 4 tygodnie</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          {curveComparisonMode === 'custom' && (
            <DateRangePicker
              startDate={customCurveRange.from}
              endDate={customCurveRange.to}
              onChange={(from, to) => setCustomCurveRange({ from, to })}
            />
          )}
        </>
      )}
      {comparisonRange && tab === 1 ? (
        <Typography variant="body2" color="text.secondary">
          Porównanie: {comparisonLabel}
        </Typography>
      ) : null}
    </Stack>
  );

  const handleRefresh = async () => {
    await queryClient.refetchQueries();
  };

  const goNextTab = () => setTab((current) => Math.min(current + 1, tabs.length - 1));
  const goPrevTab = () => setTab((current) => Math.max(current - 1, 0));

  return (
    <PageContainer
      title="Analityka"
      subtitle="Wykresy zostały zebrane w czterech obszarach: PMC, krzywa mocy, obciążenie i trendy."
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Analityka' },
      ]}
    >
      <PullToRefreshPanel onRefresh={handleRefresh}>
        <EditorialHero
          eyebrow="Analityka"
          title="Wykresy, obciążenie i trendy w jednym bardziej spójnym rytmie."
          description="Sekcja dostała ten sam ciemniejszy, mniej generyczny kierunek co Home, żeby dane wyglądały jak narzędzie treningowe, a nie kolejny dashboard z szablonu."
          accentColor={CHART_COLORS.primary}
          imageSrc={getPageHeroIllustrationPath('analytics')}
          imageAlt="Analityka hero"
          imagePosition="center 52%"
          highlights={['PMC i krzywa mocy', 'Obciążenie dnia i tygodnia', 'Trend FTP / EF']}
        />
        {isMobile ? (
          <Accordion
            expanded={filtersExpanded}
            onChange={(_, expanded) => setFiltersExpanded(expanded)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DateRangeIcon fontSize="small" />
                <Typography sx={{ fontWeight: 700 }}>Filtry i zakres</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>{filtersContent}</AccordionDetails>
          </Accordion>
        ) : (
          <Section
            title="Filtry i zakres"
            subtitle="Jeden panel steruje datami i porównaniem krzywej mocy."
            accentColor={CHART_COLORS.primary}
          >
            {filtersContent}
          </Section>
        )}

        <TabsNav tabs={tabs} value={tab} onChange={setTab} />

        <SwipeableContent onSwipeLeft={goNextTab} onSwipeRight={goPrevTab}>
          {tab === 0 && (
            <Section title="PMC" subtitle="CTL / ATL / TSB" accentColor={CHART_COLORS.primary}>
              <PMChart data={pmcData ?? []} />
            </Section>
          )}

          {tab === 1 && (
            <Section title="Krzywa mocy" subtitle="Najlepszy wysiłek wg czasu" accentColor={CHART_COLORS.secondary}>
              <PowerCurveChart data={powerCurve} comparisonSeries={powerCurveComparisonSeries} />
            </Section>
          )}

          {tab === 2 && (
            <Stack spacing={2.5}>
              <Section
                title="Obciążenie dzienne"
                subtitle="TSS, projekcja i krótkoterminowe odchylenia."
                accentColor={CHART_COLORS.tertiary}
              >
                <DailyOptimalLoadChart data={dailyOptimalLoad ?? []} />
              </Section>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={7}>
                  <Section
                    title="Obciążenie tygodniowe"
                    subtitle="Tygodniowe TSS względem bezpiecznego zakresu."
                    accentColor={CHART_COLORS.primary}
                  >
                    <OptimalLoadChart data={weeklyOptimalLoad ?? []} />
                  </Section>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Section
                    title="Strefy mocy"
                    subtitle="Czas spędzony w strefach dla wybranego okresu."
                    accentColor={CHART_COLORS.secondary}
                  >
                    <ZoneDistributionChart data={zoneData} />
                  </Section>
                </Grid>
              </Grid>
            </Stack>
          )}

          {tab === 3 && (
            <Stack spacing={2.5}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <Section title="Trend FTP" subtitle="Szacowane FTP w czasie" accentColor={CHART_COLORS.primary}>
                    <FtpTrendChart data={ftpTrend ?? []} />
                  </Section>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Section title="Efektywność (EF)" subtitle="Wydajność tlenowa w czasie" accentColor={CHART_COLORS.secondary}>
                    <EfficiencyTrend data={efTrend ?? []} />
                  </Section>
                </Grid>
              </Grid>
              <Section title="Porównanie sezonów" subtitle="Zestawienie dwóch okresów" accentColor={CHART_COLORS.tertiary}>
                <SeasonComparison />
              </Section>
            </Stack>
          )}

          {tab === 4 && (
            <Stack spacing={2.5}>
              <Section title="Stan zmęczenia" subtitle="Aktualny poziom zmęczenia w rozbiciu na składowe" accentColor={STATUS_COLORS.warning}>
                {fatigueState ? (
                  <Box sx={{ p: 1 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Box>
                          <Typography variant="h3" sx={{ fontWeight: 900, color: STATUS_COLORS.warning }}>
                            {fatigueState.score}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">{fatigueState.level}</Typography>
                        </Box>
                        <Stack spacing={0.75} sx={{ flex: 1 }}>
                          {[
                            { label: 'ATL', value: fatigueState.atlFatigue, color: STATUS_COLORS.warning },
                            { label: 'Metaboliczne', value: fatigueState.metabolicFatigue, color: STATUS_COLORS.info },
                            { label: 'Obciążenie (TSB)', value: fatigueState.loadFatigue, color: STATUS_COLORS.error },
                            { label: 'Dług regeneracyjny', value: fatigueState.recoveryDebt, color: STATUS_COLORS.accent },
                          ].map((c) => (
                            <Stack key={c.label} direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption" sx={{ minWidth: 120, fontSize: '0.65rem' }}>{c.label}</Typography>
                              <Box sx={{ flex: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(c.value / 25) * 100}
                                  sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { bgcolor: c.color, borderRadius: 3 } }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 20, textAlign: 'right' }}>{c.value}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption" color="text.secondary">Monotonia: {fatigueState.monotony.toFixed(1)}</Typography>
                        <Typography variant="caption" color="text.secondary">Strain: {Math.round(fatigueState.strain)}</Typography>
                        <Typography variant="caption" color="text.secondary">Energia: {fatigueState.energyBudget}</Typography>
                        <Typography variant="caption" color="text.secondary">Max TSS: {fatigueState.maxTssToday}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                ) : null}
              </Section>
              <TrainingLoadFocus data={loadFocus} isLoading={loadFocusLoading} />
            </Stack>
          )}
          {tab === 5 && (
            <Stack spacing={2.5}>
              <WeeklyStressBudget
                weeks={weeklySummaries ?? []}
                avgTss={weeklySummaries && weeklySummaries.length > 0 ? (weeklySummaries.slice(0, Math.min(4, weeklySummaries.length)).reduce((s, w) => s + w.totalTss, 0) / Math.min(4, weeklySummaries.length)) : 0}
              />
            </Stack>
          )}

          {tab === 6 && <PerformancePredictionPanel />}
        </SwipeableContent>
      </PullToRefreshPanel>
    </PageContainer>
  );
}
