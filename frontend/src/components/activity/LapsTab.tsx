import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useState, useMemo, useCallback } from 'react';

import type { ActivityLap } from '@/types/activity';
import { formatDuration, formatDistance, formatPower } from '@/utils/formatters';

import LapCard from './LapCard';

import type { BrushRange } from './InteractiveStreamsChart';

interface LapsTabProps {
  laps: ActivityLap[];
  sportType: string;
  altitudeStream?: number[] | null;
  powerStream?: number[] | null;
  heartrateStream?: number[] | null;
  velocityStream?: number[] | null;
  timeStream?: number[] | null;
  onHoverIndex?: (idx: number | null) => void;
  onSelectRange?: (range: BrushRange | null) => void;
}

export default function LapsTab({
  laps,
  sportType,
  altitudeStream,
  powerStream,
  heartrateStream,
  velocityStream,
  timeStream,
  onHoverIndex,
  onSelectRange,
}: LapsTabProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareLaps, setCompareLaps] = useState<number[]>([]);

  const bestPowerIdx = useMemo(() => {
    let best = 0;
    let bestVal = 0;
    laps.forEach((lap, i) => {
      if ((lap.avgPowerW ?? 0) > bestVal) {
        bestVal = lap.avgPowerW ?? 0;
        best = i;
      }
    });
    return bestVal > 0 ? best : -1;
  }, [laps]);

  const bestNPIdx = useMemo(() => {
    let best = 0;
    let bestVal = 0;
    laps.forEach((lap, i) => {
      if ((lap.normalizedPowerW ?? 0) > bestVal) {
        bestVal = lap.normalizedPowerW ?? 0;
        best = i;
      }
    });
    return bestVal > 0 ? best : -1;
  }, [laps]);

  const resolvedLaps = useMemo((): ActivityLap[] => {
    const needsFallback = laps.some((l) => l.startIndex == null || l.endIndex == null);
    if (!needsFallback) return laps;

    const time = timeStream;
    if (!time || time.length < 2) return laps;

    let cumulativeSec = 0;
    return laps.map((lap) => {
      if (lap.startIndex != null && lap.endIndex != null && lap.endIndex > lap.startIndex) {
        cumulativeSec += lap.movingTimeSec;
        return lap;
      }

      const startSec = cumulativeSec;
      const endSec = startSec + lap.movingTimeSec;
      cumulativeSec = endSec;

      const t0 = time[0] ?? 0;
      let startIdx = 0;
      let endIdx = time.length - 1;

      for (let j = 0; j < time.length; j++) {
        if ((time[j] ?? 0) - t0 >= startSec) { startIdx = j; break; }
      }
      for (let j = startIdx; j < time.length; j++) {
        if ((time[j] ?? 0) - t0 >= endSec) { endIdx = j; break; }
      }

      return endIdx > startIdx ? { ...lap, startIndex: startIdx, endIndex: endIdx } : lap;
    });
  }, [laps, timeStream]);

  const handleToggleExpand = useCallback((idx: number) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleSelect = useCallback(
    (startIdx: number, endIdx: number) => {
      if (startIdx >= 0 && endIdx > startIdx) {
        onSelectRange?.({ startIndex: startIdx, endIndex: endIdx });
      }
    },
    [onSelectRange],
  );

  const handleCompareToggle = useCallback(
    (idx: number) => {
      if (compareMode) {
        setCompareLaps((prev) => {
          const filtered = prev.filter((i) => i !== idx);
          if (prev.includes(idx)) return filtered;
          if (filtered.length >= 2) {
            const second = filtered[1];
            if (second != null) return [second, idx];
          }
          return [...filtered, idx];
        });
      }
    },
    [compareMode],
  );

  if (!laps.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography sx={{ color: '#8B949E' }}>Brak danych okrążeń.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ color: '#8B949E', fontSize: '0.8rem', fontWeight: 600 }}>
          {resolvedLaps.length} okrąż{ resolvedLaps.length === 1 ? 'enie' : resolvedLaps.length >= 5 ? 'eń' : 'enia'}
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={compareMode ? 'compare' : 'view'}
          exclusive
          onChange={(_, val) => {
            if (val) {
              setCompareMode(val === 'compare');
              setCompareLaps([]);
            }
          }}
          sx={{
            '& .MuiToggleButton-root': {
              color: '#8B949E',
              fontSize: '0.7rem',
              px: 1.5,
              py: 0.3,
              borderColor: '#30363D',
              '&.Mui-selected': {
                color: '#E6EDF3',
                bgcolor: 'rgba(88,166,255,0.15)',
              },
            },
          }}
        >
          <ToggleButton value="view">Przegląd</ToggleButton>
          <ToggleButton value="compare">Porównaj</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Comparison mode header */}
      {compareMode && compareLaps.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#161B22', borderRadius: 2, border: '1px solid #30363D' }}>
          <Typography sx={{ color: '#8B949E', fontSize: '0.75rem', mb: 1 }}>
            Porównanie okrążeń {compareLaps.map((i) => `#${i + 1}`).join(' vs ')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2 }}>
            {compareLaps.map((idx) => {
              const lap = resolvedLaps[idx];
              if (!lap) return null;
              return (
                <Box key={idx} sx={{ p: 1.5, bgcolor: '#0D1117', borderRadius: 1 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#8B949E', mb: 0.5 }}>
                    Okr. {idx + 1}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#E6EDF3' }}>
                    {formatDuration(lap.movingTimeSec)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#8B949E' }}>
                    {formatPower(lap.avgPowerW ?? 0)}
                    {lap.normalizedPowerW != null && ` · NP ${lap.normalizedPowerW} W`}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#8B949E' }}>
                    {formatDistance(lap.distanceM)}
                    {lap.powerDropPct != null && ` · ${lap.powerDropPct > 0 ? '-' : '+'}${Math.abs(lap.powerDropPct).toFixed(1)}%`}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Lap cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {resolvedLaps.map((lap, idx) => (
          <LapCard
            key={idx}
            lap={lap}
            index={idx}
            sportType={sportType}
            powerStream={powerStream}
            heartrateStream={heartrateStream}
            velocityStream={velocityStream}
            altitudeStream={altitudeStream}
            timeStream={timeStream}
            isBestPower={idx === bestPowerIdx}
            isBestNP={idx === bestNPIdx}
            isExpanded={expandedIndex === idx}
            onToggleExpand={() => handleToggleExpand(idx)}
            onHover={compareMode ? undefined : onHoverIndex}
            onSelect={() => {
              if (compareMode) {
                handleCompareToggle(idx);
              } else if (lap.startIndex != null && lap.endIndex != null && lap.endIndex > lap.startIndex) {
                handleSelect(lap.startIndex, lap.endIndex);
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
