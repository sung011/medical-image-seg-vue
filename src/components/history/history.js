import {API_BASE} from '../../apiBase'

const HISTORY_API = `${API_BASE}/learning/history`

export const PREVIEW_SIZE = 4

export const HISTORY_RANGES = [
    {id: 'all', label: '전체 기간'},
    {id: '7', label: '최근 7일'},
    {id: '30', label: '최근 30일'}
]

export function historyImageUrl(path) {
    if (!path) return ''
    if (/^https?:\/\//i.test(path)) return path
    return path.startsWith('/') ? path : `/${path}`
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

export function mapHistoryItem(row) {
    return {
        idx: row.idx,
        studyIdx: row.study_idx,
        disease: row.disease || '소견 없음',
        solution: row.solution || '',
        solutionLabel: row.solution_label || '',
        partLabel: row.part_label || '',
        modalLabel: row.modal_label || '',
        region: row.region || '',
        type: row.type || '',
        image: historyImageUrl(row.image),
        createdAt: row.created_at || '',
        dateLabel: formatHistoryDate(row.created_at),
        caseLabel: caseLabel(row.study_idx)
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
