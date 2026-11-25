import {API_BASE} from '../../apiBase'
import {buildImageUrl} from '../../imageBase'
import {normalizeResult} from '../Medical/review/reviewModel'

const NOTES_API = `${API_BASE}/learning/reviews`

const PART_REGION = {
    '1': 'brain',
    '2': 'chest',
    '3': 'abdomen',
    '4': 'knee'
}

const MODAL_TYPE = {
    '1': 'x-ray',
    '2': 'CT',
    '3': 'MRI'
}

export const PAGE_SIZE = 8

export const NOTE_FILTERS = [
    {id: 'all', label: '전체'},
    {id: 'W', label: '불일치'},
    {id: 'H', label: '부분일치'}
]

export const NOTE_SORTS = [
    {id: 'newest', label: '최신순'},
    {id: 'oldest', label: '오래된순'}
]

export function noteImageUrl(path, studyIdx, sliceIndex) {
    return buildImageUrl(path, {studyIdx, sliceIndex})
}

export function formatNoteDate(value) {
    if (!value) return ''
    const day = String(value).replace('T', ' ').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return String(value)
    return day.replace(/-/g, '.')
}

function mapRoi(value) {
    if (!value || typeof value !== 'object') return null
    const x = Number(value.x)
    const y = Number(value.y)
    const width = Number(value.width)
    const height = Number(value.height)
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null
    const type = String(value.type || value.roi_type || 'box').toLowerCase()
    return {
        type: type === 'circle' ? 'circle' : 'box',
        x,
        y,
        width,
        height
    }
}

export function mapNoteItem(row) {
    const part = String(row.st_part || '')
    const modal = String(row.st_modal || '')
    const rois = Array.isArray(row.user_rois)
        ? row.user_rois.map(mapRoi).filter(Boolean)
        : []
    const userRoi = mapRoi(row.user_roi) || rois[0] || null
    return {
        idx: row.review_idx,
        studyIdx: row.study_idx,
        disease: row.disease || '병명 없음',
        solution: row.solution,
        solutionLabel: normalizeResult(row.solution_label) || '',
        partLabel: row.st_part_label || '',
        modalLabel: row.st_modal_label || '',
        region: PART_REGION[part] || row.region || '',
        type: MODAL_TYPE[modal] || row.type || '',
        image: noteImageUrl(row.image_url || row.image, row.study_idx, row.slice_index),
        userRoi,
        userRois: rois.length ? rois : (userRoi ? [userRoi] : []),
        createdAt: row.created_at || '',
        dateLabel: formatNoteDate(row.created_at)
    }
}

/** 썸네일 위에 학습자 ROI 박스를 올릴 때 쓰는 인라인 스타일(0~1 좌표). */
export function roiThumbStyle(roi) {
    if (!roi) return null
    return {
        left: `${Number(roi.x) * 100}%`,
        top: `${Number(roi.y) * 100}%`,
        width: `${Number(roi.width) * 100}%`,
        height: `${Number(roi.height) * 100}%`,
        borderRadius: roi.type === 'circle' ? '50%' : '0'
    }
}

export function latestPerStudy(items) {
    const seen = new Set()
    const kept = []
    items.forEach((item) => {
        const key = item.studyIdx != null ? `study:${item.studyIdx}` : `review:${item.idx}`
        if (seen.has(key)) return
        seen.add(key)
        kept.push(item)
    })
    return kept
}

export function filterNotes(items, filter) {
    if (!filter || filter === 'all') return items.slice()
    return items.filter((item) => item.solution === filter)
}

export function sortNotes(items, sort) {
    const copy = items.slice()
    copy.sort((a, b) => {
        const left = String(a.createdAt)
        const right = String(b.createdAt)
        if (left === right) return (Number(b.idx) || 0) - (Number(a.idx) || 0)
        if (sort === 'oldest') return left < right ? -1 : 1
        return left > right ? -1 : 1
    })
    return copy
}

export function pageCount(total, size = PAGE_SIZE) {
    if (total <= 0) return 1
    return Math.ceil(total / size)
}

export function pageItems(items, page, size = PAGE_SIZE) {
    const current = Math.max(1, page)
    const start = (current - 1) * size
    return items.slice(start, start + size)
}

export async function fetchWrongNotes(userIdx) {
    const params = new URLSearchParams({
        user_idx: String(userIdx),
        limit: '200'
    })
    const response = await fetch(`${NOTES_API}?${params}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : '리뷰노트를 불러오지 못했습니다.'
        throw new Error(detail)
    }
    const rows = Array.isArray(data.items) ? data.items : []
    return latestPerStudy(rows.map(mapNoteItem))
}
