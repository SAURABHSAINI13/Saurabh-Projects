// src/api/client.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic request wrapper.
 * If you pass `body` as an object, it will be JSON-stringified here.
 */
export const request = async (path, options = {}) => {
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // If caller provided a plain object body, stringify it.
  const body =
    options.body && typeof options.body === 'object'
      ? JSON.stringify(options.body)
      : options.body;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body,
  });

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    // ignore parse errors; payload stays {}
  }

  if (!res.ok) {
    throw new Error(payload.error || `HTTP ${res.status}`);
  }

  return payload;
};