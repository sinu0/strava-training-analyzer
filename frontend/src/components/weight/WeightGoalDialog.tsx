
import { Stack, TextField } from '@mui/material';

import FormDialog from '@/components/common/FormDialog';
import type { UseFormDialogResult } from '@/hooks/useFormDialog';

import type { FormEvent } from 'react';

interface WeightGoalFormValues {
  [key: string]: string;
  targetWeightKg: string;
  targetDate: string;
}

interface WeightGoalDialogProps {
  dialog: UseFormDialogResult<WeightGoalFormValues>;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function WeightGoalDialog({
  dialog,
  pending,
  onSubmit,
}: WeightGoalDialogProps) {
  const { open, values, closeDialog, setValue } = dialog;

  return (
    <FormDialog
      open={open}
      title="Ustaw cel wagowy"
      submitLabel="Zapisz cel"
      maxWidth="xs"
      disableSubmit={pending || !values.targetWeightKg.trim() || !values.targetDate}
      onSubmit={onSubmit}
      onClose={closeDialog}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Docelowa waga (kg)"
          type="number"
          value={values.targetWeightKg}
          onChange={(event) => setValue('targetWeightKg', event.target.value)}
          inputProps={{ step: '0.1', min: '30', max: '300' }}
          fullWidth
          autoFocus
        />
        <TextField
          label="Data docelowa"
          type="date"
          value={values.targetDate}
          onChange={(event) => setValue('targetDate', event.target.value)}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>
    </FormDialog>
  );
}
