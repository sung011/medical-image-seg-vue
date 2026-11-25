const SESSION_KEY = 'medlens_user'

export function saveUserSession(data) {
  const user = {
    idx: data.idx,
    user_id: data.user_id,
    user_name: data.user_name,
    mb_level: data.mb_level,
    // 같은 출처 계정 쿠키까지 확인한 로그인만 true. 이전 방식 로그인(쿠키 없음)은 계정 화면 전에 다시 로그인한다.
    account_verified: data.account_verified === true,
    // 그 로그인 때의 계정 프록시 대상(정규 origin). 실행 설정이 바뀌면 이 세션은 쓰지 않는다.
    account_target: typeof data.account_target === 'string' ? data.account_target : ''
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function getUserSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export function clearUserSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
