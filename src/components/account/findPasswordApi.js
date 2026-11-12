import { API_BASE } from '../../apiBase'

// 비밀번호 찾기 화면 도우미. 답·비밀번호는 이 모듈 밖으로 저장·기록하지 않는다(메모리 전달만).
export const REQUEST_TIMEOUT_MS = 15000

// 질문 하나로 가입한 계정(security_question_choice_v2)이 고를 수 있는 질문. 서버 CHOICE_QUESTION_IDS 와 같다.
export const CHOICE_QUESTIONS = [
  { id: 'Q01', label: '처음 다닌 초등학교 이름' },
  { id: 'Q02', label: '어릴 때 사용하던 별명' },
  { id: 'Q03', label: '어릴 때 살았던 동네 이름' },
  { id: 'Q04', label: '내 보물 1호' }
]
// 예전에 질문 세 개로 가입한 계정(security_questions_v1). 서버 QUESTION_IDS 와 같다.
export const LEGACY_QUESTIONS = CHOICE_QUESTIONS.slice(0, 3)

/**
 * POST 하나. 응답 헤더부터 본문을 다 읽을 때까지 15초 제한을 한 수명으로 묶는다(가입 화면과 같은 기준).
 * 돌려주는 값 { status, data } — data 는 JSON 이 아니면 null. 시간 초과·끊김은 throw.
 */
export async function postJson(path, payload) {
  const controller = new AbortController()
  const stopped = new Promise((resolve, reject) => {
    controller.signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true })
  })
  stopped.catch(() => {})
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await Promise.race([
      fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal
      }),
      stopped
    ])
    const text = await Promise.race([response.text(), stopped])
    let data = null
    try {
      data = JSON.parse(text)
    } catch (e) {
      data = null
    }
    return { status: response.status, data }
  } finally {
    clearTimeout(timer)
  }
}

/** 성공 계약: 200 + JSON 객체 + ok === true. 그 밖(HTML·빈 본문·ok:false)은 성공으로 보지 않는다. */
export function isOk(result) {
  return !!result && result.status === 200 && !!result.data && typeof result.data === 'object' && result.data.ok === true
}

/** 숫자만 골라 YYYY-MM-DD 모양으로 맞춘다(최대 8자리). */
export function formatBirth(text) {
  const d = String(text || '').replace(/[^0-9]/g, '').slice(0, 8)
  if (d.length <= 4) return d
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`
}

/** 본인 확인용 생년월일 검사(서버 FindId 와 같은 기준: 형식·있는 날짜·미래 아님). 문제가 없으면 ''. */
export function birthProblem(value, today = new Date()) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value || '')) return '생년월일 8자리를 입력해 주세요. 예: 2000-01-01'
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '없는 날짜예요. 월·일을 확인해 주세요.'
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (dt > t) return '오늘 이전 날짜로 입력해 주세요.'
  return ''
}

function hasControl(text) {
  for (const ch of text) {
    const c = ch.codePointAt(0)
    if (c <= 0x1f || (c >= 0x7f && c <= 0x9f) || c === 0x2028 || c === 0x2029) return true
  }
  return false
}

/** 서버 정규화(answer_norm_v1)와 같은 기준의 사전 검사. 마지막 판단은 서버가 한다. */
export function answerProblem(text) {
  if (typeof text !== 'string') return '답을 입력해 주세요.'
  if (hasControl(text)) return '줄바꿈 같은 특수 문자는 쓸 수 없어요.'
  const value = text.normalize('NFC').trim().replace(/\s+/g, ' ')
  if (!value) return '답을 입력해 주세요.'
  if (Array.from(value).length > 50 || new TextEncoder().encode(value).length > 72) return '답은 50자(한글 약 24자) 이내로 입력해 주세요.'
  return ''
}

/** 새 비밀번호 사전 검사(서버 FindPw: 4자 이상, UTF-8 72바이트 이내, 두 칸 일치). */
export function passwordProblem(pw, pw2) {
  if (!pw || !pw2) return '새 비밀번호와 확인 비밀번호를 입력해 주세요.'
  if (Array.from(pw).length < 4) return '비밀번호는 4글자 이상으로 입력해 주세요.'
  if (new TextEncoder().encode(pw).length > 72) return '비밀번호가 너무 길어요. (UTF-8 72바이트 이내)'
  if (pw !== pw2) return '새 비밀번호와 확인 비밀번호가 일치하지 않아요.'
  return ''
}

const FIELD_LABELS = { user_id: '이메일 아이디', user_name: '이름', user_birth: '생년월일', user_pw: '새 비밀번호', user_pw_confirm: '새 비밀번호 확인' }

/** 서버 오류를 고정 문구로 바꾼다. 서버 원문·입력 값은 화면에 쓰지 않는다. */
export function errorText(status, data, step) {
  if (status === 404) return '입력한 정보를 확인하지 못했어요. 아이디·이름·생년월일과 가입 방식·질문·답을 다시 확인해 주세요.'
  if (status === 429) return '시도 횟수가 너무 많아요. 10분 후 다시 시도해 주세요.'
  if (status === 503) return '지금은 점검 중이에요. 잠시 후 다시 시도해 주세요.'
  if (status === 400 && step === 2) return '새 비밀번호와 확인 비밀번호가 일치하지 않아요.'
  if (status === 422 && data && Array.isArray(data.detail)) {
    const lines = []
    for (const item of data.detail) {
      const loc = item && Array.isArray(item.loc) ? item.loc : []
      let line
      if (loc[1] === 'answers') line = '가입 방식과 질문·답을 확인해 주세요.'
      else if (FIELD_LABELS[loc[1]]) line = `${FIELD_LABELS[loc[1]]}을(를) 확인해 주세요.`
      else line = '입력한 내용을 확인해 주세요.'
      if (!lines.includes(line)) lines.push(line)
    }
    if (lines.length) return lines.join(' ')
  }
  return '결과를 확인하지 못했어요. 잠시 후 다시 시도해 주세요. (자동으로 다시 보내지 않아요)'
}
// 가린 아이디 최대 길이(코드포인트). 원래 아이디 최대 254자 → 앞부분 1~2자 + '***' 로 바뀌어 최대 3자 늘어난다.
export const MASKED_ID_MAX = 257
// 한 번에 보여 주는 아이디 수. 서버는 개수 제한이 없으므로 넘치면 '총 N개 중 20개' 로 안내한다.
export const FIND_ID_DISPLAY_MAX = 20

/**
 * 서버 mask_user_id 가 만드는 모양인지 정확히 본다.
 * 서버 규칙: local, @, domain = 아이디.partition('@') → local 앞 2자(local 이 2자 이하면 1자) + '***' + ('@' + domain).
 * - 앞부분 1~2 코드포인트('@' 없음) 바로 뒤에 '***' 가 오고, 그 뒤는 끝(기존 비이메일 아이디)이거나 '@' + 도메인(다른 '@' 없음)이어야 한다.
 * - 앞부분 자체에 '*' 가 있을 수 있어(이메일 local 허용 문자) 2자·1자를 모두 맞춰 본다.
 * - 프런트가 대신 가려서 성공으로 바꾸지 않는다. 모르는 모양이면 false.
 */
export function isServerMaskedId(id) {
  if (typeof id !== 'string') return false
  const cps = Array.from(id)
  if (cps.length < 4 || cps.length > MASKED_ID_MAX) return false
  for (const keep of [2, 1]) {
    const prefix = cps.slice(0, keep)
    if (prefix.includes('@')) continue
    if (cps.slice(keep, keep + 3).join('') !== '***') continue
    const rest = cps.slice(keep + 3)
    if (rest.length === 0) return true
    if (rest[0] === '@' && rest.length > 1 && !rest.slice(1).includes('@')) return true
  }
  return false
}

/**
 * 아이디 찾기 성공 계약: 200 + JSON ok:true + user_ids 가 비어 있지 않은 배열이고 **모든** 항목이 서버 마스킹 모양.
 * 한 항목이라도 다르면 전체를 성공으로 보지 않는다(null).
 * 맞으면 { ids: 앞에서부터 최대 20개, total: 전체 개수 }.
 */
export function maskedIdsFrom(result) {
  if (!isOk(result)) return null
  const ids = result.data.user_ids
  if (!Array.isArray(ids) || ids.length === 0) return null
  if (!ids.every(isServerMaskedId)) return null
  return { ids: ids.slice(0, FIND_ID_DISPLAY_MAX), total: ids.length }
}

/** 아이디 찾기 오류를 고정 문구로. 서버 원문·입력 값은 쓰지 않는다. */
export function findIdErrorText(result) {
  const status = result ? result.status : 0
  if (status === 404) return '입력한 이름·생년월일과 일치하는 회원을 찾지 못했어요. 가입할 때 입력한 정보를 다시 확인해 주세요.'
  if (status === 429) return '시도 횟수가 너무 많아요. 10분 후 다시 시도해 주세요.'
  if (status === 503) return '지금은 점검 중이에요. 잠시 후 다시 시도해 주세요.'
  if (status === 422) return '이름과 생년월일을 확인해 주세요.'
  return '결과를 확인하지 못했어요. 잠시 후 다시 시도해 주세요. (자동으로 다시 보내지 않아요)'
}
