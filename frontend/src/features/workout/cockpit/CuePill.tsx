import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import LoopIcon from '@mui/icons-material/Loop';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

import { StatusPill } from '@/ui';

import type { Cue } from './cues';

const SUSTAIN_MS = 5_000;

/** Shows a cue only after it has been true for 5 s, so short surges do not nag the rider. */
export function useSustainedCue(cue: Cue | null, nowMs: number): Cue | null {
  const [since, setSince] = useState<{ key: string; at: number } | null>(null);
  const key = cue?.key ?? null;
  useEffect(() => {
    setSince((current) => (key == null ? null : current?.key === key ? current : { key, at: nowMs }));
  }, [key, nowMs]);
  return cue && since?.key === cue.key && nowMs - since.at >= SUSTAIN_MS ? cue : null;
}

export default function CuePill({ cue }: { cue: Cue | null }) {
  const icon = cue?.key === 'power-up' ? <ArrowUpwardIcon /> : cue?.key === 'power-down' ? <ArrowDownwardIcon /> : <LoopIcon />;
  return (
    <Box role="status" aria-live="polite" sx={{ display: 'flex', justifyContent: 'center', '&:empty': { display: 'none' } }}>
      {cue ? <StatusPill variant="solid" tone={cue.tone} icon={icon} label={cue.text} /> : null}
    </Box>
  );
}
