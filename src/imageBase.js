import {API_BASE} from './apiBase'

export const IMAGE_BASE = 'https://kr.object.ncloudstorage.com/biz02gj'

/** 경로·URL 안의 slice_000 형태에서 장 번호(0부터)를 읽는다. */
export function sliceIndexFromImagePath(path) {
  const match = String(path || '').match(/slice[_-]?(\d+)/i)
  if (!match) return null
  const number = Number(match[1])
  return Number.isFinite(number) && number >= 0 ? number : null
}

/** 풀이·리뷰와 같이 문제 API로 한 장 바이트를 받는 주소. */
export function problemSliceImageUrl(studyIdx, sliceIndex = 0) {
  const study = Number(studyIdx)
  if (!Number.isFinite(study) || study < 1) return ''
  const slice = Number(sliceIndex)
  const index = Number.isFinite(slice) && slice >= 0 ? Math.floor(slice) : 0
  return `${API_BASE}/learning/problem/${study}/image?slice_index=${index}`
}

function isKneeSeriesPath(value) {
  return /\/knee_series\//i.test(String(value || ''))
}

/**
 * 학습 영상 주소.
 * `/stylesheets`는 개발 프록시·공개 저장소, `/knee_series`는 공개 OSS에 없어
 * studyIdx가 있으면 `GET /learning/problem/{번호}/image?slice_index=`로 돌린다.
 * options: { studyIdx, sliceIndex }
 */
export function buildImageUrl(path, options = {}) {
  if (path == null) return ''
  const value = String(path).trim()
  if (!value) return ''

  if (isKneeSeriesPath(value)) {
    const slice =
      options.sliceIndex != null && Number.isFinite(Number(options.sliceIndex))
        ? Number(options.sliceIndex)
        : sliceIndexFromImagePath(value)
    return problemSliceImageUrl(options.studyIdx, slice != null ? slice : 0)
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }
  const rel = value.startsWith('/') ? value : `/${value}`
  // 서버가 준 문제 영상 API 주소는 개발 프록시(/__api)를 붙인다.
  if (rel.startsWith('/learning/problem/')) {
    const base = String(API_BASE || '').replace(/\/$/, '')
    return `${base}${rel}`
  }
  if (rel.startsWith('/medical/') || rel.startsWith('/learning/')) return rel
  return `${IMAGE_BASE}${rel}`
}
