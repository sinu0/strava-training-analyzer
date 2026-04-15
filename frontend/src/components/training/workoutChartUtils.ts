import { getZoneForPower, ZONE_COLORS_TRAINING } from '../../types/training';

import type { WorkoutStep } from '../../types/training';

export interface ChartSegment {
  startSec: number;
  endSec: number;
  powerLow: number;
  powerHigh: number;
  type: string;
}

export interface ChartDataPoint {
  timeSec: number;
  power: number;
  fill: string;
  label: string;
}

export function stepsToSegments(steps: WorkoutStep[]): ChartSegment[] {
  const segments: ChartSegment[] = [];
  let currentTime = 0;

  for (const step of steps) {
    if (step.type === 'interval' && step.repeat) {
      for (let r = 0; r < step.repeat; r++) {
        segments.push({
          startSec: currentTime,
          endSec: currentTime + (step.onDurationSec ?? 0),
          powerLow: step.onPowerPctFtpLow ?? 0,
          powerHigh: step.onPowerPctFtpHigh ?? 0,
          type: 'work',
        });
        currentTime += step.onDurationSec ?? 0;
        segments.push({
          startSec: currentTime,
          endSec: currentTime + (step.offDurationSec ?? 0),
          powerLow: step.offPowerPctFtpLow ?? 0,
          powerHigh: step.offPowerPctFtpHigh ?? 0,
          type: 'rest',
        });
        currentTime += step.offDurationSec ?? 0;
      }
    } else {
      segments.push({
        startSec: currentTime,
        endSec: currentTime + (step.durationSec ?? 0),
        powerLow: step.powerPctFtpLow ?? 0,
        powerHigh: step.powerPctFtpHigh ?? 0,
        type: step.type,
      });
      currentTime += step.durationSec ?? 0;
    }
  }

  return segments;
}

export function segmentsToDataPoints(segments: ChartSegment[]): ChartDataPoint[] {
  if (segments.length === 0) return [];

  const last = segments[segments.length - 1];
  if (!last) return [];
  const totalSec = last.endSec;
  const resolution = Math.max(1, Math.floor(totalSec / 300));
  const points: ChartDataPoint[] = [];

  for (const seg of segments) {
    const duration = seg.endSec - seg.startSec;
    const steps = Math.max(1, Math.ceil(duration / resolution));

    for (let i = 0; i < steps; i++) {
      const t = seg.startSec + i * resolution;
      if (t >= seg.endSec) break;
      const fraction = duration > 0 ? (t - seg.startSec) / duration : 0;

      let power: number;
      if (seg.type === 'warmup') {
        power = seg.powerLow + (seg.powerHigh - seg.powerLow) * fraction;
      } else if (seg.type === 'cooldown') {
        power = seg.powerHigh - (seg.powerHigh - seg.powerLow) * fraction;
      } else {
        power = (seg.powerLow + seg.powerHigh) / 2;
      }

      const zone = getZoneForPower(power);
      points.push({
        timeSec: t,
        power: Math.round(power),
        fill: ZONE_COLORS_TRAINING[zone] ?? '#8B949E',
        label: seg.type,
      });
    }
  }

  return points;
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const TYPE_LABELS: Record<string, string> = {
  warmup: 'Rozgrzewka',
  cooldown: 'Schładzanie',
  steady: 'Stały',
  work: 'Praca',
  rest: 'Odpoczynek',
};

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}
