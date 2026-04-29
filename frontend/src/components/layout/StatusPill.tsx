import AirIcon from '@mui/icons-material/Air';
import BalanceIcon from '@mui/icons-material/Balance';
import BoltIcon from '@mui/icons-material/Bolt';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { Box, Typography, Popover, Stack, LinearProgress, Tooltip } from '@mui/material';
import { useState } from 'react';

import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon';
import type { ReadinessData, FtpProgress, WeatherGradient } from '@/types/analytics';
import {
  CHART_COLORS,
  COMMON_COLORS,
  PMC_COLORS,
  STATUS_COLORS,
  SURFACE_COLORS,
  WEATHER_METRIC_COLORS,
  alphaColor,
} from '@/utils/colors';
import { getHomeWidgetIllustrationPath, getReadinessIllustrationPath } from '@/utils/illustrationAssets';
import {
  getReadinessColor,
  getReadinessImage,
  getReadinessLabel,
} from '@/utils/readinessScales';
import { getScoreColor, getScoreLabel } from '@/utils/scoreColor';
import { PERFORMANCE_TREND_COLORS } from '@/utils/statusColors';

interface StatusPillProps {
  readiness: ReadinessData | undefined;
  ftpProgress: FtpProgress | undefined;
  weatherGradient: WeatherGradient | undefined;
}

const trendIcons = {
  up: <TrendingUpIcon sx={{ fontSize: 14 }} />,
  down: <TrendingDownIcon sx={{ fontSize: 14 }} />,
  stagnant: <TrendingFlatIcon sx={{ fontSize: 14 }} />,
} as const;

const trendColors = PERFORMANCE_TREND_COLORS;

/* ── Popover sections ── */

function ReadinessPopover({ data }: { data: ReadinessData }) {
  const color = getReadinessColor(data.score);
  const tsbColor = data.tsb >= 0 ? PMC_COLORS.TSB : STATUS_COLORS.error;
  return (
    <Box sx={{ p: 2, width: 304 }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2.5,
          height: 88,
          mb: 1.5,
          border: `1px solid ${alphaColor(color, 0.14)}`,
        }}
      >
        <Box
          component="img"
          src={getHomeWidgetIllustrationPath('readiness')}
          alt="Gotowość"
          sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center 48%' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, ${alphaColor(COMMON_COLORS.black, 0.06)} 0%, ${alphaColor(COMMON_COLORS.black, 0.34)} 100%)`,
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box
          component="img"
          src={getReadinessIllustrationPath(getReadinessImage(data.score))}
          alt={data.level}
          sx={{ width: 56, height: 48, objectFit: 'contain', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.3))' }}
        />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color, lineHeight: 1 }}>
            {data.score}<Typography component="span" variant="body2" color="text.secondary">/100</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color, fontWeight: 600 }}>{getReadinessLabel(data.score)}</Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.4 }}>
        {data.description}
      </Typography>
      <Stack direction="row" spacing={1}>
        {[
          { label: 'CTL', value: Math.round(data.ctl), color: PMC_COLORS.CTL, icon: <TrendingUpIcon sx={{ fontSize: 12 }} /> },
          { label: 'ATL', value: Math.round(data.atl), color: PMC_COLORS.ATL, icon: <TrendingDownIcon sx={{ fontSize: 12 }} /> },
          { label: 'TSB', value: `${data.tsb > 0 ? '+' : ''}${Math.round(data.tsb)}`, color: tsbColor, icon: <BalanceIcon sx={{ fontSize: 12 }} /> },
        ].map(m => (
          <Box key={m.label} sx={{
            flex: 1, textAlign: 'center', py: 0.5, borderRadius: 1,
            bgcolor: alphaColor(m.color, 0.08),
            border: `1px solid ${alphaColor(m.color, 0.2)}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
              {m.icon}
              <Typography variant="caption" sx={{ color: m.color, fontWeight: 600, fontSize: '0.6rem' }}>{m.label}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: m.color, fontWeight: 700 }}>{m.value}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function FtpPopover({ data }: { data: FtpProgress }) {
  const tc = trendColors[data.trend];
  return (
    <Box sx={{ p: 2, width: 280 }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2.5,
          height: 88,
          mb: 1.5,
          border: `1px solid ${alphaColor(tc, 0.14)}`,
        }}
      >
        <Box
          component="img"
          src={getHomeWidgetIllustrationPath('progress')}
          alt="FTP"
          sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center 54%' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, ${alphaColor(COMMON_COLORS.black, 0.06)} 0%, ${alphaColor(COMMON_COLORS.black, 0.34)} 100%)`,
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {data.currentFtp ?? '—'}<Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>W</Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">Aktualne FTP</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: tc }}>
            {trendIcons[data.trend]}
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">90 dni</Typography>
        </Box>
      </Box>
      {data.history.length > 1 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Historia</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 40 }}>
            {data.history.slice(-20).map((p) => {
              const max = Math.max(...data.history.map(h => h.value));
              const min = Math.min(...data.history.map(h => h.value));
              const range = max - min || 1;
              const h = ((p.value - min) / range) * 32 + 8;
              return (
                <Tooltip key={p.date} title={`${p.date}: ${Math.round(p.value)}W`}>
                  <Box sx={{ flex: 1, height: h, bgcolor: tc, borderRadius: 0.5, opacity: 0.7, '&:hover': { opacity: 1 } }} />
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function WeatherPopover({ data }: { data: WeatherGradient }) {
  const c = data.current;
  const sc = getScoreColor(c.outdoorScore);
  return (
    <Box sx={{ p: 2, width: 292 }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2.5,
          height: 88,
          mb: 1.5,
          border: `1px solid ${alphaColor(sc, 0.14)}`,
        }}
      >
        <Box
          component="img"
          src={getHomeWidgetIllustrationPath('weather')}
          alt="Pogoda"
          sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center 58%' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, ${alphaColor(COMMON_COLORS.black, 0.06)} 0%, ${alphaColor(COMMON_COLORS.black, 0.34)} 100%)`,
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {Math.round(c.temperature)}°
        </Typography>
        <WeatherConditionIcon code={c.weatherCode} size={18} alt={c.weatherDescription} />
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {c.weatherDescription}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <AirIcon sx={{ fontSize: 14, color: WEATHER_METRIC_COLORS.wind }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>{Math.round(c.windSpeed)} km/h</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <WaterDropIcon sx={{ fontSize: 14, color: WEATHER_METRIC_COLORS.precipitation }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>{c.precipitation} mm</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <ThermostatIcon sx={{ fontSize: 14, color: WEATHER_METRIC_COLORS.temperature }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>{c.outdoorScore}/100</Typography>
        </Box>
      </Stack>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary">Ocena outdoor</Typography>
          <Typography variant="caption" sx={{ color: sc, fontWeight: 700 }}>
            {getScoreLabel(c.outdoorScore)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={c.outdoorScore}
          sx={{
            height: 5, borderRadius: 3, bgcolor: CHART_COLORS.surface,
            '& .MuiLinearProgress-bar': { bgcolor: sc, borderRadius: 3 },
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        📍 {data.locationName}
      </Typography>
    </Box>
  );
}

/* ── Main StatusPill ── */

/**
 * Shows readiness, FTP, and weather summaries with detailed popovers.
 */
export default function StatusPill({ readiness, ftpProgress, weatherGradient }: StatusPillProps) {
  const [anchor, setAnchor] = useState<{ el: HTMLElement; type: 'readiness' | 'ftp' | 'weather' } | null>(null);

  const handleOpen = (e: React.MouseEvent<HTMLElement>, type: 'readiness' | 'ftp' | 'weather') => {
    setAnchor({ el: e.currentTarget, type });
  };
  const handleClose = () => setAnchor(null);

  const hasData = readiness || ftpProgress || weatherGradient;
  if (!hasData) return null;

  return (
    <>
      <Stack
        direction="row"
        spacing={0.6}
        sx={{
          px: 0.8,
          py: 0.7,
          bgcolor: alphaColor(CHART_COLORS.tooltip, 0.84),
          borderRadius: 999,
          border: `1px solid ${alphaColor(CHART_COLORS.grid, 0.6)}`,
          backdropFilter: 'blur(14px)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
        }}
      >
        {/* Readiness segment */}
        {!!readiness && (
          <Box
            onClick={(e) => handleOpen(e, 'readiness')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              px: 1.15,
              py: 0.7,
              minWidth: 94,
              borderRadius: 999,
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.15s',
              '&:hover': { bgcolor: SURFACE_COLORS.hover, transform: 'translateY(-1px)' },
            }}
          >
            <Box
              component="img"
              src={getReadinessIllustrationPath(getReadinessImage(readiness.score))}
              alt="readiness"
              sx={{ width: 22, height: 20, objectFit: 'contain' }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1 }}>
                Gotowość
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: getReadinessColor(readiness.score), fontSize: '0.78rem' }}>
                {readiness.score}/100
              </Typography>
            </Box>
          </Box>
        )}

        {/* FTP segment */}
        {!!ftpProgress && (
          <Box
            onClick={(e) => handleOpen(e, 'ftp')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              px: 1.15,
              py: 0.7,
              minWidth: 86,
              borderRadius: 999,
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.15s',
              '&:hover': { bgcolor: SURFACE_COLORS.hover, transform: 'translateY(-1px)' },
            }}
          >
            <BoltIcon sx={{ fontSize: 16, color: trendColors[ftpProgress.trend] }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1 }}>
                FTP
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.78rem' }}>
                {ftpProgress.currentFtp ?? '—'} W
              </Typography>
            </Box>
          </Box>
        )}

        {/* Weather segment */}
        {!!weatherGradient && (
          <Box
            onClick={(e) => handleOpen(e, 'weather')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              px: 1.15,
              py: 0.7,
              minWidth: 88,
              borderRadius: 999,
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.15s',
              '&:hover': { bgcolor: SURFACE_COLORS.hover, transform: 'translateY(-1px)' },
            }}
          >
            <WeatherConditionIcon
              code={weatherGradient.current.weatherCode}
              size={16}
              alt={weatherGradient.current.weatherDescription}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1 }}>
                Pogoda
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.78rem' }}>
                {Math.round(weatherGradient.current.temperature)}°
              </Typography>
            </Box>
          </Box>
        )}
      </Stack>

      {/* Popover */}
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor?.el}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              bgcolor: CHART_COLORS.tooltip,
              border: `1px solid ${alphaColor(CHART_COLORS.grid, 0.8)}`,
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            },
          },
        }}
      >
        {anchor?.type === 'readiness' && !!readiness && <ReadinessPopover data={readiness} />}
        {anchor?.type === 'ftp' && !!ftpProgress && <FtpPopover data={ftpProgress} />}
        {anchor?.type === 'weather' && !!weatherGradient && <WeatherPopover data={weatherGradient} />}
      </Popover>
    </>
  );
}
