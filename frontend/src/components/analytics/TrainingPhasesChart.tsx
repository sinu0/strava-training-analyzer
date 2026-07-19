import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';

import { useTrainingPhases } from '../../hooks/useTrainingTrends';
import { getChartVisuals } from '../../utils/chartStyles';

const PHASE_COLORS: Record<string, string> = {
  BASE: '#4caf50',
  BUILD: '#ff9800',
  PEAK: '#f44336',
  RECOVERY: '#2196f3',
};

const PHASE_LABELS: Record<string, string> = {
  BASE: 'Baza',
  BUILD: 'Budowanie',
  PEAK: 'Szczyt',
  RECOVERY: 'Odpoczynek',
};

interface TrainingPhasesChartProps {
  from: string;
  to: string;
}

export default function TrainingPhasesChart({ from, to }: TrainingPhasesChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const { data, isLoading } = useTrainingPhases(from, to);

  const chartData = useMemo(() => {
    if (!data?.phases) return [];
    return data.phases.map((p) => ({
      week: p.weekLabel,
      tss: Math.round(p.totalTss),
      phase: p.phase,
      ctl: Math.round(p.avgCtl),
      tsb: Math.round(p.avgTsb),
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Paper sx={{ p: { xs: 2, md: 2.5 }, border: '1px solid', borderColor: 'divider' }}>
        <Typography color="text.secondary">Ładowanie faz treningowych…</Typography>
      </Paper>
    );
  }

  if (!data) return null;

  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" fontWeight={600}>
            Fazy treningowe
          </Typography>
          <Stack direction="row" spacing={0.5}>
            {Object.entries(PHASE_LABELS).map(([key, label]) => (
              <Chip
                key={key}
                label={label}
                size="small"
                sx={{
                  backgroundColor: PHASE_COLORS[key],
                  color: '#fff',
                  fontSize: 11,
                }}
              />
            ))}
          </Stack>
        </Stack>

        {!!data.currentPhase && (
          <Alert
            severity="info"
            icon={false}
            sx={{ bgcolor: (currentTheme) => currentTheme.tokens?.activeOverlay ?? 'rgba(252,76,2,0.11)', border: '1px solid', borderColor: 'divider' }}
          >
            <Typography variant="body2">
              <strong>Aktualna faza:</strong> {PHASE_LABELS[data.currentPhase] || data.currentPhase}
              {!!data.recommendation && ` — ${data.recommendation}`}
            </Typography>
          </Alert>
        )}

        <Box sx={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="week" {...chart.axis} />
              <YAxis {...chart.axis} unit=" TSS" />
              <Tooltip
                {...chart.tooltip}
                labelFormatter={(label) => `Tydzień: ${label}`}
                formatter={(value) => [`${value} TSS`, 'Obciążenie']}
              />
              <Bar dataKey="tss" radius={chart.barRadius}>
                {chartData.map((entry) => (
                  <Cell key={entry.week} fill={PHASE_COLORS[entry.phase] || '#666'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Typography variant="caption" color="text.secondary" textAlign="center">
          Ocena periodyzacji: {data.periodizationScore}/100
        </Typography>
      </Stack>
    </Paper>
  );
}
