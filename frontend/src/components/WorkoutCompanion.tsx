import { useState } from 'react';

import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';

interface WorkoutStep {
  label: string;
  duration: number;
  targetPowerPct: number;
  targetHrZone: string;
  color: string;
}

const ZC = (zone: number): string => {
  const colors: Record<number, string> = { 1: '#4ECDC4', 2: '#58A6FF', 3: '#FFD93D', 4: '#FF8C42', 5: '#FF4444', 6: '#FF4444', 7: '#FF2020' };
  return colors[zone] ?? '#58A6FF';
};

const PRESETS: Record<string, WorkoutStep[]> = {
  'RECOVERY': [
    { label: 'Rozgrzewka', duration: 600, targetPowerPct: 45, targetHrZone: 'Z1', color: ZC(1) },
    { label: 'Jazda', duration: 1800, targetPowerPct: 50, targetHrZone: 'Z2', color: ZC(2) },
    { label: 'Schłodzenie', duration: 300, targetPowerPct: 40, targetHrZone: 'Z1', color: ZC(1) },
  ],
  'ENDURANCE': [
    { label: 'Rozgrzewka', duration: 600, targetPowerPct: 50, targetHrZone: 'Z2', color: ZC(2) },
    { label: 'Jazda', duration: 3600, targetPowerPct: 65, targetHrZone: 'Z2', color: ZC(2) },
    { label: 'Schłodzenie', duration: 300, targetPowerPct: 45, targetHrZone: 'Z1', color: ZC(1) },
  ],
  'TEMPO': [
    { label: 'Rozgrzewka', duration: 600, targetPowerPct: 55, targetHrZone: 'Z2', color: ZC(2) },
    { label: 'Tempo', duration: 2400, targetPowerPct: 80, targetHrZone: 'Z3', color: ZC(3) },
    { label: 'Schłodzenie', duration: 300, targetPowerPct: 45, targetHrZone: 'Z1', color: ZC(1) },
  ],
  'THRESHOLD': [
    { label: 'Rozgrzewka', duration: 900, targetPowerPct: 55, targetHrZone: 'Z2', color: ZC(2) },
    { label: 'Interwał', duration: 1200, targetPowerPct: 95, targetHrZone: 'Z4', color: ZC(4) },
    { label: 'Odpoczynek', duration: 600, targetPowerPct: 50, targetHrZone: 'Z1', color: ZC(1) },
    { label: 'Interwał', duration: 1200, targetPowerPct: 95, targetHrZone: 'Z4', color: ZC(4) },
    { label: 'Schłodzenie', duration: 600, targetPowerPct: 45, targetHrZone: 'Z1', color: ZC(1) },
  ],
  'VO2MAX': [
    { label: 'Rozgrzewka', duration: 900, targetPowerPct: 55, targetHrZone: 'Z2', color: ZC(2) },
    { label: 'Interwał', duration: 180, targetPowerPct: 115, targetHrZone: 'Z5', color: ZC(5) },
    { label: 'Odpoczynek', duration: 180, targetPowerPct: 40, targetHrZone: 'Z1', color: ZC(1) },
    { label: 'Interwał', duration: 180, targetPowerPct: 115, targetHrZone: 'Z5', color: ZC(5) },
    { label: 'Odpoczynek', duration: 180, targetPowerPct: 40, targetHrZone: 'Z1', color: ZC(1) },
    { label: 'Interwał', duration: 180, targetPowerPct: 115, targetHrZone: 'Z5', color: ZC(5) },
    { label: 'Odpoczynek', duration: 180, targetPowerPct: 40, targetHrZone: 'Z1', color: ZC(1) },
    { label: 'Interwał', duration: 180, targetPowerPct: 115, targetHrZone: 'Z5', color: ZC(5) },
    { label: 'Schłodzenie', duration: 600, targetPowerPct: 45, targetHrZone: 'Z1', color: ZC(1) },
  ],
};

const PRESET_LABELS: Record<string, string> = {
  RECOVERY: 'Regeneracja',
  ENDURANCE: 'Wytrzymałość',
  TEMPO: 'Tempo',
  THRESHOLD: 'Próg',
  VO2MAX: 'VO2max',
};

export default function WorkoutCompanion() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const steps = preset ? (PRESETS[preset] ?? []) : [];
  const currentStep = steps[stepIndex];
  const totalDuration = steps.reduce((s, st) => s + st.duration, 0);
  const bgColor = currentStep?.color ?? '#0D1117';

  const startPreset = (p: string) => {
    setPreset(p);
    setStepIndex(0);
    setElapsed(0);
    setRunning(true);
    setOpen(true);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!open) {
    return (
      <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Live Companion</Typography>
        <Stack spacing={0.5}>
          {Object.keys(PRESETS).map((key) => {
            const presetSteps = PRESETS[key];
            if (!presetSteps) return null;
            return (
              <Button
                key={key}
                variant="outlined"
                size="small"
                onClick={() => startPreset(key)}
                fullWidth
                sx={{ justifyContent: 'flex-start', py: 1 }}
              >
                <DirectionsBikeIcon sx={{ mr: 1, fontSize: 18 }} />
                {PRESET_LABELS[key]} — {formatTime(presetSteps.reduce((s, st) => s + st.duration, 0))}
              </Button>
            );
          })}
        </Stack>
      </Box>
    );
  }

  return (
    <Dialog open fullScreen onClose={() => { setOpen(false); setRunning(false); }}>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${bgColor}0D`,
          transition: 'background-color 0.5s',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h1" fontWeight={900} sx={{ fontSize: '5rem', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(elapsed)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0}
          sx={{ width: 300, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.08)' }}
        />
        {currentStep && (
          <Box>
            <Typography variant="h5" fontWeight={700} color={currentStep.color}>
              {currentStep.label}
            </Typography>
            <Chip
              label={`${currentStep.targetPowerPct}% FTP | ${currentStep.targetHrZone}`}
              size="small"
              sx={{ mt: 1, bgcolor: `${currentStep.color}22`, color: currentStep.color, fontWeight: 600 }}
            />
          </Box>
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {running ? (
            <Button variant="contained" color="error" size="large" onClick={() => setRunning(false)}>
              Pauza
            </Button>
          ) : (
            <Button variant="contained" color="success" size="large" onClick={() => setRunning(true)}>
              Start
            </Button>
          )}
          <Button variant="outlined" size="large" onClick={() => { setOpen(false); setRunning(false); }}>
            Zakończ
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
