import { useState } from 'react';

import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';

import { useJournalForActivity, useSaveJournalEntry } from '@/hooks/useJournal';
import type { JournalMood } from '@/types/journal';
import { STATUS_COLORS } from '@/utils/colors';

const MOOD_OPTIONS: { value: JournalMood; label: string; color: string }[] = [
  { value: 'GREAT', label: 'Fantastycznie', color: STATUS_COLORS.success },
  { value: 'GOOD', label: 'Dobrze', color: '#58A6FF' },
  { value: 'OK', label: 'Tak sobie', color: STATUS_COLORS.warning },
  { value: 'TIRED', label: 'Zmeczony', color: STATUS_COLORS.error },
  { value: 'BAD', label: 'Kiepsko', color: '#888' },
];

interface JournalEntryFormProps {
  activityId: string;
}

export default function JournalEntryForm({ activityId }: JournalEntryFormProps) {
  const { data: existing, isLoading } = useJournalForActivity(activityId);
  const saveMutation = useSaveJournalEntry();

  const [mood, setMood] = useState<JournalMood>(existing?.mood ?? 'OK');
  const [note, setNote] = useState(existing?.note ?? '');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagInput, setTagInput] = useState('');

  const handleSave = () => {
    saveMutation.mutate({
      activityId,
      mood,
      note: note || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  if (isLoading) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" fontWeight={700}>
        Dziennik
      </Typography>

      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {MOOD_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            size="small"
            variant={mood === opt.value ? 'filled' : 'outlined'}
            onClick={() => setMood(opt.value)}
            sx={{
              cursor: 'pointer',
              fontWeight: mood === opt.value ? 700 : 500,
              ...(mood === opt.value
                ? { bgcolor: `${opt.color}22`, color: opt.color, borderColor: opt.color }
                : {}),
            }}
          />
        ))}
      </Stack>

      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={6}
        size="small"
        label="Notatka"
        placeholder="Jak się czułeś? Co poszło dobrze? Nad czym pracować?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            onDelete={() => setTags(tags.filter((t) => t !== tag))}
          />
        ))}
        <TextField
          size="small"
          placeholder="Dodaj tag..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tagInput.trim()) {
              e.preventDefault();
              if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
              }
              setTagInput('');
            }
          }}
          sx={{ width: 130 }}
        />
      </Stack>

      <Button
        variant="contained"
        size="small"
        onClick={handleSave}
        disabled={saveMutation.isPending}
        sx={{ alignSelf: 'flex-start' }}
      >
        {saveMutation.isPending ? 'Zapisywanie...' : existing ? 'Aktualizuj' : 'Zapisz'}
      </Button>

      {saveMutation.isSuccess && (
        <Typography variant="caption" color="success.main">
          Zapisano!
        </Typography>
      )}
    </Box>
  );
}
