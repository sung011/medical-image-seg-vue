import { API_BASE } from '../../apiBase'

const BRAIN_MRI_API = `${API_BASE}/api/v1/analyze/brain-mri`
const KNEE_GRADE_API = `${API_BASE}/learning/roi-grade/knee`

function errorDetail(payload, fallback) {
  const detail = payload && payload.detail
  if (typeof detail === 'string' && detail) return detail
  if (payload && typeof payload.message === 'string' && payload.message) return payload.message
  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join('\n')
  }
  return fallback
}

export function readingKind(region, type) {
  const part = String(region || '').toLowerCase()
  const modal = String(type || '').toLowerCase()
  if (part === 'brain' && modal === 'ct') return 'brain-ct'
  if (part === 'brain' && modal === 'mri') return 'brain-mri'
  if (part === 'chest' && (modal === 'x-ray' || modal === 'xray')) return 'chest-xray'
  if (part === 'knee' && modal === 'mri') return 'knee-mri'
  return 'none'
}

export async function readBrainMri(file, fields) {
  const filename = /\.(png|jpe?g)$/i.test(file.name || '') ? file.name : 'mri.png'
  const form = new FormData()
  form.append('image', file, filename)
  form.append('include_overlay', 'true')
  form.append('sequence', 'unknown')
  Object.keys(fields || {}).forEach((key) => {
    if (fields[key] != null && fields[key] !== '') form.append(key, String(fields[key]))
  })
  const response = await fetch(BRAIN_MRI_API, { method: 'POST', body: form })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(errorDetail(data, `뇌 MRI 판독 오류 (${response.status})`))
  }
  return data
}

export function brainMriAsGrade(data) {
  const predictions = Array.isArray(data.predictions) ? data.predictions.slice() : []
  predictions.sort((left, right) => Number(right.confidence) - Number(left.confidence))
  const top = predictions[0] || {}
  const labels = ['정답', '부분정답', '오답']
  return {
    ok: true,
    result: labels.includes(data.result) ? data.result : '판독',
    recall: data.recall == null ? null : data.recall,
    iou: data.iou == null ? null : data.iou,
    review_idx: data.review_idx,
    abnormality_bbox: data.reference_bbox || null,
    overlay_png_base64: data.overlay_png_base64 || null,
    overlay_summary: data.confidence_note || '',
    classification: {
      task: 'brain-mri',
      top_label: top.disease || '',
      top_label_ko: top.disease_ko || top.disease || '',
      confidence: top.confidence,
      findings: predictions.map((item) => ({
        label: item.disease,
        label_ko: item.disease_ko || item.disease,
        score: item.confidence
      }))
    },
    germinoma: null,
    disclaimer: data.disclaimer || ''
  }
}

export async function gradeKneeRoi(fields) {
  const body = new URLSearchParams()
  Object.keys(fields).forEach((key) => {
    if (fields[key] != null && fields[key] !== '') body.set(key, String(fields[key]))
  })
  const response = await fetch(KNEE_GRADE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok && !(data && data.reading)) {
    throw new Error(errorDetail(data, `무릎 채점 오류 (${response.status})`))
  }
  return data
}

export function kneeAsGrade(data) {
  const reading = data && data.reading
  if (reading && Array.isArray(reading.findings)) {
    const scored = reading.findings.filter((item) => item.status === 'evaluated' && item.prob != null)
    scored.sort((left, right) => Number(right.prob) - Number(left.prob))
    const top = scored[0] || {}
    return {
      ok: true,
      result: data.result,
      disease: top.label_ko || '',
      recall: data.recall,
      iou: data.iou,
      review_idx: data.review_idx || null,
      overlay_summary: reading.summary || data.feedback || '',
      abnormality_bbox: data.reference_bbox || null,
      classification: {
        task: 'knee-mri',
        top_label: top.key || '',
        top_label_ko: top.label_ko || '',
        confidence: top.prob,
        findings: reading.findings.map((item) => ({
          label: item.key,
          label_ko: item.label_ko,
          score: item.prob,
          verdict: item.verdict,
          status: item.status,
          reason: item.reason || ''
        }))
      },
      germinoma: null,
      disclaimer: reading.disclaimer || ''
    }
  }
  return {
    ok: true,
    result: data.result || '미채점',
    recall: data.iou,
    iou: data.iou,
    review_idx: data.review_idx || null,
    overlay_summary: data.not_graded_message || data.feedback || '',
    abnormality_bbox: data.reference_bbox || null,
    classification: {
      task: 'knee',
      top_label: 'acl',
      top_label_ko: 'ACL',
      confidence: data.iou,
      findings: []
    },
    germinoma: null
  }
}
