import { Alert, Chip, Stack, Typography } from '@mui/material';

import type { BlockHealth } from '@/types/analytics';

interface BlockHealthPanelProps {
  blockHealth?: BlockHealth;
}

function chipColor(status?: string) {
  if (status === 'STABLE_PRODUCTIVE') return 'success';
  if (status === 'NO_ACTIVE_BLOCK') return 'default';
  return 'warning';
}

/**
 * Shows the current block-quality summary so cockpit surfaces can explain whether the week still supports the goal.
 */
export default function BlockHealthPanel({ blockHealth }: BlockHealthPanelProps) {
  if (!blockHealth) {
    return (
      <Alert severity="info">
        Wygeneruj program, żeby zobaczyć stan bloku i czerwone flagi dla bieżącego tygodnia.
      </Alert>
    );
  }

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip label={blockHealth.label} color={chipColor(blockHealth.status)} />
        {!!blockHealth.goalExecutionStatus && (
          <Chip label={`Cel: ${blockHealth.goalExecutionStatus}`} size="small" variant="outlined" />
        )}
        {blockHealth.goalExecutionScore != null && (
          <Chip label={`${blockHealth.goalExecutionScore}/100`} size="small" variant="outlined" />
        )}
      </Stack>
      <Typography variant="body2">{blockHealth.description}</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip label={`Korekty: ${blockHealth.adjustmentDays}`} size="small" variant="outlined" />
        <Chip label={`Nietrafione bodźce: ${blockHealth.missedStimulusDays}`} size="small" variant="outlined" />
        <Chip label={`Przeciążenia: ${blockHealth.overloadDays}`} size="small" variant="outlined" />
      </Stack>
      {blockHealth.keySignals.map((signal) => (
        <Alert key={signal} severity="info">
          {signal}
        </Alert>
      ))}
      {!!blockHealth.nextFocus && (
        <Typography variant="body2" color="text.secondary">
          {blockHealth.nextFocus}
        </Typography>
      )}
    </Stack>
  );
}
