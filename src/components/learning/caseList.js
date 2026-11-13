// 케이스 목록 화면(CaseListPage.vue)만 쓰는 상수와 순수 함수

export const CASE_FILTERS = [
  {id: 'all', label: '전체'},
  {id: 'unsolved', label: '안 푼 문제'},
  {id: 'review', label: '오답·부분정답'}
]

export function padCase(number) {
  return String(number).padStart(2, '0')
}

/** 내 최근 결과(C 정답, H 부분정답, W 오답)에 따른 배지 종류. 안 풀었으면 new */
export function badgeKind(item) {
  return {C: 'good', H: 'half', W: 'bad'}[item.last_solution] || 'new'
}

export function filterCases(items, filter) {
  if (filter === 'unsolved') return items.filter((item) => !item.solved)
  if (filter === 'review') return items.filter((item) => ['W', 'H'].includes(item.last_solution))
  return items
}

/** 2026-11-12T09:00:00 → 2026.11.12 */
export function formatSolvedDate(value) {
  if (!value) return ''
  const day = String(value).replace('T', ' ').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return String(value)
  return day.replace(/-/g, '.')
}

/** 풀이 화면으로 가는 주소. idx를 주면 그 문제만 연다 */
export function solveRoute(region, type, idx) {
  const query = {region, type}
  if (idx != null) query.idx = String(idx)
  return {path: '/medical', query}
}
