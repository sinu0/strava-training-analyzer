import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { Alert, Button, Chip, Menu, MenuItem, Stack } from '@mui/material';
import { useState } from 'react';

import { PRIMARY_NAVIGATION_BY_PATH } from '@/navigation/appNavigation';
import type { UiPreferences } from '@/types/uiPreferences';

interface MobileShortcutPinButtonProps {
  label: string;
  path: string;
  preferences: UiPreferences;
  saving?: boolean;
  onSave: (preferences: UiPreferences) => Promise<void> | void;
}

export default function MobileShortcutPinButton({
  label,
  path,
  preferences,
  saving = false,
  onSave,
}: MobileShortcutPinButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [saveError, setSaveError] = useState(false);
  const isPinned = preferences.mobileNavigation.includes(path);

  const replace = async (index: number) => {
    setAnchor(null);
    setSaveError(false);
    const mobileNavigation = [...preferences.mobileNavigation];
    mobileNavigation[index] = path;
    try {
      await onSave({ ...preferences, mobileNavigation });
    } catch {
      setSaveError(true);
    }
  };

  if (isPinned) {
    return <Chip icon={<CheckCircleOutlineIcon />} label={`${label} w skrótach`} color="success" variant="outlined" />;
  }

  return (
    <Stack spacing={1} alignItems="flex-end">
      <Button
        variant="outlined"
        startIcon={<PushPinOutlinedIcon />}
        disabled={saving}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        Przypnij {label}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {preferences.mobileNavigation.map((shortcutPath, index) => (
          <MenuItem key={shortcutPath} onClick={() => void replace(index)}>
            Zastąp {PRIMARY_NAVIGATION_BY_PATH.get(shortcutPath)?.label ?? shortcutPath}
          </MenuItem>
        ))}
      </Menu>
      {saveError ? <Alert severity="error">Nie udało się zapisać skrótu.</Alert> : null}
    </Stack>
  );
}
