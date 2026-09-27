// Set EXPO_PUBLIC_API_URL in a .env file at the project root, e.g.
//   EXPO_PUBLIC_API_URL=http://192.168.1.23:4000/api
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

export type AuthUser = { id: string; email: string };
export type AuthResult = { token: string; user: AuthUser };

async function handle<T>(res: Response): Promise<T> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // response wasn't JSON
  }
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, body?.code);
  }
  return body as T;
}

function post<T>(path: string, payload: unknown): Promise<T> {
  return fetch(`${API_URL}/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((res) => handle<T>(res));
}

export function register(email: string, password: string) {
  return post<{ message: string; email: string }>('/register', { email, password });
}

export function verifyEmail(email: string, code: string) {
  return post<AuthResult>('/verify-email', { email, code });
}

export function resendVerification(email: string) {
  return post<{ message: string }>('/resend-verification', { email });
}

export function login(email: string, password: string) {
  return post<AuthResult>('/login', { email, password });
}

export function forgotPassword(email: string) {
  return post<{ message: string }>('/forgot-password', { email });
}

export function resetPassword(email: string, code: string, newPassword: string) {
  return post<AuthResult>('/reset-password', { email, code, newPassword });
}
