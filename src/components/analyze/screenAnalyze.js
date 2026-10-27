import { API_BASE } from '../../apiBase'

const SCREEN_ROI_API = `${API_BASE}/api/v1/analyze/screen-roi`
const EXPLAIN_API = `${API_BASE}/api/v1/analyze/screen-roi/explain`
const HEAD_RE = /^【(.+?)】\s*(.*)$/

function errorMessage(data, fallback) {
  if (data && typeof data.detail === 'string') return data.detail
  if (data && typeof data.message === 'string') return data.message
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

const THORAX_HEALTH_API = `${API_BASE}/api/v1/thorax/health`
const THORAX_SCREEN_API = `${API_BASE}/api/v1/thorax/analyze/screen-roi`
const BRAIN_MRI_API = `${API_BASE}/api/v1/analyze/brain-mri`
const KNEE_SCREEN_API = `${API_BASE}/api/v1/knee/screen-roi`

const KNEE_FINDING_LABELS = {
  abnormal: '이상',
  acl: 'ACL',
  meniscus: '반월판'
}

async function postForm(url, form, fallback) {
  const response = await fetch(url, { method: 'POST', body: form })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(errorMessage(data, `${fallback} (${response.status})`))
  }
  return data
}

async function assertReady(url, flag, fallback) {
  const response = await fetch(url)
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data[flag]) {
    throw new Error(data.models_error || data.model_error || errorMessage(data, fallback))
  }
}

export function analyzeTargets() {
  return [
    { id: 'brain', label: '뇌 CT' },
    { id: 'thorax', label: '흉부 X-ray' },
    { id: 'brain-mri', label: '뇌 MRI' },
    { id: 'knee', label: '무릎 MRI' }
  ]
}

export function brainMriSequences() {
  return ['unknown', 'T1', 'T1CE', 'T1C', 'DWI', 'FLAIR', 'other']
}

export function kneePlanes() {
  return [
    { id: 'sagittal', label: '시상면' },
    { id: 'coronal', label: '관상면' },
    { id: 'axial', label: '축상면' }
  ]
}

export function kneeScopes() {
  return [
    { id: 'roi_crop', label: '자른 영역' },
    { id: 'full_slice', label: '슬라이스 전체' }
  ]
}

export async function analyzeThoraxScreen(blob) {
  await assertReady(THORAX_HEALTH_API, 'models_loaded', '흉부 모델이 준비되지 않았습니다.')
  const form = new FormData()
  form.append('image', blob, 'roi.png')
  form.append('modality', 'xray')
  form.append('include_overlay', 'true')
  return postForm(THORAX_SCREEN_API, form, '흉부 분석 오류')
}

export async function analyzeBrainMri(blob, sequence) {
  const form = new FormData()
  form.append('image', blob, 'mri.png')
  form.append('include_overlay', 'true')
  form.append('sequence', sequence || 'unknown')
  return postForm(BRAIN_MRI_API, form, '뇌 MRI 분석 오류')
}

export async function analyzeKneeScreen(blob, plane, imageScope) {
  const form = new FormData()
  form.append('image', blob, 'roi.png')
  form.append('body_part', 'knee')
  form.append('plane', plane || 'sagittal')
  form.append('image_scope', imageScope || 'roi_crop')
  form.append('include_overlay', 'true')
  return postForm(KNEE_SCREEN_API, form, '무릎 분석 오류')
}

function scorePercent(score) {
  const value = Number(score)
  if (!Number.isFinite(value)) return null
  return Math.round(Math.min(1, Math.max(0, value)) * 100)
}

function findingView(item) {
  const percent = scorePercent(item.score)
  return {
    label: item.label || item.label_ko || '',
    label_ko: item.label_ko || item.label || '',
    score: percent == null ? null : Number(item.score),
    percent,
    scoreText: percent == null ? (item.verdict || '평가 안 함') : `${percent}%`,
    note: item.note || ''
  }
}

function presentScreen(data, thorax) {
  const top = data.classification || {}
  let title = thorax
    ? `흉부 최상위: ${top.top_label_ko || '소견 없음'}`
    : `출혈 최상위: ${top.top_label_ko || '소견 없음'}`
  if (!thorax && data.germinoma) {
    title += ` · germinoma: ${data.germinoma.top_label_ko} ${scorePercent(data.germinoma.confidence) || 0}%`
  }
  const groups = [{
    title: thorax ? '흉부 소견' : '출혈 (ICH)',
    findings: (top.findings || []).map(findingView)
  }]
  if (!thorax && data.germinoma && data.germinoma.findings) {
    groups.push({ title: 'Germinoma', findings: data.germinoma.findings.map(findingView) })
  }
  return {
    title,
    explainable: !thorax,
    overlay: data.overlay_png_base64 || '',
    notes: thorax ? ['흉부 화면 분석에는 판독문이 없습니다.'] : [],
    meta: [
      data.roi ? `ROI 크기: ${data.roi.width}×${data.roi.height}` : '',
      data.image_stats ? `밝기 평균/편차: ${data.image_stats.mean} / ${data.image_stats.std}` : '',
      data.latency_ms != null ? `추론 시간: ${data.latency_ms}ms` : '',
      data.overlay_summary ? `이상 부위: ${data.overlay_summary}` : ''
    ].filter(Boolean),
    groups
  }
}

function presentBrainMri(data) {
  const findings = (data.predictions || []).map((item) => findingView({
    label: item.disease,
    label_ko: item.disease_ko || item.disease,
    score: item.confidence
  }))
  return {
    title: '뇌 MRI 5질환',
    explainable: false,
    overlay: data.overlay_png_base64 || '',
    notes: [
      'PNG/JPEG 한 장만 분석합니다. DICOM은 받지 않습니다.',
      data.confidence_note || '',
      ...(data.limitations || [])
    ].filter(Boolean),
    meta: [
      data.latency_ms != null ? `추론 시간: ${data.latency_ms}ms` : '',
      data.input_scope ? `입력 범위: ${data.input_scope}` : ''
    ].filter(Boolean),
    groups: [{ title: '질환 위치와 점수', findings }]
  }
}

function presentKnee(data) {
  const findings = Object.keys(data.findings || {}).map((key) => {
    const item = data.findings[key] || {}
    return findingView({
      label: key,
      label_ko: KNEE_FINDING_LABELS[key] || key,
      score: item.prob,
      verdict: item.verdict,
      note: item.reason || ''
    })
  })
  const visual = data.visualization || {}
  const notes = [
    visual.acl_box_note || '',
    ...(data.notices || []).map((item) => item.text).filter(Boolean)
  ].filter(Boolean)
  return {
    title: '무릎 MRI',
    explainable: false,
    overlay: visual.overlay_png_base64 || '',
    notes,
    meta: [
      data.latency_ms != null ? `추론 시간: ${data.latency_ms}ms` : '',
      visual.acl_location_status ? `ACL 위치: ${visual.acl_location_status}` : ''
    ].filter(Boolean),
    groups: [{ title: '이상 · ACL · 반월판', findings }]
  }
}

export function presentAnalysis(target, data) {
  if (!data) return null
  if (target === 'brain-mri') return presentBrainMri(data)
  if (target === 'knee') return presentKnee(data)
  return presentScreen(data, target === 'thorax')
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
