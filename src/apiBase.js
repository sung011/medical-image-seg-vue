const DEFAULT_API_BASE = 'http://127.0.0.1:8000'
const API_BASE_KEY = 'medlens_api_base'

function storedApiBase() {
  if (typeof window === 'undefined') return ''
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('api')
    if (fromQuery) window.localStorage.setItem(API_BASE_KEY, fromQuery.replace(/\/$/, ''))
    const saved = window.localStorage.getItem(API_BASE_KEY)
    return saved ? saved.replace(/\/$/, '') : ''
  } catch (err) {
    return ''
  }
}

function hostApiBase() {
  if (typeof window === 'undefined' || !window.location) return ''
  const host = window.location.hostname
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') return ''
  return `http://${host}:8000`
}

export const API_BASE = storedApiBase() || hostApiBase() || DEFAULT_API_BASE
