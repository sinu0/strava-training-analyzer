import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Chip } from '@mui/material';

import type { TrainingStatus } from '@/types/fatigue';
import { STATUS_COLORS } from '@/utils/colors';

interface Props { data: TrainingStatus | undefined; isLoading: boolean; }

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PRODUCTIVE: { label: 'Forma rośnie', color: STATUS_COLORS.success, icon: <TrendingUpIcon sx={{ fontSize: 14 }} /> },
  MAINTAINING: { label: 'Utrzymanie', color: STATUS_COLORS.info, icon: <TrendingFlatIcon sx={{ fontSize: 14 }} /> },
  OVERREACHING: { label: 'Przeciążenie', color: STATUS_COLORS.warning, icon: <TrendingUpIcon sx={{ fontSize: 14 }} /> },
  DETRAINING: { label: 'Spadek formy', color: '#DA3633', icon: <TrendingDownIcon sx={{ fontSize: 14 }} /> },
  RECOVERY: { label: 'Regeneracja', color: '#39D353', icon: <TrendingDownIcon sx={{ fontSize: 14 }} /> },
  STRAINED: { label: 'Przemęczenie', color: STATUS_COLORS.error, icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
};

export default function TrainingStatusBadge({ data, isLoading }: Props) {
  if (isLoading || !data) return null;
  const s = STATUS_MAP[data.status];
  if (!s) return null;
  const trendLabel = data.ctlTrend > 0 ? `↗${data.ctlTrend.toFixed(1)}` : data.ctlTrend < 0 ? `↘${Math.abs(data.ctlTrend).toFixed(1)}` : '→0';
  return (
    <Chip
      icon={s.icon ? <>{s.icon}</> : undefined}
      label={`${s.label}  ${trendLabel} /tydz`}
      size="small"
      sx={{
        fontWeight: 800,
        fontSize: '0.65rem',
        bgcolor: `${s.color}18`,
        color: s.color,
        border: `1px solid ${s.color}40`,
      }}
    />
  );
}
