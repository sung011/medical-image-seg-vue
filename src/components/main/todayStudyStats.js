export const REGION_LABELS = {
  brain: '뇌',
  chest: '흉부',
  abdomen: '복부',
  knee: '무릎'
}

/** 오늘 학습한 부위 목업. 학습 없는 부위는 넣지 않는다. */
const MOCK_TODAY_BY_REGION = [
  {
    region: 'brain',
    studyMinutes: 20,
    solvedCount: 12,
    accuracy: 83
  },
  {
    region: 'chest',
    studyMinutes: 25,
    solvedCount: 20,
    accuracy: 75
  }
]

/**
 * 오늘 학습한 부위만 반환한다.
 * @param {Array<{region: string, studyMinutes: number, solvedCount: number, accuracy: number}>} [rows]
 */
export function getStudiedRegionStats(rows = MOCK_TODAY_BY_REGION) {
  return (rows || [])
    .filter((row) => row && row.region && (row.solvedCount > 0 || row.studyMinutes > 0))
    .map((row) => ({
      region: row.region,
      label: REGION_LABELS[row.region] || row.region,
      studyMinutes: Number(row.studyMinutes) || 0,
      solvedCount: Number(row.solvedCount) || 0,
      accuracy: Number(row.accuracy) || 0
    }))
}
