export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function buildBasicAuthHeader(username, password) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

export function resolveApiUrl(path, environment = process.env.NODE_ENV) {
  if (/^[A-Za-z][A-Za-z\d+.-]*:/.test(path) || String(path).startsWith("//")) return path;
  if (environment === "production") return `http://127.0.0.1:5050${path}`;
  return path;
}

export async function fetchJson(path, authHeader, options = {}) {
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (authHeader) headers.Authorization = authHeader;

  const response = await fetch(resolveApiUrl(path), { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) throw new ApiError("Authentication failed", 401);
    let detail = "";
    try {
      detail = await response.text();
    } catch (_) {
      // The status code is enough when the response body cannot be read.
    }
    throw new ApiError(detail || response.statusText || `HTTP ${response.status}`, response.status);
  }

  return response.json();
}
