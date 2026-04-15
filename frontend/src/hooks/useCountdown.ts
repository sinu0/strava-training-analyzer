import { useEffect, useMemo, useState } from 'react';

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export function useCountdown(targetDate: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetDate) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [targetDate]);

  return useMemo(() => {
    if (!targetDate) {
      return {
        isActive: false,
        remainingMs: 0,
        label: '',
      };
    }

    const remainingMs = Math.max(0, new Date(targetDate).getTime() - now);
    return {
      isActive: remainingMs > 0,
      remainingMs,
      label: remainingMs > 0 ? formatCountdown(remainingMs) : '',
    };
  }, [now, targetDate]);
}
