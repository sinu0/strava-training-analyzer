import { useCallback, useRef, useState } from 'react';

import type {
  BrushRange,
  SelectionStats,
  StreamDataPoint,
} from '@/components/activity/interactiveStreams.types';

interface UseChartInteractionOptions {
  timeStream: number[] | null;
  powerStream: number[] | null;
  heartrateStream: number[] | null;
  cadenceStream: number[] | null;
  altitudeStream: number[] | null;
  velocityStream: number[] | null;
  distanceStream: number[] | null;
  onHoverIndex: (index: number | null) => void;
  onSelectionChange: (range: BrushRange | null, stats: SelectionStats | null) => void;
}

interface ChartMouseMoveState {
  activePayload?: Array<{ payload: StreamDataPoint }>;
}

interface ChartActiveLabelState {
  activeLabel?: string | number;
}

interface SelectionComputationResult {
  range: BrushRange;
  stats: SelectionStats;
}

export function useChartInteraction({
  timeStream,
  powerStream,
  heartrateStream,
  cadenceStream,
  altitudeStream,
  velocityStream,
  distanceStream,
  onHoverIndex,
  onSelectionChange,
}: UseChartInteractionOptions) {
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const [selectionRange, setSelectionRange] = useState<[number, number] | null>(null);
  const [dragging, setDragging] = useState(false);

  const isDragging = useRef(false);

  const computeStats = useCallback(
    (startTime: number, endTime: number): SelectionComputationResult | null => {
      const length = timeStream?.length ?? 0;
      if (length === 0) {
        return null;
      }

      let startIndex = -1;
      let endIndex = -1;

      for (let index = 0; index < length; index += 1) {
        const timeValue = timeStream?.[index] ?? index;
        if (startIndex < 0 && timeValue >= startTime) {
          startIndex = index;
        }
        if (timeValue <= endTime) {
          endIndex = index;
        }
      }

      if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
        return null;
      }

      let sumPower = 0;
      let powerCount = 0;
      let sumHeartRate = 0;
      let heartRateCount = 0;
      let sumCadence = 0;
      let cadenceCount = 0;
      let sumVelocity = 0;
      let velocityCount = 0;
      let elevationGain = 0;

      for (let index = startIndex; index <= endIndex; index += 1) {
        const powerValue = powerStream?.[index];
        if (powerValue != null) {
          sumPower += powerValue;
          powerCount += 1;
        }

        const heartRateValue = heartrateStream?.[index];
        if (heartRateValue != null) {
          sumHeartRate += heartRateValue;
          heartRateCount += 1;
        }

        const cadenceValue = cadenceStream?.[index];
        if (cadenceValue != null) {
          sumCadence += cadenceValue;
          cadenceCount += 1;
        }

        const velocityValue = velocityStream?.[index];
        if (velocityValue != null) {
          sumVelocity += velocityValue;
          velocityCount += 1;
        }

        if (index > startIndex) {
          const currentAltitude = altitudeStream?.[index];
          const previousAltitude = altitudeStream?.[index - 1];
          if (currentAltitude != null && previousAltitude != null) {
            const deltaAltitude = currentAltitude - previousAltitude;
            if (deltaAltitude > 0) {
              elevationGain += deltaAltitude;
            }
          }
        }
      }

      const duration = (timeStream?.[endIndex] ?? endIndex) - (timeStream?.[startIndex] ?? startIndex);
      const distance = distanceStream
        ? (distanceStream[endIndex] ?? 0) - (distanceStream[startIndex] ?? 0)
        : 0;

      return {
        range: {
          startIndex,
          endIndex,
        },
        stats: {
          avgPower: powerCount > 0 ? Math.round(sumPower / powerCount) : null,
          avgHr: heartRateCount > 0 ? Math.round(sumHeartRate / heartRateCount) : null,
          avgCadence: cadenceCount > 0 ? Math.round(sumCadence / cadenceCount) : null,
          avgSpeed: velocityCount > 0 ? Math.round((sumVelocity / velocityCount) * 36) / 10 : null,
          duration,
          distance: Math.round(distance),
          elevGain: Math.round(elevationGain),
        },
      };
    },
    [
      altitudeStream,
      cadenceStream,
      distanceStream,
      heartrateStream,
      powerStream,
      timeStream,
      velocityStream,
    ],
  );

  const handleMouseMove = useCallback(
    (state: ChartMouseMoveState) => {
      const payload = state.activePayload?.[0]?.payload;
      if (payload && !isDragging.current) {
        onHoverIndex(payload.index);
      }
    },
    [onHoverIndex],
  );

  const handleMouseLeave = useCallback(() => {
    if (!isDragging.current) {
      onHoverIndex(null);
    }
  }, [onHoverIndex]);

  const handleMouseDown = useCallback(
    (state: ChartActiveLabelState) => {
      if (state.activeLabel == null) {
        return;
      }

      isDragging.current = true;
      setDragging(true);
      setRefAreaLeft(Number(state.activeLabel));
      setRefAreaRight(null);
      setSelectionRange(null);
      onSelectionChange(null, null);
    },
    [onSelectionChange],
  );

  const handleMouseMoveForDrag = useCallback((state: ChartActiveLabelState) => {
    if (isDragging.current && state.activeLabel != null) {
      setRefAreaRight(Number(state.activeLabel));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) {
      return;
    }

    isDragging.current = false;
    setDragging(false);

    if (refAreaLeft != null && refAreaRight != null && refAreaLeft !== refAreaRight) {
      const left = Math.min(refAreaLeft, refAreaRight);
      const right = Math.max(refAreaLeft, refAreaRight);
      setSelectionRange([left, right]);

      const result = computeStats(left, right);
      if (result) {
        onSelectionChange(result.range, result.stats);
      }
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
  }, [computeStats, onSelectionChange, refAreaLeft, refAreaRight]);

  const clearSelection = useCallback(() => {
    setSelectionRange(null);
    onSelectionChange(null, null);
  }, [onSelectionChange]);

  return {
    dragging,
    refAreaLeft,
    refAreaRight,
    selectionRange,
    computeStats,
    handleMouseMove,
    handleMouseLeave,
    handleMouseDown,
    handleMouseMoveForDrag,
    handleMouseUp,
    clearSelection,
  };
}
