import {
  AppUiProvider,
  emitNotification,
  useAppUi,
  type NotificationSeverity,
} from '@/context/AppUiContext';

import type { ReactNode } from 'react';


export { emitNotification, type NotificationSeverity };

export function NotificationProvider({ children }: { children: ReactNode }) {
  return <AppUiProvider>{children}</AppUiProvider>;
}

export function useNotification() {
  const {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  } = useAppUi();

  return {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
}
