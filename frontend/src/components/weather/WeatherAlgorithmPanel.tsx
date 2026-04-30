import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AirIcon from '@mui/icons-material/Air';
import OpacityIcon from '@mui/icons-material/Opacity';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { Box, Paper, Slider, Stack, TextField, Typography } from '@mui/material';

import { alphaColor, CHART_COLORS, STATUS_COLORS, WEATHER_METRIC_COLORS } from '@/utils/colors';

interface WeatherAlgorithmPanelProps {
  profile: {
    rideWindowStartHour: number;
    rideWindowEndHour: number;
    idealTemperatureMin: number;
    idealTemperatureMax: number;
    acceptableTemperatureMin: number;
    acceptableTemperatureMax: number;
    comfortableWindMax: number;
    riskyWindMax: number;
    drizzleMmMax: number;
    rainMmMax: number;
    temperatureWeight: number;
    windWeight: number;
    precipitationWeight: number;
    conditionWeight: number;
  };
  onChange: (key: keyof WeatherAlgorithmPanelProps['profile'], value: number) => void;
}

function GroupCard({
  title,
  accentColor,
  children,
}: {
  title: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 4,
          bgcolor: accentColor,
        },
      }}
    >
      <Box sx={{ pl: 2, pr: 1.5, py: 1.25 }}>
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            fontWeight: 800,
            color: accentColor,
            fontSize: '0.7rem',
            display: 'block',
            mb: 1,
          }}
        >
          {title}
        </Typography>
        {children}
      </Box>
    </Paper>
  );
}

function CompactNumberField({
  label,
  value,
  onChange,
  adornment,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  adornment?: string;
}) {
  return (
    <TextField
      size="small"
      label={label}
      type="number"
      value={value}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (!Number.isNaN(n)) onChange(n);
      }}
      slotProps={{
        input: {
          endAdornment: adornment ? (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {adornment}
            </Typography>
          ) : undefined,
        },
        inputLabel: { sx: { fontSize: '0.75rem' } },
      }}
      sx={{
        '& .MuiInputBase-root': {
          borderRadius: 2,
          fontSize: '0.85rem',
        },
      }}
    />
  );
}

function WeightSlider({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
          {label}
        </Typography>
        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: alphaColor(color, 0.12),
            color,
            fontWeight: 700,
            fontSize: '0.75rem',
            minWidth: 28,
            textAlign: 'center',
          }}
        >
          {value}
        </Box>
      </Box>
      <Slider
        size="small"
        min={0}
        max={3}
        step={0.1}
        value={value}
        onChange={(_, v) => onChange(v as number)}
        sx={{
          color,
          '& .MuiSlider-thumb': {
            width: 14,
            height: 14,
            bgcolor: color,
          },
          '& .MuiSlider-rail': {
            opacity: 0.25,
            bgcolor: color,
          },
        }}
      />
    </Box>
  );
}

export default function WeatherAlgorithmPanel({ profile, onChange }: WeatherAlgorithmPanelProps) {
  return (
    <Stack spacing={1.5}>
      <GroupCard title="Okno jazdy" accentColor={STATUS_COLORS.info}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeIcon sx={{ color: STATUS_COLORS.info, fontSize: 18 }} />
          <CompactNumberField
            label="Start"
            value={profile.rideWindowStartHour}
            onChange={(v) => onChange('rideWindowStartHour', v)}
          />
          <Typography variant="body2" color="text.secondary" sx={{ px: 0.25 }}>
            –
          </Typography>
          <CompactNumberField
            label="Koniec"
            value={profile.rideWindowEndHour}
            onChange={(v) => onChange('rideWindowEndHour', v)}
          />
        </Stack>
      </GroupCard>

      <GroupCard title="Temperatura" accentColor={WEATHER_METRIC_COLORS.temperature}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ThermostatIcon sx={{ color: WEATHER_METRIC_COLORS.temperature, fontSize: 18 }} />
            <CompactNumberField
              label="Idealne min"
              value={profile.idealTemperatureMin}
              onChange={(v) => onChange('idealTemperatureMin', v)}
              adornment="°C"
            />
            <CompactNumberField
              label="Idealne max"
              value={profile.idealTemperatureMax}
              onChange={(v) => onChange('idealTemperatureMax', v)}
              adornment="°C"
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 18 }} />
            <CompactNumberField
              label="Akcept. min"
              value={profile.acceptableTemperatureMin}
              onChange={(v) => onChange('acceptableTemperatureMin', v)}
              adornment="°C"
            />
            <CompactNumberField
              label="Akcept. max"
              value={profile.acceptableTemperatureMax}
              onChange={(v) => onChange('acceptableTemperatureMax', v)}
              adornment="°C"
            />
          </Stack>
        </Stack>
      </GroupCard>

      <GroupCard title="Wiatr i opady" accentColor={WEATHER_METRIC_COLORS.wind}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AirIcon sx={{ color: WEATHER_METRIC_COLORS.wind, fontSize: 18 }} />
            <CompactNumberField
              label="Komfortowy"
              value={profile.comfortableWindMax}
              onChange={(v) => onChange('comfortableWindMax', v)}
              adornment="km/h"
            />
            <CompactNumberField
              label="Ryzykowny"
              value={profile.riskyWindMax}
              onChange={(v) => onChange('riskyWindMax', v)}
              adornment="km/h"
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <OpacityIcon sx={{ color: WEATHER_METRIC_COLORS.precipitation, fontSize: 18 }} />
            <CompactNumberField
              label="Maks. mżawka"
              value={profile.drizzleMmMax}
              onChange={(v) => onChange('drizzleMmMax', v)}
              adornment="mm"
            />
            <CompactNumberField
              label="Maks. deszcz"
              value={profile.rainMmMax}
              onChange={(v) => onChange('rainMmMax', v)}
              adornment="mm"
            />
          </Stack>
        </Stack>
      </GroupCard>

      <GroupCard title="Wagi algorytmu" accentColor={CHART_COLORS.primary}>
        <Stack spacing={0.75}>
          <WeightSlider
            label="Temperatura"
            value={profile.temperatureWeight}
            color={WEATHER_METRIC_COLORS.temperature}
            onChange={(v) => onChange('temperatureWeight', v)}
          />
          <WeightSlider
            label="Wiatr"
            value={profile.windWeight}
            color={WEATHER_METRIC_COLORS.wind}
            onChange={(v) => onChange('windWeight', v)}
          />
          <WeightSlider
            label="Opady"
            value={profile.precipitationWeight}
            color={WEATHER_METRIC_COLORS.precipitation}
            onChange={(v) => onChange('precipitationWeight', v)}
          />
          <WeightSlider
            label="Warunki"
            value={profile.conditionWeight}
            color={STATUS_COLORS.success}
            onChange={(v) => onChange('conditionWeight', v)}
          />
        </Stack>
      </GroupCard>
    </Stack>
  );
}
