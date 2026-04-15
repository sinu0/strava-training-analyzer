import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import type { ActivityLap } from '@/types/activity';
import { formatDuration, formatDistance, formatPace } from '@/utils/formatters';

import LapsCharts from './LapsCharts';

import type { BrushRange } from './InteractiveStreamsChart';


interface LapsTabProps {
  laps: ActivityLap[];
  sportType: string;
  altitudeStream?: number[] | null;
  onHoverIndex?: (idx: number | null) => void;
  onSelectRange?: (range: BrushRange | null) => void;
}

function formatSpeed(ms: number | null, sportType: string): string {
  if (ms == null || ms <= 0) return '-';
  const isRunning = sportType.toLowerCase().includes('run')
    || sportType.toLowerCase().includes('bieg');
  if (isRunning) {
    return formatPace(ms);
  }
  return `${(ms * 3.6).toFixed(1)} km/h`;
}

function formatHr(hr: number | null): string {
  if (hr == null) return '-';
  return `${Math.round(hr)}`;
}

function formatPowerVal(watts: number | null): string {
  if (watts == null) return '-';
  return `${Math.round(watts)}`;
}

function formatCadence(cad: number | null): string {
  if (cad == null) return '-';
  return `${Math.round(cad)}`;
}

const headerCellSx = {
  color: '#8B949E',
  fontWeight: 700,
  fontSize: '0.7rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  borderBottom: '1px solid #30363D',
  py: 1.5,
  whiteSpace: 'nowrap' as const,
};

const bodyCellSx = {
  color: '#E6EDF3',
  fontSize: '0.85rem',
  borderBottom: '1px solid rgba(48,54,61,0.5)',
  py: 1.25,
  fontVariantNumeric: 'tabular-nums',
};

export default function LapsTab({ laps, sportType, altitudeStream, onHoverIndex, onSelectRange }: LapsTabProps) {
  if (!laps.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography sx={{ color: '#8B949E' }}>Brak danych okrążeń.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <LapsCharts laps={laps} altitudeStream={altitudeStream} onBarHover={onHoverIndex} onBarSelect={onSelectRange} />

      <TableContainer
        sx={{
          bgcolor: '#161B22',
          borderRadius: 3,
          border: '1px solid #30363D',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>#</TableCell>
              <TableCell sx={headerCellSx}>Dystans</TableCell>
              <TableCell sx={headerCellSx}>Czas ruchu</TableCell>
              <TableCell sx={headerCellSx}>Prędkość śr.</TableCell>
              <TableCell sx={headerCellSx}>Tętno śr.</TableCell>
              <TableCell sx={headerCellSx}>Moc śr.</TableCell>
              <TableCell sx={headerCellSx}>Kadencja</TableCell>
              <TableCell sx={headerCellSx}>Przewyższenie</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {laps.map((lap, idx) => (
              <TableRow
                key={lap.lapIndex}
                sx={{
                  bgcolor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  '&:hover': { bgcolor: 'rgba(255,107,53,0.04)' },
                }}
              >
                <TableCell sx={bodyCellSx}>{lap.lapIndex}</TableCell>
                <TableCell sx={bodyCellSx}>{formatDistance(lap.distanceM)}</TableCell>
                <TableCell sx={bodyCellSx}>{formatDuration(lap.movingTimeSec)}</TableCell>
                <TableCell sx={bodyCellSx}>{formatSpeed(lap.avgSpeedMs, sportType)}</TableCell>
                <TableCell sx={bodyCellSx}>{formatHr(lap.avgHeartrate)}</TableCell>
                <TableCell sx={bodyCellSx}>{formatPowerVal(lap.avgPowerW)}</TableCell>
                <TableCell sx={bodyCellSx}>{formatCadence(lap.avgCadence)}</TableCell>
                <TableCell sx={bodyCellSx}>
                  {lap.totalElevationGain != null ? `${Math.round(lap.totalElevationGain)} m` : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
