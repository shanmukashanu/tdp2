type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiError = {
  status: number;
  message: string;
};

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  'https://tdp2-backend-jcjg.onrender.com';

function getStoredTokens() {
  const raw = localStorage.getItem('tdp_tokens');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { accessToken: string; refreshToken: string };
  } catch {
    return null;
  }
}

function setStoredTokens(tokens: { accessToken: string; refreshToken: string } | null) {
  if (!tokens) {
    localStorage.removeItem('tdp_tokens');
    return;
  }
  localStorage.setItem('tdp_tokens', JSON.stringify(tokens));
}

async function request<T>(path: string, method: HttpMethod, body?: any, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = { status: res.status, message: data?.message || 'Request failed' };
    throw err;
  }
  return data as T;
}

async function authedRequest<T>(path: string, method: HttpMethod, body?: any): Promise<T> {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    throw { status: 401, message: 'Unauthorized' } as ApiError;
  }

  try {
    return await request<T>(path, method, body, tokens.accessToken);
  } catch (e: any) {
    if (e?.status !== 401 || !tokens.refreshToken) throw e;

    const refreshed = await request<{ ok: true; tokens: { accessToken: string; refreshToken: string } }>(
      '/api/auth/refresh',
      'POST',
      { refreshToken: tokens.refreshToken }
    ).catch(async () => {
      return await request<{ ok: true; tokens: { accessToken: string; refreshToken: string } }>(
        '/api/admin/auth/refresh',
        'POST',
        { refreshToken: tokens.refreshToken }
      );
    });

    setStoredTokens(refreshed.tokens);
    return await request<T>(path, method, body, refreshed.tokens.accessToken);
  }
}

async function uploadSingle(file: File): Promise<{
  ok: true;
  file: { url: string; publicId: string; resourceType: string; bytes: number; originalname: string };
}> {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    throw { status: 401, message: 'Unauthorized' } as ApiError;
  }

  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`${API_BASE}/api/uploads/single`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = { status: res.status, message: data?.message || 'Upload failed' };
    throw err;
  }

  return data as any;
}

export const api = {
  API_BASE,
  getStoredTokens,
  setStoredTokens,
  request,
  authedRequest,
  uploadSingle,
};

export type { ApiError };
