import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  type DialogProps,
} from '@mui/material';

import type { FormEvent, ReactNode } from 'react';

interface FormDialogProps extends Pick<DialogProps, 'maxWidth' | 'fullWidth'> {
  open: boolean;
  title: string;
  submitLabel: string;
  cancelLabel?: string;
  disableSubmit?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Wraps dialog content in a form so submit and cancel actions stay consistent.
 */
export default function FormDialog({
  open,
  title,
  submitLabel,
  cancelLabel = 'Anuluj',
  disableSubmit = false,
  maxWidth = 'sm',
  fullWidth = true,
  onSubmit,
  onClose,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <Box component="form" onSubmit={onSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{cancelLabel}</Button>
          <Button type="submit" variant="contained" disabled={disableSubmit}>
            {submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
