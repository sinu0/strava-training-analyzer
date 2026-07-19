import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

import { useRaceReadiness } from '../../hooks/useTrainingTrends';
import { getChartVisuals } from '../../utils/chartStyles';

const FORM_COLORS: Record<string, string> = {
  'Świetna': '#4caf50',
  'Dobra': '#8bc34a',
  'Przeciętna': '#ff9800',
  'Zmęczony': '#f44336',
};

export default function RaceReadinessCard() {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const [raceDate, setRaceDate] = useState<string>('');
  const { data, isLoading } = useRaceReadiness(raceDate || null);

  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          Gotowość na wyścig
        </Typography>

        <TextField
          type="date"
          size="small"
          label="Data wyścigu"
          value={raceDate}
          onChange={(e) => setRaceDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: new Date().toISOString().split('T')[0] }}
          fullWidth
        />

        {!!isLoading && (
          <Typography color="text.secondary" variant="body2">
            Obliczanie projekcji…
          </Typography>
        )}

        {!!data && <>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={`Forma: ${data.formAssessment}`}
                sx={{
                  backgroundColor: FORM_COLORS[data.formAssessment] || '#666',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
              <Chip label={`Za ${data.daysUntilRace} dni`} size="small" variant="outlined" />
              <Chip label={`CTL: ${Math.round(data.currentCtl)} → ${Math.round(data.projectedCtl)}`} size="small" variant="outlined" />
              <Chip label={`TSB: ${Math.round(data.currentTsb)} → ${Math.round(data.projectedTsb)}`} size="small" variant="outlined" />
            </Stack>

            <Alert
              severity="info"
              icon={false}
              sx={{ bgcolor: (currentTheme) => currentTheme.tokens?.activeOverlay ?? 'rgba(252,76,2,0.11)', border: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant="body2">{data.taperRecommendation}</Typography>
            </Alert>

            {data.projections.length > 0 && (
              <Box sx={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={data.projections} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="date" {...chart.axis} />
                    <YAxis {...chart.axis} />
                    <Tooltip
                      {...chart.tooltip}
                    />
                    <Legend {...chart.legend} />
                    <ReferenceLine y={0} stroke={theme.tokens?.chart.grid ?? theme.palette.divider} />
                    <Line type="monotone" dataKey="ctl" stroke="#4caf50" name="CTL" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="atl" stroke="#f44336" name="ATL" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="tsb" stroke={theme.tokens?.chart.tertiary ?? theme.palette.info.main} name="TSB" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </>}
      </Stack>
    </Paper>
  );
}
