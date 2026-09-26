import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import type { ReactNode } from 'react';

export interface ChoiceCardOption<Value extends string> {
  value: Value;
  label: string;
  description: string;
  icon?: ReactNode;
}

interface ChoiceCardGroupProps<Value extends string> {
  value: Value | null;
  options: ChoiceCardOption<Value>[];
  ariaLabel: string;
  disabled?: boolean;
  /** Columns from `sm` up; one column on phones. */
  columns?: 2 | 3;
  onChange: (value: Value) => void;
}

/** Exclusive card-style picker used by settings (language, AI language, coaching style). */
export default function ChoiceCardGroup<Value extends string>({
  value,
  options,
  ariaLabel,
  disabled = false,
  columns = 2,
  onChange,
}: ChoiceCardGroupProps<Value>) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      aria-label={ariaLabel}
      disabled={disabled}
      onChange={(_event, next: Value | null) => {
        if (next) onChange(next);
      }}
      sx={{
        mt: 2,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: `repeat(${columns}, minmax(0, 1fr))` },
        gap: 1,
        '& .MuiToggleButtonGroup-grouped': {
          m: '0 !important',
          border: '1px solid !important',
          borderColor: 'divider !important',
          borderRadius: '14px !important',
        },
      }}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          aria-label={option.label}
          sx={{
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            textAlign: 'left',
            px: 1.5,
            py: 1.3,
            gap: 1.25,
            color: 'text.primary',
            '&.Mui-selected': {
              color: 'primary.main',
              bgcolor: (theme) => getAppThemeTokens(theme).activeOverlay,
              borderColor: 'primary.main !important',
            },
          }}
        >
          {option.icon}
          <Stack spacing={0.15} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ fontWeight: 760 }}>{option.label}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'none' }}>
              {option.description}
            </Typography>
          </Stack>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
