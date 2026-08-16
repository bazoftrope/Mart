import type {
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
} from '@/lib/apiHandler';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public issues?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type RequestBody = Record<string, unknown> | string | undefined;

let refreshPromise: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(
  method: string,
  url: string,
  body?: RequestBody,
  isRetry = false
): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = {
    method,
    credentials: 'include',
  };

  if (body !== undefined) {
    if (typeof body === 'string') {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
    }
    headers['Content-Type'] = 'application/json';
  }

  init.headers = headers;

  const res = await fetch(url, init);
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (res.status === 401 && !isRetry && !url.startsWith('/api/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(method, url, body, true);
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    const error = json as ApiErrorResponse;
    throw new ApiClientError(
      error.message || 'Request failed',
      res.status,
      error.error || 'UNKNOWN_ERROR',
      error.issues
    );
  }

  const success = json as ApiSuccessResponse<T>;
  return success.data;
}

export const apiClient = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: RequestBody) => request<T>('POST', url, body),
  put: <T>(url: string, body?: RequestBody) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: RequestBody) => request<T>('PATCH', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
};

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  let res = await fetch(url, { credentials: 'include', ...init });

  if (res.status === 401 && !url.startsWith('/api/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(url, { credentials: 'include', ...init });
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return res;
}
