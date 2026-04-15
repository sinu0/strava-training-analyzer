import { useEffect, useState } from 'react';

function readStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  const rawValue = window.localStorage.getItem(key);
  if (rawValue == null) {
    return defaultValue;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return rawValue as T;
  }
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): readonly [T, (value: T | ((currentValue: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStoredValue(key, defaultValue));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  const updateValue = (nextValue: T | ((currentValue: T) => T)) => {
    setValue((currentValue) =>
      typeof nextValue === 'function'
        ? (nextValue as (value: T) => T)(currentValue)
        : nextValue,
    );
  };

  return [value, updateValue] as const;
}
