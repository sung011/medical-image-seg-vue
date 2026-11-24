import { API_BASE } from '../../apiBase'
import { getUserSession } from '../login/authSession'
import { isAccountSession } from '../login/accountSession'

const BRAIN_MRI_API = `${API_BASE}/api/v1/analyze/brain-mri`
// 무릎 채점은 로그인 쿠키(learner 세션)가 있어야 하므로 같은 출처 계정 프록시로 보낸다(devserver/accountProxy.js).
const KNEE_GRADE_API = '/account-api/learning/roi-grade/knee'
const KNEE_TIMEOUT_MS = 20000
// 무릎 채점 실패 안내(고정 문구). 프록시가 서버 원문 대신 상태·코드만 돌려준다.
const KNEE_ERROR = {
  400: '박스 영역이나 장 번호를 확인한 뒤 다시 제출해 주세요.',
  401: '로그인이 필요합니다. 다시 로그인해 주세요.',
  403: '관리자 승인 후 사용할 수 있어요. 승인 여부는 관리자에게 문의해 주세요.',
  404: '채점할 수 있는 문제가 아닙니다.',
  408: '제출 내용을 다 보내지 못했어요. 다시 제출해 주세요.',
  409: '문제 내용이 바뀌었어요. 문제를 다시 열어 주세요.',
  412: '이 브라우저에 다른 계정이 로그인되어 있어 제출하지 않았어요. 다시 로그인해 주세요.',
  413: '제출 내용이 너무 커요.',
  429: '시도가 너무 많아요. 잠시 후 다시 해 주세요.',
  503: '지금은 무릎 채점을 사용할 수 없어요.'
}
const KNEE_UNKNOWN = '채점 결과를 확인하지 못했어요. 학습 기록에서 저장됐는지 확인한 뒤 필요하면 다시 제출해 주세요.'

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

/**
 * 무릎 ROI 채점. 같은 출처 /account-api 로 로그인 쿠키와 함께 보낸다. 회원은 서버가 쿠키로 정하고,
 * 화면 계정 번호(X-Medlens-Account)는 프록시가 쿠키 계정과 같은지 확인하는 데만 쓴다(인증 수단 아님, 폼에 회원 번호를 싣지 않는다).
 * 자동으로 다시 보내지 않는다. 채점하지 않는 문제(승인 기준 없음 등)는 200 + graded=false 로 온다.
 */
export async function gradeKneeRoi(fields) {
  const owner = getUserSession()
  if (!isAccountSession(owner)) {
    throw new Error('무릎 채점은 다시 로그인한 뒤 사용할 수 있어요. 로그아웃 후 다시 로그인해 주세요.')
  }
  const body = new URLSearchParams()
  Object.keys(fields).forEach((key) => {
    if (key === 'user_idx') return
    if (fields[key] != null && fields[key] !== '') body.set(key, String(fields[key]))
  })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), KNEE_TIMEOUT_MS)
  let response
  let data = null
  try {
    response = await fetch(KNEE_GRADE_API, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Medlens-Account': String(owner.idx) },
      body,
      signal: controller.signal
    })
    data = await response.json().catch(() => null)
  } catch (e) {
    throw new Error(KNEE_UNKNOWN)
  } finally {
    clearTimeout(timer)
  }
  if (response.type === 'opaqueredirect') throw new Error(KNEE_UNKNOWN)
  if (!response.ok) throw new Error(KNEE_ERROR[response.status] || KNEE_UNKNOWN)
  if (!data || data.ok !== true || typeof data.graded !== 'boolean') throw new Error(KNEE_UNKNOWN)
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
