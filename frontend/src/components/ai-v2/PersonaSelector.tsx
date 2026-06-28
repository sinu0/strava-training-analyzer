import { Box, Typography, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';

import {
  PERSONA_LABELS,
  PERSONA_DESCRIPTIONS,
  PERSONA_EMOJIS,
  type Persona,
} from '@/types/aiV2';
import { alphaColor, STATUS_COLORS } from '@/utils/colors';

interface PersonaSelectorProps {
  value: Persona | undefined;
  onChange: (persona: Persona) => void;
  disabled?: boolean;
}

const ALL_PERSONAS: Persona[] = [
  'AGGRESSIVE_COACH',
  'BALANCED_ADVISOR',
  'CONSERVATIVE_SCIENTIST',
];

const PERSONA_COLORS: Record<Persona, string> = {
  AGGRESSIVE_COACH: STATUS_COLORS.accent,
  BALANCED_ADVISOR: STATUS_COLORS.info,
  CONSERVATIVE_SCIENTIST: STATUS_COLORS.secondary,
};

export default function PersonaSelector({ value, onChange, disabled }: PersonaSelectorProps) {
  return (
    <ToggleButtonGroup
      value={value ?? null}
      exclusive
      onChange={(_, newValue) => {
        if (newValue) onChange(newValue as Persona);
      }}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 1,
        '& .MuiToggleButtonGroup-grouped': {
          border: '1px solid',
          borderColor: 'divider !important',
          borderRadius: '8px !important',
          m: 0,
        },
      }}
    >
      {ALL_PERSONAS.map((persona) => {
        const isSelected = value === persona;
        const color = PERSONA_COLORS[persona];
        return (
          <Tooltip key={persona} title={PERSONA_DESCRIPTIONS[persona]} arrow placement="top">
            <ToggleButton
              value={persona}
              disabled={disabled}
              sx={{
                p: 1.5,
                textTransform: 'none',
                '&.Mui-selected': {
                  bgcolor: alphaColor(color, 0.12),
                  borderColor: `${color} !important`,
                  '&:hover': { bgcolor: alphaColor(color, 0.18) },
                },
                '&:hover': {
                  bgcolor: alphaColor(color, 0.06),
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '1.1rem' }}>
                  {PERSONA_EMOJIS[persona]}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? color : 'text.primary',
                    fontSize: '0.8rem',
                  }}
                >
                  {PERSONA_LABELS[persona]}
                </Typography>
              </Box>
            </ToggleButton>
          </Tooltip>
        );
      })}
    </ToggleButtonGroup>
  );
}
