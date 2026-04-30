import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';

import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon';
import {
  CHART_COLORS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
} from '@/utils/colors';

import { StatusChip, formatTimestamp } from './adminUtils';
import DataCard from '../common/DataCard';

export interface WeatherLocation {
  id: string;
  name: string;
  active: boolean;
}

export interface WeatherJobStatus {
  status: string;
  lastRunAt: string | null;
  locationsProcessed: number;
  locationsFailed: number;
  errorMessage: string | null;
}

export interface WeatherJobSectionProps {
  weatherJobStatus: WeatherJobStatus | undefined;
  weatherLocations: WeatherLocation[] | undefined;
  refreshWeatherPending: boolean;
  refreshAllWeatherPending: boolean;
  onRefreshWeather: (name: string) => void;
  onRefreshAllWeather: () => void;
}

export default function WeatherJobSection({
  weatherJobStatus,
  weatherLocations,
  refreshWeatherPending,
  refreshAllWeatherPending,
  onRefreshWeather,
  onRefreshAllWeather,
}: WeatherJobSectionProps) {
  return (
    <DataCard title="Cache pogody">
      <Box sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <WeatherConditionIcon kind="sunny" size={28} alt="" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Automatyczne odświeżanie
            </Typography>
            <Typography variant="caption" sx={{ color: STATUS_COLORS.success, fontWeight: 600 }}>
              Codziennie o 06:00 i 18:00
            </Typography>
          </Box>
        </Box>

        {/* Job execution status */}
        <Box sx={{
          p: 1.5, borderRadius: 1.5, mb: 2,
          bgcolor: SURFACE_COLORS.subtle,
          border: `1px solid ${SURFACE_COLORS.border}`,
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
            OSTATNIE WYKONANIE
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">Status:</Typography>
              <StatusChip status={weatherJobStatus?.status ?? 'idle'} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Czas wykonania:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {formatTimestamp(weatherJobStatus?.lastRunAt ?? null)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Lokalizacje przetworzone:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: STATUS_COLORS.success }}>
                {weatherJobStatus?.locationsProcessed ?? 0}
              </Typography>
            </Box>
            {(weatherJobStatus?.locationsFailed ?? 0) > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Błędy:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: STATUS_COLORS.error }}>
                  {weatherJobStatus?.locationsFailed}
                </Typography>
              </Box>
            )}
            {!!weatherJobStatus?.errorMessage && (
              <Typography variant="caption" sx={{ color: STATUS_COLORS.error, fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
                {weatherJobStatus.errorMessage}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Locations list */}
        <Box sx={{
          p: 1.5, borderRadius: 1.5, mb: 2,
          bgcolor: SURFACE_COLORS.subtle,
          border: `1px solid ${SURFACE_COLORS.border}`,
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
            LOKALIZACJE ({weatherLocations?.length ?? 0})
          </Typography>
          <Stack spacing={0.5}>
            {weatherLocations?.map((loc) => (
              <Box key={loc.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {loc.active ? (
                    <CheckCircleIcon sx={{ fontSize: 14, color: STATUS_COLORS.success }} />
                  ) : (
                    <Box sx={{ width: 14 }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: loc.active ? 700 : 400 }}>
                    {loc.name}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => onRefreshWeather(loc.name)}
                  disabled={refreshWeatherPending || refreshAllWeatherPending}
                  sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', color: STATUS_COLORS.info }}
                >
                  Odśwież
                </Button>
              </Box>
            ))}
            {(!weatherLocations || weatherLocations.length === 0) && (
              <Typography variant="caption" color="text.secondary">
                Brak lokalizacji — dodaj w widżecie pogody na dashboardzie.
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Refresh all */}
        <Button
          variant="contained"
          startIcon={
            refreshAllWeatherPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <WeatherConditionIcon kind="sunny" size={16} alt="" />
            )
          }
          onClick={onRefreshAllWeather}
          disabled={refreshAllWeatherPending}
          fullWidth
          sx={{
            textTransform: 'none',
            bgcolor: CHART_COLORS.secondary,
            '&:hover': { bgcolor: alphaColor(CHART_COLORS.secondary, 0.82) },
            fontWeight: 600,
            color: 'background.default',
          }}
        >
          Odśwież cache wszystkich lokalizacji
        </Button>
      </Box>
    </DataCard>
  );
}
