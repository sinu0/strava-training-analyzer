import { Box, Typography, Grid } from '@mui/material';
import { useState } from 'react';

import DateRangePicker from './common/DateRangePicker';
import { useComparePeriods } from '../hooks/useAnalytics';
import { formatDistance, formatDuration } from '../utils/formatters';

function defaultRange(monthsAgo: number) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const to = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function SeasonComparison() {
  const [period1, setPeriod1] = useState(defaultRange(2));
  const [period2, setPeriod2] = useState(defaultRange(1));
  const { data } = useComparePeriods(period1, period2);

  const p1 = data?.[0];
  const p2 = data?.[1];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Okres 1</Typography>
          <DateRangePicker
            startDate={period1.from}
            endDate={period1.to}
            onChange={(from, to) => setPeriod1({ from, to })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Okres 2</Typography>
          <DateRangePicker
            startDate={period2.from}
            endDate={period2.to}
            onChange={(from, to) => setPeriod2({ from, to })}
          />
        </Grid>
      </Grid>

      {p1 && p2 ? (
        <Grid container spacing={2}>
          {[
            { label: 'Aktywności', v1: p1.activityCount, v2: p2.activityCount },
            { label: 'Dystans', v1: formatDistance(p1.totalDistanceM), v2: formatDistance(p2.totalDistanceM) },
            { label: 'Czas', v1: formatDuration(p1.totalTimeSec), v2: formatDuration(p2.totalTimeSec) },
            { label: 'Wzniesienie', v1: `${Math.round(p1.totalElevationM)} m`, v2: `${Math.round(p2.totalElevationM)} m` },
          ].map(({ label, v1, v2 }) => (
            <Grid item xs={6} md={3} key={label}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body1">{v1}</Typography>
                <Typography variant="body2" color="text.secondary">vs</Typography>
                <Typography variant="body1">{v2}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Wybierz dwa okresy do porównania.
        </Typography>
      )}
    </Box>
  );
}
