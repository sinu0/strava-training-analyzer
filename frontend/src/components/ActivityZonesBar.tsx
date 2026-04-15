import { Box, Typography, Stack } from '@mui/material';
import { useMemo } from 'react';

import { STATUS_COLORS, ZONE_COLORS } from '../utils/colors';

interface ActivityZonesBarProps {
  zonesJson: string | ZoneData;
}

interface ZoneData {
  powerZoneSeconds?: Record<string, number>;
  hrZoneSeconds?: Record<string, number>;
}

export default function ActivityZonesBar({ zonesJson }: ActivityZonesBarProps) {
  const zones = useMemo<ZoneData | null>(() => {
    if (typeof zonesJson === 'object' && zonesJson !== null) {
      return zonesJson;
    }
    try {
      return JSON.parse(zonesJson) as ZoneData;
    } catch {
      return null;
    }
  }, [zonesJson]);

  if (!zones) return null;

  return (
    <Stack spacing={2}>
      {!!zones.powerZoneSeconds && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Strefy mocy
          </Typography>
          <ZoneBar zoneSeconds={zones.powerZoneSeconds} />
        </Box>
      )}
      {!!zones.hrZoneSeconds && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Strefy HR
          </Typography>
          <ZoneBar zoneSeconds={zones.hrZoneSeconds} />
        </Box>
      )}
    </Stack>
  );
}

function ZoneBar({ zoneSeconds }: { zoneSeconds: Record<string, number> }) {
  const entries = Object.entries(zoneSeconds);
  const total = entries.reduce((sum, [, val]) => sum + val, 0);

  if (total === 0) return <Typography color="text.secondary">Brak danych</Typography>;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          height: 28,
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {entries.map(([zone, secs]) => {
          const pct = (secs / total) * 100;
          if (pct < 0.5) return null;
          const colorKey = zone as keyof typeof ZONE_COLORS;
          return (
            <Box
              key={zone}
              sx={{
                width: `${pct}%`,
                backgroundColor: ZONE_COLORS[colorKey] ?? STATUS_COLORS.neutral,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: pct > 5 ? undefined : 0,
              }}
            >
              {pct > 8 && (
                <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600 }}>
                  {zone}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', mt: 0.5, gap: 1, flexWrap: 'wrap' }}>
        {entries.map(([zone, secs]) => {
          const pct = (secs / total) * 100;
          if (pct < 0.5) return null;
          const mins = Math.floor(secs / 60);
          const colorKey = zone as keyof typeof ZONE_COLORS;
          return (
            <Typography key={zone} variant="caption" color="text.secondary">
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                   width: 8,
                   height: 8,
                   borderRadius: '50%',
                   backgroundColor: ZONE_COLORS[colorKey] ?? STATUS_COLORS.neutral,
                   mr: 0.5,
                 }}
               />
              {zone}: {mins}m ({pct.toFixed(0)}%)
            </Typography>
          );
        })}
      </Box>
    </Box>
  );
}
