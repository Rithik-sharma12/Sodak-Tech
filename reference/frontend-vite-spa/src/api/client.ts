/// <reference types="vite/client" />
/**
 * Transport for the Django API.
 *
 * Authentication is a session cookie, not a bearer token. Stack doc §5.1:
 * "Authentication tokens in HTTP-only, secure, same-site cookies — never in
 * browser storage, which is readable by any injected script." That matters more
 * here than in a typical app, because this platform renders untrusted learner
 * code — an XSS would read anything kept in localStorage.
 *
 * Two consequences every request depends on:
 *   - `credentials: 'include'`, or the session cookie never travels.
 *   - An `X-CSRFToken` header on writes, echoing the `csrftoken` cookie.
 */

/**
 * Requests go to a relative path so the browser treats them as same-origin.
 * Vite proxies /api to Django in development (see vite.config.ts).
 *
 * Same-origin is not a convenience here: session cookies are SameSite=Lax, so a
 * cross-site XHR would silently drop the cookie and every authenticated request
 * would 403.
 */
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[2]) : null
}

let csrfPrimed = false

/**
 * Django only sets the CSRF cookie once something asks for it. Priming before
 * the first write avoids a spurious 403 on a cold session.
 */
async function primeCsrf(): Promise<void> {
  if (csrfPrimed || readCookie('csrftoken')) {
    csrfPrimed = true
    return
  }
  try {
    await fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' })
    csrfPrimed = true
  } catch {
    // Leave unprimed; the write will fail loudly rather than silently.
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(method)

  if (isWrite) await primeCsrf()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (isWrite) {
    const token = readCookie('csrftoken')
    if (token) headers['X-CSRFToken'] = token
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })

  if (response.status === 204) return undefined as T

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const detail =
      (body && ((body as Record<string, unknown>).detail || (body as Record<string, unknown>).error)) ||
      `${response.status} ${response.statusText}`
    throw new ApiError(response.status, String(detail), body)
  }

  return body as T
}

function query(params?: Record<string, unknown>): string {
  if (!params) return ''
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  return pairs.length ? `?${pairs.join('&')}` : ''
}

export const http = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>(`${path}${query(params)}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
