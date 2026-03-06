import { getToken, clearToken } from '../auth/auth';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearToken();
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || data?.error || 'Request failed';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return data as T;
}

export const api = {
  register: (email: string, password: string) =>
    requestJson<{ token: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),

  login: (email: string, password: string) =>
    requestJson<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => requestJson<{ id: string; email: string }>('/auth/me'),

  createSession: () => requestJson<any>('/sessions', { method: 'POST', body: JSON.stringify({}) }),

  listSessions: () => requestJson<any[]>('/sessions'),

  getSession: (id: string) => requestJson<any>(`/sessions/${id}`),

  updateAnswers: (id: string, answers: string[]) =>
    requestJson<any>(`/sessions/${id}/answers`, { method: 'PUT', body: JSON.stringify({ answers }) }),

  submitSession: (id: string) =>
    requestJson<any>(`/sessions/${id}/submit`, { method: 'POST', body: JSON.stringify({}) }),
};
