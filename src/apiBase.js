const DEFAULT_API_BASE = 'http://127.0.0.1:8000'
const API_BASE_KEY = 'medlens_api_base'
const LOOPBACK = ['localhost', '127.0.0.1', '[::1]', '::1']
// 설정 주소 형식이 틀렸을 때 쓰는 자리 표시. 예약된 .invalid 이름이라 어떤 서버에도 닿지 않는다(잘못된 곳으로 요청이 가지 않게).
const INVALID_API_BASE = 'http://invalid-api-base.invalid'
// 허용하는 주소 형식: http(s)://호스트[:포트] 와 선택적인 끝 슬래시 하나. 경로·쿼리·조각·사용자 정보·빈 구분자(? #)·스킴 뒤 슬래시 생략은 받지 않는다.
const ORIGIN_FORMAT = /^https?:\/\/[^/?#@\s\\]+\/?$/i

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

export const API_BASE = CANONICAL_API_BASE || INVALID_API_BASE
dropUntrustedOverride(CANONICAL_API_BASE)

/** 계정 프록시 대상(ACCOUNT_PROXY_TARGET)의 정규 origin. 실행 설정에서만 온다. */
export const ACCOUNT_TARGET = canonicalOrigin(process.env.VUE_APP_ACCOUNT_UPSTREAM)

/**
 * 브라우저가 쓰는 백엔드(API_BASE)와 계정 프록시 대상이 같은 서버인지 본다. 같으면 ''.
 * 기본은 정규 origin(스킴·호스트·포트) 완전 일치다. 루프백끼리·화면 호스트라도 문자열이 다르면 다른 서버로 본다.
 * 같은 서버를 다른 주소로 불러야 할 때만 실행 설정 ACCOUNT_API_ALIASES(쉼표 목록)에 API_BASE 의 origin 을 적어 같은 서버임을 밝힌다.
 */
export function accountTargetProblem() {
  if (!ACCOUNT_TARGET || !CANONICAL_API_BASE) return 'unknown'
  if (CANONICAL_API_BASE === ACCOUNT_TARGET) return ''
  const aliases = String(process.env.VUE_APP_ACCOUNT_API_ALIASES || '').split(',').map((s) => canonicalOrigin(s)).filter(Boolean)
  return aliases.includes(CANONICAL_API_BASE) ? '' : 'mismatch'
}
