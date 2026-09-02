import { TextField, type TextFieldProps } from '@mui/material';
import { useEffect, useState } from 'react';

type PolishDateFieldProps = Omit<TextFieldProps, 'type' | 'value' | 'onChange'> & {
  value: string;
  onChange: (isoDate: string) => void;
};

function formatIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : '';
}

function parsePolishDate(value: string) {
  const match = /^(\d{2})[.\-/](\d{2})[.\-/](\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export default function PolishDateField({ value, onChange, inputProps, ...props }: PolishDateFieldProps) {
  const [displayValue, setDisplayValue] = useState(() => formatIsoDate(value));

  useEffect(() => {
    setDisplayValue(formatIsoDate(value));
  }, [value]);

  const commit = () => {
    if (!displayValue.trim()) {
      onChange('');
      return;
    }
    const parsed = parsePolishDate(displayValue);
    if (parsed) {
      onChange(parsed);
      setDisplayValue(formatIsoDate(parsed));
    } else {
      setDisplayValue(formatIsoDate(value));
    }
  };

  return (
    <TextField
      {...props}
      type="text"
      value={displayValue}
      placeholder="DD.MM.RRRR"
      onChange={(event) => setDisplayValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      inputProps={{
        ...inputProps,
        lang: 'pl-PL',
        inputMode: 'numeric',
        maxLength: 10,
      }}
    />
  );
}
