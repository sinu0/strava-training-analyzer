import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useState, useMemo, useCallback } from 'react';

import type { ActivityLap } from '@/types/activity';
import { Surface } from '@/ui';
import { formatDuration, formatDistance, formatPower } from '@/utils/formatters';

import LapCard from './LapCard';
import { activityMessages } from './messages';

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
  const t = activityMessages.useT();
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
        <Typography sx={{ color: 'text.secondary' }}>{t('lapsTab.noLaps')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {t('lapsTab.lapsCount', { count: resolvedLaps.length })}
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
        >
          <ToggleButton value="view">{t('lapsTab.viewMode')}</ToggleButton>
          <ToggleButton value="compare">{t('lapsTab.compareMode')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Comparison mode header */}
      {!!compareMode && compareLaps.length > 0 && (
        <Surface variant="muted" padding="sm" radius="panel" sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
            {t('lapsTab.comparisonTitle')} {compareLaps.map((i) => `#${i + 1}`).join(' vs ')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2 }}>
            {compareLaps.map((idx) => {
              const lap = resolvedLaps[idx];
              if (!lap) return null;
              return (
                <Surface key={idx} padding="none" radius="panel" sx={{ p: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                    {t('lapsTab.lapShort', { index: idx + 1 })}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatDuration(lap.movingTimeSec)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {formatPower(lap.avgPowerW ?? 0)}
                    {lap.normalizedPowerW != null && ` · NP ${lap.normalizedPowerW} W`}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {formatDistance(lap.distanceM)}
                    {lap.powerDropPct != null && ` · ${lap.powerDropPct > 0 ? '-' : '+'}${Math.abs(lap.powerDropPct).toFixed(1)}%`}
                  </Typography>
                </Surface>
              );
            })}
          </Box>
        </Surface>
      )}

      {/* Lap cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {resolvedLaps.map((lap, idx) => (
          <LapCard
            key={lap.lapIndex}
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
