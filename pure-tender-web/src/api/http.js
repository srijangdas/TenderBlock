import { API_BASE_URL } from '../data/constants';

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'ApiError'; this.status = status; }
}

export async function http(path, { method = 'GET', body, token, signal } = {}) {
  const isMultipart = body instanceof FormData;
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: {
        ...(!isMultipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: isMultipart ? body : JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('Cannot connect to Spring Boot. Check the backend server and Vite proxy.');
  }
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) {
    if (response.status === 401 && token && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tenderblock:session-expired'));
    }
    const message = typeof data === 'object' && data
      ? (data.message || data.error || data.detail)
      : null;
    if ([502, 503, 504].includes(response.status)) {
      throw new ApiError(
        `Backend/API gateway unavailable (HTTP ${response.status}). The Vite frontend is running, but the request could not be completed by Spring Boot. Check that the Java application is listening on the configured backend port (usually 8080); inspect its terminal for database or Fabric startup errors.`,
        response.status,
      );
    }
    throw new ApiError(message || `Request failed (${response.status}).`, response.status);
  }
  return data;
}
