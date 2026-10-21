import { API_BASE } from '../../apiBase'

const TODAY_API = `${API_BASE}/learning/today`

const PART_LABELS = {
  1: '뇌',
  2: '흉부',
  3: '복부',
  4: '무릎'
}

export function mapTodayItems(items) {
  return (items || [])
    .filter((row) => row && row.st_part && (Number(row.problem_count) > 0 || Number(row.study_minutes) > 0))
    .map((row) => {
      const part = String(row.st_part)
      return {
        region: part,
        label: row.part_label || PART_LABELS[part] || part,
        studyMinutes: Number(row.study_minutes) || 0,
        solvedCount: Number(row.problem_count) || 0,
        accuracy: Number(row.correct_rate) || 0
      }
    })
}

export async function fetchTodayStudyStats(userIdx) {
  const response = await fetch(`${TODAY_API}?user_idx=${encodeURIComponent(userIdx)}`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : '오늘의 학습 현황을 불러오지 못했습니다.'
    throw new Error(detail)
  }
  return mapTodayItems(data.items)
}
