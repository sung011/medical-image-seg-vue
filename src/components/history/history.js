import {API_BASE} from '../../apiBase'
import {buildImageUrl} from '../../imageBase'
import {normalizeResult} from '../Medical/review/reviewModel'

const HISTORY_API = `${API_BASE}/learning/history`

export const PREVIEW_SIZE = 4

export const HISTORY_RANGES = [
    {id: 'all', label: '전체 기간'},
    {id: '7', label: '최근 7일'},
    {id: '30', label: '최근 30일'}
]

export function historyImageUrl(path, studyIdx, sliceIndex) {
    return buildImageUrl(path, {studyIdx, sliceIndex})
}

export function parseCreated(value) {
    if (!value) return null
    const time = new Date(String(value).replace(' ', 'T'))
    return Number.isNaN(time.getTime()) ? null : time
}

export function formatHistoryDate(value) {
    const time = parseCreated(value)
    if (!time) return value ? String(value) : ''
    const pad = (number) => String(number).padStart(2, '0')
    return `${time.getFullYear()}.${pad(time.getMonth() + 1)}.${pad(time.getDate())} ${pad(time.getHours())}:${pad(time.getMinutes())}`
}

export function caseLabel(studyIdx) {
    if (studyIdx == null || studyIdx === '') return 'CASE'
    return `CASE ${String(studyIdx).padStart(2, '0')}`
}

function percent(part, total) {
    const whole = Number(total) || 0
    if (whole <= 0) return 0
    return Math.round((Number(part) / whole) * 100)
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

export function mapHistoryItem(row) {
    const rois = Array.isArray(row.user_rois)
        ? row.user_rois.map(mapRoi).filter(Boolean)
        : []
    const userRoi = mapRoi(row.user_roi) || rois[0] || null
    return {
        idx: row.idx,
        studyIdx: row.study_idx,
        disease: row.disease || '소견 없음',
        solution: row.solution || '',
        solutionLabel: normalizeResult(row.solution_label) || '',
        partLabel: row.part_label || '',
        modalLabel: row.modal_label || '',
        region: row.region || '',
        type: row.type || '',
        image: historyImageUrl(row.image, row.study_idx, row.slice_index),
        userRoi,
        userRois: rois.length ? rois : (userRoi ? [userRoi] : []),
        createdAt: row.created_at || '',
        dateLabel: formatHistoryDate(row.created_at),
        caseLabel: caseLabel(row.study_idx)
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

export function filterByRange(items, rangeId, now = new Date()) {
    if (!rangeId || rangeId === 'all') return items.slice()
    const days = Number(rangeId)
    if (!Number.isFinite(days) || days < 1) return items.slice()
    const cutoff = new Date(now)
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - (days - 1))
    return items.filter((item) => {
        const time = parseCreated(item.createdAt)
        return time != null && time >= cutoff
    })
}

export function summarizeHistory(items, totalStudies) {
    const seen = new Set()
    let correctStudies = 0
    let correctSubmissions = 0
    items.forEach((item) => {
        if (item.solution === 'C') correctSubmissions += 1
        const key = item.studyIdx != null ? `study:${item.studyIdx}` : `review:${item.idx}`
        if (seen.has(key)) return
        seen.add(key)
        if (item.solution === 'C') correctStudies += 1
    })
    const solved = seen.size
    const total = Math.max(0, Number(totalStudies) || 0)
    const submissions = items.length
    return {
        solved,
        total,
        correctStudies,
        submissions,
        correctSubmissions,
        progress: percent(solved, total),
        accuracy: percent(correctStudies, solved),
        roiAccuracy: percent(correctSubmissions, submissions)
    }
}

export async function fetchLearningHistory(userIdx) {
    const response = await fetch(`${HISTORY_API}?user_idx=${encodeURIComponent(userIdx)}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : '학습 기록을 불러오지 못했습니다.'
        throw new Error(detail)
    }
    const rows = Array.isArray(data.items) ? data.items : []
    return {
        totalStudies: Number(data.total_studies) || 0,
        items: rows.map(mapHistoryItem)
    }
}
