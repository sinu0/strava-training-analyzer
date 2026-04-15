import { Box, TextField } from '@mui/material';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

/**
 * Lets the user pick a start and end date with paired date inputs.
 */
export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <TextField
        type="date"
        label="Od"
        value={startDate}
        onChange={(e) => onChange(e.target.value, endDate)}
        size="small"
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        type="date"
        label="Do"
        value={endDate}
        onChange={(e) => onChange(startDate, e.target.value)}
        size="small"
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  );
}
