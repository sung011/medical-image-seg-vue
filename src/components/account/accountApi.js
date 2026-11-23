// 마이페이지·설정·로그인의 계정 API 요청 모음 (MYPAGE-TEAM-FE-20261123). 화면은 이 파일과 login/accountSession.js 만 부른다.
//
// 지키는 규칙
// - 주소는 같은 출처 프록시 /account-api 하나뿐이다(로그인 쿠키가 같은 출처로 오간다). 백엔드 주소·토큰을 코드에 적지 않는다.
// - 회원은 서버가 쿠키 세션으로 정한다. 쓰기(로그아웃·정보 수정·비밀번호 변경)에는 화면이 예상한 회원 번호를
//   X-Medlens-Account 로 보내고, 프록시가 쿠키의 회원과 같을 때만 넘긴다(번호는 인증이 아니라 대상 확인용).
// - 비밀번호·이름·생년월일은 저장소·URL·콘솔에 쓰지 않는다. 서버 원문 오류도 화면에 내지 않는다.
// - 한 번의 호출은 응답 헤더부터 본문(JSON)까지 15초 제한과 취소가 함께 적용된다. 실패해도 자동으로 다시 보내지 않는다.

export const ACCOUNT_API_BASE = '/account-api'
const TIMEOUT_MS = 15000
const KNOWN_FIELDS = ['user_name', 'user_un', 'user_sp', 'current_password', 'expected_version', 'new_password', 'new_password_confirm']

/** 화면이 구분해 안내하는 실패 종류. kind 로 안내 문구를 고른다(서버 원문은 쓰지 않는다). */
export class AccountApiError extends Error {
  constructor(kind, status, fields) {
    super(kind)
    this.name = 'AccountApiError'
    // credentials | login | forbidden | switched | badinput | conflict | badpassword | mismatch | samepassword
    // | limited | unavailable | network | invalid | config
    this.kind = kind
    this.status = status || 0
    this.fields = fields || [] // 422 에서 알려진 입력 칸 이름만. 값은 담지 않는다.
  }
}

function kindFromStatus(status) {
  if (status === 401) return 'login'
  if (status === 403) return 'forbidden'
  if (status === 412) return 'switched'
  if (status === 429) return 'limited'
  if (status === 400 || status === 422) return 'badinput'
  return 'unavailable'
}

async function readJson(res, signal) {
  try {
    return await res.json()
  } catch (e) {
    if (signal && signal.aborted) throw new AccountApiError('network')
    return null // JSON 이 아니면(HTML 등) 본문은 쓰지 않는다
  }
}

/** 서버 호출 하나. 헤더 받기와 본문 읽기를 한 수명으로 묶어 15초 제한·외부 취소를 함께 적용한다. 돌려주는 값 { status, ok, body }. */
async function call(path, options = {}) {
  const controller = new AbortController()
  const external = options.signal
  const onAbort = () => controller.abort()
  if (external) {
    if (external.aborted) controller.abort()
    else external.addEventListener('abort', onAbort, { once: true })
  }
  const stopped = new Promise((resolve, reject) => {
    const fail = () => reject(new AccountApiError('network'))
    if (controller.signal.aborted) fail()
    else controller.signal.addEventListener('abort', fail, { once: true })
  })
  stopped.catch(() => {})
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await Promise.race([
      fetch(ACCOUNT_API_BASE + path, { credentials: 'same-origin', cache: 'no-store', redirect: 'manual', ...options, signal: controller.signal }),
      stopped
    ])
    if (res.type === 'opaqueredirect') throw new AccountApiError('invalid')
    const body = await Promise.race([readJson(res, controller.signal), stopped])
    return { status: res.status, ok: res.ok, body }
  } catch (e) {
    throw e instanceof AccountApiError ? e : new AccountApiError('network')
  } finally {
    clearTimeout(timer)
    if (external) external.removeEventListener('abort', onAbort)
  }
}

function accountHeader(expectedIdx) {
  if (!Number.isInteger(expectedIdx) || expectedIdx <= 0) throw new AccountApiError('switched')
  return { 'X-Medlens-Account': String(expectedIdx) }
}

/** 422 응답의 알려진 입력 칸 이름만 꺼낸다. 프록시가 서버 원문 대신 { code, fields } 만 돌려준다. */
function fieldsFromDetail(body) {
  const list = body && Array.isArray(body.fields) ? body.fields : []
  return list.filter((name, i) => KNOWN_FIELDS.includes(name) && list.indexOf(name) === i)
}

function failureFrom(r) {
  return new AccountApiError(kindFromStatus(r.status), r.status, r.status === 422 ? fieldsFromDetail(r.body) : [])
}

function textOrNull(v) {
  return typeof v === 'string' ? v : null
}

// ── 로그인 ──────────────────────────────────────────────────────────────────────
/** 같은 출처 로그인 한 번. 성공 응답이 계약(ok·양의 정수 idx·아이디 문자열)과 다르면 invalid. 401 은 credentials. */
export async function loginRequest(userId, userPw, signal) {
  const r = await call('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userPw }),
    signal
  })
  if (r.status === 401) throw new AccountApiError('credentials', 401)
  if (!r.ok) throw failureFrom(r)
  const b = r.body
  if (!b || b.ok !== true || !Number.isInteger(b.idx) || b.idx <= 0 || typeof b.user_id !== 'string' || !b.user_id) {
    throw new AccountApiError('invalid', r.status)
  }
  if (!(b.user_name === null || b.user_name === undefined || typeof b.user_name === 'string')) throw new AccountApiError('invalid', r.status)
  return { idx: b.idx, user_id: b.user_id, user_name: textOrNull(b.user_name), mb_level: b.mb_level }
}

// ── 마이페이지 ───────────────────────────────────────────────────────────────────
/** GET /me 응답을 화면이 쓰는 값으로 바꾼다. 모양이 다르면 null(→ 오류로 처리, 0건 성공으로 바꾸지 않는다). */
export function normalizeMe(body) {
  const p = body && body.profile
  const r = body && body.recent_learning
  if (!body || body.ok !== true || !p || !Number.isInteger(p.idx) || p.idx <= 0 || typeof p.user_id !== 'string') return null
  if (!r || !Array.isArray(r.items)) return null
  const items = []
  for (const it of r.items) {
    if (!it || !Number.isInteger(it.review_idx) || !Number.isInteger(it.study_idx) || typeof it.solution_label !== 'string') return null
    items.push({
      reviewIdx: it.review_idx,
      studyIdx: it.study_idx,
      partLabel: textOrNull(it.part_label),
      modalLabel: textOrNull(it.modal_label),
      available: it.study_available === true,
      solutionLabel: it.solution_label,
      solution: textOrNull(it.solution),
      createdAt: textOrNull(it.created_at)
    })
  }
  return {
    profile: { idx: p.idx, userId: p.user_id, userName: textOrNull(p.user_name), school: textOrNull(p.user_un), major: textOrNull(p.user_sp) },
    recent: items
  }
}

export async function fetchMe(signal) {
  const r = await call('/me', { method: 'GET', signal })
  if (!r.ok) throw failureFrom(r)
  const me = normalizeMe(r.body)
  if (!me) throw new AccountApiError('invalid', r.status)
  return me
}

// ── 학습 통계(GET /me/stats) ─────────────────────────────────────────────────────
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const REGION_LABELS = { 1: '뇌', 2: '흉부', 3: '복부', 4: '무릎' }
const WEEK_STATES = ['learned', 'partial', 'empty', 'future', 'unavailable']

function count(v) {
  return Number.isInteger(v) && v >= 0
}

function countOrNull(v) {
  return v === null || count(v)
}

/** 정답률은 정답 수/전체 문제 수(소수 첫째 자리)와 일치해야 한다. 서버 값끼리 모순이면 화면은 그리지 않는다. */
function rateMatches(rate, correct, total) {
  if (total === 0) return rate === null
  return typeof rate === 'number' && Math.abs(rate - (correct * 100) / total) <= 0.0500001
}

function rateOk(v) {
  return v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100)
}

/** GET /me/stats 응답을 화면용으로 바꾼다. 서버 계약(허용 값·합계·범위·배열 길이)과 하나라도 다르면 null. */
export function normalizeStats(body) {
  if (!body || body.ok !== true || body.stats_version !== 'motivation_v1') return null
  if (!Number.isInteger(body.owner_idx) || body.owner_idx <= 0 || typeof body.as_of !== 'string') return null
  const s = body.summary
  const c = body.calendar
  const q = body.quality
  if (!s || !c || !q || !Array.isArray(body.regions) || body.regions.length !== 4) return null

  if (![s.solved_problem_count, s.correct_count, s.partial_count, s.wrong_count].every(count)) return null
  if (s.correct_count + s.partial_count + s.wrong_count !== s.solved_problem_count) return null
  if (!rateOk(s.correct_rate_pct) || !rateMatches(s.correct_rate_pct, s.correct_count, s.solved_problem_count)) return null
  if (!Number.isInteger(s.studied_parts_count) || s.studied_parts_count < 0 || s.studied_parts_count > 4) return null

  if (!['ready', 'unavailable'].includes(c.status) || c.timezone !== 'Asia/Seoul') return null
  if (!DATE_RE.test(c.today) || !DATE_RE.test(c.week_start) || !DATE_RE.test(c.week_end_exclusive)) return null
  if (!Array.isArray(c.recent7) || c.recent7.length !== 7 || !Array.isArray(c.week_days) || c.week_days.length !== 7) return null
  const numbers = [c.current_streak_days, c.longest_streak_days, c.weekly_solved_problem_count, c.today_solved_problem_count]
  if (!Number.isInteger(c.daily_goal) || c.daily_goal < 1) return null
  if (!numbers.every(countOrNull) || !(c.today_done === null || typeof c.today_done === 'boolean')) return null
  const recent = []
  for (const d of c.recent7) {
    if (!d || !DATE_RE.test(d.date) || !countOrNull(d.solved_problem_count)) return null
    recent.push({ date: d.date, count: d.solved_problem_count })
  }
  const week = []
  for (const d of c.week_days) {
    if (!d || !DATE_RE.test(d.date) || !WEEK_STATES.includes(d.state)) return null
    week.push({ date: d.date, state: d.state })
  }
  if (c.status === 'unavailable') {
    if (c.reason !== 'source_timezone_unverified' || numbers.some((v) => v !== null) || c.today_done !== null) return null
    if (recent.some((d) => d.count !== null) || week.some((d) => d.state !== 'unavailable')) return null
  } else {
    if (!(c.reason === null || c.reason === 'no_graded_records') || numbers.some((v) => v === null) || c.today_done === null) return null
    if (c.today_done !== c.today_solved_problem_count >= c.daily_goal) return null
    if (recent.some((d) => d.count === null) || week.some((d) => d.state === 'unavailable')) return null
  }

  const regions = []
  let classified = 0
  for (let i = 0; i < 4; i += 1) {
    const r = body.regions[i]
    const code = String(i + 1)
    if (!r || r.code !== code || r.label !== REGION_LABELS[code]) return null
    if (![r.problem_count, r.correct_count, r.partial_count, r.wrong_count].every(count)) return null
    if (r.correct_count + r.partial_count + r.wrong_count !== r.problem_count) return null
    if (!rateOk(r.correct_rate_pct) || !rateMatches(r.correct_rate_pct, r.correct_count, r.problem_count)) return null
    classified += r.problem_count
    regions.push({ code, label: r.label, problems: r.problem_count, correct: r.correct_count, partial: r.partial_count, wrong: r.wrong_count, ratePct: r.correct_rate_pct })
  }
  if (![q.ungraded_submission_count, q.undated_graded_submission_count, q.unclassified_problem_count].every(count) || !countOrNull(q.future_graded_submission_count)) return null
  if (classified + q.unclassified_problem_count !== s.solved_problem_count) return null
  if (s.studied_parts_count !== regions.filter((r) => r.problems > 0).length) return null

  return {
    ownerIdx: body.owner_idx,
    asOf: body.as_of,
    summary: { solved: s.solved_problem_count, correct: s.correct_count, partial: s.partial_count, wrong: s.wrong_count, ratePct: s.correct_rate_pct, parts: s.studied_parts_count },
    calendar: {
      status: c.status,
      reason: c.reason,
      today: c.today,
      weekStart: c.week_start,
      weekEndExclusive: c.week_end_exclusive,
      current: c.current_streak_days,
      longest: c.longest_streak_days,
      todayDone: c.today_done,
      weekly: c.weekly_solved_problem_count,
      dailyGoal: c.daily_goal,
      todaySolved: c.today_solved_problem_count,
      recent7: recent,
      weekDays: week
    },
    regions,
    quality: { ungraded: q.ungraded_submission_count, undated: q.undated_graded_submission_count, future: q.future_graded_submission_count, unclassified: q.unclassified_problem_count }
  }
}

export async function fetchStats(signal) {
  const r = await call('/me/stats', { method: 'GET', signal })
  if (!r.ok) throw failureFrom(r)
  const stats = normalizeStats(r.body)
  if (!stats) throw new AccountApiError('invalid', r.status)
  return stats
}

// ── 내 정보 수정·비밀번호 변경 ─────────────────────────────────────────────────────
// 프록시가 400 의 서버 문구를 고정 코드로 바꿔 준다(devserver/accountProxy.js KNOWN_400).
const SETTINGS_CODES = { bad_password: 'badpassword', password_mismatch: 'mismatch', same_password: 'samepassword' }

/** 400 은 프록시의 고정 코드로 세분하고, 409 는 충돌이다. */
function settingsFailure(r) {
  if (r.status === 409) return new AccountApiError('conflict', 409)
  if (r.status === 400) {
    const code = r.body && typeof r.body.code === 'string' ? r.body.code : ''
    if (SETTINGS_CODES[code]) return new AccountApiError(SETTINGS_CODES[code], 400)
  }
  return failureFrom(r)
}

/** GET /me/settings, PATCH /me/profile 응답을 화면용으로 바꾼다. 계약과 다르면 null. */
export function normalizeSettings(body) {
  const p = body && body.profile
  if (!body || body.ok !== true || !p || !Number.isInteger(p.idx) || p.idx <= 0 || typeof p.user_id !== 'string') return null
  if (typeof body.profile_version !== 'string' || !/^[0-9a-f]{64}$/.test(body.profile_version)) return null
  if (!(p.user_name === null || typeof p.user_name === 'string') || typeof p.user_un !== 'string' || typeof p.user_sp !== 'string') return null
  return {
    profile: { idx: p.idx, userId: p.user_id, userName: p.user_name, school: p.user_un, major: p.user_sp },
    version: body.profile_version
  }
}

export async function fetchSettings(signal) {
  const r = await call('/me/settings', { method: 'GET', signal })
  if (!r.ok) throw settingsFailure(r)
  const out = normalizeSettings(r.body)
  if (!out) throw new AccountApiError('invalid', r.status)
  return out
}

/** 이름·학교·전공 저장. 자동으로 다시 보내지 않는다. */
export async function saveProfile(expectedIdx, { userName, school, major, currentPassword, expectedVersion }) {
  const r = await call('/me/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...accountHeader(expectedIdx) },
    body: JSON.stringify({ user_name: userName, user_un: school, user_sp: major, current_password: currentPassword, expected_version: expectedVersion })
  })
  if (!r.ok) throw settingsFailure(r)
  const out = normalizeSettings(r.body)
  if (!out) throw new AccountApiError('invalid', r.status)
  return out
}

/** 비밀번호 변경. {ok, password_changed, session_ended} 가 모두 true 여야 성공이다. */
export async function changePasswordRequest(expectedIdx, currentPassword, newPassword, newPasswordConfirm) {
  const r = await call('/me/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...accountHeader(expectedIdx) },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, new_password_confirm: newPasswordConfirm })
  })
  if (!r.ok) throw settingsFailure(r)
  if (!r.body || r.body.ok !== true || r.body.password_changed !== true || r.body.session_ended !== true) throw new AccountApiError('invalid', r.status)
  return true
}

/** 서버 로그아웃. 200 JSON {ok:true} 를 확인해야 성공이다. */
export async function serverLogout(expectedIdx) {
  const r = await call('/logout', { method: 'POST', headers: accountHeader(expectedIdx) })
  if (!r.ok) throw failureFrom(r)
  if (!r.body || r.body.ok !== true) throw new AccountApiError('invalid', r.status)
  return true
}

/** 새 비밀번호: 앞뒤 공백을 지우지 않는다. 4글자(코드포인트) 이상, UTF-8 72바이트 이하. */
export function passwordProblem(pw) {
  if (typeof pw !== 'string' || Array.from(pw).length < 4) return 'short'
  if (new TextEncoder().encode(pw).length > 72) return 'long'
  return ''
}

/** DB 에 기록된 저장 시각 문자열을 "2026-11-05 10:00" 으로만 보여 준다. 시간대를 바꾸거나 더하지 않는다. */
export function formatSavedAt(text) {
  if (typeof text !== 'string') return ''
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(text)
  return m ? `${m[1]} ${m[2]}` : ''
}
