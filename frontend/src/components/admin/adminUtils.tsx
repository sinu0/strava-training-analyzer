import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimerIcon from '@mui/icons-material/Timer';
import { Chip } from '@mui/material';

export function formatTimestamp(ts: string | null): string {
  if (!ts) return 'Nigdy';
  const d = new Date(ts);
  return d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function StatusChip({ status }: { status: string }) {
  const config: Record<string, { color: 'success' | 'warning' | 'error' | 'default'; icon: React.ReactElement; label: string }> = {
    completed: { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, label: 'Zakończony' },
    success: { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, label: 'Sukces' },
    in_progress: { color: 'warning', icon: <HourglassEmptyIcon sx={{ fontSize: 16 }} />, label: 'W trakcie...' },
    rate_limited: { color: 'error', icon: <TimerIcon sx={{ fontSize: 16 }} />, label: 'Rate limit' },
    failed: { color: 'error', icon: <ErrorIcon sx={{ fontSize: 16 }} />, label: 'Błąd' },
    partial_failure: { color: 'warning', icon: <ErrorIcon sx={{ fontSize: 16 }} />, label: 'Częściowy błąd' },
    idle: { color: 'default', icon: <ScheduleIcon sx={{ fontSize: 16 }} />, label: 'Oczekuje' },
  };
  const c = config[status] ?? config.idle;
  return (
    <Chip
      icon={c!.icon}
      label={c!.label}
      color={c!.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
}
