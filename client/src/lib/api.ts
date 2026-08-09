import { apiUrl } from './env';

let tokenGetter: () => Promise<string | null> = async () => null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = await tokenGetter();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'UNKNOWN',
      data?.error?.message ?? res.statusText,
    );
  }
  return data;
}

export const api = {
  get: <T = unknown>(path: string) => request('GET', path) as Promise<T>,
  post: <T = unknown>(path: string, body?: unknown) =>
    request('POST', path, body) as Promise<T>,
  patch: <T = unknown>(path: string, body?: unknown) =>
    request('PATCH', path, body) as Promise<T>,
  put: <T = unknown>(path: string, body?: unknown) =>
    request('PUT', path, body) as Promise<T>,
  del: (path: string) => request('DELETE', path),
};
