import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import DateRangePicker from '../components/common/DateRangePicker';

describe('DateRangePicker', () => {
  it('calls onChange with the new start date and current end date', () => {
    const handleChange = vi.fn();

    render(
      <DateRangePicker
        startDate="2024-06-01"
        endDate="2024-06-30"
        onChange={handleChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Od'), { target: { value: '2024-06-05' } });

    expect(handleChange).toHaveBeenCalledWith('2024-06-05', '2024-06-30');
  });

  it('reflects updated controlled props from the parent', () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <DateRangePicker
        startDate="2024-06-01"
        endDate="2024-06-30"
        onChange={handleChange}
      />,
    );

    rerender(
      <DateRangePicker
        startDate="2024-06-10"
        endDate="2024-07-05"
        onChange={handleChange}
      />,
    );

    expect(screen.getByDisplayValue('2024-06-10')).toBeDefined();
    expect(screen.getByDisplayValue('2024-07-05')).toBeDefined();
  });
});
