import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

import { useWPrimeBalance } from '../../hooks/usePowerAnalysis';

interface WPrimeBalanceChartProps {
  activityId: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function WPrimeBalanceChart({ activityId }: WPrimeBalanceChartProps) {
  const { data, isLoading } = useWPrimeBalance(activityId);

  const chartData = useMemo(() => {
    if (!data?.balanceOverTime) return [];
    const step = Math.max(1, Math.floor(data.balanceOverTime.length / 500));
    return data.balanceOverTime
      .filter((_, i) => i % step === 0)
      .map((bal, i) => ({
        time: i * step,
        balance: Math.round(bal),
        pct: Math.round((bal / data.wPrime) * 100),
      }));
  }, [data]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, backgroundColor: '#0D1117', border: '1px solid #30363D' }}>
        <Typography color="text.secondary">Ładowanie W&apos; Balance…</Typography>
      </Paper>
    );
  }

  if (!data) return null;

  const minPct = Math.round((data.minBalance / data.wPrime) * 100);

  return (
    <Paper sx={{ p: 2, backgroundColor: '#0D1117', border: '1px solid #30363D' }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          W&apos; Balance
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={`CP: ${Math.round(data.criticalPower)} W`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`W': ${Math.round(data.wPrime / 1000)} kJ`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Min: ${minPct}%`}
            size="small"
            color={minPct < 25 ? 'error' : minPct < 50 ? 'warning' : 'success'}
          />
          <Chip
            label={`Wyczerpania: ${data.depletionEvents}`}
            size="small"
            color={data.depletionEvents > 3 ? 'error' : 'default'}
          />
          <Chip
            label={`< 50%: ${formatTime(data.secondsBelowFiftyPct)}`}
            size="small"
            variant="outlined"
          />
        </Stack>

        <Box sx={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="wBalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#58a6ff" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#8B949E"
                fontSize={11}
                tickFormatter={formatTime}
              />
              <YAxis stroke="#8B949E" fontSize={11} unit="%" domain={[0, 100]} dataKey="pct" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: 8,
                }}
                labelFormatter={(label) => formatTime(Number(label ?? 0))}
                formatter={(value) => [`${Number(value ?? 0)}%`, "W' Balance"]}
              />
              <ReferenceLine y={50} stroke="#ffc107" strokeDasharray="3 3" label={{ value: '50%', fill: '#ffc107', fontSize: 10 }} />
              <ReferenceLine y={25} stroke="#f44336" strokeDasharray="3 3" label={{ value: '25%', fill: '#f44336', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#58a6ff"
                fill="url(#wBalGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Stack>
    </Paper>
  );
}
