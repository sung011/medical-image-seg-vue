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
