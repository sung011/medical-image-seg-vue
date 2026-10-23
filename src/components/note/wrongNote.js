import {API_BASE} from '../../apiBase'
import {buildImageUrl} from '../../imageBase'

const NOTES_API = `${API_BASE}/learning/notes`

export const PAGE_SIZE = 8

export const NOTE_FILTERS = [
    {id: 'all', label: '전체'},
    {id: 'W', label: '오답'},
    {id: 'H', label: '부분정답'}
]

export const NOTE_SORTS = [
    {id: 'newest', label: '최신순'},
    {id: 'oldest', label: '오래된순'}
]

export function noteImageUrl(path) {
    return buildImageUrl(path)
}

export function formatNoteDate(value) {
    if (!value) return ''
    const day = String(value).replace('T', ' ').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return String(value)
    return day.replace(/-/g, '.')
}

export function mapNoteItem(row) {
    return {
        idx: row.idx,
        studyIdx: row.study_idx,
        disease: row.disease || '병명 없음',
        solution: row.solution,
        solutionLabel: row.solution_label || '',
        partLabel: row.part_label || '',
        modalLabel: row.modal_label || '',
        region: row.region || '',
        type: row.type || '',
        image: noteImageUrl(row.image),
        createdAt: row.created_at || '',
        dateLabel: formatNoteDate(row.created_at)
    }
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
    const response = await fetch(`${NOTES_API}?user_idx=${encodeURIComponent(userIdx)}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : '오답노트를 불러오지 못했습니다.'
        throw new Error(detail)
    }
    return (data.items || []).map(mapNoteItem)
}
