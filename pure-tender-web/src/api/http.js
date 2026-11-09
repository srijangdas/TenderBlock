import { API_BASE_URL } from '../data/constants';
import { parseApiJson } from './parseApiJson.js';

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'ApiError'; this.status = status; }
}

export async function http(path, { method = 'GET', body, token, signal, binary = false, responseType = 'json' } = {}) {
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
  if (response.ok && (binary || responseType === 'blob')) return response.blob();
  const raw = await response.text();
  let data;
  try { data = raw ? parseApiJson(raw) : null; } catch { data = raw; }
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

export const pageItems = value => Array.isArray(value) ? value : value?.content || [];

// Fetch every Spring Page so staff queues do not silently stop at 100 records.
export async function readAllPages(path, token, signal) {
  const items = [];
  for (let page = 0; page < 1000; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const response = await http(`${path}${separator}page=${page}&size=100`, { token, signal });
    if (Array.isArray(response)) return response;
    if (!Array.isArray(response?.content)) throw new ApiError('Expected a Spring Page response.');
    items.push(...response.content);
    if (response.last || page + 1 >= response.totalPages || !response.content.length) return items;
  }
  throw new ApiError('The queue is too large to load. Narrow the backend results.');
}
