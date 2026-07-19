import { Box, Typography, Grid } from '@mui/material';
import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
} from 'recharts';

import type { ActivityDetail } from '@/types/activity';

interface AdvancedStatsTabProps {
  activity: ActivityDetail;
}

const PEAK_DURATIONS = [1, 5, 30, 60, 300, 1200, 3600];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        p: 3,
        mb: 3,
      }}
    >
      <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: 'text.primary', mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function StatRow({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  if (value == null || value === '') return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>{label}</Typography>
      <Typography color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}{unit ? ` ${unit}` : ''}
      </Typography>
    </Box>
  );
}

function computeQuartiles(data: number[]) {
  if (data.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0, stdDev: 0 };
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = data.reduce((s, v) => s + v, 0) / n;
  const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const q = (p: number) => {
    const idx = p * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
  };
  return {
    min: sorted[0]!,
    q1: Math.round(q(0.25) * 10) / 10,
    median: Math.round(q(0.5) * 10) / 10,
    q3: Math.round(q(0.75) * 10) / 10,
    max: sorted[n - 1]!,
    mean: Math.round(mean * 10) / 10,
    stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
  };
}

function buildHistogram(data: number[], buckets: number = 20) {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  if (min === max) return [{ range: `${min}`, count: data.length }];
  const binSize = (max - min) / buckets;
  const bins = new Array(buckets).fill(0) as number[];
  for (const v of data) {
    const idx = Math.min(Math.floor((v - min) / binSize), buckets - 1);
    bins[idx] = (bins[idx] ?? 0) + 1;
  }
  return bins.map((count, i) => ({ range: `${Math.round(min + i * binSize)}`, count }));
}

function computePeaks(data: number[], durations: number[]) {
  const labels = ['1s', '5s', '30s', '1min', '5min', '20min', '60min'];
  const results: { duration: string; value: number }[] = [];
  for (let di = 0; di < durations.length; di++) {
    const w = durations[di]!;
    if (w > data.length) break;
    let windowSum = 0;
    for (let i = 0; i < w; i++) windowSum += data[i]!;
    let maxAvg = windowSum / w;
    for (let i = w; i < data.length; i++) {
      windowSum += data[i]! - data[i - w]!;
      const avg = windowSum / w;
      if (avg > maxAvg) maxAvg = avg;
    }
    results.push({ duration: labels[di]!, value: Math.round(maxAvg * 10) / 10 });
  }
  return results;
}

export default function AdvancedStatsTab({ activity }: AdvancedStatsTabProps) {
  const hasPower = !!activity.powerStream && activity.powerStream.length > 0;
  const hasHr = !!activity.heartrateStream && activity.heartrateStream.length > 0;
  const hasCadence = !!activity.cadenceStream && activity.cadenceStream.length > 0;
  const hasAny = hasPower || hasHr || hasCadence;

  const powerStats = useMemo(() => hasPower ? computeQuartiles(activity.powerStream!) : null, [activity.powerStream, hasPower]);
  const hrStats = useMemo(() => hasHr ? computeQuartiles(activity.heartrateStream!) : null, [activity.heartrateStream, hasHr]);
  const cadStats = useMemo(() => hasCadence ? computeQuartiles(activity.cadenceStream!) : null, [activity.cadenceStream, hasCadence]);

  const powerPeaks = useMemo(() => hasPower ? computePeaks(activity.powerStream!, PEAK_DURATIONS) : [], [activity.powerStream, hasPower]);
  const hrPeaks = useMemo(() => hasHr ? computePeaks(activity.heartrateStream!, PEAK_DURATIONS) : [], [activity.heartrateStream, hasHr]);

  const powerHist = useMemo(() => hasPower ? buildHistogram(activity.powerStream!.filter(v => v > 0), 25) : [], [activity.powerStream, hasPower]);
  const hrHist = useMemo(() => hasHr ? buildHistogram(activity.heartrateStream!.filter(v => v > 0), 20) : [], [activity.heartrateStream, hasHr]);

  const driftData = useMemo(() => {
    if (!hasPower || !hasHr) return [];
    const power = activity.powerStream!;
    const hr = activity.heartrateStream!;
    const len = Math.min(power.length, hr.length);
    const windowSize = 300;
    const points: { power: number; hr: number }[] = [];
    for (let i = 0; i + windowSize <= len; i += windowSize) {
      let sumP = 0, sumH = 0;
      for (let j = i; j < i + windowSize; j++) {
        sumP += power[j]!;
        sumH += hr[j]!;
      }
      points.push({ power: Math.round(sumP / windowSize), hr: Math.round(sumH / windowSize) });
    }
    return points;
  }, [activity.powerStream, activity.heartrateStream, hasPower, hasHr]);

  if (!hasAny) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">Brak danych strumieni do analizy zaawansowanej.</Typography>
      </Box>
    );
  }

  const tooltipStyle = { backgroundColor: '#21262D', border: '1px solid #30363D', borderRadius: 8, fontSize: 12 };

  return (
    <Box>
      {/* Peak Efforts */}
      {(powerPeaks.length > 0 || hrPeaks.length > 0) && (
        <Section title="Najlepsze wysiłki (Peak Efforts)">
          <Grid container spacing={3}>
            {powerPeaks.length > 0 && (
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Typography sx={{ color: '#8B949E', fontSize: '0.8rem', mb: 1, fontWeight: 600 }}>⚡ Moc (W)</Typography>
                {powerPeaks.map(p => <StatRow key={p.duration} label={p.duration} value={p.value} unit="W" />)}
              </Grid>
            )}
            {hrPeaks.length > 0 && (
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Typography sx={{ color: '#8B949E', fontSize: '0.8rem', mb: 1, fontWeight: 600 }}>❤ Tętno (bpm)</Typography>
                {hrPeaks.map(p => <StatRow key={p.duration} label={p.duration} value={p.value} unit="bpm" />)}
              </Grid>
            )}
          </Grid>
        </Section>
      )}
      {/* Quartile Analysis */}
      <Section title="Analiza statystyczna">
        <Grid container spacing={3}>
          {!!powerStats && (
            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <Typography sx={{ color: '#FF6B35', fontSize: '0.8rem', mb: 1, fontWeight: 600 }}>⚡ Moc (W)</Typography>
              <StatRow label="Średnia" value={powerStats.mean} unit="W" />
              <StatRow label="Mediana" value={powerStats.median} unit="W" />
              <StatRow label="Odch. std." value={powerStats.stdDev} unit="W" />
              <StatRow label="Q1 (25%)" value={powerStats.q1} unit="W" />
              <StatRow label="Q3 (75%)" value={powerStats.q3} unit="W" />
              <StatRow label="Min" value={powerStats.min} unit="W" />
              <StatRow label="Max" value={powerStats.max} unit="W" />
            </Grid>
          )}
          {!!hrStats && (
            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <Typography sx={{ color: '#F85149', fontSize: '0.8rem', mb: 1, fontWeight: 600 }}>❤ Tętno (bpm)</Typography>
              <StatRow label="Średnia" value={hrStats.mean} unit="bpm" />
              <StatRow label="Mediana" value={hrStats.median} unit="bpm" />
              <StatRow label="Odch. std." value={hrStats.stdDev} unit="bpm" />
              <StatRow label="Q1 (25%)" value={hrStats.q1} unit="bpm" />
              <StatRow label="Q3 (75%)" value={hrStats.q3} unit="bpm" />
              <StatRow label="Min" value={hrStats.min} unit="bpm" />
              <StatRow label="Max" value={hrStats.max} unit="bpm" />
            </Grid>
          )}
          {!!cadStats && (
            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <Typography sx={{ color: '#4ECDC4', fontSize: '0.8rem', mb: 1, fontWeight: 600 }}>🔄 Kadencja (rpm)</Typography>
              <StatRow label="Średnia" value={cadStats.mean} unit="rpm" />
              <StatRow label="Mediana" value={cadStats.median} unit="rpm" />
              <StatRow label="Odch. std." value={cadStats.stdDev} unit="rpm" />
              <StatRow label="Q1 (25%)" value={cadStats.q1} unit="rpm" />
              <StatRow label="Q3 (75%)" value={cadStats.q3} unit="rpm" />
            </Grid>
          )}
        </Grid>
      </Section>
      {/* Distribution Histograms */}
      {(powerHist.length > 0 || hrHist.length > 0) && (
        <Section title="Rozkład danych">
          <Grid container spacing={3}>
            {powerHist.length > 0 && (
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Typography sx={{ color: '#8B949E', fontSize: '0.75rem', mb: 1 }}>Rozkład mocy (W)</Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={powerHist}>
                      <CartesianGrid stroke="#30363D" strokeDasharray="3 3" />
                      <XAxis dataKey="range" stroke="#8B949E" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                      <YAxis stroke="#8B949E" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#FF6B35" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            )}
            {hrHist.length > 0 && (
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Typography sx={{ color: '#8B949E', fontSize: '0.75rem', mb: 1 }}>Rozkład tętna (bpm)</Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hrHist}>
                      <CartesianGrid stroke="#30363D" strokeDasharray="3 3" />
                      <XAxis dataKey="range" stroke="#8B949E" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                      <YAxis stroke="#8B949E" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#F85149" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            )}
          </Grid>
        </Section>
      )}
      {/* Cardiac Drift */}
      {driftData.length > 2 && (
        <Section title="Dryfowanie sercowe (Cardiac Drift)">
          <Typography sx={{ color: '#8B949E', fontSize: '0.75rem', mb: 2 }}>
            Średnia moc vs tętno w 5-minutowych oknach — wzrostowy trend wskazuje na dryfowanie sercowe.
          </Typography>
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#30363D" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="power" name="Moc" unit="W" stroke="#8B949E" tick={{ fontSize: 10 }} />
                <YAxis type="number" dataKey="hr" name="Tętno" unit="bpm" stroke="#8B949E" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Scatter data={driftData} fill="#FF6B35" fillOpacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        </Section>
      )}
    </Box>
  );
}
