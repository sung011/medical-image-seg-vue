// 마이페이지 학습 통계 화면 계산(시안 B). 순수 함수만 둔다 — 서버 숫자를 보기 좋게 고를 뿐 새 숫자를 만들지 않는다.
// 서버 GET /me/stats 의 날짜 기준(서울)·하루 목표 규칙을 그대로 따른다.

const WEEKDAY = ['월', '화', '수', '목', '금', '토', '일']

/** 'YYYY-MM-DD' → 월~일 한 글자. 잘못된 값은 빈 문자열. 시간대 영향을 받지 않도록 UTC 로만 계산한다. */
export function weekdayLabel(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '')
  if (!m) return ''
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return WEEKDAY[(d.getUTCDay() + 6) % 7]
}

/** 'YYYY-MM-DD' → '11/06' */
export function shortDate(date) {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date || '')
  return m ? `${m[1]}/${m[2]}` : ''
}

/**
 * 상단 격려 문구. 서버가 준 실제 상태로만 고른다(목표·배지 없음, 경쟁/실패를 부추기는 표현 없음). 규칙 순서:
 * 1 채점 0건 → 2 날짜 기준 미확인 → 3 오늘 목표(하루 5문제) 달성 → 4 어제까지 이어짐(오늘 진행도 포함) → 5 다시 시작/시작 전 진행도.
 */
export function encouragement(stats) {
  if (!stats) return ''
  if (stats.summary.solved === 0) {
    return stats.quality.ungraded > 0
      ? '아직 채점된 문제 기록이 없어요.'
      : '첫 학습을 시작해 볼까요? 저장된 채점 기록이 생기면 여기에 보여드려요.'
  }
  const cal = stats.calendar
  if (cal.status !== 'ready' || cal.current === null) return '학습 기록이 쌓이고 있어요. 연속 학습일은 날짜 기준을 확인한 뒤 보여드려요.'
  const goal = cal.dailyGoal
  const done = cal.todaySolved
  const left = Math.max(0, goal - done)
  if (cal.todayDone && cal.current >= 1) return `오늘 목표를 채웠어요! ${cal.current}일 연속 학습 중이에요.`
  if (!cal.todayDone && cal.current >= 1) {
    return done > 0
      ? `${cal.current}일 연속 학습 중이에요. 오늘 ${done}/${goal}문제 — ${left}문제 더 풀면 ${cal.current + 1}일째예요.`
      : `${cal.current}일 연속 학습을 이어가고 있어요. 오늘 ${goal}문제를 풀면 ${cal.current + 1}일째예요.`
  }
  return done > 0 ? `오늘 ${done}/${goal}문제! ${left}문제 더 풀면 연속 학습이 시작돼요.` : `오늘 ${goal}문제로 다시 시작해 볼까요?`
}

/**
 * 최근 7일 막대 높이(px). 값이 null(날짜 미확인)이면 null(막대 없음), 0 이면 실제 0, 최댓값이 0 이면 나눗셈 없이 모두 0.
 * 시안의 '0인데 5px' 같은 거짓 높이를 만들지 않는다.
 */
export function barHeights(recent7, maxPx = 90) {
  const values = recent7.map((d) => d.count)
  const max = Math.max(0, ...values.filter((v) => v !== null))
  return values.map((v) => (v === null ? null : max === 0 ? 0 : Math.round((v / max) * maxPx)))
}

/** 브라우저 시계로 본 서울 날짜(YYYY-MM-DD). 통계 숫자를 만들지 않고 '서버 날짜를 다시 받을 때가 됐는지'만 판단하는 데 쓴다. */
export function kstDateString(ms) {
  const d = new Date(ms + 9 * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}

/** 다음 서울 자정까지 남은 밀리초(최소 1초). 자정 직후 서버 날짜를 한 번 다시 받기 위한 단발 타이머 값. */
export function msUntilNextKstMidnight(ms) {
  const kstMs = ms + 9 * 3600 * 1000
  const next = (Math.floor(kstMs / 86400000) + 1) * 86400000
  return Math.max(1000, next - kstMs + 1000)
}

/** 부위 막대 한 줄의 글자: 정답률(소수 1자리까지)과 문제 수. 기록이 없으면 '—·0문제'. */
export function regionText(region) {
  return region.ratePct === null ? `— · ${region.problems}문제` : `${region.ratePct}% (${region.problems}문제)`
}

/** 정답률 글자: null 이면 '—'(0% 가 아니다). */
export function rateText(rate) {
  return rate === null || rate === undefined ? '—' : `${rate}%`
}
