import { Box, Paper, Stack, Typography } from '@mui/material';
import type { LoadFocus } from '@/types/fatigue';
import { STATUS_COLORS } from '@/utils/colors';

interface TrainingLoadFocusProps {
  data: LoadFocus | undefined;
  isLoading: boolean;
}

function FocusBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, Math.max(5, value));
  const targetPct = Math.min(100, target);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mb: 0.25 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color, fontSize: '0.65rem' }}>
          {value.toFixed(1)}% (cel: ~{target}%)
        </Typography>
      </Stack>
      <Box sx={{ position: 'relative', height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.06)' }}>
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${pct}%`,
            borderRadius: 5,
            bgcolor: color,
            transition: 'width 0.4s ease',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: `${targetPct - 0.5}%`,
            top: -2,
            width: 2,
            height: 14,
            bgcolor: 'white',
            borderRadius: 1,
            opacity: 0.5,
          }}
        />
      </Box>
    </Box>
  );
}

export default function TrainingLoadFocus({ data, isLoading }: TrainingLoadFocusProps) {
  if (isLoading || !data) return null;

  const warnings: string[] = [];
  if (data.lowAerobicPct > 90) warnings.push('Za dużo niskiej intensywności — dodaj tempo/threshold');
  if (data.lowAerobicPct < 55) warnings.push('Za mało bazy — dodaj długie jazdy Z2');
  if (data.highAerobicPct > 30) warnings.push('Za dużo tempa/threshold — ryzyko zmęczenia');
  if (data.anaerobicPct > 15) warnings.push('Za dużo intensywności beztlenowej');

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.25 }}>
        Balans obciążeń — ostatnie {data.totalSeconds / 3600 < 1 ? '4 tyg' : `${Math.round(data.totalSeconds / 3600)}h`}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Porównanie czasu w strefach z optymalnym rozkładem dla fazy bazowej (80/15/5)
      </Typography>

      <FocusBar label="Low Aerobic (Z1-Z2)" value={data.lowAerobicPct} target={data.lowAerobicTarget} color={STATUS_COLORS.info} />
      <FocusBar label="High Aerobic (Z3-Z4)" value={data.highAerobicPct} target={data.highAerobicTarget} color={STATUS_COLORS.warning} />
      <FocusBar label="Anaerobic (Z5+)" value={data.anaerobicPct} target={data.anaerobicTarget} color={STATUS_COLORS.error} />

      {warnings.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 2 }}>
          {warnings.map((w) => (
            <Typography key={w} variant="caption" sx={{ color: STATUS_COLORS.warning, fontSize: '0.65rem' }}>
              ⚠ {w}
            </Typography>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
