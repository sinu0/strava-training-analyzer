
import AirIcon from '@mui/icons-material/Air';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import LightModeIcon from '@mui/icons-material/LightMode';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { Box, Button, Chip, Divider, LinearProgress, Popover, Stack, Tooltip, Typography } from '@mui/material';
import { useState, type MouseEvent } from 'react';

import {
  WEATHER_SCORE_LEGEND,
  formatDayName,
  getCyclistForDay,
  getGradientColor,
  getTodayData,
  isToday,
} from '@/components/weather/weatherWidgetUtils';
import type { GradientDay, HourScore, WeatherGradient } from '@/types/analytics';
import {
  CHART_COLORS,
  STATUS_COLORS,
  WEATHER_METRIC_COLORS,
  alphaColor,
} from '@/utils/colors';
import { getWeatherIllustrationPath } from '@/utils/illustrationAssets';
import { getScoreColor, getScoreLabel } from '@/utils/scoreColor';

interface WeatherForecastViewsProps {
  gradient: WeatherGradient;
  view: 'today' | 'week';
  onViewChange: (view: 'today' | 'week') => void;
}

interface GradientStripProps {
  hours: HourScore[];
  bestStart?: string;
  bestEnd?: string;
}

function GradientStrip({ hours, bestStart, bestEnd }: GradientStripProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedHour, setSelectedHour] = useState<HourScore | null>(null);

  const handleClick = (event: MouseEvent<HTMLElement>, hour: HourScore) => {
    setAnchorEl(event.currentTarget);
    setSelectedHour(hour);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedHour(null);
  };

  const denominator = Math.max(hours.length - 1, 1);
  const stops = hours.map((hour, index) => {
    const percentage = (index / denominator) * 100;
    const hourNumber = parseInt(hour.hour.split(':')[0] ?? '0', 10);
    const color = getGradientColor(hour.score);
    const opacity = hourNumber < 6 || hourNumber > 22 ? 0.3 : 1;
    return { percentage, color, opacity };
  });

  const gradientStops = stops
    .map(({ percentage, color, opacity }) => {
      const red = parseInt(color.slice(1, 3), 16);
      const green = parseInt(color.slice(3, 5), 16);
      const blue = parseInt(color.slice(5, 7), 16);
      return `rgba(${red},${green},${blue},${opacity}) ${percentage.toFixed(1)}%`;
    })
    .join(', ');

  const bestStartHr = bestStart ? parseInt(bestStart.split(':')[0] ?? '0', 10) : -1;
  const bestEndHr = bestEnd ? parseInt(bestEnd.split(':')[0] ?? '0', 10) : -1;

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          height: 18,
          borderRadius: 1,
          background: `linear-gradient(to right, ${gradientStops})`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {bestStartHr >= 0 && bestEndHr > bestStartHr && (
          <Box
            sx={{
              position: 'absolute',
              left: `${(bestStartHr / 24) * 100}%`,
              width: `${((bestEndHr - bestStartHr) / 24) * 100}%`,
              top: 0,
              bottom: 0,
              borderTop: `2px solid ${CHART_COLORS.primary}`,
              borderBottom: `2px solid ${CHART_COLORS.primary}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
        }}
      >
        {hours.map((hour) => (
          <Tooltip key={hour.hour} title={`${hour.hour} — ${hour.score}/100`}>
            <Box
              component="button"
              type="button"
              aria-label={`Pogoda dla ${hour.hour}`}
              sx={{
                flex: 1,
                minWidth: 0,
                cursor: 'pointer',
                border: 0,
                p: 0,
                m: 0,
                background: 'transparent',
              }}
              onClick={(event) => handleClick(event, hour)}
            />
          </Tooltip>
        ))}
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { p: 1.5, minWidth: 180, borderRadius: 2 } } }}
      >
        {!!selectedHour && (
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {selectedHour.hour}
            </Typography>
            <Divider />
            <Stack direction="row" spacing={1} alignItems="center">
              <ThermostatIcon fontSize="small" sx={{ color: WEATHER_METRIC_COLORS.temperature }} />
              <Typography variant="body2">{Math.round(selectedHour.temperature)}°C</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <AirIcon fontSize="small" sx={{ color: WEATHER_METRIC_COLORS.wind }} />
              <Typography variant="body2">{Math.round(selectedHour.windSpeed)} km/h</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <WaterDropIcon fontSize="small" sx={{ color: WEATHER_METRIC_COLORS.precipitation }} />
              <Typography variant="body2">{selectedHour.precipitation} mm</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <WbSunnyIcon fontSize="small" sx={{ color: WEATHER_METRIC_COLORS.sun }} />
              <Typography variant="body2">Wynik: {selectedHour.score}/100</Typography>
            </Stack>
            {!!selectedHour.sunrise && (
              <Stack direction="row" spacing={1} alignItems="center">
                <LightModeIcon fontSize="small" sx={{ color: WEATHER_METRIC_COLORS.sun }} />
                <Typography variant="body2">Wschód słońca</Typography>
                <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 600 }}>
                  {selectedHour.sunrise}
                </Typography>
              </Stack>
            )}
            {!!selectedHour.sunset && (
              <Stack direction="row" spacing={1} alignItems="center">
                <BedtimeIcon fontSize="small" sx={{ color: WEATHER_METRIC_COLORS.wind }} />
                <Typography variant="body2">Zachód słońca</Typography>
                <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 600 }}>
                  {selectedHour.sunset}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Popover>
    </Box>
  );
}

function DayGradientRow({ day }: { day: GradientDay }) {
  const today = isToday(day.date);
  const dayCyclist = getCyclistForDay(day.weatherCode, day.windSpeedMax, day.tempMax);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.5,
        px: 1,
        borderRadius: 1,
        bgcolor: today ? alphaColor(CHART_COLORS.primary, 0.08) : alphaColor(CHART_COLORS.tooltipText, 0.02),
        border: today ? `1px solid ${alphaColor(CHART_COLORS.primary, 0.3)}` : '1px solid transparent',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          width: 52,
          fontWeight: today ? 700 : 600,
          color: today ? CHART_COLORS.primary : 'text.secondary',
          fontSize: '0.7rem',
        }}
      >
        {today ? 'Dziś' : formatDayName(day.date)}
      </Typography>

      <Box
        component="img"
        src={getWeatherIllustrationPath(dayCyclist)}
        alt={dayCyclist}
        sx={{ width: 22, height: 18, objectFit: 'contain', borderRadius: 0.5, flexShrink: 0 }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, width: 50 }}>
        <Typography
          variant="caption"
          sx={{ color: WEATHER_METRIC_COLORS.wind, fontWeight: 600, fontSize: '0.65rem' }}
        >
          {Math.round(day.tempMin)}°
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          /
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: WEATHER_METRIC_COLORS.temperature, fontWeight: 600, fontSize: '0.65rem' }}
        >
          {Math.round(day.tempMax)}°
        </Typography>
      </Box>

      <Box sx={{ flex: 1, position: 'relative' }}>
        <GradientStrip
          hours={day.hourlyScores}
          bestStart={day.bestWindowStart}
          bestEnd={day.bestWindowEnd}
        />
      </Box>

      {!!day.bestWindowStart && (
        <Tooltip
          title={`Najlepsze 2h: ${day.bestWindowStart}–${day.bestWindowEnd} (${day.bestWindowScore}/100)`}
        >
          <Chip
            icon={<DirectionsBikeIcon sx={{ fontSize: 12 }} />}
            label={day.bestWindowStart}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6rem',
              bgcolor: alphaColor(CHART_COLORS.secondary, 0.15),
              color: CHART_COLORS.secondary,
              border: `1px solid ${alphaColor(CHART_COLORS.secondary, 0.3)}`,
              '& .MuiChip-icon': { color: CHART_COLORS.secondary },
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
}

export default function WeatherForecastViews({
  gradient,
  view,
  onViewChange,
}: WeatherForecastViewsProps) {
  const current = gradient.current;
  const todayData = getTodayData(gradient.days);
  const scoreColor = getScoreColor(current.outdoorScore);

  return (
    <>
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary">
            Ocena outdoor
          </Typography>
          <Typography variant="caption" sx={{ color: scoreColor, fontWeight: 700 }}>
            {getScoreLabel(current.outdoorScore)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={current.outdoorScore}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: CHART_COLORS.surface,
            '& .MuiLinearProgress-bar': { bgcolor: scoreColor, borderRadius: 3 },
          }}
        />
      </Box>

      {!!todayData?.bestWindowStart && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1.5,
            p: 1,
            borderRadius: 1.5,
            bgcolor: alphaColor(CHART_COLORS.secondary, 0.08),
            border: `1px solid ${alphaColor(CHART_COLORS.secondary, 0.2)}`,
          }}
        >
          <DirectionsBikeIcon sx={{ color: CHART_COLORS.secondary, fontSize: 22 }} />
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: CHART_COLORS.secondary }}>
              Najlepsza pora na rower dziś
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {todayData.bestWindowStart} – {todayData.bestWindowEnd}
              <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                ({todayData.bestWindowScore}/100)
              </Typography>
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
        <Button
          size="small"
          variant={view === 'today' ? 'contained' : 'text'}
          onClick={() => onViewChange('today')}
          sx={{
            flex: 1,
            textTransform: 'none',
            fontSize: '0.75rem',
            bgcolor: view === 'today' ? alphaColor(CHART_COLORS.primary, 0.15) : 'transparent',
            color: view === 'today' ? CHART_COLORS.primary : 'text.secondary',
            '&:hover': { bgcolor: alphaColor(CHART_COLORS.primary, 0.1) },
          }}
        >
          Dziś
        </Button>
        <Button
          size="small"
          variant={view === 'week' ? 'contained' : 'text'}
          onClick={() => onViewChange('week')}
          sx={{
            flex: 1,
            textTransform: 'none',
            fontSize: '0.75rem',
            bgcolor: view === 'week' ? alphaColor(CHART_COLORS.primary, 0.15) : 'transparent',
            color: view === 'week' ? CHART_COLORS.primary : 'text.secondary',
            '&:hover': { bgcolor: alphaColor(CHART_COLORS.primary, 0.1) },
          }}
        >
          Tydzień
        </Button>
      </Box>

      {view === 'today' && !!todayData && (
        <Box>
          <GradientStrip
            hours={todayData.hourlyScores}
            bestStart={todayData.bestWindowStart}
            bestEnd={todayData.bestWindowEnd}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              06:00
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              12:00
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              18:00
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              00:00
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, justifyContent: 'center' }}>
            {WEATHER_SCORE_LEGEND.map(({ color, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: `1px solid ${CHART_COLORS.grid}`,
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {view === 'week' && (
        <Stack spacing={0.5}>
          {gradient.days.map((day) => (
            <DayGradientRow key={day.date} day={day} />
          ))}
        </Stack>
      )}

      {current.warnings.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {current.warnings.map((warning, index) => (
            <Typography
              key={`${warning}-${index}`}
              variant="caption"
              sx={{ display: 'block', color: STATUS_COLORS.warning, fontSize: '0.65rem' }}
            >
              ⚠ {warning}
            </Typography>
          ))}
        </Box>
      )}
    </>
  );
}
