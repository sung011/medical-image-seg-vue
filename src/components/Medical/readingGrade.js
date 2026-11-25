import { API_BASE, apiCredentials } from '../../apiBase'
import { normalizeResult } from './review/reviewModel'

const BRAIN_MRI_API = `${API_BASE}/api/v1/analyze/brain-mri`
const KNEE_GRADE_API = `${API_BASE}/learning/roi-grade/knee`
const KNEE_TASK_API = `${API_BASE}/learning/knee/task`

function errorDetail(payload, fallback) {
  const detail = payload && payload.detail
  if (typeof detail === 'string' && detail) return detail
  if (detail && typeof detail === 'object' && typeof detail.message === 'string' && detail.message) {
    return detail.message
  }
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
  if (part === 'abdomen' && modal === 'ct') return 'abdomen-ct'
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
  const normalized = normalizeResult(data.result)
  const graded = normalized === '일치' || normalized === '부분일치' || normalized === '불일치'
  return {
    ok: true,
    result: graded ? normalized : '판독',
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

/** 무릎 슬라이드 채점에 필요한 problem_token·대표 장 번호를 받는다. */
export async function fetchKneeTask(studyIdx) {
  const params = new URLSearchParams({study_idx: String(studyIdx)})
  let response
  try {
    response = await fetch(`${KNEE_TASK_API}?${params}`, {
      credentials: apiCredentials()
    })
  } catch (err) {
    throw new Error('서버에 연결하지 못했습니다. 개발 서버를 재시작한 뒤 다시 로그인해 주세요.')
  }
  const data = await response.json().catch(() => ({}))
  if (response.status === 401) {
    throw new Error('로그인이 필요합니다. 로그아웃 후 다시 로그인해 주세요.')
  }
  if (!response.ok) {
    throw new Error(errorDetail(data, `무릎 문제 정보를 불러오지 못했습니다. (${response.status})`))
  }
  const task = data && data.knee_task && typeof data.knee_task === 'object' ? data.knee_task : null
  if (!task) {
    throw new Error('무릎 문제 정보가 비어 있습니다.')
  }
  return {
    studyIdx: data.study_idx != null ? data.study_idx : studyIdx,
    gradingAvailable: task.grading_available === true,
    unavailableReason: task.unavailable_reason || '',
    problemToken: typeof task.problem_token === 'string' ? task.problem_token : '',
    representativeSliceIndex:
      task.representative_slice_index != null && Number.isFinite(Number(task.representative_slice_index))
        ? Number(task.representative_slice_index)
        : null,
    sliceCount:
      task.slice_count != null && Number.isFinite(Number(task.slice_count))
        ? Number(task.slice_count)
        : null,
    taskLabel: task.task_label || ''
  }
}

export async function gradeKneeRoi(fields) {
  const body = new URLSearchParams()
  Object.keys(fields).forEach((key) => {
    if (fields[key] != null && fields[key] !== '') body.set(key, String(fields[key]))
  })
  let response
  try {
    response = await fetch(KNEE_GRADE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: apiCredentials(),
      body
    })
  } catch (err) {
    throw new Error('서버에 연결하지 못했습니다. 개발 서버를 재시작한 뒤 다시 로그인해 주세요.')
  }
  const data = await response.json().catch(() => ({}))
  if (response.status === 401) {
    throw new Error('로그인이 필요합니다. 로그아웃 후 다시 로그인해 주세요.')
  }
  if (response.status === 403) {
    throw new Error(errorDetail(data, '이메일 인증을 마친 뒤 사용할 수 있습니다.'))
  }
  if (!response.ok && !(data && data.reading)) {
    throw new Error(errorDetail(data, `무릎 채점 오류 (${response.status})`))
  }
  if (data && data.ok && data.graded === false) {
    throw new Error(
      data.not_graded_message || '이 문제는 지금 채점할 수 없습니다. 서버 기준 영상이 준비되지 않았습니다.'
    )
  }
  return data
}

export function kneeAsGrade(data) {
  const disease =
    (data && (data.expected_disease || data.disease || data.rn_disease)) || ''
  const reading = data && data.reading
  if (reading && Array.isArray(reading.findings)) {
    const scored = reading.findings.filter((item) => item.status === 'evaluated' && item.prob != null)
    scored.sort((left, right) => Number(right.prob) - Number(left.prob))
    const top = scored[0] || {}
    return {
      ok: true,
      result: normalizeResult(data.result),
      disease: disease || top.label_ko || '',
      expected_disease: disease || null,
      recall: data.recall,
      iou: data.iou,
      review_idx: data.review_idx || null,
      overlay_summary: reading.summary || data.feedback || '',
      abnormality_bbox: data.reference_bbox || null,
      classification: {
        task: 'knee-mri',
        top_label: top.key || '',
        top_label_ko: disease || top.label_ko || '',
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
    result: normalizeResult(data.result) || '미채점',
    disease: disease || '',
    expected_disease: disease || null,
    recall: data.iou,
    iou: data.iou,
    review_idx: data.review_idx || null,
    overlay_summary: data.not_graded_message || data.feedback || '',
    abnormality_bbox: data.reference_bbox || null,
    classification: {
      task: 'knee',
      top_label: 'acl',
      top_label_ko: disease || 'ACL',
      confidence: data.iou,
      findings: []
    },
    germinoma: null
  }
}
