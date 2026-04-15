import { Box, Typography, LinearProgress, Chip, Divider } from '@mui/material';

import { PREDICTION_TYPE_LABELS } from '../types/ai';
import {
  AI_PREDICTION_COLORS,
  COMMON_COLORS,
  STATUS_COLORS,
} from '../utils/colors';

import type { PredictionResponse } from '../types/ai';
import type { PredictionType } from '../types/ai';

interface PredictionResultCardProps {
  prediction: PredictionResponse;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.75) return STATUS_COLORS.success;
  if (confidence >= 0.5) return STATUS_COLORS.warning;
  return STATUS_COLORS.error;
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Bardzo wysoka';
  if (confidence >= 0.7) return 'Wysoka';
  if (confidence >= 0.5) return 'Średnia';
  if (confidence >= 0.3) return 'Niska';
  return 'Bardzo niska';
}

export default function PredictionResultCard({ prediction }: PredictionResultCardProps) {
  const typeKey = prediction.predictionType as PredictionType;
  const label = PREDICTION_TYPE_LABELS[typeKey] ?? prediction.predictionType;
  const color = AI_PREDICTION_COLORS[typeKey] ?? STATUS_COLORS.info;
  const confidenceColor = getConfidenceColor(prediction.confidence);
  const confidencePct = Math.round(prediction.confidence * 100);

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Chip label={label} size="small" sx={{ bgcolor: color, color: COMMON_COLORS.white, fontWeight: 600 }} />
        <Typography variant="caption" color="text.secondary">
          {new Date(prediction.createdAt).toLocaleString('pl-PL')}
        </Typography>
      </Box>

      {/* Summary */}
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        {prediction.summary}
      </Typography>

      {/* Confidence */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">Pewność predykcji</Typography>
          <Typography variant="body2" sx={{ color: confidenceColor, fontWeight: 600 }}>
            {confidencePct}% — {getConfidenceLabel(prediction.confidence)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={confidencePct}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { bgcolor: confidenceColor, borderRadius: 4 },
          }}
        />
      </Box>

      {/* Detail */}
      {!!prediction.detail && <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {prediction.detail}
          </Typography>
        </>}

      {/* Structured Data */}
      {!!prediction.structuredData && Object.keys(prediction.structuredData).length > 0 && <>
          <Divider sx={{ my: 1.5 }} />
          <StructuredDataView data={prediction.structuredData} />
        </>}

      {/* Footer */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        <Chip label={prediction.providerName} size="small" variant="outlined" />
        <Chip label={prediction.modelId} size="small" variant="outlined" />
      </Box>
    </Box>
  );
}

function StructuredDataView({ data }: { data: Record<string, unknown> }) {
  const filtered = Object.entries(data).filter(([k]) => k !== 'confidence' && k !== 'reasoning');

  if (filtered.length === 0) return null;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1 }}>
      {filtered.map(([key, value]) => (
        <Box key={key} sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
