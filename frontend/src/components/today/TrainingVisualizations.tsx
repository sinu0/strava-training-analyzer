import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

interface LoadDotMatrixProps {
  ctl: number;
  atl: number;
  form: number;
}

interface RecoveryFormGaugeProps {
  form: number;
}

const DOT_COUNT = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DotRow({ label, value, filled, color }: { label: string; value: string; filled: number; color: string }) {
  return (
    <Stack direction="row" spacing={1.1} alignItems="center">
      <Typography variant="caption" color="text.secondary" sx={{ width: 42, fontWeight: 760 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${DOT_COUNT}, 1fr)`, gap: 0.5, flex: 1 }}>
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <Box
            // Fixed visual cells; their count is derived from the current metric, not a time series.
            key={`${label}-${index}`}
            sx={{
              aspectRatio: 1,
              minWidth: 8,
              borderRadius: '50%',
              bgcolor: index < filled ? color : (theme) => alpha(theme.palette.text.secondary, 0.13),
              boxShadow: index < filled ? `0 3px 8px ${alpha(color, 0.2)}` : 'none',
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" sx={{ width: 38, textAlign: 'right', fontWeight: 780 }}>
        {value}
      </Typography>
    </Stack>
  );
}

/** Compact comparison of the current load values; it intentionally does not imply a historical time series. */
export function LoadDotMatrix({ ctl, atl, form }: LoadDotMatrixProps) {
  const theme = useTheme();
  const loadMax = Math.max(ctl, atl, 1);
  const ctlDots = clamp(Math.round((ctl / loadMax) * DOT_COUNT), 1, DOT_COUNT);
  const atlDots = clamp(Math.round((atl / loadMax) * DOT_COUNT), 1, DOT_COUNT);
  const formDots = clamp(Math.round((Math.abs(form) / 30) * DOT_COUNT), 0, DOT_COUNT);
  const formColor = form < -10
    ? theme.tokens?.status.warning ?? theme.palette.warning.main
    : form >= 5 ? theme.tokens?.status.success ?? theme.palette.success.main : theme.tokens?.chart.secondary ?? theme.palette.secondary.main;
  const secondaryColor = theme.tokens?.chart.secondary ?? theme.palette.secondary.main;
  const primaryColor = theme.tokens?.chart.primary ?? theme.palette.primary.main;

  return (
    <Box
      role="img"
      aria-label={`Porównanie obciążenia: CTL ${ctl.toFixed(1)}, ATL ${atl.toFixed(1)}, forma ${form.toFixed(1)}`}
      sx={{ mt: 2.5, p: 1.25, borderRadius: 2.5, bgcolor: (currentTheme) => currentTheme.tokens?.surfaceSubtle ?? 'rgba(255,255,255,0.025)' }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
        Bieżące natężenie
      </Typography>
      <Stack spacing={0.9}>
        <DotRow label="CTL" value={ctl.toFixed(1)} filled={ctlDots} color={secondaryColor} />
        <DotRow label="ATL" value={atl.toFixed(1)} filled={atlDots} color={primaryColor} />
        <DotRow label="FORMA" value={form.toFixed(1)} filled={formDots} color={formColor} />
      </Stack>
    </Box>
  );
}

/** Renders form on its actual -30 to +30 readiness range. */
export function RecoveryFormGauge({ form }: RecoveryFormGaugeProps) {
  const theme = useTheme();
  const position = clamp(((form + 30) / 60) * 100, 0, 100);
  const markerColor = form < -10
    ? theme.tokens?.status.warning ?? theme.palette.warning.main
    : form >= 5 ? theme.tokens?.status.success ?? theme.palette.success.main : theme.tokens?.chart.secondary ?? theme.palette.secondary.main;

  return (
    <Box role="img" aria-label={`Skala formy: ${form.toFixed(1)}, od -30 do 30`} sx={{ mt: 2.5 }}>
      <Box sx={{ position: 'relative', height: 9, borderRadius: 99, bgcolor: (currentTheme) => alpha(currentTheme.palette.text.secondary, 0.15) }}>
        <Box
          sx={{
            position: 'absolute',
            left: `${position}%`,
            top: '50%',
            width: 17,
            height: 17,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: markerColor,
            border: '3px solid',
            borderColor: 'background.paper',
            boxShadow: `0 4px 12px ${alpha(markerColor, 0.35)}`,
          }}
        />
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
        <Typography variant="caption" color="text.secondary">Zmęczenie −30</Typography>
        <Typography variant="caption" sx={{ color: markerColor, fontWeight: 800 }}>Forma {form.toFixed(1)}</Typography>
        <Typography variant="caption" color="text.secondary">Świeżość +30</Typography>
      </Stack>
    </Box>
  );
}
