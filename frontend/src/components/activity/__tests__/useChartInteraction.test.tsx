import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useChartInteraction } from '@/components/activity/useChartInteraction';

describe('useChartInteraction', () => {
  it('updates hover state outside of drag operations', () => {
    const onHoverIndex = vi.fn();

    const { result } = renderHook(() =>
      useChartInteraction({
        timeStream: [0, 10, 20, 30],
        powerStream: [100, 150, 200, 250],
        heartrateStream: [120, 125, 130, 135],
        cadenceStream: [80, 82, 84, 86],
        altitudeStream: [100, 105, 103, 110],
        velocityStream: [8, 9, 10, 11],
        distanceStream: [0, 100, 250, 450],
        onHoverIndex,
        onSelectionChange: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleMouseMove({
        activePayload: [{
          payload: {
            index: 2,
            time: 20,
            power: 200,
            hr: 130,
            cadence: 84,
            altitude: 103,
            velocity: 10,
          },
        }],
      });
    });

    act(() => {
      result.current.handleMouseLeave();
    });

    expect(onHoverIndex).toHaveBeenNthCalledWith(1, 2);
    expect(onHoverIndex).toHaveBeenNthCalledWith(2, null);
  });

  it('calculates selection stats for the dragged range', () => {
    const onSelectionChange = vi.fn();

    const { result } = renderHook(() =>
      useChartInteraction({
        timeStream: [0, 10, 20, 30],
        powerStream: [100, 150, 200, 250],
        heartrateStream: [120, 125, 130, 135],
        cadenceStream: [80, 82, 84, 86],
        altitudeStream: [100, 105, 103, 110],
        velocityStream: [8, 9, 10, 11],
        distanceStream: [0, 100, 250, 450],
        onHoverIndex: vi.fn(),
        onSelectionChange,
      }),
    );

    act(() => {
      result.current.handleMouseDown({ activeLabel: 10 });
    });

    act(() => {
      result.current.handleMouseMoveForDrag({ activeLabel: 30 });
    });

    act(() => {
      result.current.handleMouseUp();
    });

    expect(result.current.selectionRange).toEqual([10, 30]);
    expect(onSelectionChange).toHaveBeenNthCalledWith(1, null, null);
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, {
      startIndex: 1,
      endIndex: 3,
    }, {
      avgPower: 200,
      avgHr: 130,
      avgCadence: 84,
      avgSpeed: 36,
      duration: 20,
      distance: 350,
      elevGain: 7,
    });

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectionRange).toBeNull();
    expect(onSelectionChange).toHaveBeenLastCalledWith(null, null);
  });
});
