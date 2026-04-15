import axios, { type InternalAxiosRequestConfig } from 'axios';

import { emitNotification } from '@/hooks/useNotification';
import { getApiErrorMessage, isRetryableApiError } from '@/utils/errorHandling';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  skipErrorNotification?: boolean;
}

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestConfig = error.config as RetryableRequestConfig | undefined;
    const method = requestConfig?.method?.toLowerCase();
    const retryCount = requestConfig?._retryCount ?? 0;
    const canRetry = method === 'get' && retryCount < 1 && isRetryableApiError(error);

    if (requestConfig && canRetry) {
      requestConfig._retryCount = retryCount + 1;
      return apiClient(requestConfig);
    }

    if (!requestConfig?.skipErrorNotification && !axios.isCancel(error)) {
      emitNotification(
        getApiErrorMessage(error, 'Wystąpił błąd komunikacji z API.'),
        'error',
      );
    }

    return Promise.reject(error);
  },
);

export default apiClient;
