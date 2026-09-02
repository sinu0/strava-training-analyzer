import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PolishDateField from '@/components/common/PolishDateField';

describe('PolishDateField', () => {
  it('shows and emits dates in an explicit Polish format', () => {
    const onChange = vi.fn();
    render(<PolishDateField label="Od" value="2026-08-21" onChange={onChange} />);

    const input = screen.getByLabelText('Od');
    expect(input.getAttribute('placeholder')).toBe('DD.MM.RRRR');
    expect((input as HTMLInputElement).value).toBe('21.08.2026');

    fireEvent.change(input, { target: { value: '22.08.2026' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith('2026-08-22');
  });
});
