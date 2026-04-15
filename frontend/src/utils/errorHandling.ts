import axios from 'axios';

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    return payload?.message ?? payload?.error ?? fallback;
  }
  return fallback;
}

export function isRetryableApiError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status == null || status >= 500;
}
