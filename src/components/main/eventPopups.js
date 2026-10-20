import { API_BASE } from '../../apiBase'

const POPUPS_API = `${API_BASE}/popups`
const TODAY_KEY = 'medlens.eventDismissToday'

function todayStamp() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function readTodayMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TODAY_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (e) {
    return {}
  }
}

function formatDay(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}

function formatPeriod(startAt, endAt) {
  const start = formatDay(startAt)
  const end = formatDay(endAt)
  if (start && end) return `${start} – ${end}`
  return start || end
}

function normalizePopup(row) {
  if (!row || row.idx == null) return null
  const link = typeof row.pp_link === 'string' ? row.pp_link.trim() : ''
  return {
    id: String(row.idx),
    title: row.pp_title || '이벤트',
    imageUrl: row.pp_image_url || '',
    link,
    external: /^https?:\/\//i.test(link),
    period: formatPeriod(row.start_at, row.end_at),
    sort: Number(row.pp_sort) || 0
  }
}

export async function fetchVisibleEventPopups() {
  const response = await fetch(POPUPS_API)
  if (!response.ok) {
    throw new Error('팝업을 불러오지 못했습니다.')
  }
  const rows = await response.json()
  const today = todayStamp()
  const hiddenToday = readTodayMap()
  return (Array.isArray(rows) ? rows : [])
    .map(normalizePopup)
    .filter((event) => event && hiddenToday[event.id] !== today)
    .sort((a, b) => a.sort - b.sort || Number(a.id) - Number(b.id))
}

export function dismissEventForToday(id) {
  const map = readTodayMap()
  map[id] = todayStamp()
  try {
    localStorage.setItem(TODAY_KEY, JSON.stringify(map))
  } catch (e) {
    /* 저장이 막혀도 화면의 닫기는 유지한다 */
  }
}
