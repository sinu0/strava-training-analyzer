import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { Alert, Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';

import { PRIMARY_NAVIGATION } from '@/navigation/appNavigation';
import type { UiPreferences } from '@/types/uiPreferences';

interface MobileNavigationSettingsProps {
  preferences: UiPreferences;
  saving?: boolean;
  onSave: (preferences: UiPreferences) => Promise<void> | void;
}

export default function MobileNavigationSettings({
  preferences,
  saving = false,
  onSave,
}: MobileNavigationSettingsProps) {
  const [selected, setSelected] = useState(preferences.mobileNavigation);
  const [saveError, setSaveError] = useState<string>();
  const missingCount = 4 - selected.length;

  const toggle = (path: string) => {
    setSaveError(undefined);
    setSelected((current) => {
      if (current.includes(path)) return current.filter((item) => item !== path);
      if (current.length >= 4) return current;
      return [...current, path];
    });
  };

  const save = async () => {
    setSaveError(undefined);
    try {
      await onSave({ ...preferences, mobileNavigation: selected });
    } catch {
      setSaveError('Nie udało się zapisać skrótów. Odśwież dane i spróbuj ponownie.');
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={780}>Skróty mobilne</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Wybierz dokładnie cztery sekcje widoczne obok przycisku „Więcej”.
      </Typography>
      <ToggleButtonGroup
        value={selected}
        aria-label="Skróty mobilne"
        sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' }, gap: 1 }}
      >
        {PRIMARY_NAVIGATION.map((item) => (
          <ToggleButton
            key={item.path}
            value={item.path}
            selected={selected.includes(item.path)}
            onChange={() => toggle(item.path)}
            sx={{ gap: 0.75, border: '1px solid !important', borderRadius: '10px !important' }}
          >
            {item.icon}
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mt: 2 }}>
        <Typography variant="body2" color={missingCount === 0 ? 'success.main' : 'warning.main'} sx={{ flex: 1 }}>
          {missingCount === 0 ? 'Wybrano 4 skróty.' : `Wybierz jeszcze ${missingCount} skrót${missingCount === 1 ? '' : 'y'}.`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          disabled={missingCount !== 0 || saving}
          onClick={() => void save()}
        >
          Zapisz skróty
        </Button>
      </Stack>
      {!!saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
    </Box>
  );
}
