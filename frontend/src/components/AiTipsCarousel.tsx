import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
  LinearProgress,
  Skeleton,
  Alert,
} from '@mui/material';
import { useState } from 'react';

import { PREDICTION_TYPE_LABELS } from '../types/ai';
import { AI_PREDICTION_COLORS, STATUS_COLORS } from '../utils/colors';

import type { AiModuleStatus, PredictionResponse, PredictionType } from '../types/ai';

interface AiTipsCarouselProps {
  tips: PredictionResponse[];
  loading: boolean;
  status?: AiModuleStatus;
}

const TYPE_ICONS: Record<PredictionType, React.ReactNode> = {
  FTP_PREDICTION: <BoltIcon />,
  FATIGUE_PREDICTION: <BatteryAlertIcon />,
  TRAINING_TYPE_RECOMMENDATION: <FitnessCenterIcon />,
  PERFORMANCE_TREND: <TrendingUpIcon />,
  OVERTRAINING_RISK: <WarningIcon />,
  RACE_READINESS: <EmojiEventsIcon />,
  TRAINING_COACH_SUMMARY: <AutoAwesomeIcon />,
};

interface TipStructuredData {
  summary?: string;
  insight?: string;
  action?: string;
  metrics?: Record<string, string>;
  warnings?: string[];
  confidence?: number;
}

function extractStructured(tip: PredictionResponse): TipStructuredData {
  const s = (tip.structuredData ?? {}) as Record<string, unknown>;
  return {
    summary: typeof s.summary === 'string' ? s.summary : (tip.summary ?? ''),
    insight: typeof s.insight === 'string' ? s.insight : (tip.detail ?? ''),
    action: typeof s.action === 'string' ? s.action : '',
    metrics: (s.metrics && typeof s.metrics === 'object' && !Array.isArray(s.metrics))
      ? (s.metrics as Record<string, string>) : {},
    warnings: Array.isArray(s.warnings) ? (s.warnings as string[]) : [],
    confidence: typeof s.confidence === 'number' ? s.confidence : tip.confidence,
  };
}

export default function AiTipsCarousel({ tips, loading, status }: AiTipsCarouselProps) {
  const [index, setIndex] = useState(0);
  const total = tips.length;

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  const batchTimeLabel = (() => {
    if (!status?.batchCron) {
      return '03:00';
    }
    if (status.batchCron === '0 0 3 * * *') {
      return '03:00';
    }
    return `cron: ${status.batchCron}`;
  })();

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="85%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 1, mb: 1.5 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={70} height={24} />
          <Skeleton variant="rounded" width={60} height={24} />
        </Box>
      </Box>
    );
  }

  if (total === 0 || !tips[index]) {
    let subtitle = `AI przygotuje rekomendacje o ${batchTimeLabel} w nocy`;

    if (status) {
      if (!status.enabled) {
        subtitle = 'Moduł AI jest wyłączony w konfiguracji.';
      } else if (!status.modelAvailable) {
        subtitle = 'Aktywny model AI jest niedostępny, więc rekomendacje nie mogą się wygenerować.';
      } else if (status.batchEnabled === false) {
        subtitle = 'Nocny batch rekomendacji jest wyłączony. Włącz go lub uruchom batch ręcznie w panelu Admin.';
      } else if (status.todayTipsReady === false) {
        subtitle = `Dzisiejsze rekomendacje jeszcze się nie wygenerowały. Batch działa o ${batchTimeLabel}. Możesz też uruchomić go ręcznie w panelu Admin.`;
      }
    }

    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <LightbulbIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Brak prognoz na dziś
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {subtitle}
        </Typography>
      </Box>
    );
  }

  const tip = tips[index]!;
  const tipType = tip.predictionType as PredictionType;
  const color = AI_PREDICTION_COLORS[tipType] ?? STATUS_COLORS.info;
  const label = PREDICTION_TYPE_LABELS[tipType] ?? tipType;
  const icon = TYPE_ICONS[tipType] ?? <LightbulbIcon />;
  const { summary, insight, action, metrics, warnings, confidence } = extractStructured(tip);
  const confidencePct = Math.round((confidence ?? 0) * 100);

  return (
    <Box>
      {/* Header row: type badge + counter + navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
          <Chip
            label={label}
            size="small"
            sx={{ bgcolor: `${color}22`, color, border: `1px solid ${color}55`, fontWeight: 600 }}
          />
        </Box>

        {total > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={prev}
              aria-label="poprzedni"
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, textAlign: 'center' }}>
              {index + 1}&thinsp;/&thinsp;{total}
            </Typography>
            <IconButton
              size="small"
              onClick={next}
              aria-label="następny"
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Summary headline */}
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color, mb: 1, lineHeight: 1.3 }}
      >
        {summary}
      </Typography>

      {/* Insight body */}
      {!!insight && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
          {insight}
        </Typography>
      )}

      {/* Action box */}
      {!!action && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            bgcolor: `${color}11`,
            border: `1px solid ${color}33`,
            borderRadius: 1,
            px: 1.5,
            py: 1,
            mb: 1.5,
          }}
        >
          <CheckCircleOutlineIcon sx={{ color, fontSize: 18, mt: 0.1, flexShrink: 0 }} />
          <Typography variant="body2" sx={{ color, fontWeight: 500 }}>
            {action}
          </Typography>
        </Box>
      )}

      {/* Warnings */}
      {!!warnings && warnings.length > 0 && (
        <Stack spacing={0.5} sx={{ mb: 1.5 }}>
          {warnings.map((w, i) => (
            <Alert key={i} severity="warning" sx={{ py: 0, '& .MuiAlert-message': { py: 0.5 } }}>
              <Typography variant="caption">{w}</Typography>
            </Alert>
          ))}
        </Stack>
      )}

      {/* Metrics chips */}
      {!!metrics && Object.keys(metrics).length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
          {Object.entries(metrics).map(([key, val]) => (
            <Chip
              key={key}
              label={`${key}: ${val}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', borderColor: 'divider', color: 'text.secondary' }}
            />
          ))}
        </Box>
      )}

      {/* Confidence bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.disabled" sx={{ minWidth: 60 }}>
          Pewność:
        </Typography>
        <LinearProgress
          variant="determinate"
          value={confidencePct}
          sx={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            bgcolor: 'action.disabledBackground',
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, textAlign: 'right' }}>
          {confidencePct}%
        </Typography>
      </Box>

      {/* Dot indicators */}
      {total > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: 2 }}>
          {tips.map((_, i) => (
            <Box
              key={i}
              data-tip-dot
              onClick={() => setIndex(i)}
              sx={{
                width: i === index ? 20 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: i === index ? color : 'action.disabled',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: i === index ? color : 'text.disabled' },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
