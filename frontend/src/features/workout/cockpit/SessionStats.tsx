import BoltIcon from '@mui/icons-material/Bolt';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';

import { StatRow, Surface } from '@/ui';

import { formatClock } from './format';

import type { SessionMetrics } from '../devices/liveMetrics';

/** Whole-session totals: time, virtual distance, work and training stress. */
export default function SessionStats({ elapsedMs, totalMs, session }: { elapsedMs: number; totalMs: number; session: SessionMetrics }) {
  return (
    <Surface padding="sm" component="section" aria-label="Podsumowanie sesji">
      <StatRow
        variant="plain"
        items={[
          { id: 'time', icon: <TimerOutlinedIcon />, value: formatClock(elapsedMs), unit: totalMs ? `z ${formatClock(totalMs)}` : 'czas', label: 'Czas treningu' },
          { id: 'distance', icon: <RouteOutlinedIcon />, value: session.distanceKm.toFixed(1), unit: 'km', tone: 'secondary', label: 'Dystans wirtualny' },
          { id: 'work', icon: <BoltIcon />, value: Math.round(session.kilojoules), unit: 'kJ', tone: 'warning', label: 'Praca' },
          { id: 'tss', icon: <ShowChartIcon />, value: session.tss != null ? Math.round(session.tss) : '—', unit: 'TSS', tone: 'success', label: 'Obciążenie' },
        ]}
      />
    </Surface>
  );
}
