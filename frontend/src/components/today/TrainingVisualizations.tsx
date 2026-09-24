import { Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { DotMatrixRow, ProgressTrack, Surface, useTokens } from '@/ui';

interface LoadDotMatrixProps {
  ctl: number;
  atl: number;
  form: number;
}

const DOT_COUNT = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useFormColor(form: number) {
  const theme = useTheme();
  const tokens = useTokens();
  if (form < -10) return theme.palette.warning.main;
  if (form >= 5) return theme.palette.success.main;
  return tokens.chart.secondary;
}

/** Compact comparison of the current load values; it intentionally does not imply a historical time series. */
export function LoadDotMatrix({ ctl, atl, form }: LoadDotMatrixProps) {
  const tokens = useTokens();
  const formColor = useFormColor(form);
  const loadMax = Math.max(ctl, atl, 1);

  return (
    <Surface
      variant="muted"
      padding="none"
      role="img"
      aria-label={`Porównanie obciążenia: CTL ${ctl.toFixed(1)}, ATL ${atl.toFixed(1)}, forma ${form.toFixed(1)}`}
      radius="panel"
      sx={{ mt: 2.5, p: 1.5 }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 700 }}>
        Bieżące natężenie
      </Typography>
      <Stack spacing={0.9}>
        <DotMatrixRow label="CTL" valueLabel={ctl.toFixed(1)} filled={clamp((ctl / loadMax) * DOT_COUNT, 1, DOT_COUNT)} total={DOT_COUNT} color={tokens.chart.secondary} />
        <DotMatrixRow label="ATL" valueLabel={atl.toFixed(1)} filled={clamp((atl / loadMax) * DOT_COUNT, 1, DOT_COUNT)} total={DOT_COUNT} color={tokens.chart.primary} />
        <DotMatrixRow label="FORMA" valueLabel={form.toFixed(1)} filled={clamp((Math.abs(form) / 30) * DOT_COUNT, 0, DOT_COUNT)} total={DOT_COUNT} color={formColor} />
      </Stack>
    </Surface>
  );
}

/** Renders form on its actual -30 to +30 readiness range. */
export function RecoveryFormGauge({ form }: { form: number }) {
  const markerColor = useFormColor(form);
  return (
    <Stack sx={{ mt: 2.5 }} spacing={0.75}>
      <ProgressTrack
        mode="marker"
        size="md"
        value={clamp(((form + 30) / 60) * 100, 0, 100)}
        color={markerColor}
        ariaLabel={`Skala formy: ${form.toFixed(1)}, od -30 do 30`}
      />
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Zmęczenie −30</Typography>
        <Typography variant="caption" sx={{ color: markerColor, fontWeight: 800 }}>Forma {form.toFixed(1)}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Świeżość +30</Typography>
      </Stack>
    </Stack>
  );
}
