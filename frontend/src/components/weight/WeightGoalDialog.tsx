
import { Stack, TextField } from '@mui/material';

import FormDialog from '@/components/common/FormDialog';
import { weightMessages } from '@/components/weight/messages';
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
  const t = weightMessages.useT();

  return (
    <FormDialog
      open={open}
      title={t('goalDialog.title')}
      submitLabel={t('goalDialog.submit')}
      maxWidth="xs"
      disableSubmit={pending || !values.targetWeightKg.trim() || !values.targetDate}
      onSubmit={onSubmit}
      onClose={closeDialog}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label={t('goalDialog.targetWeightLabel')}
          type="number"
          value={values.targetWeightKg}
          onChange={(event) => setValue('targetWeightKg', event.target.value)}
          fullWidth
          slotProps={{
            htmlInput: { step: '0.1', min: '30', max: '300' }
          }}
        />
        <TextField
          label={t('goalDialog.targetDateLabel')}
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
