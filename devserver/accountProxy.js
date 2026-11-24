// 계정 API 같은 출처 프록시 (npm run serve 전용, MYPAGE-TEAM-FE-20261123).
//
// 브라우저는 /account-api/... 로만 부르고, 이 미들웨어가 요청을 검사한 뒤 백엔드로 넘긴다.
// - 승인된 조합만 넘긴다(계정 7개 + 무릎 제출 POST /learning/roi-grade/knee). 나머지 경로 404, 다른 메서드 405,
//   쿼리·비정규 경로 400. 이때 백엔드·SPA 폴백 호출은 없다.
// - 무릎 제출은 로그인 쿠키(learner 세션)가 있어야 채점하는 백엔드 경로라 같은 출처로 넘긴다. 다른 쓰기와 같이
//   화면 계정과 쿠키 계정이 같을 때만 넘기고, 본문은 기존 형식(application/x-www-form-urlencoded) 그대로 보낸다.
// - 쓰기(POST·PATCH)는 Origin 이 이 화면 주소와 정확히 같아야 한다. 화면 주소는 루프백이거나 ACCOUNT_TRUSTED_ORIGINS 에 있어야 한다.
// - 쿠키는 브라우저에 medlens_account_<화면 포트>(Path=/account-api)로만 두고, 백엔드에는 brain_fast_session 으로 바꿔 보낸다.
//   쿠키는 포트를 구분하지 않으므로 이름에 화면 포트를 넣어, 포트가 다른 devServer(=다른 출처, 다른 Web Locks 범위)끼리
//   로그인·만료가 서로 닿지 않게 한다. 같은 호스트의 관리자·직접 백엔드 쿠키와도 섞이지 않는다.
//   세션을 바꾸는 응답(로그인·로그아웃·비밀번호 변경)만 쿠키를 전달한다.
// - 로그아웃·정보 수정·비밀번호 변경은 X-Medlens-Account(화면이 예상하는 회원 번호)를 받아,
//   같은 쿠키로 GET /me/settings 를 먼저 불러 인증된 회원과 같을 때만 원 요청을 넘긴다. 번호는 인증에 쓰지 않는다.
// - 응답은 no-store. 리다이렉트는 따라가지 않는다. 비밀번호·쿠키·본문을 로그에 남기지 않는다.
// - 요청 하나의 시간 예산(15초)을 본문 수신·계정 확인·전달이 함께 쓴다. 예산을 넘겼거나 브라우저 연결이 이미 끊겼으면
//   원 요청(쓰기)을 백엔드로 보내지 않는다. 이미 보낸 쓰기는 되돌리지 않고, 결과는 화면이 조회로 확인한다.
// - 백엔드 오류 응답(4xx·5xx)은 원문을 넘기지 않고 상태와 고정 코드만 담아 돌려준다(검증 오류의 입력값 등이 새지 않게).
const http = require('http')
const https = require('https')

const PREFIX = '/account-api'
const ROUTES = {
  '/login': 'POST',
  '/logout': 'POST',
  '/me': 'GET',
  '/me/stats': 'GET',
  '/me/settings': 'GET',
  '/me/profile': 'PATCH',
  '/me/password': 'POST',
  '/learning/roi-grade/knee': 'POST'
}
const NEEDS_ACCOUNT = new Set(['/logout', '/me/profile', '/me/password', '/learning/roi-grade/knee'])
// 본문 형식: 기본은 JSON, 무릎 제출만 기존 폼 형식
const BODY_TYPES = { '/learning/roi-grade/knee': 'application/x-www-form-urlencoded' }
const SESSION_CHANGING = new Set(['/login', '/logout', '/me/password'])
const BROWSER_COOKIE_PREFIX = 'medlens_account_'
// 허용하는 대상 주소 형식(화면의 src/apiBase.js 와 같은 규칙): http(s)://호스트[:포트] 와 선택적인 끝 슬래시 하나
const ORIGIN_FORMAT = /^https?:\/\/[^/?#@\s\\]+\/?$/i
const UPSTREAM_COOKIE = 'brain_fast_session'
const ACCOUNT_HEADER = 'x-medlens-account'
const MAX_REQUEST_BYTES = 16 * 1024
const MAX_RESPONSE_BYTES = 512 * 1024
const TIMEOUT_MS = 15000
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]'])
// 화면 분기에 필요한 것만 고정 코드로 남긴다. 서버 문구·입력값은 응답에 싣지 않는다.
const STATUS_CODES = { 400: 'bad_request', 401: 'login_required', 403: 'forbidden', 404: 'not_found', 409: 'conflict', 422: 'invalid_input', 429: 'rate_limited' }
const KNOWN_400 = {
  '현재 비밀번호가 맞지 않습니다.': 'bad_password',
  '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.': 'password_mismatch',
  '새 비밀번호는 현재 비밀번호와 달라야 합니다.': 'same_password'
}
const KNOWN_FIELDS = new Set(['userId', 'userPw', 'user_name', 'user_un', 'user_sp', 'current_password', 'expected_version', 'new_password', 'new_password_confirm'])

function parseTarget(raw) {
  if (!ORIGIN_FORMAT.test(String(raw || '').trim())) {
    throw new Error('ACCOUNT_PROXY_TARGET 은 경로·쿼리·사용자 정보 없이 http(s)://호스트:포트 만 씁니다.')
  }
  let url
  try {
    url = new URL(raw)
  } catch (e) {
    throw new Error('ACCOUNT_PROXY_TARGET 은 http(s)://호스트:포트 형식이어야 합니다.')
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || (url.pathname && url.pathname !== '/')) {
    throw new Error('ACCOUNT_PROXY_TARGET 은 경로·쿼리·사용자 정보 없이 http(s)://호스트:포트 만 씁니다.')
  }
  return url
}

function trustedOrigins() {
  return (process.env.ACCOUNT_TRUSTED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

function send(res, status, body, extraHeaders) {
  if (res.headersSent) return
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(extraHeaders || {})
  })
  res.end(text)
}

const FIXED = {
  badPath: [400, { ok: false, detail: '허용되지 않은 요청 주소입니다.' }],
  notFound: [404, { ok: false, detail: '없는 주소입니다.' }],
  forbiddenOrigin: [403, { ok: false, detail: '허용되지 않은 요청입니다.' }],
  badAccount: [400, { ok: false, detail: '계정 확인 값이 없습니다.' }],
  bodyTimeout: [408, { ok: false, detail: '요청을 다 받지 못했습니다.' }],
  timeout: [504, { ok: false, detail: '학습 서버 응답이 늦습니다.' }],
  tooLarge: [413, { ok: false, detail: '요청이 너무 큽니다.' }],
  login: [401, { ok: false, detail: '로그인이 필요합니다.' }],
  approval: [403, { ok: false, detail: '관리자 승인 후 사용할 수 있습니다.' }],
  switched: [412, { ok: false, detail: 'account_mismatch' }],
  upstream: [502, { ok: false, detail: '학습 서버에 연결하지 못했습니다.' }]
}

function fail(res, key, extraHeaders) {
  const [status, body] = FIXED[key]
  send(res, status, body, extraHeaders)
}

/** 브라우저 Cookie 헤더에서 medlens_account 값 하나만 꺼낸다(다른 쿠키는 백엔드로 보내지 않는다). */
/** 이 화면 출처(Host 의 포트)에만 속한 계정 쿠키 이름. 포트가 없으면 스킴 기본 포트(80). */
function cookieNameFor(host) {
  const m = /:(\d{1,5})$/.exec(host)
  return BROWSER_COOKIE_PREFIX + (m ? m[1] : '80')
}

function accountCookie(header, name) {
  let found = null
  for (const part of String(header || '').split(';')) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    if (part.slice(0, eq).trim() === name) {
      const value = part.slice(eq + 1).trim()
      if (found !== null) return null // 같은 이름이 둘이면 어느 계정인지 모르므로 쓰지 않는다
      found = value
    }
  }
  return found && /^[A-Za-z0-9+/=._-]+$/.test(found) ? found : null
}

/** 백엔드의 brain_fast_session Set-Cookie 를 브라우저용 medlens_account(Path=/account-api)로 바꾼다. 로그인·만료 모두 같은 범위. */
function rewriteSetCookie(values, name) {
  const out = []
  for (const raw of values || []) {
    const parts = String(raw).split(';').map((s) => s.trim())
    const eq = parts[0].indexOf('=')
    if (eq < 0 || parts[0].slice(0, eq) !== UPSTREAM_COOKIE) continue
    const value = parts[0].slice(eq + 1)
    const attrs = [`${name}=${value}`, `Path=${PREFIX}`, 'HttpOnly', 'SameSite=Lax']
    for (const attr of parts.slice(1)) {
      const name = attr.split('=')[0].toLowerCase()
      if (name === 'max-age' || name === 'expires') attrs.push(attr)
    }
    out.push(attrs.join('; '))
  }
  return out
}

/** 백엔드 오류 응답을 상태 + 고정 코드(+ 알려진 입력 칸 이름)로만 바꾼다. 원문·입력값은 버린다. */
function sanitizedError(status, raw) {
  let parsed = null
  try {
    parsed = JSON.parse(raw.toString('utf8'))
  } catch (e) {
    parsed = null
  }
  const out = { ok: false, code: STATUS_CODES[status] || (status >= 500 ? 'server_error' : 'request_failed') }
  const detail = parsed && parsed.detail
  if (status === 400 && typeof detail === 'string' && KNOWN_400[detail]) out.code = KNOWN_400[detail]
  if (status === 422 && Array.isArray(detail)) {
    const fields = []
    for (const item of detail) {
      const loc = item && Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null
      if (typeof loc === 'string' && KNOWN_FIELDS.has(loc) && !fields.includes(loc)) fields.push(loc)
    }
    out.fields = fields
  }
  return out
}

function readBody(req, deadline) {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now()
    if (remaining <= 0) {
      reject(Object.assign(new Error('timeout'), { code: 'TIMEOUT' }))
      return
    }
    const timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), remaining)
    req.on('end', () => clearTimeout(timer))
    req.on('close', () => clearTimeout(timer))
    const declared = Number(req.headers['content-length'] || 0)
    if (declared > MAX_REQUEST_BYTES) {
      req.resume() // 남은 본문은 버리고(쌓지 않음) 바로 413 을 보낸다
      reject(Object.assign(new Error('too large'), { code: 'TOO_LARGE' }))
      return
    }
    const chunks = []
    let size = 0
    let over = false
    req.on('data', (chunk) => {
      if (over) return
      size += chunk.length
      if (size > MAX_REQUEST_BYTES) {
        over = true
        chunks.length = 0
        reject(Object.assign(new Error('too large'), { code: 'TOO_LARGE' }))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (!over) resolve(Buffer.concat(chunks))
    })
    req.on('error', reject)
  })
}

/** 백엔드 요청 하나. 남은 예산 안에서만 기다리고, 리다이렉트는 따라가지 않고, 응답 본문은 상한까지만 읽는다. */
function upstreamRequest(target, { method, path, headers, body, deadline }) {
  const lib = target.protocol === 'https:' ? https : http
  const budget = Math.min(TIMEOUT_MS, (deadline || Date.now() + TIMEOUT_MS) - Date.now())
  if (budget <= 0) return Promise.reject(Object.assign(new Error('timeout'), { code: 'TIMEOUT' }))
  return new Promise((resolve, reject) => {
    const req = lib.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      method,
      path,
      headers,
      timeout: budget
    }, (res) => {
      const chunks = []
      let size = 0
      res.on('data', (chunk) => {
        size += chunk.length
        if (size > MAX_RESPONSE_BYTES) {
          res.destroy(new Error('response too large'))
          return
        }
        chunks.push(chunk)
      })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
      res.on('error', reject)
    })
    const timer = setTimeout(() => req.destroy(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), budget)
    req.on('timeout', () => req.destroy(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })))
    req.on('error', (e) => { clearTimeout(timer); reject(e) })
    req.on('close', () => clearTimeout(timer))
    if (body && body.length) req.write(body)
    req.end()
  })
}

/** 화면 주소(Host)가 믿을 수 있는가: 루프백이거나 ACCOUNT_TRUSTED_ORIGINS 에 있다. */
function hostTrusted(host) {
  if (!host) return false
  const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0]
  return LOOPBACK.has(name.toLowerCase()) || trustedOrigins().includes(`http://${host}`)
}

function createAccountProxy(rawTarget) {
  const target = parseTarget(rawTarget)

  // 예상하지 못한 오류도 고정 502 로 끝낸다(원문·스택을 응답에 싣지 않는다).
  return function accountProxyEntry(req, res, next) {
    handle(req, res, next).catch(() => fail(res, 'upstream'))
  }

  async function handle(req, res, next) {
    const rawUrl = req.url || ''
    if (rawUrl !== PREFIX && !rawUrl.startsWith(PREFIX + '/') && !rawUrl.startsWith(PREFIX + '?')) return next()

    // 요청 하나의 시간 예산과 브라우저 연결 상태(본문 수신·확인·전달이 함께 쓴다)
    const deadline = Date.now() + TIMEOUT_MS
    let clientGone = false
    res.on('close', () => {
      if (!res.writableFinished) clientGone = true
    })
    const stopped = () => clientGone || res.destroyed || req.socket.destroyed
    const expired = () => Date.now() >= deadline

    // 1) 주소 검사: 쿼리·조각·인코딩·점·이중 슬래시·끝 슬래시·역슬래시가 있으면 고정 400
    if (rawUrl.includes('?') || rawUrl.includes('#')) return fail(res, 'badPath')
    const sub = rawUrl.slice(PREFIX.length)
    if (!/^(\/[a-z0-9_-]+)+$/.test(sub)) return fail(res, 'badPath')
    const allowed = Object.prototype.hasOwnProperty.call(ROUTES, sub) ? ROUTES[sub] : null
    if (!allowed) return fail(res, 'notFound')
    const bodyType = BODY_TYPES[sub] || 'application/json'
    if (req.method !== allowed) {
      return send(res, 405, { ok: false, detail: '허용되지 않은 방법입니다.' }, { Allow: allowed })
    }

    // 2) 출처 검사: 다른 사이트에서 온 요청 거절, 쓰기는 Origin 이 이 화면 주소와 정확히 같아야 한다
    const host = req.headers.host || ''
    if (!hostTrusted(host)) return fail(res, 'forbiddenOrigin')
    const site = String(req.headers['sec-fetch-site'] || '').toLowerCase()
    if (site && site !== 'same-origin') return fail(res, 'forbiddenOrigin')
    const origin = req.headers.origin
    if (allowed !== 'GET') {
      if (origin !== `http://${host}`) return fail(res, 'forbiddenOrigin')
    } else if (origin && origin !== `http://${host}`) {
      return fail(res, 'forbiddenOrigin')
    }

    // 3) 본문(쓰기만): 크기 상한, 경로마다 정한 형식만(기본 JSON, 무릎 제출은 폼)
    let body = Buffer.alloc(0)
    if (allowed !== 'GET') {
      try {
        body = await readBody(req, deadline)
      } catch (e) {
        return fail(res, e && e.code === 'TOO_LARGE' ? 'tooLarge' : e && e.code === 'TIMEOUT' ? 'bodyTimeout' : 'badPath')
      }
      if (body.length && !String(req.headers['content-type'] || '').toLowerCase().startsWith(bodyType)) {
        return fail(res, 'badPath')
      }
    }

    // 4) 쿠키 스냅샷: 이 요청에서 받은 medlens_account 하나만 쓴다(확인 조회와 원 요청에 같은 값)
    const cookieName = cookieNameFor(host)
    const cookie = accountCookie(req.headers.cookie, cookieName)
    const baseHeaders = { Host: host, Accept: 'application/json' }
    if (cookie) baseHeaders.Cookie = `${UPSTREAM_COOKIE}=${cookie}`
    if (site) baseHeaders['Sec-Fetch-Site'] = site

    // 5) 쓰기 대상 확인: 화면이 예상한 회원과 쿠키의 회원이 같을 때만 원 요청을 보낸다
    if (NEEDS_ACCOUNT.has(sub)) {
      const expected = String(req.headers[ACCOUNT_HEADER] || '')
      if (!/^[1-9][0-9]{0,9}$/.test(expected)) return fail(res, 'badAccount')
      if (!cookie) return fail(res, 'login')
      let check
      try {
        check = await upstreamRequest(target, { method: 'GET', path: '/me/settings', headers: baseHeaders, deadline })
      } catch (e) {
        return fail(res, e && e.code === 'TIMEOUT' ? 'timeout' : 'upstream')
      }
      if (check.status === 401) return fail(res, 'login')
      if (check.status === 403) return fail(res, 'approval')
      if (check.status !== 200) return fail(res, 'upstream')
      let checked = null
      try {
        checked = JSON.parse(check.body.toString('utf8'))
      } catch (e) {
        return fail(res, 'upstream')
      }
      const idx = checked && checked.ok === true && checked.profile ? checked.profile.idx : null
      if (!Number.isInteger(idx) || idx <= 0) return fail(res, 'upstream')
      if (String(idx) !== expected) return fail(res, 'switched')
    }

    // 6) 원 요청 전달 직전: 브라우저가 이미 끊겼거나 예산을 넘겼으면 보내지 않는다(받을 사람이 없는 쓰기 0)
    if (stopped()) return
    if (expired()) return fail(res, 'timeout')

    // 7) 원 요청 전달(확인용 헤더는 보내지 않는다)
    const headers = { ...baseHeaders }
    if (origin) headers.Origin = origin
    if (body.length) {
      headers['Content-Type'] = bodyType
      headers['Content-Length'] = body.length
    } else if (allowed !== 'GET') {
      headers['Content-Length'] = 0
    }
    let up
    try {
      up = await upstreamRequest(target, { method: allowed, path: sub, headers, body, deadline })
    } catch (e) {
      return fail(res, e && e.code === 'TIMEOUT' ? 'timeout' : 'upstream')
    }
    if (up.status >= 300 && up.status < 400) return fail(res, 'upstream')
    if (up.status >= 400) {
      // 오류 원문(검증 오류의 입력값 등)은 넘기지 않는다. 세션을 바꾸는 오류 응답이 있으면 쿠키만 같은 규칙으로 넘긴다.
      const cookies = SESSION_CHANGING.has(sub) ? rewriteSetCookie(up.headers['set-cookie'], cookieName) : []
      return send(res, up.status, sanitizedError(up.status, up.body), cookies.length ? { 'Set-Cookie': cookies } : undefined)
    }

    const outHeaders = {
      'Content-Type': up.headers['content-type'] || 'application/octet-stream',
      'Content-Length': up.body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
    if (SESSION_CHANGING.has(sub)) {
      const cookies = rewriteSetCookie(up.headers['set-cookie'], cookieName)
      if (cookies.length) outHeaders['Set-Cookie'] = cookies
    }
    if (res.headersSent) return
    res.writeHead(up.status, outHeaders)
    res.end(up.body)
  }
}

module.exports = { createAccountProxy, parseTarget, PREFIX }
