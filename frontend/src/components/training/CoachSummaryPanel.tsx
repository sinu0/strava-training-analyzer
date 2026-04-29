import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';

import type { PredictionResponse } from '@/types/ai';

type CoachSummaryPanelProps = {
  prediction?: PredictionResponse | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
};

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

export default function CoachSummaryPanel({
  prediction,
  onGenerate,
  isGenerating = false,
}: CoachSummaryPanelProps) {
  if (!prediction) {
    return (
      <Alert
        severity="info"
        action={onGenerate ? (
          <Button size="small" onClick={onGenerate} disabled={isGenerating}>
            {isGenerating ? 'Generowanie...' : 'Generuj'}
          </Button>
        ) : undefined}
      >
        Brakuje świeżego podsumowania trenera AI dla tygodnia i bloku.
      </Alert>
    );
  }

  const weekReview = readString(prediction.structuredData.weekReview);
  const blockReview = readString(prediction.structuredData.blockReview);
  const nextFocus = readString(prediction.structuredData.nextFocus);
  const keyWins = readStringList(prediction.structuredData.keyWins);
  const keyRisks = readStringList(prediction.structuredData.keyRisks);

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip icon={<AutoAwesomeIcon />} label="Coach AI" size="small" color="secondary" />
        <Chip label={`${Math.round(prediction.confidence * 100)}% pewności`} size="small" variant="outlined" />
      </Stack>
      <Typography variant="body2">{prediction.summary}</Typography>
      {weekReview ? (
        <Box>
          <Typography variant="subtitle2">Tydzień</Typography>
          <Typography variant="body2" color="text.secondary">{weekReview}</Typography>
        </Box>
      ) : null}
      {blockReview ? (
        <Box>
          <Typography variant="subtitle2">Blok</Typography>
          <Typography variant="body2" color="text.secondary">{blockReview}</Typography>
        </Box>
      ) : null}
      {!!keyWins.length && (
        <Box>
          <Typography variant="subtitle2">Co działa</Typography>
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {keyWins.map((item) => <Alert key={item} severity="success">{item}</Alert>)}
          </Stack>
        </Box>
      )}
      {!!keyRisks.length && (
        <Box>
          <Typography variant="subtitle2">Na co uważać</Typography>
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {keyRisks.map((item) => <Alert key={item} severity="warning">{item}</Alert>)}
          </Stack>
        </Box>
      )}
      {nextFocus ? (
        <Alert severity="info">
          <Typography variant="subtitle2">Najbliższy focus</Typography>
          <Typography variant="body2">{nextFocus}</Typography>
        </Alert>
      ) : null}
    </Stack>
  );
}
