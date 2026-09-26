
import { Stack, TextField } from '@mui/material';

import FormDialog from '@/components/common/FormDialog';
import { weightMessages } from '@/components/weight/messages';
import type { UseFormDialogResult } from '@/hooks/useFormDialog';

import type { FormEvent } from 'react';

interface AddWeightFormValues {
  [key: string]: string;
  weightKg: string;
  recordedDate: string;
  notes: string;
}

interface AddWeightDialogProps {
  dialog: UseFormDialogResult<AddWeightFormValues>;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function AddWeightDialog({
  dialog,
  pending,
  onSubmit,
}: AddWeightDialogProps) {
  const { open, values, closeDialog, setValue } = dialog;
  const t = weightMessages.useT();

  return (
    <FormDialog
      open={open}
      title={t('addDialog.title')}
      submitLabel={t('addDialog.submit')}
      maxWidth="xs"
      disableSubmit={pending || !values.weightKg.trim() || !values.recordedDate}
      onSubmit={onSubmit}
      onClose={closeDialog}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label={t('addDialog.weightLabel')}
          type="number"
          value={values.weightKg}
          onChange={(event) => setValue('weightKg', event.target.value)}
          fullWidth
          slotProps={{
            htmlInput: { step: '0.1', min: '30', max: '300' }
          }}
        />
        <TextField
          label={t('addDialog.dateLabel')}
          type="date"
          value={values.recordedDate}
          onChange={(event) => setValue('recordedDate', event.target.value)}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label={t('addDialog.notesLabel')}
          value={values.notes}
          onChange={(event) => setValue('notes', event.target.value)}
          fullWidth
          multiline
          rows={2}
        />
      </Stack>
    </FormDialog>
  );
}
