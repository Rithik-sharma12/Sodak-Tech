/**
 * The single place the frontend talks to the API.
 *
 * Session cookies, not bearer tokens. The API sets an HttpOnly session cookie
 * and the browser sends it automatically; nothing here reads or stores a
 * credential. That is deliberate and load-bearing on this platform in a way it
 * is not on an ordinary app: the product renders code written by strangers, so
 * a token in localStorage would be readable by any injected script.
 *
 * The consequence is CSRF protection, which cookie auth needs and bearer auth
 * does not. Django sets a readable `csrftoken` cookie; every unsafe method
 * echoes it back in the X-CSRFToken header.
 */

import type { Paginated } from "./types";

/**
 * Same-origin. The Vite dev server proxies /api to the backend and the
 * production edge does the same, so no environment ever needs a base URL
 * configured and no request is ever cross-origin.
 */
const BASE = "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Field-level messages from DRF, when the failure was a validation error. */
  readonly fields: Record<string, string[]>;
  readonly retryAfter?: number;

  constructor(
    status: number,
    message: string,
    code = "error",
    fields: Record<string, string[]> = {},
    retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }

  /** True when the user is not signed in, or their session has expired. */
  get isUnauthenticated(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]!) : null;
}

let csrfPrimed = false;

/**
 * Ensure a CSRF cookie exists before the first unsafe request.
 *
 * Django only sets it on a view that calls get_token(), so a user whose first
 * action after loading is a POST would otherwise be rejected once and succeed
 * on retry — which reads as a flaky app.
 */
export async function primeCsrf(force = false): Promise<void> {
  if (csrfPrimed && !force && readCookie("csrftoken")) return;
  await fetch(`${BASE}/auth/csrf/`, { credentials: "same-origin" });
  csrfPrimed = true;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Query parameters; undefined and empty values are dropped. */
  params?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${url}${url.includes("?") ? "&" : "?"}${query}` : url;
}

/**
 * Flatten DRF's error shapes into one message plus per-field detail.
 *
 * DRF returns at least three: `{detail}`, `{field: [messages]}`, and this
 * project's `{error, detail}`. Handling them in one place keeps every caller
 * from re-deriving "what went wrong" from an unknown shape.
 */
function parseError(status: number, payload: unknown): ApiError {
  if (typeof payload === "string" && payload.trim()) {
    return new ApiError(status, payload);
  }
  if (!payload || typeof payload !== "object") {
    return new ApiError(status, `Request failed with status ${status}.`);
  }

  const body = payload as Record<string, unknown>;
  const code = typeof body.error === "string" ? body.error : "error";
  const retryAfter =
    typeof body.retry_after === "number" ? body.retry_after : undefined;

  if (typeof body.detail === "string") {
    return new ApiError(status, body.detail, code, {}, retryAfter);
  }

  const fields: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "error" || key === "retry_after") continue;
    if (Array.isArray(value)) fields[key] = value.map(String);
    else if (typeof value === "string") fields[key] = [value];
  }

  const first = Object.entries(fields)[0];
  const message = first
    ? // non_field_errors reads as noise to a user; show just the message.
      first[0] === "non_field_errors"
      ? first[1][0]!
      : `${first[0]}: ${first[1][0]}`
    : `Request failed with status ${status}.`;

  return new ApiError(status, message, code, fields, retryAfter);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const unsafe = method !== "GET";

  if (unsafe) await primeCsrf();

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (unsafe) {
    const token = readCookie("csrftoken");
    if (token) headers["X-CSRFToken"] = token;
  }

  const response = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    credentials: "same-origin",
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    // A rejected CSRF token usually means the cookie was rotated (a new
    // session, a restarted backend in development). Re-prime once so the
    // retry that follows can succeed rather than failing the same way.
    if (response.status === 403 && String(text).includes("CSRF")) {
      csrfPrimed = false;
    }
    throw parseError(response.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, params?: RequestOptions["params"], signal?: AbortSignal) =>
    request<T>(path, { method: "GET", params, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Unwrap a paginated envelope for the many places that just want the rows. */
export function rows<T>(page: Paginated<T> | T[] | undefined): T[] {
  if (!page) return [];
  return Array.isArray(page) ? page : (page.results ?? []);
}
