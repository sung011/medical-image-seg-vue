// 계정 세션 수명 관리 (MYPAGE-TEAM-FE-20261123). 로그인·로그아웃·비밀번호 변경·정보 저장은 모두 여기서 시작한다.
//
// - 화면 세션(sessionStorage medlens_user)은 탭마다 다르지만 계정 쿠키는 탭끼리 같이 쓴다. 그래서 쿠키를 바꾸는 일
//   (로그인·로그아웃·비밀번호 변경)과 정보 저장은 같은 출처의 모든 탭에서 한 줄로 세운다(Web Locks).
//   Web Locks 가 없는 환경(오래된 브라우저, localhost·127.0.0.1 이 아닌 http 주소 등)에서는 탭끼리 줄을 세울 수 없으므로
//   로그인 자체를 막는다(늦은 응답이 다른 탭의 새 로그인 쿠키를 지우는 일을 원천 차단).
// - 로그인할 때의 계정 프록시 대상(ACCOUNT_TARGET)을 화면 세션에 함께 적고, 화면을 옮길 때마다 지금 실행 설정과 비교한다.
//   설정이 바뀌었거나 두 대상이 다르면 기존 세션도 지운다(계정 서버와 학습 API 서버가 갈라지지 않게).
// - 쿠키가 바뀌면 다른 탭에 '바뀌었다'는 알림만 보낸다(계정 번호·이름 등은 싣지 않는다). 알림을 못 받은 탭도
//   돌아올 때 계정을 다시 확인한다.
// - 늦게 끝난 작업은 시작할 때의 화면 계정과 지금 화면 계정이 같을 때만 세션을 지운다.
import { clearUserSession, getUserSession, saveUserSession } from './authSession'
import { clearReviewStorage } from '../Medical/review/reviewModel'
import { ACCOUNT_TARGET, accountTargetProblem } from '../../apiBase'
import { AccountApiError, changePasswordRequest, fetchMe, loginRequest, saveProfile, serverLogout } from '../account/accountApi'

const LOCK_NAME = 'medlens-account-session'
const CHANNEL_NAME = 'medlens-account'
const TAB_ID = Math.random().toString(36).slice(2)

export const LOGOUT_UNCONFIRMED = '서버 로그아웃은 확인하지 못했어요. 이 화면의 로그인 정보는 지웠어요. 공용 컴퓨터라면 아래 버튼으로 다시 시도해 주세요.'
const LOGOUT_OTHER_ACCOUNT = '이 브라우저는 다른 계정으로 로그인되어 있어서, 이 화면의 로그인 정보만 지웠어요.'

// ── 탭 공통 직렬화 ────────────────────────────────────────────────────────────────
/** 이 브라우저가 탭 공통 잠금(Web Locks)을 지원하는가. */
export function accountLocksSupported() {
  return typeof navigator !== 'undefined' && !!navigator.locks && typeof navigator.locks.request === 'function'
}

/** 같은 출처의 모든 탭에서 한 번에 하나만 실행한다. 지원하지 않으면 실행하지 않고 unsupported 로 거부한다. */
function withAccountLock(task) {
  if (!accountLocksSupported()) return Promise.reject(new AccountApiError('unsupported'))
  return navigator.locks.request(LOCK_NAME, { mode: 'exclusive' }, () => task())
}

// ── 탭 사이 알림 ─────────────────────────────────────────────────────────────────
let channel = null

function openChannel() {
  if (channel || typeof BroadcastChannel === 'undefined') return channel
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
  } catch (e) {
    channel = null
  }
  return channel
}

function announceChange() {
  const ch = openChannel()
  if (ch) ch.postMessage({ type: 'account-changed', from: TAB_ID })
}

/** 다른 탭에서 계정 쿠키가 바뀌었을 때 부른다. 돌려주는 함수로 구독을 끝낸다. */
export function onAccountChanged(callback) {
  const ch = openChannel()
  if (!ch) return () => {}
  const handler = (event) => {
    const data = event && event.data
    if (data && data.type === 'account-changed' && data.from !== TAB_ID) callback()
  }
  ch.addEventListener('message', handler)
  return () => ch.removeEventListener('message', handler)
}

// ── 화면 세션 정리 ────────────────────────────────────────────────────────────────
function sameOwner(a, b) {
  return !!a && !!b && a.idx === b.idx && a.user_id === b.user_id
}

/** 시작할 때의 화면 계정(owner)이 지금과 같을 때만 화면 세션과 채점 임시 저장을 지운다. 지웠으면 true. */
export function clearSessionIfOwner(owner) {
  if (!sameOwner(owner, getUserSession())) return false
  clearUserSession()
  clearReviewStorage()
  return true
}

/** 이 화면 세션이 같은 출처 계정 쿠키까지 확인한 로그인이고, 지금 실행 설정의 계정 서버에 묶여 있는가(이전 방식 로그인은 false). */
export function isAccountSession(user) {
  return !!user && user.account_verified === true && Number.isInteger(user.idx) && user.idx > 0 &&
    !!ACCOUNT_TARGET && user.account_target === ACCOUNT_TARGET && !accountTargetProblem()
}

const BINDING_CHANGED = '학습 서버 설정이 바뀌어 로그인 정보를 지웠어요. 다시 로그인해 주세요.'

/**
 * 화면을 옮길 때마다(라우터) 부른다. 지금 두 서버 주소가 다르거나, 쿠키 확인 로그인이 다른 계정 서버에 묶여 있으면
 * 기존 화면 세션과 채점 임시 저장을 지운다. 그래서 설정이 바뀐 뒤에는 계정 요청도 회원 번호 학습 요청도 보내지 않는다.
 */
export function enforceAccountBinding() {
  const user = getUserSession()
  if (!user) return false
  const stale = !!accountTargetProblem() || (user.account_verified === true && user.account_target !== ACCOUNT_TARGET)
  if (!stale) return false
  clearUserSession()
  clearReviewStorage()
  setLoginNotice({ text: BINDING_CHANGED })
  return true
}

// ── 로그인 화면 안내(메모리에만, 한 번 보여 준다) ───────────────────────────────────────
let loginNotice = null

export function setLoginNotice(notice) {
  loginNotice = notice
}

export function takeLoginNotice() {
  const n = loginNotice
  loginNotice = null
  return n
}

// ── 로그인 ──────────────────────────────────────────────────────────────────────
/**
 * 같은 출처 로그인 한 번 → 같은 출처 GET /me 로 쿠키가 실제로 오가고 같은 회원인지 확인 → 그때만 화면 세션 저장.
 * 실패하면 화면 세션을 저장하지 않는다(AccountApiError 를 던진다).
 */
export function login(userId, userPw) {
  if (!accountLocksSupported()) return Promise.reject(new AccountApiError('unsupported'))
  if (accountTargetProblem()) return Promise.reject(new AccountApiError('config'))
  return withAccountLock(async () => {
    const data = await loginRequest(userId, userPw)
    let me
    try {
      me = await fetchMe()
    } catch (e) {
      throw new AccountApiError(e && e.kind === 'forbidden' ? 'forbidden' : 'cookie')
    }
    if (me.profile.idx !== data.idx || me.profile.userId !== data.user_id) throw new AccountApiError('cookie')
    announceChange()
    return saveUserSession({ ...data, account_verified: true, account_target: ACCOUNT_TARGET })
  })
}

// ── 로그아웃 ─────────────────────────────────────────────────────────────────────
/**
 * 머리글·설정의 공통 로그아웃. 서버가 {ok:true} 로 끝냈다고 확인하면 화면을 정리한다.
 * - 401(이미 서버 로그인이 없음): 화면만 정리한다.
 * - 412(쿠키가 다른 계정): 그 계정의 서버 로그인은 건드리지 않고 이 화면만 정리하고 알린다.
 * - 그 밖(서버 오류·끊김·403 등): 이 화면만 정리하되 서버 종료 미확인임을 알리고 다시 시도할 수 있게 한다.
 * 돌려주는 값 { result: 'confirmed'|'expired'|'other'|'unconfirmed'|'local', cleared }.
 */
export async function logout() {
  const owner = getUserSession()
  if (!owner) return { result: 'local', cleared: false }
  if (!isAccountSession(owner)) {
    // 이전 방식 로그인: 이 화면이 만든 서버 쿠키가 없으므로 화면만 정리한다(다른 탭의 계정 쿠키를 건드리지 않는다).
    return { result: 'local', cleared: clearSessionIfOwner(owner) }
  }
  if (!accountLocksSupported()) {
    // 줄을 세울 수 없으면 서버 쿠키를 바꾸는 요청을 보내지 않는다. 화면만 정리하고 미확인으로 알린다.
    const cleared = clearSessionIfOwner(owner)
    if (cleared) setLoginNotice({ text: LOGOUT_UNCONFIRMED })
    return { result: 'unconfirmed', cleared }
  }
  return withAccountLock(async () => {
    let result
    try {
      await serverLogout(owner.idx)
      result = 'confirmed'
    } catch (e) {
      const kind = e && e.kind
      result = kind === 'login' ? 'expired' : kind === 'switched' ? 'other' : 'unconfirmed'
    }
    const cleared = clearSessionIfOwner(owner)
    if (cleared && result === 'unconfirmed') setLoginNotice({ text: LOGOUT_UNCONFIRMED, retryIdx: owner.idx })
    if (cleared && result === 'other') setLoginNotice({ text: LOGOUT_OTHER_ACCOUNT })
    if (result === 'confirmed') announceChange()
    return { result, cleared }
  })
}

/** 로그인 화면의 '서버 로그아웃 다시 시도'. 그 계정의 쿠키일 때만 서버가 끝낸다. true=끝냄(또는 이미 없음). */
export function retryServerLogout(idx) {
  return withAccountLock(async () => {
    try {
      await serverLogout(idx)
      announceChange()
      return true
    } catch (e) {
      return !!e && e.kind === 'login'
    }
  }).catch(() => false)
}

// ── 정보 저장 ────────────────────────────────────────────────────────────────────
/** 프로필 저장도 같은 줄에 선다(로그인·로그아웃·비밀번호 변경과 엇갈리지 않게). */
export function saveProfileFor(owner, payload) {
  return withAccountLock(() => saveProfile(owner.idx, payload))
}

// ── 비밀번호 변경 ─────────────────────────────────────────────────────────────────
let passwordFlight = null
let passwordOutcome = null // 화면을 떠난 뒤 끝난 실패·미확정 결과: { owner:{idx,user_id}, kind } (비밀번호·서버 원문 없음)

function outcomeKind(kind) {
  return ['badpassword', 'mismatch', 'samepassword', 'badinput', 'limited', 'forbidden', 'switched'].includes(kind) ? kind : 'unknown'
}

/**
 * 비밀번호 변경의 공통 수명: 요청 → 서버가 확정하면 같은 화면 계정일 때만 정리·로그인 안내 → onCleared.
 * 설정 화면이 떠나도 끝까지 마친다. 한 번에 하나만, 자동 재전송 없음.
 * 돌려주는 값(거부되지 않음): { ok:true, cleared } | { ok:false, error, handled }.
 */
export function changePasswordAndEndSession(owner, currentPassword, newPassword, newPasswordConfirm, onCleared) {
  if (passwordFlight) return passwordFlight
  passwordOutcome = null
  passwordFlight = withAccountLock(async () => {
    try {
      await changePasswordRequest(owner.idx, currentPassword, newPassword, newPasswordConfirm)
    } catch (error) {
      const kind = error && error.kind
      if (kind === 'login') {
        const cleared = clearSessionIfOwner(owner)
        if (cleared) {
          setLoginNotice({ text: '로그인 시간이 지났어요. 다시 로그인해 주세요.' })
          if (typeof onCleared === 'function') onCleared()
        }
        return { ok: false, error, handled: cleared }
      }
      passwordOutcome = { owner: { idx: owner.idx, user_id: owner.user_id }, kind: outcomeKind(kind) }
      return { ok: false, error, handled: false }
    }
    announceChange()
    const cleared = clearSessionIfOwner(owner)
    if (cleared) {
      setLoginNotice({ text: '비밀번호를 변경했어요. 새 비밀번호로 다시 로그인해 주세요.' })
      if (typeof onCleared === 'function') onCleared()
    }
    return { ok: true, cleared }
  }).catch((error) => ({ ok: false, error, handled: false })).finally(() => {
    passwordFlight = null
  })
  return passwordFlight
}

/** 화면을 떠난 사이 끝난 비밀번호 변경의 실패·미확정 결과를 같은 계정일 때 한 번만 꺼낸다. */
export function takePasswordOutcome(currentOwner) {
  const found = passwordOutcome
  if (!found) return null
  passwordOutcome = null
  return sameOwner(found.owner, currentOwner) ? found.kind : null
}

export function waitForPasswordChange() {
  return passwordFlight ? passwordFlight.then(() => undefined, () => undefined) : Promise.resolve()
}

export function isPasswordChangePending() {
  return !!passwordFlight
}
