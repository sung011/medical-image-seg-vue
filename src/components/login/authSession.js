import {API_BASE, apiCredentials} from '../../apiBase'

const SESSION_KEY = 'medlens_user'

export function saveUserSession(data) {
  const user = {
    idx: data.idx,
    user_id: data.user_id,
    user_name: data.user_name,
    mb_level: data.mb_level
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

/** 화면 세션과 서버 학습자 세션(쿠키)을 함께 끝낸다. */
export async function logoutUserSession() {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: apiCredentials()
    })
  } catch (e) {
    /* 서버 로그아웃이 실패해도 화면 세션은 지운다 */
  }
  clearUserSession()
}
