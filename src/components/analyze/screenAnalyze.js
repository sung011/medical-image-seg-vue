import { API_BASE } from '../../apiBase'

const SCREEN_ROI_API = `${API_BASE}/api/v1/analyze/screen-roi`
const EXPLAIN_API = `${API_BASE}/api/v1/analyze/screen-roi/explain`
const HEAD_RE = /^【(.+?)】\s*(.*)$/

function errorMessage(data, fallback) {
  if (data && typeof data.detail === 'string') return data.detail
  return fallback
}

export function cropRect(roi, overlayWidth, overlayHeight, videoWidth, videoHeight) {
  if (!roi || !videoWidth || !overlayWidth || !overlayHeight) return null
  const scaleX = videoWidth / overlayWidth
  const scaleY = videoHeight / overlayHeight
  const sx = Math.max(0, Math.floor(roi.x * scaleX))
  const sy = Math.max(0, Math.floor(roi.y * scaleY))
  const sw = Math.min(videoWidth - sx, Math.floor(roi.w * scaleX))
  const sh = Math.min(videoHeight - sy, Math.floor(roi.h * scaleY))
  if (sw < 4 || sh < 4) return null
  return { sx, sy, sw, sh }
}

export async function analyzeScreenRoi(blob) {
  const form = new FormData()
  form.append('image', blob, 'roi.png')
  form.append('modality', 'screen_capture')
  form.append('include_overlay', 'true')
  const response = await fetch(SCREEN_ROI_API, { method: 'POST', body: form })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(errorMessage(data, `API 오류 (${response.status})`))
  }
  return data
}

export async function explainScreenRoi(blob, analysis) {
  const form = new FormData()
  form.append('image', blob, 'roi.png')
  form.append('probs_json', JSON.stringify(analysis.classification.probs))
  if (analysis.germinoma && analysis.germinoma.probs) {
    form.append('germinoma_probs_json', JSON.stringify(analysis.germinoma.probs))
  }
  if (analysis.overlay_png_base64) {
    form.append('overlay_png_base64', analysis.overlay_png_base64)
  }
  const response = await fetch(EXPLAIN_API, { method: 'POST', body: form })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(errorMessage(data, `해설 API 오류 (${response.status})`))
  }
  return data
}

function reportBlocks(lines) {
  return lines.map((line) => {
    if (line.startsWith('※')) return { type: 'note', text: line }
    if (/^[-·*]\s/.test(line) || /^1[.)]\s/.test(line)) {
      return {
        type: 'bullet',
        text: line.replace(/^[-·*]\s*/, '').replace(/^1[.)]\s*/, '')
      }
    }
    return { type: 'text', text: line }
  })
}

export function parseReport(text) {
  const sections = []
  let current = null
  String(text || '').split('\n').forEach((raw) => {
    const line = raw.trim()
    if (!line) return
    const match = line.match(HEAD_RE)
    if (match) {
      if (current) sections.push(current)
      current = { title: match[1], lines: match[2] ? [match[2]] : [] }
      return
    }
    if (!current) current = { title: '판독', lines: [] }
    current.lines.push(line)
  })
  if (current) sections.push(current)
  return sections.map((section) => ({
    title: section.title,
    tone: section.title === 'AI참고' ? 'hl' : section.title === '면책' ? 'warn' : '',
    blocks: reportBlocks(section.lines)
  }))
}
