import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { SegmentEffort } from '@/types/segments';

export default function SegmentProgressChart({ efforts }: { efforts: SegmentEffort[] }) {
  const data = useMemo(() => [...efforts]
    .filter(effort => effort.elapsedTimeSec != null)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .map(effort => ({
      date: effort.startedAt,
      elapsedTimeSec: effort.elapsedTimeSec,
      label: new Date(effort.startedAt).toLocaleDateString('pl-PL'),
    })), [efforts]);

  if (data.length === 0) return null;
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>Progres czasu</Typography>
      <Box sx={{ height: 230 }} aria-label="Wykres progresu własnych prób segmentu">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={value => new Date(String(value)).toLocaleDateString('pl-PL')} />
            <YAxis reversed unit=" s" domain={['dataMin - 3', 'dataMax + 3']} />
            <Tooltip labelFormatter={value => new Date(String(value)).toLocaleString('pl-PL')} formatter={value => [`${Number(value)} s`, 'Czas']} />
            <Line type="monotone" dataKey="elapsedTimeSec" name="Czas" stroke="#ff6b35" strokeWidth={2.5} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
