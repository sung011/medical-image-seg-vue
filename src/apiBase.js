const DEFAULT_API_BASE = 'http://127.0.0.1:8000'
const API_BASE_KEY = 'medlens_api_base'
const LOCAL_PROXY_BASE = '/__api'

function hostApiBase() {
  if (typeof window === 'undefined' || !window.location) return ''
  const host = window.location.hostname
  if (!host || LOOPBACK.includes(host)) return ''
  return `http://${host}:8000`
}

/** 허용 형식이면 정규 origin(예: http://127.0.0.1:8000), 아니면 ''. 검사에 쓴 이 값을 그대로 실제 요청에도 쓴다. */
function canonicalOrigin(url) {
  const text = String(url || '').trim()
  if (!ORIGIN_FORMAT.test(text)) return ''
  try {
    const u = new URL(text)
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.search || u.hash || u.pathname !== '/') return ''
    return u.origin
  } catch (e) {
    return ''
  }
}

// 백엔드 주소는 실행 설정(VUE_APP_API_BASE, 없으면 기본 규칙) 하나만 믿는다.
// 계정 API 는 같은 출처 프록시(/account-api)가 ACCOUNT_PROXY_TARGET 으로 보내므로, 브라우저에서 주소를 바꾸면
// 로그인한 계정과 다른 백엔드에 회원 번호로 학습 요청을 보낼 수 있다. 그래서 ?api= 와 저장된 medlens_api_base 는
// 쓰지 않고, 실행 설정과 다른 저장값은 지운다(이전 설정을 조용히 다른 서버로 이어 쓰지 않는다).
// 설정 값은 정규 origin 으로 바꿔 쓴다. 형식이 틀리면 어떤 서버에도 닿지 않는 자리 표시를 쓰고 로그인도 막는다.
const CONFIGURED_API_BASE = String(process.env.VUE_APP_API_BASE || '').trim() || hostApiBase() || DEFAULT_API_BASE
const CANONICAL_API_BASE = canonicalOrigin(CONFIGURED_API_BASE)

function dropUntrustedOverride(trusted) {
  if (typeof window === 'undefined') return
  try {
    const saved = window.localStorage.getItem(API_BASE_KEY)
    if (saved !== null && canonicalOrigin(saved) !== trusted) window.localStorage.removeItem(API_BASE_KEY)
  } catch (err) {
    // 저장소를 쓸 수 없으면 덮어쓰기도 없다
  }
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
