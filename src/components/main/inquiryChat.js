import {getUserSession} from '../login/authSession'
import { API_BASE } from '../../apiBase'

const QA_API = `${API_BASE}/qa`

function formatTime(value) {
  const date = value ? new Date(String(value).replace(' ', 'T')) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function clipTitle(text) {
  const body = String(text || '').trim()
  return body.length > 40 ? body.slice(0, 40) : body
}

function toView(message) {
  return {
    id: String(message.idx),
    role: message.qm_role === 'U' ? 'user' : 'staff',
    text: message.qm_body || '',
    time: formatTime(message.created_at)
  }
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.ok === false) {
    const detail = data && data.detail
    const message = typeof detail === 'string' ? detail : '문의를 처리하지 못했습니다.'
    throw new Error(message)
  }
  return data
}

export function inquiryUserIdx() {
  const user = getUserSession()
  const idx = Number(user && user.idx)
  return Number.isFinite(idx) ? idx : null
}

export async function loadInquiryThread(userIdx, threadIdx) {
  const response = await fetch(`${QA_API}/${threadIdx}?user_idx=${encodeURIComponent(userIdx)}`)
  const data = await readJson(response)
  const thread = data.thread || {}
  return {
    threadIdx: thread.idx,
    closed: thread.state === 'S',
    messages: (data.messages || []).map(toView)
  }
}

export async function loadInquiry(userIdx) {
  const response = await fetch(`${QA_API}?user_idx=${encodeURIComponent(userIdx)}`)
  const data = await readJson(response)
  const thread = (data.items || [])[0]
  if (!thread) {
    return {threadIdx: null, closed: false, messages: []}
  }
  return loadInquiryThread(userIdx, thread.idx)
}

export async function sendInquiry({userIdx, threadIdx, closed, text}) {
  const body = String(text || '').trim()
  if (!body) {
    throw new Error('메시지 내용이 필요합니다.')
  }
  const startNew = !threadIdx || closed
  const response = await fetch(startNew ? QA_API : `${QA_API}/${threadIdx}/messages`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(startNew
      ? {user_idx: userIdx, title: clipTitle(body), body}
      : {user_idx: userIdx, body})
  })
  const data = await readJson(response)
  const idx = data.thread && data.thread.idx
  if (!idx) {
    throw new Error('문의를 처리하지 못했습니다.')
  }
  return loadInquiryThread(userIdx, idx)
}
