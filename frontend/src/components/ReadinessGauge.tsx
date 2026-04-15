import BalanceIcon from '@mui/icons-material/Balance';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Typography, Stack, LinearProgress, Tooltip } from '@mui/material';

import type { ReadinessData } from '@/types/analytics';
import {
  CHART_COLORS,
  COMMON_COLORS,
  PMC_COLORS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
} from '@/utils/colors';
import { getReadinessIllustrationPath } from '@/utils/illustrationAssets';
import {
  getReadinessColor,
  getReadinessImage,
  getReadinessLabel,
  getReadinessLevelLabel,
} from '@/utils/readinessScales';

interface ReadinessGaugeProps {
  data: ReadinessData | undefined;
}

export default function ReadinessGauge({ data }: ReadinessGaugeProps) {
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

  return (
    <Box>
      {/* ─── Hero: Cyclist illustration + Score + Level ─── */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor: SURFACE_COLORS.subtle,
        border: `1px solid ${alphaColor(CHART_COLORS.grid, 0.5)}`,
        overflow: 'hidden',
      }}>
        {/* Cyclist illustration */}
        <Box
          component="img"
          src={getReadinessIllustrationPath(getReadinessImage(data.score))}
          alt={`Gotowość: ${data.level}`}
          sx={{
            width: 110,
            height: 92,
            objectFit: 'contain',
            borderRadius: 1.5,
            flexShrink: 0,
            filter: `drop-shadow(0 2px 8px ${alphaColor(COMMON_COLORS.black, 0.3)})`,
          }}
        />

        {/* Score + level */}
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

      {/* ─── Score bar ─── */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary">Gotowość treningowa</Typography>
          <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
            {getReadinessLabel(data.score)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={data.score}
          sx={{
            height: 6, borderRadius: 3, bgcolor: CHART_COLORS.surface,
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
          }}
        />
      </Box>

      {/* ─── Description ─── */}
      <Box sx={{
        mb: 1.5,
        p: 1,
        borderRadius: 1.5,
        bgcolor: alphaColor(color, 0.12),
        border: `1px solid ${alphaColor(color, 0.3)}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
          <FitnessCenterIcon sx={{ fontSize: 16, color }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color }}>
            Zalecenie
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          {data.description}
        </Typography>
      </Box>

      {/* ─── PMC metrics ─── */}
      <Stack direction="row" spacing={1}>
        <Tooltip title="Chronic Training Load – obciążenie długoterminowe (42 dni)">
          <Box sx={{
            flex: 1,
            textAlign: 'center',
            py: 0.75,
            px: 0.5,
            borderRadius: 1.5,
            bgcolor: alphaColor(PMC_COLORS.CTL, 0.08),
            border: `1px solid ${alphaColor(PMC_COLORS.CTL, 0.2)}`,
          }}>
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
          <Box sx={{
            flex: 1,
            textAlign: 'center',
            py: 0.75,
            px: 0.5,
            borderRadius: 1.5,
            bgcolor: alphaColor(PMC_COLORS.ATL, 0.08),
            border: `1px solid ${alphaColor(PMC_COLORS.ATL, 0.2)}`,
          }}>
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
          <Box sx={{
            flex: 1,
            textAlign: 'center',
            py: 0.75,
            px: 0.5,
            borderRadius: 1.5,
            bgcolor: alphaColor(tsbColor, 0.08),
            border: `1px solid ${alphaColor(tsbColor, 0.2)}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3, mb: 0.25 }}>
              <BalanceIcon sx={{ fontSize: 14, color: tsbColor }} />
              <Typography variant="caption" sx={{ color: tsbColor, fontWeight: 600, fontSize: '0.65rem' }}>
                TSB
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: tsbColor, fontWeight: 700 }}>
              {data.tsb > 0 ? '+' : ''}{Math.round(data.tsb)}
            </Typography>
          </Box>
        </Tooltip>
      </Stack>
    </Box>
  );
}
