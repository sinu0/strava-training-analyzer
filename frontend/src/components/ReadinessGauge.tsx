import BalanceIcon from '@mui/icons-material/Balance';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Button, Chip, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import type { ReadinessData, SaveReadinessCheckInInput } from '@/types/analytics';
import {
  CHART_COLORS,
  COMMON_COLORS,
  PMC_COLORS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
} from '@/utils/colors';
import { getHomeWidgetIllustrationPath } from '@/utils/illustrationAssets';
import {
  getReadinessColor,
  getReadinessLabel,
  getReadinessLevelLabel,
} from '@/utils/readinessScales';

const CHECK_IN_OPTIONS = [1, 2, 3, 4, 5] as const;
const DEFAULT_CHECK_IN: SaveReadinessCheckInInput = {
  sleepQuality: 3,
  legFreshness: 3,
  motivation: 3,
  soreness: 3,
};

interface ReadinessGaugeProps {
  data: ReadinessData | undefined;
  isSavingCheckIn?: boolean;
  onSaveCheckIn?: (payload: SaveReadinessCheckInInput) => void;
}

interface CheckInScaleRowProps {
  label: string;
  hint: string;
  value: number;
  onChange: (nextValue: number) => void;
}

function getInitialCheckIn(data: ReadinessData | undefined): SaveReadinessCheckInInput {
  if (!data?.checkIn) {
    return DEFAULT_CHECK_IN;
  }

  return {
    sleepQuality: data.checkIn.sleepQuality,
    legFreshness: data.checkIn.legFreshness,
    motivation: data.checkIn.motivation,
    soreness: data.checkIn.soreness,
  };
}

function formatAdjustment(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatUpdatedAt(updatedAt?: string | null): string | null {
  if (!updatedAt) {
    return null;
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(updatedAt));
}

function CheckInScaleRow({ label, hint, value, onChange }: CheckInScaleRowProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {hint}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0.5}>
        {CHECK_IN_OPTIONS.map((option) => (
          <Button
            key={`${label}-${option}`}
            size="small"
            variant={value === option ? 'contained' : 'outlined'}
            color={value === option ? 'success' : 'inherit'}
            onClick={() => onChange(option)}
            sx={{ minWidth: 36, px: 0 }}
          >
            {option}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}

export default function ReadinessGauge({
  data,
  isSavingCheckIn = false,
  onSaveCheckIn,
}: ReadinessGaugeProps) {
  const [checkInDraft, setCheckInDraft] = useState<SaveReadinessCheckInInput>(getInitialCheckIn(data));

  useEffect(() => {
    setCheckInDraft(getInitialCheckIn(data));
  }, [data]);

  if (!data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Ładowanie gotowości...
        </Typography>
      </Box>
    );
  }

  const color = getReadinessColor(data.score);
  const tsbColor = data.tsb >= 0 ? PMC_COLORS.TSB : STATUS_COLORS.error;
  const updatedAtLabel = formatUpdatedAt(data.checkIn?.updatedAt);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 1.5,
          p: 1.25,
          borderRadius: 3,
          bgcolor: alphaColor('#0D1117', 0.26),
          border: `1px solid ${alphaColor(color, 0.16)}`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 132,
            height: 96,
            overflow: 'hidden',
            borderRadius: 2,
            flexShrink: 0,
            border: `1px solid ${alphaColor(color, 0.14)}`,
            bgcolor: SURFACE_COLORS.subtle,
          }}
        >
          <Box
            component="img"
            src={getHomeWidgetIllustrationPath('readiness')}
            alt={`Gotowość: ${data.level}`}
            sx={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
              objectPosition: 'center 52%',
              filter: `saturate(0.9) contrast(1.03) drop-shadow(0 2px 8px ${alphaColor(COMMON_COLORS.black, 0.24)})`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${alphaColor('#0D1117', 0.08)} 0%, ${alphaColor('#0D1117', 0.3)} 100%)`,
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1, color }}>
              {data.score}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              /100
            </Typography>
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color, lineHeight: 1.2 }}>
            {getReadinessLevelLabel(data.level)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary">
            Gotowość treningowa
          </Typography>
          <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
            {getReadinessLabel(data.score)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={data.score}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: CHART_COLORS.surface,
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
          }}
        />
      </Box>

      <Box
        sx={{
          mb: 1.5,
          p: 1,
          borderRadius: 1.5,
          bgcolor: alphaColor(color, 0.12),
          border: `1px solid ${alphaColor(color, 0.3)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
          <FitnessCenterIcon sx={{ fontSize: 16, color }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color }}>
            Zalecenie
          </Typography>
        </Box>
        {data.dayLabel ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Typ dnia
            </Typography>
            <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
              {data.dayLabel}
            </Typography>
          </Box>
        ) : null}
        {data.dayFocus ? (
          <Typography variant="body2" sx={{ color, fontWeight: 600, lineHeight: 1.4, mb: 0.5 }}>
            {data.dayFocus}
          </Typography>
        ) : null}
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          {data.description}
        </Typography>
      </Box>

      {data.healthSignals ? (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700 }}>
            Sygnały regeneracji
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {data.healthSignals.sleepScore != null ? (
              <Chip size="small" label={`Sen ${data.healthSignals.sleepScore}/100`} />
            ) : null}
            {data.healthSignals.bodyBattery != null ? (
              <Chip size="small" label={`Body Battery ${data.healthSignals.bodyBattery}`} />
            ) : null}
            {data.healthSignals.restingHrBpm != null ? (
              <Chip
                size="small"
                label={`RHR ${data.healthSignals.restingHrBpm}${
                  data.healthSignals.restingHrDelta != null
                    ? ` (${formatAdjustment(data.healthSignals.restingHrDelta)})`
                    : ''
                }`}
              />
            ) : null}
            <Chip
              size="small"
              color={data.healthSignals.scoreAdjustment >= 0 ? 'success' : 'warning'}
              label={`Wpływ ${formatAdjustment(data.healthSignals.scoreAdjustment)} pkt`}
            />
          </Stack>
        </Box>
      ) : null}

      {data.sessionVariants?.length ? (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700 }}>
            Warianty sesji
          </Typography>
          <Stack spacing={0.75}>
            {data.sessionVariants.map((variant) => (
              <Box
                key={`${variant.title}-${variant.durationMinutes}`}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: SURFACE_COLORS.subtle,
                  border: `1px solid ${alphaColor(CHART_COLORS.grid, 0.4)}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {variant.title}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color }}>
                    {variant.durationMinutes} min
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip size="small" label={variant.targetPower} sx={{ fontSize: '0.72rem' }} />
                  <Chip size="small" label={`TSS ~ ${variant.targetTss}`} sx={{ fontSize: '0.72rem' }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'text.secondary', lineHeight: 1.4 }}>
                  Paliwo: {variant.fuelingHint}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.35, color: 'text.secondary', lineHeight: 1.4 }}>
                  Regeneracja: {variant.recoveryHint}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}

      {onSaveCheckIn ? (
        <Box
          sx={{
            mb: 1.5,
            p: 1,
            borderRadius: 1.5,
            bgcolor: SURFACE_COLORS.subtle,
            border: `1px solid ${alphaColor(CHART_COLORS.grid, 0.4)}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'text.secondary' }}>
                Poranny check-in
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                4 szybkie oceny, żeby readiness uwzględniał realne samopoczucie.
              </Typography>
            </Box>
            {data.checkIn ? (
              <Chip
                size="small"
                color={data.checkIn.scoreAdjustment >= 0 ? 'success' : 'warning'}
                label={`Ostatni wpływ ${formatAdjustment(data.checkIn.scoreAdjustment)} pkt`}
              />
            ) : null}
          </Box>

          {updatedAtLabel ? (
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
              Ostatnia aktualizacja: {updatedAtLabel}
            </Typography>
          ) : null}

          <Stack spacing={1}>
            <CheckInScaleRow
              label="Sen"
              hint="1 słabo / 5 bardzo dobrze"
              value={checkInDraft.sleepQuality}
              onChange={(sleepQuality) => setCheckInDraft((current) => ({ ...current, sleepQuality }))}
            />
            <CheckInScaleRow
              label="Świeżość nóg"
              hint="1 zajechane / 5 świeże"
              value={checkInDraft.legFreshness}
              onChange={(legFreshness) => setCheckInDraft((current) => ({ ...current, legFreshness }))}
            />
            <CheckInScaleRow
              label="Motywacja"
              hint="1 brak / 5 pełna"
              value={checkInDraft.motivation}
              onChange={(motivation) => setCheckInDraft((current) => ({ ...current, motivation }))}
            />
            <CheckInScaleRow
              label="Obolałość"
              hint="1 mała / 5 duża"
              value={checkInDraft.soreness}
              onChange={(soreness) => setCheckInDraft((current) => ({ ...current, soreness }))}
            />
          </Stack>

          <Button
            variant="contained"
            color="success"
            onClick={() => onSaveCheckIn(checkInDraft)}
            disabled={isSavingCheckIn}
            sx={{ mt: 1.25 }}
          >
            {isSavingCheckIn ? 'Zapisywanie...' : 'Zapisz check-in'}
          </Button>
        </Box>
      ) : null}

      {data.tomorrowHint ? (
        <Box
          sx={{
            mb: 1.5,
            p: 1,
            borderRadius: 1.5,
            bgcolor: alphaColor(PMC_COLORS.TSB, 0.08),
            border: `1px solid ${alphaColor(PMC_COLORS.TSB, 0.22)}`,
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', mb: 0.4, fontWeight: 700, color: PMC_COLORS.TSB }}>
            Jutro
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
            {data.tomorrowHint}
          </Typography>
        </Box>
      ) : null}

      {data.qualityWindows?.length ? (
        <Box
          sx={{
            mb: 1.5,
            p: 1,
            borderRadius: 1.5,
            bgcolor: alphaColor(STATUS_COLORS.info, 0.08),
            border: `1px solid ${alphaColor(STATUS_COLORS.info, 0.22)}`,
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 700, color: STATUS_COLORS.info }}>
            Okno jakości 72h
          </Typography>
          {data.qualityWindowSummary ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4, mb: 0.75 }}>
              {data.qualityWindowSummary}
            </Typography>
          ) : null}
          <Stack spacing={0.75}>
            {data.qualityWindows.map((window) => (
              <Box
                key={`${window.date}-${window.label}`}
                sx={{
                  p: 0.9,
                  borderRadius: 1.5,
                  bgcolor: SURFACE_COLORS.subtle,
                  border: `1px solid ${alphaColor(CHART_COLORS.grid, 0.4)}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 0.35 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {window.label}
                  </Typography>
                  <Chip size="small" label={`${window.score}/100`} color={window.recommendation === 'BEST_QUALITY' ? 'success' : 'default'} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>
                  {window.focus}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Stack direction="row" spacing={1}>
        <Tooltip title="Chronic Training Load – obciążenie długoterminowe (42 dni)">
          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
              py: 0.75,
              px: 0.5,
              borderRadius: 1.5,
              bgcolor: alphaColor(PMC_COLORS.CTL, 0.08),
              border: `1px solid ${alphaColor(PMC_COLORS.CTL, 0.2)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3, mb: 0.25 }}>
              <TrendingUpIcon sx={{ fontSize: 14, color: PMC_COLORS.CTL }} />
              <Typography variant="caption" sx={{ color: PMC_COLORS.CTL, fontWeight: 600, fontSize: '0.65rem' }}>
                CTL
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: PMC_COLORS.CTL, fontWeight: 700 }}>
              {Math.round(data.ctl)}
            </Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Acute Training Load – obciążenie krótkoterminowe (7 dni)">
          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
              py: 0.75,
              px: 0.5,
              borderRadius: 1.5,
              bgcolor: alphaColor(PMC_COLORS.ATL, 0.08),
              border: `1px solid ${alphaColor(PMC_COLORS.ATL, 0.2)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3, mb: 0.25 }}>
              <TrendingDownIcon sx={{ fontSize: 14, color: PMC_COLORS.ATL }} />
              <Typography variant="caption" sx={{ color: PMC_COLORS.ATL, fontWeight: 600, fontSize: '0.65rem' }}>
                ATL
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: PMC_COLORS.ATL, fontWeight: 700 }}>
              {Math.round(data.atl)}
            </Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Training Stress Balance – bilans formy (CTL − ATL)">
          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
              py: 0.75,
              px: 0.5,
              borderRadius: 1.5,
              bgcolor: alphaColor(tsbColor, 0.08),
              border: `1px solid ${alphaColor(tsbColor, 0.2)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3, mb: 0.25 }}>
              <BalanceIcon sx={{ fontSize: 14, color: tsbColor }} />
              <Typography variant="caption" sx={{ color: tsbColor, fontWeight: 600, fontSize: '0.65rem' }}>
                TSB
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: tsbColor, fontWeight: 700 }}>
              {data.tsb > 0 ? '+' : ''}
              {Math.round(data.tsb)}
            </Typography>
          </Box>
        </Tooltip>
      </Stack>
    </Box>
  );
}
