import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { getChartVisuals } from '../utils/chartStyles';
import { PMC_COLORS } from '../utils/colors';

import type { PmcData } from '../types/analytics';

interface TrainingLoadMiniChartProps {
  data: PmcData[] | undefined;
}

const TrainingLoadMiniChart = memo(function TrainingLoadMiniChart({
  data,
}: TrainingLoadMiniChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return data.map((d) => ({
      date: d.date,
      CTL: d.ctl,
      ATL: d.atl,
      TSB: d.tsb,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Brak danych PMC. Zsynchronizuj aktywności i oblicz metryki.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid {...chart.grid} />
          <XAxis dataKey="date" {...chart.axis} />
          <YAxis {...chart.axis} />
          <Tooltip
            {...chart.tooltip}
          />
          <Line type="monotone" dataKey="CTL" stroke={PMC_COLORS.CTL} dot={false} strokeWidth={2.25} />
          <Line type="monotone" dataKey="ATL" stroke={PMC_COLORS.ATL} dot={false} strokeWidth={2.25} />
          <Line type="monotone" dataKey="TSB" stroke={PMC_COLORS.TSB} dot={false} strokeWidth={2} strokeDasharray="5 5" />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default TrainingLoadMiniChart;
