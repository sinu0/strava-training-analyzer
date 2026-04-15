import { useCallback, useMemo, useState, useTransition } from 'react';

import type { ActivityFilters } from '@/types/query';

import type { Field, RuleGroupType } from 'react-querybuilder';

export const ACTIVITY_FILTER_FIELDS: Field[] = [
  { name: 'distanceKm', label: 'Dystans (km)', inputType: 'number' },
  { name: 'durationMin', label: 'Czas (min)', inputType: 'number' },
  { name: 'avgPowerW', label: 'Moc avg (W)', inputType: 'number' },
  { name: 'avgHr', label: 'Tętno avg (bpm)', inputType: 'number' },
  {
    name: 'sportType',
    label: 'Typ sportu',
    valueEditorType: 'select',
    values: [
      { name: 'cycling', label: 'Kolarstwo' },
      { name: 'running', label: 'Bieganie' },
      { name: 'swimming', label: 'Pływanie' },
      { name: 'walking', label: 'Chód' },
      { name: 'strength', label: 'Siłownia' },
    ],
    operators: [{ name: '=', label: '=' }],
  },
];

export const ACTIVITY_NUMERIC_OPERATORS = [
  { name: '>', label: '>' },
  { name: '>=', label: '>=' },
  { name: '<', label: '<' },
  { name: '<=', label: '<=' },
  { name: '=', label: '=' },
];

export const SPORT_TYPES = ['cycling', 'running', 'swimming', 'walking', 'strength'];

function createDefaultQuery(): RuleGroupType {
  return { combinator: 'and', rules: [] };
}

function queryToFilters(query: RuleGroupType): Record<string, number | string> {
  const filters: Record<string, number | string> = {};

  for (const rule of query.rules) {
    if (!('field' in rule) || rule.value === '' || rule.value == null) {
      continue;
    }

    if (rule.field === 'sportType') {
      if (rule.operator === '=') {
        filters.sportType = String(rule.value);
      }
      continue;
    }

    const value = Number(rule.value);
    if (Number.isNaN(value)) {
      continue;
    }

    switch (rule.field) {
      case 'distanceKm':
        if (rule.operator === '>' || rule.operator === '>=') {
          filters.minDistanceKm = value;
        } else if (rule.operator === '<' || rule.operator === '<=') {
          filters.maxDistanceKm = value;
        } else if (rule.operator === '=') {
          filters.minDistanceKm = value;
          filters.maxDistanceKm = value;
        }
        break;
      case 'durationMin':
        if (rule.operator === '>' || rule.operator === '>=') {
          filters.minDurationMin = value;
        } else if (rule.operator === '<' || rule.operator === '<=') {
          filters.maxDurationMin = value;
        } else if (rule.operator === '=') {
          filters.minDurationMin = value;
          filters.maxDurationMin = value;
        }
        break;
      case 'avgPowerW':
        if (rule.operator === '>' || rule.operator === '>=') {
          filters.minAvgPowerW = value;
        } else if (rule.operator === '<' || rule.operator === '<=') {
          filters.maxAvgPowerW = value;
        } else if (rule.operator === '=') {
          filters.minAvgPowerW = value;
          filters.maxAvgPowerW = value;
        }
        break;
      case 'avgHr':
        if (rule.operator === '>' || rule.operator === '>=') {
          filters.minAvgHr = value;
        } else if (rule.operator === '<' || rule.operator === '<=') {
          filters.maxAvgHr = value;
        } else if (rule.operator === '=') {
          filters.minAvgHr = value;
          filters.maxAvgHr = value;
        }
        break;
    }
  }

  return filters;
}

export interface UseActivityFiltersResult {
  sportType: string;
  page: number;
  query: RuleGroupType;
  appliedFilters: Record<string, number | string>;
  showBuilder: boolean;
  listFilters: ActivityFilters;
  activeFilterCount: number;
  isPending: boolean;
  setSportType: (value: string) => void;
  setPage: (value: number) => void;
  setQuery: (value: RuleGroupType) => void;
  setShowBuilder: (value: boolean) => void;
  applyFilters: () => void;
  clearFilters: () => void;
}

export function useActivityFilters(): UseActivityFiltersResult {
  const [sportTypeValue, setSportTypeValue] = useState('');
  const [page, setPageState] = useState(0);
  const [query, setQueryState] = useState<RuleGroupType>(() => createDefaultQuery());
  const [appliedFilters, setAppliedFilters] = useState<Record<string, number | string>>({});
  const [showBuilder, setShowBuilderState] = useState(false);
  const [isPending, startTransition] = useTransition();

  const setSportType = useCallback((value: string) => {
    startTransition(() => {
      setSportTypeValue(value);
      setPageState(0);
    });
  }, []);

  const setPage = useCallback((value: number) => {
    setPageState(value);
  }, []);

  const setQuery = useCallback((value: RuleGroupType) => {
    startTransition(() => {
      setQueryState(value);
    });
  }, []);

  const setShowBuilder = useCallback((value: boolean) => {
    setShowBuilderState(value);
  }, []);

  const applyFilters = useCallback(() => {
    startTransition(() => {
      setAppliedFilters(queryToFilters(query));
      setPageState(0);
    });
  }, [query]);

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setQueryState(createDefaultQuery());
      setAppliedFilters({});
      setSportTypeValue('');
      setPageState(0);
      setShowBuilderState(false);
    });
  }, []);

  const listFilters = useMemo<ActivityFilters>(
    () => ({
      ...(sportTypeValue ? { sportType: sportTypeValue } : {}),
      ...appliedFilters,
      page,
    }),
    [appliedFilters, page, sportTypeValue],
  );

  return {
    sportType: sportTypeValue,
    page,
    query,
    appliedFilters,
    showBuilder,
    listFilters,
    activeFilterCount: query.rules.length + (sportTypeValue ? 1 : 0),
    isPending,
    setSportType,
    setPage,
    setQuery,
    setShowBuilder,
    applyFilters,
    clearFilters,
  };
}
