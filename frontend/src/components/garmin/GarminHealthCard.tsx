import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HotelIcon from '@mui/icons-material/Hotel';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import { Box, Stack, Tooltip, Typography } from '@mui/material';

import type { GarminHealthData } from '../../types/garmin';

interface MetricBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  unit?: string;
  color: string;
}

function MetricBox({ icon, label, value, unit, color }: MetricBoxProps) {
  return (
    <Box sx={{
      p: 1.5,
      borderRadius: 2,
      bgcolor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'center',
      flex: 1,
      minWidth: 100,
    }}>
      <Box sx={{ color, mb: 0.5, display: 'flex', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color, lineHeight: 1.2 }}>
        {value ?? '—'}
        {value != null && !!unit && (
          <Typography component="span" variant="caption" sx={{ ml: 0.3, fontWeight: 400, color: '#8B949E' }}>
            {unit}
          </Typography>
        )}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
        {label}
      </Typography>
    </Box>
  );
}

function formatSleepDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

interface SleepStageBarProps {
  deep: number | null;
  light: number | null;
  rem: number | null;
  awake: number | null;
}

function SleepStageBar({ deep, light, rem, awake }: SleepStageBarProps) {
  const total = (deep ?? 0) + (light ?? 0) + (rem ?? 0) + (awake ?? 0);
  if (total === 0) return null;

  const stages = [
    { label: 'Głęboki', seconds: deep ?? 0, color: '#1E3A5F' },
    { label: 'Lekki', seconds: light ?? 0, color: '#58A6FF' },
    { label: 'REM', seconds: rem ?? 0, color: '#BC8CFF' },
    { label: 'Przebudzenia', seconds: awake ?? 0, color: '#F85149' },
  ];

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', mb: 0.5, display: 'block' }}>
        FAZY SNU
      </Typography>
      <Box sx={{ display: 'flex', borderRadius: 1, overflow: 'hidden', height: 8 }}>
        {stages.map((stage) => {
          const pct = (stage.seconds / total) * 100;
          if (pct < 1) return null;
          return (
            <Tooltip key={stage.label} title={`${stage.label}: ${formatSleepDuration(stage.seconds)}`} arrow>
              <Box sx={{ width: `${pct}%`, bgcolor: stage.color, minWidth: 2 }} />
            </Tooltip>
          );
        })}
      </Box>
      <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
        {stages.map((stage) => (
          <Typography key={stage.label} variant="caption" sx={{ fontSize: '0.55rem', color: '#8B949E' }}>
            <Box component="span" sx={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', bgcolor: stage.color, mr: 0.3, verticalAlign: 'middle' }} />
            {stage.label} {formatSleepDuration(stage.seconds)}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

interface GarminHealthCardProps {
  data: GarminHealthData | null | undefined;
}

export default function GarminHealthCard({ data }: GarminHealthCardProps) {
  if (!data) return null;

  const hasSleepStages = data.deepSleepSeconds != null || data.lightSleepSeconds != null
    || data.remSleepSeconds != null || data.awakeSleepSeconds != null;

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
        DANE ZDROWOTNE — {data.date}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <MetricBox
          icon={<FavoriteIcon sx={{ fontSize: 22 }} />}
          label="Tętno spoczynkowe"
          value={data.restingHrBpm}
          unit="bpm"
          color="#F85149"
        />
        <MetricBox
          icon={<MonitorHeartIcon sx={{ fontSize: 22 }} />}
          label="HRV (RMSSD)"
          value={data.hrvRmssd != null ? Math.round(data.hrvRmssd) : null}
          unit="ms"
          color="#39D353"
        />
        <MetricBox
          icon={<BatteryChargingFullIcon sx={{ fontSize: 22 }} />}
          label="Body Battery"
          value={data.bodyBattery}
          color="#FFA657"
        />
        <MetricBox
          icon={<HotelIcon sx={{ fontSize: 22 }} />}
          label="Wynik snu"
          value={data.sleepScore}
          color="#58A6FF"
        />
        <MetricBox
          icon={<HotelIcon sx={{ fontSize: 22 }} />}
          label="Czas snu"
          value={formatSleepDuration(data.sleepDurationSeconds)}
          color="#BC8CFF"
        />
        <MetricBox
          icon={<DirectionsWalkIcon sx={{ fontSize: 22 }} />}
          label="Kroki"
          value={data.steps != null ? data.steps.toLocaleString('pl-PL') : null}
          color="#3FB950"
        />
        <MetricBox
          icon={<SelfImprovementIcon sx={{ fontSize: 22 }} />}
          label="Średni stres"
          value={data.stressAvg}
          color="#D29922"
        />
      </Stack>
      {!!hasSleepStages && (
        <SleepStageBar
          deep={data.deepSleepSeconds}
          light={data.lightSleepSeconds}
          rem={data.remSleepSeconds}
          awake={data.awakeSleepSeconds}
        />
      )}
    </Box>
  );
}
