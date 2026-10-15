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
