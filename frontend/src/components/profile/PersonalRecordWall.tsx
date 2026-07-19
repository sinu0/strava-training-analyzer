import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { usePersonalRecords, type PersonalRecord } from '@/hooks/usePersonalRecords';
import { STATUS_COLORS } from '@/utils/colors';

const GROUPED: Record<string, { icon: string; label: string }> = {
  BEST: { icon: '⚡', label: 'Power' },
  LONGEST: { icon: '🛣️', label: 'Dystans' },
  MOST: { icon: '⛰️', label: 'Przewyższenie' },
  FASTEST: { icon: '💨', label: 'Prędkość' },
  HIGHEST: { icon: '🔥', label: 'TSS' },
};

function getGroup(rec: PersonalRecord): string {
  const t = rec.recordType;
  if (t.startsWith('BEST')) return 'BEST';
  if (t.startsWith('LONGEST')) return 'LONGEST';
  if (t.startsWith('MOST')) return 'MOST';
  if (t.startsWith('FASTEST')) return 'FASTEST';
  return 'HIGHEST';
}

export default function PersonalRecordWall() {
  const navigate = useNavigate();
  const { data: records, isLoading } = usePersonalRecords();

  if (isLoading) return null;
  if (!records || records.length === 0) return null;

  const byGroup = new Map<string, PersonalRecord[]>();
  for (const r of records) {
    const g = getGroup(r);
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(r);
  }

  return (
    <Grid container spacing={1.5}>
      {[...byGroup.entries()].map(([group, items]) => {
        const info = GROUPED[group] ?? { icon: '🏆', label: group };
        return (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={group}>
            <Card
              sx={{
                cursor: items[0]?.activityId ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': { borderColor: STATUS_COLORS.warning },
              }}
              onClick={() => {
                const aid = items[0]?.activityId;
                if (aid) navigate(`/activities/${aid}`);
              }}
              variant="outlined"
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">
                  {info.icon} {info.label}
                </Typography>
                {items.slice(0, 3).map((r) => (
                  <Box key={r.id} sx={{ mt: 0.75 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {r.recordValue} {r.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.label}
                    </Typography>
                    {r.improvementPercent != null && r.improvementPercent > 0 && (
                      <Chip
                        icon={<TrendingUpIcon sx={{ fontSize: 12 }} />}
                        label={`+${r.improvementPercent.toFixed(0)}%`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', height: 20, mt: 0.5 }}
                      />
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
