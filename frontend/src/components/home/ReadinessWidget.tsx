import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import type { ReadinessData, SaveReadinessCheckInInput } from '@/types/analytics';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';
import { getReadinessColor } from '@/utils/readinessScales';

const CHECK_IN_OPTIONS = [1, 2, 3, 4, 5] as const;

const LABELS: Record<keyof SaveReadinessCheckInInput, { label: string; hint: string }> = {
  sleepQuality: { label: 'Sen', hint: '1–5' },
  legFreshness: { label: 'Nogi', hint: '1–5' },
  motivation: { label: 'Motywacja', hint: '1–5' },
  soreness: { label: 'Obolalosc', hint: '1–5' },
};

const BUTTON_COLORS: Record<number, { bg: string; border: string }> = {
  1: { bg: STATUS_COLORS.error, border: STATUS_COLORS.error },
  2: { bg: STATUS_COLORS.warning, border: STATUS_COLORS.warning },
  3: { bg: STATUS_COLORS.neutral, border: STATUS_COLORS.neutral },
  4: { bg: STATUS_COLORS.info, border: STATUS_COLORS.info },
  5: { bg: STATUS_COLORS.success, border: STATUS_COLORS.success },
};

function getInitialCheckIn(data: ReadinessData | undefined): SaveReadinessCheckInInput {
  if (!data?.checkIn) {
    return { sleepQuality: 3, legFreshness: 3, motivation: 3, soreness: 3 };
  }
  return {
    sleepQuality: data.checkIn.sleepQuality,
    legFreshness: data.checkIn.legFreshness,
    motivation: data.checkIn.motivation,
    soreness: data.checkIn.soreness,
  };
}

function formatUpdatedAt(updatedAt?: string | null): string | null {
  if (!updatedAt) return null;
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(updatedAt));
}

function computeAutoSuggestions(readiness: ReadinessData | undefined): Partial<SaveReadinessCheckInInput> | null {
  if (!readiness?.healthSignals) return null;

  const { sleepScore, restingHrDelta, bodyBattery } = readiness.healthSignals;
  const suggestions: Partial<SaveReadinessCheckInInput> = {};

  if (sleepScore != null) {
    suggestions.sleepQuality = sleepScore >= 80 ? 5 : sleepScore >= 65 ? 4 : sleepScore >= 45 ? 3 : sleepScore >= 30 ? 2 : 1;
  }

  if (restingHrDelta != null) {
    const freshness = restingHrDelta <= -2 ? 4 : restingHrDelta <= 0 ? 3 : 2;
    suggestions.legFreshness = freshness;
  }

  if (bodyBattery != null) {
    suggestions.motivation = bodyBattery >= 75 ? 5 : bodyBattery >= 50 ? 4 : bodyBattery >= 30 ? 3 : 2;
  }

  return Object.keys(suggestions).length > 0 ? suggestions : null;
}

interface ReadinessWidgetProps {
  readiness: ReadinessData | undefined;
  onSave: (payload: SaveReadinessCheckInInput) => void;
  isSaving?: boolean;
}

export default function ReadinessWidget({ readiness, onSave, isSaving = false }: ReadinessWidgetProps) {
  const [draft, setDraft] = useState<SaveReadinessCheckInInput>(getInitialCheckIn(readiness));

  useEffect(() => {
    setDraft(getInitialCheckIn(readiness));
  }, [readiness]);

  const score = readiness?.score ?? 55;
  const accentColor = getReadinessColor(score);
  const updatedAt = formatUpdatedAt(readiness?.checkIn?.updatedAt);
  const hasCheckIn = !!readiness?.checkIn;

  const autoSuggestions = useMemo(() => computeAutoSuggestions(readiness), [readiness]);

  const handleApplySuggestion = (field: keyof SaveReadinessCheckInInput, value: number) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const avgScore = (draft.sleepQuality + draft.legFreshness + draft.motivation + (6 - draft.soreness)) / 4;

  return (
    <Paper
      sx={{
        p: { xs: 1.75, md: 2 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: hasCheckIn ? alphaColor(STATUS_COLORS.success, 0.25) : alphaColor(accentColor, 0.15),
        bgcolor: hasCheckIn ? alphaColor(STATUS_COLORS.success, 0.04) : 'background.paper',
      }}
    >
      <Stack spacing={1.5}>
        {/* Header with score gauge */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '4px solid',
              borderColor: alphaColor(accentColor, 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alphaColor(accentColor, 0.08),
              flexShrink: 0,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1, color: accentColor }}>
                {score}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
                /100
              </Typography>
            </Box>
          </Box>
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  color: hasCheckIn ? STATUS_COLORS.success : STATUS_COLORS.accent,
                }}
              >
                {hasCheckIn ? 'Gotowość (check-in)' : 'Gotowość'}
              </Typography>
              {hasCheckIn && (
                <CheckCircleOutlineIcon sx={{ color: STATUS_COLORS.success, fontSize: 14 }} />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              {readiness?.dayLabel ?? 'Brak decyzji dnia'}{updatedAt ? ` · ${updatedAt}` : ''}
            </Typography>
          </Box>
        </Stack>

        {/* Health signals */}
        {readiness?.healthSignals && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {readiness.healthSignals.sleepScore != null && (
              <Chip
                label={`Sen: ${readiness.healthSignals.sleepScore}`}
                size="small"
                sx={{ fontSize: '0.6rem', height: 20 }}
                variant="outlined"
              />
            )}
            {readiness.healthSignals.restingHrBpm != null && (
              <Chip
                label={`HR: ${readiness.healthSignals.restingHrBpm}`}
                size="small"
                sx={{ fontSize: '0.6rem', height: 20 }}
                variant="outlined"
              />
            )}
            {readiness.healthSignals.bodyBattery != null && (
              <Chip
                label={`Bateria: ${readiness.healthSignals.bodyBattery}`}
                size="small"
                sx={{ fontSize: '0.6rem', height: 20 }}
                variant="outlined"
              />
            )}
          </Stack>
        )}

        {/* Auto-suggestions */}
        {autoSuggestions && Object.keys(autoSuggestions).length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {(Object.entries(autoSuggestions) as Array<[keyof SaveReadinessCheckInInput, number]>).map(([key, value]) => (
              <Chip
                key={key}
                label={`${LABELS[key].label}: ${value}`}
                size="small"
                variant="outlined"
                onClick={() => handleApplySuggestion(key, value)}
                sx={{
                  fontSize: '0.58rem', height: 20, cursor: 'pointer',
                  borderColor: BUTTON_COLORS[value]?.border ?? 'divider',
                  color: BUTTON_COLORS[value]?.bg ?? 'text.secondary',
                }}
              />
            ))}
          </Stack>
        )}

        {/* Check-in sliders */}
        <Stack spacing={0.5}>
          {(Object.keys(LABELS) as Array<keyof SaveReadinessCheckInInput>).map((key) => {
            const { label, hint } = LABELS[key];
            return (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, fontSize: '0.7rem', width: 50, flexShrink: 0 }}
                >
                  {label}
                </Typography>
                <Stack direction="row" spacing={0.3} sx={{ flex: 1 }}>
                  {CHECK_IN_OPTIONS.map((option) => {
                    const isSelected = draft[key] === option;
                    const colorConfig = BUTTON_COLORS[option]!;
                    return (
                      <Button
                        key={option}
                        size="small"
                        variant={isSelected ? 'contained' : 'outlined'}
                        onClick={() => setDraft((current) => ({ ...current, [key]: option }))}
                        sx={{
                          minWidth: 0,
                          flex: 1,
                          px: 0,
                          py: 0.1,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: 1,
                          ...(isSelected && {
                            bgcolor: `${colorConfig.bg} !important`,
                            color: '#fff !important',
                            borderColor: `${colorConfig.border} !important`,
                          }),
                        }}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ width: 20, textAlign: 'right', fontSize: '0.6rem' }}>
                  {hint}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* Score + save */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Box sx={{
            px: 1, py: 0.4, borderRadius: 1,
            bgcolor: alphaColor(STATUS_COLORS.accent, 0.06),
          }}>
            <Typography variant="caption" sx={{
              fontSize: '0.62rem', fontWeight: 800,
              color: avgScore >= 3.5 ? STATUS_COLORS.success : avgScore >= 2.5 ? STATUS_COLORS.warning : STATUS_COLORS.error,
            }}>
              Średnia: {avgScore.toFixed(1)} / 5
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => onSave(draft)}
            disabled={isSaving}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.72rem',
              py: 0.3,
              bgcolor: STATUS_COLORS.accent,
              '&:hover': { bgcolor: STATUS_COLORS.accent, filter: 'brightness(1.1)' },
            }}
          >
            {isSaving ? 'Zapisywanie…' : hasCheckIn ? 'Aktualizuj' : 'Zapisz check-in'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
