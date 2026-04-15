import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useActivityFilters } from '@/hooks/useActivityFilters';

import type { RuleGroupType } from 'react-querybuilder';

describe('useActivityFilters', () => {
  it('builds list filters from applied query rules and sport type', () => {
    const { result } = renderHook(() => useActivityFilters());
    const query: RuleGroupType = {
      combinator: 'and',
      rules: [
        { field: 'distanceKm', operator: '>=', value: '40' },
        { field: 'avgHr', operator: '<=', value: '150' },
      ],
    };

    act(() => {
      result.current.setSportType('running');
      result.current.setQuery(query);
      result.current.setPage(2);
    });

    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.page).toBe(0);
    expect(result.current.appliedFilters).toEqual({
      minDistanceKm: 40,
      maxAvgHr: 150,
    });
    expect(result.current.listFilters).toEqual({
      sportType: 'running',
      minDistanceKm: 40,
      maxAvgHr: 150,
      page: 0,
    });
    expect(result.current.activeFilterCount).toBe(3);
  });

  it('clears query, sport type, and pagination state', () => {
    const { result } = renderHook(() => useActivityFilters());
    const query: RuleGroupType = {
      combinator: 'and',
      rules: [{ field: 'avgPowerW', operator: '=', value: '250' }],
    };

    act(() => {
      result.current.setSportType('cycling');
      result.current.setQuery(query);
      result.current.setShowBuilder(true);
      result.current.applyFilters();
      result.current.setPage(3);
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.query).toEqual({ combinator: 'and', rules: [] });
    expect(result.current.sportType).toBe('');
    expect(result.current.page).toBe(0);
    expect(result.current.showBuilder).toBe(false);
    expect(result.current.appliedFilters).toEqual({});
    expect(result.current.listFilters).toEqual({ page: 0 });
  });
});
