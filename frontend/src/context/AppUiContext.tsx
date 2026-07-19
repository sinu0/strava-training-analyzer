import { Alert, LinearProgress, Snackbar } from '@mui/material';
import { QueryClientContext } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

interface NotificationItem {
  id: number;
  message: string;
  severity: NotificationSeverity;
}

interface AppUiState {
  queue: NotificationItem[];
  current: NotificationItem | null;
  manualLoadingCount: number;
}

type AppUiAction =
  | { type: 'enqueue-notification'; item: NotificationItem }
  | { type: 'show-next-notification' }
  | { type: 'close-notification' }
  | { type: 'start-global-loading' }
  | { type: 'stop-global-loading' };

interface AppUiContextValue {
  isGlobalLoading: boolean;
  notify: (message: string, severity?: NotificationSeverity) => void;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyWarning: (message: string) => void;
  notifyInfo: (message: string) => void;
  startGlobalLoading: () => void;
  stopGlobalLoading: () => void;
}

const initialState: AppUiState = {
  queue: [],
  current: null,
  manualLoadingCount: 0,
};

const AppUiContext = createContext<AppUiContextValue | null>(null);

let externalNotifier: ((message: string, severity?: NotificationSeverity) => void) | null = null;
let notificationId = 0;

function appUiReducer(state: AppUiState, action: AppUiAction): AppUiState {
  switch (action.type) {
    case 'enqueue-notification':
      return {
        ...state,
        queue: [...state.queue, action.item],
      };
    case 'show-next-notification': {
      const [nextNotification, ...rest] = state.queue;
      if (!nextNotification) {
        return state;
      }

      return {
        ...state,
        current: nextNotification,
        queue: rest,
      };
    }
    case 'close-notification':
      return {
        ...state,
        current: null,
      };
    case 'start-global-loading':
      return {
        ...state,
        manualLoadingCount: state.manualLoadingCount + 1,
      };
    case 'stop-global-loading':
      return {
        ...state,
        manualLoadingCount: Math.max(0, state.manualLoadingCount - 1),
      };
    default:
      return state;
  }
}

export function emitNotification(
  message: string,
  severity: NotificationSeverity = 'info',
): void {
  externalNotifier?.(message, severity);
}

function useOptionalIsFetching(): number {
  const queryClient = useContext(QueryClientContext);

  return useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        if (!queryClient) {
          return () => {};
        }

        return queryClient.getQueryCache().subscribe(() => {
          onStoreChange();
        });
      },
      [queryClient],
    ),
    () => queryClient?.isFetching() ?? 0,
    () => 0,
  );
}

export function AppUiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appUiReducer, initialState);
  const activeQueryCount = useOptionalIsFetching();
  const isGlobalLoading = state.manualLoadingCount > 0 || activeQueryCount > 0;
  const currentNotification = state.current;
  const notificationQueue = state.queue;

  const notify = useCallback((message: string, severity: NotificationSeverity = 'info') => {
    notificationId += 1;
    dispatch({
      type: 'enqueue-notification',
      item: { id: notificationId, message, severity },
    });
  }, []);

  useEffect(() => {
    externalNotifier = notify;
    return () => {
      if (externalNotifier === notify) {
        externalNotifier = null;
      }
    };
  }, [notify]);

  useEffect(() => {
    if (currentNotification || notificationQueue.length === 0) {
      return;
    }

    dispatch({ type: 'show-next-notification' });
  }, [currentNotification, notificationQueue]);

  const handleCloseNotification = useCallback(() => {
    dispatch({ type: 'close-notification' });
  }, []);

  const startGlobalLoading = useCallback(() => {
    dispatch({ type: 'start-global-loading' });
  }, []);

  const stopGlobalLoading = useCallback(() => {
    dispatch({ type: 'stop-global-loading' });
  }, []);

  const value = useMemo<AppUiContextValue>(
    () => ({
      isGlobalLoading,
      notify,
      notifySuccess: (message) => notify(message, 'success'),
      notifyError: (message) => notify(message, 'error'),
      notifyWarning: (message) => notify(message, 'warning'),
      notifyInfo: (message) => notify(message, 'info'),
      startGlobalLoading,
      stopGlobalLoading,
    }),
    [isGlobalLoading, notify, startGlobalLoading, stopGlobalLoading],
  );

  return (
    <AppUiContext.Provider value={value}>
      {isGlobalLoading ? (
        <LinearProgress
          color="primary"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.snackbar + 1,
          }}
        />
      ) : null}
      {children}
      <Snackbar
        open={Boolean(state.current)}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={state.current?.severity ?? 'info'}
          variant="filled"
          onClose={handleCloseNotification}
          sx={{ width: '100%' }}
        >
          {state.current?.message}
        </Alert>
      </Snackbar>
    </AppUiContext.Provider>
  );
}

export function useAppUi(): AppUiContextValue {
  const context = useContext(AppUiContext);
  if (!context) {
    throw new Error('useAppUi must be used within AppUiProvider');
  }
  return context;
}
