import BoltIcon from '@mui/icons-material/Bolt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';

import EditorialHero from '@/components/common/EditorialHero';
import PageContainer from '@/components/common/PageContainer';
import PullToRefreshPanel from '@/components/common/PullToRefreshPanel';
import Section from '@/components/common/Section';
import { useTrainingPriorities } from '@/hooks/useTrainingPriorities';
import type {
  CpModelData,
  DurabilityProfileData,
  FatigueFactorsData,
  IntervalDetectionData,
  PowerPhenotypeData,
  TrainingPriorityItem,
} from '@/types/trainingPriorities';
import { CHART_COLORS, STATUS_COLORS } from '@/utils/colors';
import { getPageHeroIllustrationPath } from '@/utils/illustrationAssets';
import { useQueryClient } from '@tanstack/react-query';

function getSubsystemIcon(subsystem: string) {
  switch (subsystem) {
    case 'cp_wprime': return <BoltIcon fontSize="small" />;
    case 'intervals': return <TimerIcon fontSize="small" />;
    case 'fatigue': return <WhatshotIcon fontSize="small" />;
    case 'durability': return <TrendingUpIcon fontSize="small" />;
    case 'phenotype': return <EmojiEventsIcon fontSize="small" />;
    default: return <ShowChartIcon fontSize="small" />;
  }
}

function getSubsystemColor(subsystem: string) {
  switch (subsystem) {
    case 'cp_wprime': return CHART_COLORS.primary;
    case 'intervals': return STATUS_COLORS.secondary;
    case 'fatigue': return STATUS_COLORS.warning;
    case 'durability': return CHART_COLORS.tertiary;
    case 'phenotype': return STATUS_COLORS.success;
    default: return CHART_COLORS.secondary;
  }
}

function getSubsystemLabel(subsystem: string) {
  switch (subsystem) {
    case 'cp_wprime': return 'CP/W\'';
    case 'intervals': return 'Interwały';
    case 'fatigue': return 'Zmęczenie';
    case 'durability': return 'Odporność';
    case 'phenotype': return 'Profil';
    default: return subsystem;
  }
}

function getImpactColor(score: number) {
  if (score >= 80) return STATUS_COLORS.success;
  if (score >= 60) return STATUS_COLORS.secondary;
  if (score >= 40) return STATUS_COLORS.warning;
  return STATUS_COLORS.error;
}

function PriorityCard({ item }: { item: TrainingPriorityItem }) {
  const impactColor = getImpactColor(item.impactScore);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: impactColor,
          boxShadow: `0 0 0 1px ${impactColor}22`,
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: `${impactColor}22`,
            color: impactColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.95rem',
            flexShrink: 0,
          }}
        >
          {item.rank}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {item.title}
            </Typography>
            <Chip
              icon={getSubsystemIcon(item.subsystem)}
              label={getSubsystemLabel(item.subsystem)}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                bgcolor: `${getSubsystemColor(item.subsystem)}22`,
                color: getSubsystemColor(item.subsystem),
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
              }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem', lineHeight: 1.5 }}>
            {item.rationale}
          </Typography>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: `${impactColor}0A`,
              border: `1px solid ${impactColor}22`,
              mb: 1.5,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: impactColor }}>
              {item.action}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Szacowany wpływ
              </Typography>
              <LinearProgress
                variant="determinate"
                value={item.impactScore}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  mt: 0.25,
                  bgcolor: `${impactColor}22`,
                  '& .MuiLinearProgress-bar': { bgcolor: impactColor, borderRadius: 3 },
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: impactColor, fontSize: '0.75rem' }}>
              {item.impactScore}%
            </Typography>
            {item.weeklyHours > 0 && (
              <Chip
                label={`${item.weeklyHours}h/tydz.`}
                size="small"
                sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function CpModelSection({ data }: { data: CpModelData }) {
  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${CHART_COLORS.primary}0F` }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: CHART_COLORS.primary }}>
            {Math.round(data.cp)}W
          </Typography>
          <Typography variant="caption" color="text.secondary">Critical Power</Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${CHART_COLORS.secondary}0F` }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: CHART_COLORS.secondary }}>
            {Math.round(data.wPrime / 1000)}kJ
          </Typography>
          <Typography variant="caption" color="text.secondary">W'</Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${STATUS_COLORS.success}0F` }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: STATUS_COLORS.success }}>
            {Math.round(data.cpPerKg * 10) / 10}
          </Typography>
          <Typography variant="caption" color="text.secondary">W/kg</Typography>
        </Box>
      </Stack>

      <Box sx={{ px: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
          Dopasowanie: R² = {Math.round(data.rSquared * 100) / 100} ({data.dataPoints} punktów danych, pewność {data.cpConfidence}%).
          FTP ({Math.round(data.currentFtp)}W) to {Math.round(data.ftpVsCpPct)}% CP — {
            data.ftpVsCpPct < 90 ? 'FTP może być zaniżone, CP sugeruje wyższy potencjał.'
            : data.ftpVsCpPct > 110 ? 'FTP jest blisko CP, ogranicza pojemność anaerobowa.'
            : 'FTP i CP są spójne.'
          }
        </Typography>
      </Box>
    </Box>
  );
}

function IntervalSection({ data }: { data: IntervalDetectionData }) {
  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${STATUS_COLORS.secondary}0F` }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: STATUS_COLORS.secondary }}>
            {data.totalIntervalSessions}
          </Typography>
          <Typography variant="caption" color="text.secondary">Sesji</Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${CHART_COLORS.primary}0F` }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: CHART_COLORS.primary }}>
            {Math.round(data.avgQualityScore)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">Jakość śr.</Typography>
        </Box>
      </Stack>

      {Object.keys(data.sessionsByType).length > 0 && (
        <Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
          {Object.entries(data.sessionsByType).map(([type, count]) => (
            <Chip
              key={type}
              label={`${type}: ${count}`}
              size="small"
              sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
            />
          ))}
        </Stack>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
        {data.recommendation}
      </Typography>
    </Box>
  );
}

function FatigueSection({ data }: { data: FatigueFactorsData }) {
  const factors = [
    { label: 'Obciążenie (ATL)', value: data.atlFatigue, color: STATUS_COLORS.warning },
    { label: 'Mięśniowe', value: data.muscularFatigue, color: STATUS_COLORS.error },
    { label: 'Metaboliczne', value: data.metabolicFatigue, color: STATUS_COLORS.accent },
    { label: 'ANS', value: data.ansFatigue, color: CHART_COLORS.tertiary },
  ];

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: STATUS_COLORS.warning }}>
        {data.statusLabel} — {data.compositeScore}/100
      </Typography>

      {factors.map((f) => (
        <Box key={f.label} sx={{ mb: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{f.label}</Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: f.color }}>
              {Math.round(f.value)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, f.value)}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: `${f.color}22`,
              '& .MuiLinearProgress-bar': { bgcolor: f.color, borderRadius: 2 },
            }}
          />
        </Box>
      ))}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontSize: '0.8rem', lineHeight: 1.6 }}>
        {data.description}
      </Typography>
    </Box>
  );
}

function DurabilitySection({ data }: { data: DurabilityProfileData }) {
  const resistances = [
    { label: 'Krótka (20-45\')', value: data.shortDurationResistance },
    { label: 'Średnia (45-90\')', value: data.mediumDurationResistance },
    { label: 'Długa (90+\')', value: data.longDurationResistance },
  ];

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${CHART_COLORS.tertiary}0F` }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: CHART_COLORS.tertiary }}>
            {data.overallScore}
          </Typography>
          <Typography variant="caption" color="text.secondary">{data.label}</Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${STATUS_COLORS.success}0F` }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: STATUS_COLORS.success }}>
            {Math.round(data.fatigueResistanceIndex * 100)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">FRI</Typography>
        </Box>
      </Stack>

      {resistances.map((r) => (
        <Box key={r.label} sx={{ mb: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{r.label}</Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
              {r.value}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={r.value}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: `${CHART_COLORS.tertiary}22`,
              '& .MuiLinearProgress-bar': { bgcolor: CHART_COLORS.tertiary, borderRadius: 2 },
            }}
          />
        </Box>
      ))}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontSize: '0.8rem', lineHeight: 1.6 }}>
        {data.recommendation}
      </Typography>
    </Box>
  );
}

function PhenotypeSection({ data }: { data: PowerPhenotypeData }) {
  const durationOrder = ['5s', '30s', '1min', '5min', '20min', '30min', '60min', '120min'];

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${STATUS_COLORS.success}0F` }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: STATUS_COLORS.success }}>
            {data.primaryType}
          </Typography>
          <Typography variant="caption" color="text.secondary">Fenotyp</Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: `${STATUS_COLORS.error}0F` }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: STATUS_COLORS.error }}>
            {data.worstDuration}
          </Typography>
          <Typography variant="caption" color="text.secondary">Do poprawy</Typography>
        </Box>
      </Stack>

      <Box sx={{ mb: 1.5 }}>
        {durationOrder.filter(d => data.referenceScores[d] !== undefined).map((dur) => {
          const pct = data.referenceScores[dur] ?? 0;
          const wkg = data.powerProfileWkg[dur] ?? 0;
          const isBest = dur === data.bestDuration;
          const isWorst = dur === data.worstDuration;
          return (
            <Stack key={dur} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{ width: 50, fontWeight: 600, fontSize: '0.7rem' }}>
                {dur}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  flex: 1,
                  height: 5,
                  borderRadius: 2,
                  bgcolor: isWorst ? `${STATUS_COLORS.error}22` : isBest ? `${STATUS_COLORS.success}22` : `${CHART_COLORS.grid}22`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: isWorst ? STATUS_COLORS.error : isBest ? STATUS_COLORS.success : CHART_COLORS.grid,
                    borderRadius: 2,
                  },
                }}
              />
              <Typography variant="caption" sx={{ width: 55, fontSize: '0.65rem', fontWeight: 600, textAlign: 'right' }}>
                {Math.round(wkg * 10) / 10} W/kg
              </Typography>
            </Stack>
          );
        })}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
        {data.description}
      </Typography>
    </Box>
  );
}

export default function PrioritiesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useTrainingPriorities();

  if (isLoading || !data) {
    return (
      <PageContainer>
        <EditorialHero
          eyebrow="Priorytety treningowe"
          title="Co bym zrobił najpierw"
          description="Analiza top 5 priorytetów treningowych z najwyższym zwrotem z inwestycji."
          accentColor={STATUS_COLORS.warning}
          imageSrc={getPageHeroIllustrationPath('priorities')}
          imageAlt="Priorytety treningowe"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PullToRefreshPanel
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ['trainingPriorities'] });
        }}
      >
        <EditorialHero
          eyebrow="Priorytety treningowe"
          title="Co bym zrobił najpierw"
          description="Top 5 priorytetów treningowych z najwyższym zwrotem z inwestycji (ROI)."
          accentColor={STATUS_COLORS.warning}
          imageSrc={getPageHeroIllustrationPath('priorities')}
          imageAlt="Priorytety treningowe"
          highlights={[
            'CP/W\' model',
            'Detekcja interwałów',
            'Zmęczenie wieloczynnikowe',
            'Odporność na zmęczenie',
            'Profil mocy',
          ]}
        />

        <Section
          title="Top 5 — co robić teraz"
          subtitle="Ranking działań posortowanych według szacowanego wpływu na wydajność."
          accentColor={STATUS_COLORS.success}
        >
          <Stack spacing={1.5}>
            {data.priorities.map((item) => (
              <PriorityCard key={item.rank} item={item} />
            ))}
          </Stack>
        </Section>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Szczegółowa analiza
          </Typography>

          {data.cpModel && (
            <Accordion
              sx={{
                mb: 1,
                borderRadius: 2,
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BoltIcon sx={{ color: CHART_COLORS.primary, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    CP/W' model
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    CP {Math.round(data.cpModel.cp)}W · W' {Math.round(data.cpModel.wPrime / 1000)}kJ
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <CpModelSection data={data.cpModel} />
              </AccordionDetails>
            </Accordion>
          )}

          {data.intervalDetection && (
            <Accordion
              sx={{
                mb: 1,
                borderRadius: 2,
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TimerIcon sx={{ color: STATUS_COLORS.secondary, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Detekcja interwałów
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.intervalDetection.totalIntervalSessions} sesji
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <IntervalSection data={data.intervalDetection} />
              </AccordionDetails>
            </Accordion>
          )}

          {data.fatigueFactors && (
            <Accordion
              sx={{
                mb: 1,
                borderRadius: 2,
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WhatshotIcon sx={{ color: STATUS_COLORS.warning, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Zmęczenie wieloczynnikowe
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.fatigueFactors.compositeScore}/100
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <FatigueSection data={data.fatigueFactors} />
              </AccordionDetails>
            </Accordion>
          )}

          {data.durabilityProfile && (
            <Accordion
              sx={{
                mb: 1,
                borderRadius: 2,
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpIcon sx={{ color: CHART_COLORS.tertiary, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Odporność na zmęczenie (Durability)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.durabilityProfile.overallScore}/100
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <DurabilitySection data={data.durabilityProfile} />
              </AccordionDetails>
            </Accordion>
          )}

          {data.powerPhenotype && (
            <Accordion
              sx={{
                mb: 1,
                borderRadius: 2,
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmojiEventsIcon sx={{ color: STATUS_COLORS.success, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Profil mocy (Power Phenotype)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.powerPhenotype.primaryType}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <PhenotypeSection data={data.powerPhenotype} />
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      </PullToRefreshPanel>
    </PageContainer>
  );
}
