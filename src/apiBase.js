const DEFAULT_API_BASE = 'http://127.0.0.1:8000'
const API_BASE_KEY = 'medlens_api_base'
const LOCAL_PROXY_BASE = '/__api'

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

function isLocalHostname(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

/** vue-cli 개발 서버(:8080 등)에서는 같은 출처 프록시로 세션 쿠키를 넘긴다. */
function localDevProxyBase() {
  if (typeof window === 'undefined' || !window.location) return ''
  const host = window.location.hostname
  const port = window.location.port
  if (!isLocalHostname(host)) return ''
  if (!port || port === '8000') return ''
  return LOCAL_PROXY_BASE
}

/** 로컬 개발 중 localStorage 가 :8000 을 가리키면 쿠키가 막히므로 프록시를 쓴다. */
function resolveApiBase() {
  const proxy = localDevProxyBase()
  const stored = storedApiBase()
  if (proxy && stored) {
    try {
      const url = new URL(stored)
      if (isLocalHostname(url.hostname) && (url.port === '8000' || url.port === '')) {
        return proxy
      }
    } catch (err) {
      /* 상대 경로 등이면 저장된 값 사용 */
    }
  }
  return stored || proxy || hostApiBase() || DEFAULT_API_BASE
}

export const API_BASE = resolveApiBase()

/** 같은 출처(프록시)일 때만 쿠키를 보낸다. 크로스 오리진 + credentials 는 CORS * 에서 실패한다. */
export function apiCredentials() {
  return String(API_BASE).startsWith('/') ? 'include' : 'same-origin'
}
