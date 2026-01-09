// Backend URL configuration
// In development: uses localhost via Vite proxy
// In production: uses VITE_API_URL environment variable or location.origin

const isDev = import.meta.env.DEV

export const API_BASE_URL = isDev
  ? '' // Empty string uses relative paths (Vite proxy in dev)
  : import.meta.env.VITE_API_URL || window.location.origin

export const getApiUrl = (path) => {
  return API_BASE_URL + path
}
