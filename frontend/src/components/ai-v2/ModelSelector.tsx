import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Typography,
} from '@mui/material';

import { useAiModels } from '@/hooks/useAiV2';

import type { SelectChangeEvent } from '@mui/material';


interface ModelSelectorProps {
  value: string | undefined;
  onChange: (modelId: string | undefined) => void;
  disabled?: boolean;
}

export default function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const { data: models, isLoading } = useAiModels();

  const handleChange = (e: SelectChangeEvent<string>) => {
    const val = e.target.value;
    onChange(val || undefined);
  };

  return (
    <FormControl fullWidth size="small" disabled={disabled || isLoading}>
      <InputLabel>Model AI</InputLabel>
      <Select
        value={value ?? ''}
        label="Model AI"
        onChange={handleChange}
      >
        <MenuItem value="">
          <Typography variant="body2" color="text.secondary">
            Domyślny
          </Typography>
        </MenuItem>
        {!!isLoading && (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Ładowanie modeli...</Typography>
            </Box>
          </MenuItem>
        )}
        {!isLoading && (!models?.providers || models.providers.length === 0) && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Brak dostępnych modeli
            </Typography>
          </MenuItem>
        )}
        {!isLoading && models?.providers?.map((provider) => {
          const modelName = provider.split(':')[1] ?? provider;
          const providerName = provider.split(':')[0] ?? '';
          return (
            <MenuItem key={provider} value={provider}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {modelName}
                </Typography>
                {!!providerName && (
                  <Typography variant="caption" color="text.secondary">
                    ({providerName})
                  </Typography>
                )}
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
