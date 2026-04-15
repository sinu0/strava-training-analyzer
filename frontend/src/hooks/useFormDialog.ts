import { useCallback, useReducer } from 'react';

type FormValues = object;

interface FormDialogState<T extends FormValues> {
  open: boolean;
  values: T;
}

type FormDialogAction<T extends FormValues> =
  | { type: 'open'; values: T }
  | { type: 'close'; values: T }
  | { type: 'reset'; values: T }
  | { type: 'set-values'; values: T };

function formDialogReducer<T extends FormValues>(
  state: FormDialogState<T>,
  action: FormDialogAction<T>,
): FormDialogState<T> {
  switch (action.type) {
    case 'open':
      return { open: true, values: action.values };
    case 'close':
      return { open: false, values: action.values };
    case 'reset':
      return { ...state, values: action.values };
    case 'set-values':
      return { ...state, values: action.values };
    default:
      return state;
  }
}

export interface UseFormDialogResult<T extends FormValues> {
  open: boolean;
  values: T;
  openDialog: (nextValues?: Partial<T>) => void;
  closeDialog: () => void;
  reset: () => void;
  setValues: (nextValues: T | ((currentValues: T) => T)) => void;
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
}

export function useFormDialog<T extends FormValues>(
  initialValues: T,
): UseFormDialogResult<T> {
  const [state, dispatch] = useReducer(formDialogReducer<T>, {
    open: false,
    values: initialValues,
  });

  const reset = useCallback(() => {
    dispatch({ type: 'reset', values: initialValues });
  }, [initialValues]);

  const openDialog = useCallback(
    (nextValues?: Partial<T>) => {
      dispatch({
        type: 'open',
        values: { ...initialValues, ...nextValues },
      });
    },
    [initialValues],
  );

  const closeDialog = useCallback(() => {
    dispatch({ type: 'close', values: initialValues });
  }, [initialValues]);

  const setValues = useCallback((nextValues: T | ((currentValues: T) => T)) => {
    dispatch({
      type: 'set-values',
      values:
        typeof nextValues === 'function'
          ? (nextValues as (values: T) => T)(state.values)
          : nextValues,
    });
  }, [state.values]);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    dispatch({
      type: 'set-values',
      values: {
        ...state.values,
      [key]: value,
      },
    });
  }, [state.values]);

  return {
    open: state.open,
    values: state.values,
    openDialog,
    closeDialog,
    reset,
    setValues,
    setValue,
  };
}
