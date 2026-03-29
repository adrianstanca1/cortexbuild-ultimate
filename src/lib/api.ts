/**
 * API utility for making authenticated requests to the backend
 * Handles auth headers and base path automatically
 */

export interface ApiErrorResponse {
  error: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: ApiErrorResponse;
}

function getAuthHeaders(): Record<string, string> {
  const authToken = localStorage.getItem('authToken') || '';
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      console.error('Failed to parse API response:', err);
    }

    if (!response.ok) {
      const errorMessage = data?.error
        ? data.error
        : `HTTP ${response.status}: ${response.statusText}`;
      return {
        ok: false,
        status: response.status,
        error: {
          error: errorMessage,
          details: data?.details || data || { status: response.status, statusText: response.statusText },
        },
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      ok: false,
      status: 0,
      error: {
        error: `Network error: ${message}`,
      },
    };
  }
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const result = await apiRequest<T>(endpoint, { method: 'GET' });
  if (!result.ok) {
    throw new Error(result.error?.error || 'Failed to fetch');
  }
  return result.data as T;
}

export async function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  const result = await apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!result.ok) {
    throw new Error(result.error?.error || 'Failed to post');
  }
  return result.data as T;
}

export async function apiPut<T>(endpoint: string, data: unknown): Promise<T> {
  const result = await apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!result.ok) {
    throw new Error(result.error?.error || 'Failed to update');
  }
  return result.data as T;
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const result = await apiRequest<T>(endpoint, { method: 'DELETE' });
  if (!result.ok) {
    throw new Error(result.error?.error || 'Failed to delete');
  }
  return result.data as T;
}
