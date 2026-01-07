const API_BASE = "http://localhost:3000";

export async function apiFetch(path, options = {}) {
  
  const url =
    path.startsWith("/")
      ? `${API_BASE}${path}`
      : `${API_BASE}/${path}`;

  const {
    method = "GET",
    headers = {},
    body,
  } = options;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    console.error("API error:", res.status, data);
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}
