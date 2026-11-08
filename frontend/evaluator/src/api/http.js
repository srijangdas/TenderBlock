const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function http(path, { method = 'GET', body, token, binary = false } = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch { throw new Error('Cannot connect to the TenderBlock backend. Check that Spring Boot is running.'); }
  if (!response.ok) {
    const text = await response.text(); let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    throw new Error(data?.message || data?.detail || `Request failed (${response.status}).`);
  }
  return binary ? response.blob() : response.status === 204 ? null : response.json();
}
