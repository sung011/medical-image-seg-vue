import {API_BASE} from '../../../apiBase'

export const STORAGE_KEY = 'medlens.review'

export const MOCK_GRADE = {
  result: '부분정답',
  has_abnormality: true,
  recall: 0.68,
  iou: 0.42,
  overlay_summary: '지주막하출혈 (p=0.82, 중부-중앙, ~741px)',
  classification: {
    top_label: 'subarachnoid',
    top_label_ko: '지주막하출혈',
    confidence: 0.82,
    task: 'hemorrhage',
    findings: [
      { label: 'subarachnoid', label_ko: '지주막하출혈', score: 0.82 },
      { label: 'any', label_ko: '두개내출혈', score: 0.81 },
      { label: 'intraparenchymal', label_ko: '뇌실질내출혈', score: 0.7 },
      { label: 'subdural', label_ko: '경막하출혈', score: 0.52 }
    ]
  },
  germinoma: {
    top_label: 'germinoma',
    top_label_ko: '생식세포종양',
    confidence: 0.36,
    task: 'germinoma',
    findings: [
      { label: 'germinoma', label_ko: '생식세포종양', score: 0.36 }
    ]
  }
}

export const MOCK_USER_ROI = {
  type: 'circle',
  x: 0.47,
  y: 0.24,
  width: 0.3,
  height: 0.3
}

export function publicAssetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || String(path).startsWith('data:')) return path
  return path.startsWith('/') ? path : `/${path}`
}

export function overlaySrcFromBase64(b64) {
  if (!b64) return ''
  if (String(b64).startsWith('data:')) return b64
  return `data:image/png;base64,${b64}`
}

export function containLayout(naturalW, naturalH, frameW, frameH) {
  const scale = Math.min(frameW / naturalW, frameH / naturalH)
  const width = naturalW * scale
  const height = naturalH * scale
  return {
    width,
    height,
    left: (frameW - width) / 2,
    top: (frameH - height) / 2
  }
}

export function formatResult(result) {
  if (result === '부분정답') return '부분 정답'
  return result || '채점 대기'
}

export function resultClass(result) {
  if (result === '정답') return 'ok'
  if (result === '부분정답') return 'partial'
  return 'wrong'
}

export function createDefaultReview() {
  return {
    imageSrc: '/medical/xray-sample.png',
    overlaySrc: '',
    userRoi: { ...MOCK_USER_ROI },
    grade: { ...MOCK_GRADE },
    usingMock: true,
    type: '',
    sliceIndex: null,
    sliceTotal: null
  }
}

export async function fetchSavedReview(reviewIdx, userIdx) {
  const params = new URLSearchParams({
    idx: String(reviewIdx),
    user_idx: String(userIdx)
  })
  const response = await fetch(`${API_BASE}/learning/review?${params}`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : '채점 기록을 불러오지 못했습니다.'
    throw new Error(detail)
  }
  const findings = data.findings && typeof data.findings === 'object' ? data.findings : {}
  const ratioOrNull = (value) => {
    if (value == null || value === '') return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
  }
  const recall = ratioOrNull(data.recall)
  const iou = ratioOrNull(data.iou)
  const sliceIndex = ratioOrNull(data.slice_index)
  return {
    usingMock: false,
    grade: {
      result: data.solution_label || '오답',
      disease: data.disease || '',
      recall,
      iou,
      overlay_summary: data.overlay_summary || '',
      classification: findings.classification || null,
      germinoma: findings.germinoma || null
    },
    studyIdx: data.study_idx,
    imageSrc: publicAssetUrl(data.image),
    userRoi: null,
    overlaySrc: '',
    type: data.type || '',
    sliceIndex: sliceIndex != null && sliceIndex >= 0 ? sliceIndex : null,
    sliceTotal: null
  }
}

export function loadReviewFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (!saved || !saved.gradeResult) return null
    const sliceIndex =
      saved.sliceIndex != null && Number.isFinite(Number(saved.sliceIndex))
        ? Number(saved.sliceIndex)
        : null
    const sliceTotal =
      saved.sliceTotal != null && Number.isFinite(Number(saved.sliceTotal))
        ? Number(saved.sliceTotal)
        : null
    return {
      usingMock: false,
      grade: saved.gradeResult,
      imageSrc: publicAssetUrl(saved.imagePath) || saved.imageDataUrl || '',
      userRoi: saved.userRoi || null,
      overlaySrc:
        publicAssetUrl(saved.overlayPath) ||
        overlaySrcFromBase64(saved.gradeResult.overlay_png_base64),
      type: saved.type || '',
      sliceIndex,
      sliceTotal
    }
  } catch (e) {
    return null
  }
}
