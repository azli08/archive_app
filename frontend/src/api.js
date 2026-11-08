import { Capacitor } from '@capacitor/core'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = (configuredApiBaseUrl || (Capacitor.isNativePlatform() ? '' : 'http://127.0.0.1:8000/api/v1')).replace(
  /\/$/,
  '',
)

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  if (!API_BASE_URL) {
    throw new Error('Set VITE_API_BASE_URL to your HTTPS backend address before building the mobile app.')
  }
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach the Collectly API. Check that the backend is running.')
  }

  if (response.status === 204) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload?.detail
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(' ')
      : typeof detail === 'string'
        ? detail
        : `Request failed (${response.status})`
    throw new Error(message)
  }
  return payload
}

export const apiBaseUrl = API_BASE_URL
