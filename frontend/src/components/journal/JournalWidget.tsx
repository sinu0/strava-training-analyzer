import { Box, Chip, Typography } from '@mui/material';

import { useLatestJournalEntry } from '@/hooks/useJournal';
import { STATUS_COLORS } from '@/utils/colors';

const MOOD_CONFIG: Record<string, { label: string; color: string }> = {
  GREAT: { label: 'Fantastycznie', color: STATUS_COLORS.success },
  GOOD: { label: 'Dobrze', color: '#58A6FF' },
  OK: { label: 'Tak sobie', color: STATUS_COLORS.warning },
  TIRED: { label: 'Zmeczony', color: STATUS_COLORS.error },
  BAD: { label: 'Kiepsko', color: '#888' },
};

export default function JournalWidget() {
  const { data: entry, isLoading } = useLatestJournalEntry();

  if (isLoading) return null;
  if (!entry) return null;

  const moodCfg = MOOD_CONFIG[entry.mood] ?? MOOD_CONFIG.OK;
  if (!moodCfg) return null;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        Ostatni wpis w dzienniku
      </Typography>
      <Chip
        label={moodCfg.label}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.7rem',
          bgcolor: `${moodCfg.color}22`,
          color: moodCfg.color,
          mb: 0.5,
        }}
      />
      {entry.note && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}
        >
          {entry.note.length > 100 ? entry.note.slice(0, 100) + '...' : entry.note}
        </Typography>
      )}
      {entry.tags && entry.tags.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
          {entry.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.6rem' }} />
          ))}
        </Box>
      )}
    </Box>
  );
}
