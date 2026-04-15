import BoltIcon from '@mui/icons-material/Bolt';
import SpeedIcon from '@mui/icons-material/Speed';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Typography, Chip, Divider, LinearProgress, Stack, Tooltip } from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';

import PowerProfileRadar from './PowerProfileRadar';
import {
  CHART_COLORS,
  COMMON_COLORS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
} from '../utils/colors';

import type { FtpProgress, PowerCurve } from '../types/analytics';

interface FtpProgressCardProps {
  data: FtpProgress | undefined;
  powerCurve?: PowerCurve;
  weightKg?: number | null;
}

const trendConfig = {
  up: { icon: <TrendingUpIcon />, color: STATUS_COLORS.success, label: 'Wzrost' },
  down: { icon: <TrendingDownIcon />, color: STATUS_COLORS.error, label: 'Spadek' },
  stagnant: { icon: <TrendingFlatIcon />, color: STATUS_COLORS.warning, label: 'Stagnacja' },
} as const;

function getFtpLevel(ftp: number): string {
  if (ftp >= 350) return 'Elitarny';
  if (ftp >= 280) return 'Zaawansowany';
  if (ftp >= 220) return 'Średni';
  if (ftp >= 160) return 'Początkujący';
  return 'Startowy';
}

function getFtpColor(ftp: number): string {
  if (ftp >= 350) return STATUS_COLORS.success;
  if (ftp >= 280) return STATUS_COLORS.secondary;
  if (ftp >= 220) return STATUS_COLORS.warning;
  if (ftp >= 160) return STATUS_COLORS.accent;
  return STATUS_COLORS.error;
}

export default function FtpProgressCard({ data, powerCurve, weightKg }: FtpProgressCardProps) {
  if (!data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Ładowanie danych FTP...
        </Typography>
      </Box>
    );
  }

  const trend = trendConfig[data.trend];
  const ftp = data.currentFtp ?? 0;
  const ftpColor = getFtpColor(ftp);
  const ftpPct = Math.min(100, Math.max(0, ((ftp - 100) / 300) * 100));
  const athleteWeight = weightKg ?? 75;
  const wkg = ftp > 0 ? (ftp / athleteWeight).toFixed(1) : '—';
  const chartData = data.history.map((p) => ({
    date: p.date,
    ftp: Math.round(p.value),
  }));

  return (
    <Box>
      {/* ─── Hero: FTP icon + big value + trend ─── */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor: SURFACE_COLORS.subtle,
        border: `1px solid ${alphaColor(CHART_COLORS.grid, 0.5)}`,
        overflow: 'hidden',
      }}>
        {/* Icon box */}
        <Box sx={{
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: alphaColor(ftpColor, 0.08),
          border: `1px solid ${alphaColor(ftpColor, 0.2)}`,
          flexShrink: 0,
        }}>
          <BoltIcon
            sx={{
              fontSize: 44,
              color: ftpColor,
              filter: `drop-shadow(0 2px 8px ${alphaColor(COMMON_COLORS.black, 0.3)})`,
            }}
          />
        </Box>

        {/* FTP value + trend */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1, color: ftpColor }}>
              {data.currentFtp ?? '—'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              W
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={trend.icon}
              label={trend.label}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                bgcolor: `${trend.color}20`,
                color: trend.color,
                fontWeight: 600,
                '& .MuiChip-icon': { color: trend.color },
              }}
            />
            {data.changePercent !== 0 && (
              <Typography variant="caption" sx={{ color: trend.color, fontWeight: 700 }}>
                {data.changePercent > 0 ? '+' : ''}
                {data.changePercent.toFixed(1)}%
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  (90d)
                </Typography>
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* ─── Score bar ─── */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary">Poziom FTP</Typography>
          <Typography variant="caption" sx={{ color: ftpColor, fontWeight: 700 }}>
            {getFtpLevel(ftp)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={ftpPct}
          sx={{
            height: 6, borderRadius: 3, bgcolor: SURFACE_COLORS.muted,
            '& .MuiLinearProgress-bar': { bgcolor: ftpColor, borderRadius: 3 },
          }}
        />
      </Box>

      {/* ─── Metric pills ─── */}
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <Tooltip title="Functional Threshold Power — próg mocy">
          <Box sx={{
            flex: 1,
            textAlign: 'center',
            py: 0.75,
            px: 0.5,
            borderRadius: 1.5,
            bgcolor: `${ftpColor}14`,
            border: `1px solid ${ftpColor}33`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3, mb: 0.25 }}>
              <BoltIcon sx={{ fontSize: 14, color: ftpColor }} />
              <Typography variant="caption" sx={{ color: ftpColor, fontWeight: 600, fontSize: '0.65rem' }}>
                FTP
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: ftpColor, fontWeight: 700 }}>
              {ftp || '—'} W
            </Typography>
          </Box>
        </Tooltip>
        <Tooltip title={`Watts per kilogram — moc na kilogram (${athleteWeight} kg)`}>
          <Box sx={{
            flex: 1,
            textAlign: 'center',
             py: 0.75,
             px: 0.5,
             borderRadius: 1.5,
             bgcolor: alphaColor(STATUS_COLORS.info, 0.08),
             border: `1px solid ${alphaColor(STATUS_COLORS.info, 0.2)}`,
           }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3, mb: 0.25 }}>
              <SpeedIcon sx={{ fontSize: 14, color: STATUS_COLORS.info }} />
              <Typography variant="caption" sx={{ color: STATUS_COLORS.info, fontWeight: 600, fontSize: '0.65rem' }}>
                W/kg
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: STATUS_COLORS.info, fontWeight: 700 }}>
              {wkg}
            </Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Zmiana FTP w ciągu ostatnich 90 dni">
          <Box sx={{
            flex: 1,
            textAlign: 'center',
            py: 0.75,
            px: 0.5,
            borderRadius: 1.5,
            bgcolor: `${trend.color}14`,
            border: `1px solid ${trend.color}33`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3, mb: 0.25 }}>
              <TimelineIcon sx={{ fontSize: 14, color: trend.color }} />
              <Typography variant="caption" sx={{ color: trend.color, fontWeight: 600, fontSize: '0.65rem' }}>
                Δ 90d
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: trend.color, fontWeight: 700 }}>
              {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
            </Typography>
          </Box>
        </Tooltip>
      </Stack>

      {/* ─── Sparkline chart ─── */}
      {chartData.length > 1 && (
        <Box sx={{ width: '100%', height: 120, mb: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ftpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ftpColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={ftpColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="date"
                tick={{ fill: CHART_COLORS.tickText, fontSize: 10 }}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })
                }
              />
              <YAxis
                tick={{ fill: CHART_COLORS.tickText, fontSize: 10 }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: CHART_COLORS.tooltip,
                  border: `1px solid ${CHART_COLORS.grid}`,
                  borderRadius: 8,
                }}
                formatter={(value: number) => [`${value} W`, 'FTP']}
                labelFormatter={(v) => new Date(v).toLocaleDateString('pl-PL')}
              />
              <Area
                type="monotone"
                dataKey="ftp"
                stroke={ftpColor}
                strokeWidth={2}
                fill="url(#ftpGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* ─── Power Profile Radar ─── */}
      <Divider sx={{ my: 1.5, borderColor: alphaColor(CHART_COLORS.grid, 0.4) }} />
      <Typography variant="caption" sx={{
        fontWeight: 700, mb: 1, display: 'block',
        color: 'text.secondary', fontSize: '0.7rem',
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        Profil mocy (90 dni)
      </Typography>
      <PowerProfileRadar data={powerCurve} weightKg={weightKg} />
    </Box>
  );
}
