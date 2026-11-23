<template>
  <PageFrame>
    <div class="mypage">
      <div class="mypage__inner">
        <header class="mypage__head">
          <h1>마이페이지</h1>
          <p>내 정보와 학습 현황을 확인해요.</p>
        </header>

        <section v-if="state === 'loading'" class="card status" role="status" data-testid="mypage-loading">
          <p>내 정보를 불러오는 중이에요…</p>
        </section>

        <section v-else-if="state !== 'ready'" class="card status status--error" role="alert" data-testid="mypage-error">
          <p>{{ errorText }}</p>
          <div class="status__actions">
            <button v-if="state === 'retry'" type="button" class="btn btn--small" data-testid="mypage-retry" @click="load">다시 시도</button>
            <button
                v-if="state === 'login' || state === 'mismatch' || state === 'relogin'"
                type="button"
                class="btn btn--small btn--primary"
                data-testid="mypage-relogin"
                :disabled="leaving"
                @click="relogin"
            >
              다시 로그인
            </button>
          </div>
        </section>

        <div v-else class="mp" data-testid="mypage-real">
          <!-- 격려 → 프로필/연속일 → 숫자 4칸 → 7일/부위 → 최근 5건. 숫자는 모두 서버(GET /me/stats)가 계산한 본인 기록이다. -->
          <p v-if="statsReady" class="cheer" role="status" data-testid="stats-cheer"><span aria-hidden="true">🔥</span> {{ cheer }}</p>

          <div class="duo" :class="{ 'duo--single': !statsReady }">
            <section class="card card--profile">
              <h2 class="name" data-testid="mypage-name">{{ realName }}</h2>
              <p class="sub" data-testid="mypage-sub">{{ realSub }}</p>
              <p class="sub" data-testid="mypage-id">{{ me.profile.userId }}</p>
              <div class="btnrow">
                <router-link class="btn btn--small" to="/settings" data-testid="to-settings">설정 보기</router-link>
                <router-link class="btn btn--small btn--primary" to="/learning" data-testid="to-learn">학습 시작</router-link>
              </div>
            </section>

            <section v-if="statsReady" class="card streak" data-testid="streak-card">
              <h3 class="card__title">연속 학습일</h3>
              <div v-if="cal.status === 'ready'" class="streak__main">
                <span class="streak__num" data-testid="streak-current">{{ cal.current }}</span>
                <span class="streak__cap">일 연속<br><span class="muted tone" data-testid="streak-longest">보관된 기록 기준 최장 {{ cal.longest }}일</span></span>
              </div>
              <p v-else class="muted pending tone" data-testid="calendar-pending">날짜 기준을 확인 중이에요. 확인되면 연속 학습일을 보여 드려요.</p>
              <p v-if="cal.status === 'ready'" class="today" data-testid="today-progress">오늘 {{ cal.todaySolved }}/{{ cal.dailyGoal }}문제 <span class="muted tone">(하루 {{ cal.dailyGoal }}문제를 풀면 연속 학습일이 늘어요)</span></p>
              <ul class="dots" aria-label="이번 주 학습 표시(월~일)" data-testid="week-days">
                <li v-for="d in cal.weekDays" :key="d.date" class="dot" :class="'dot--' + d.state" :aria-current="d.date === cal.today ? 'date' : null" data-testid="week-day">
                  <span aria-hidden="true">{{ weekday(d.date) }}</span>
                  <span class="dot__mark" aria-hidden="true">{{ weekMark(d.state) }}</span>
                  <span class="sr-only">{{ shortDate(d.date) }} {{ weekday(d.date) }}요일 {{ weekText(d.state) }}</span>
                </li>
              </ul>
            </section>

            <section v-else-if="statsState === 'loading'" class="card status" role="status" data-testid="stats-loading">
              <p>학습 통계를 불러오는 중이에요…</p>
            </section>

            <section v-else class="card status status--error" role="alert" data-testid="stats-error">
              <p>학습 통계를 불러오지 못했어요. 프로필과 최근 제출은 그대로 볼 수 있어요.</p>
              <div class="status__actions">
                <button type="button" class="btn btn--small" data-testid="stats-retry" :disabled="statsBusy" @click="loadStats">다시 시도</button>
              </div>
            </section>
          </div>

          <template v-if="statsReady">
            <div class="statgrid" data-testid="stat-cards">
              <div class="stat"><span class="stat__num" data-testid="stat-solved">{{ statData.summary.solved }}</span><span class="stat__cap">푼 문제</span></div>
              <div class="stat"><span class="stat__num" data-testid="stat-rate">{{ rate(statData.summary.ratePct) }}</span><span class="stat__cap">정답률</span></div>
              <div class="stat"><span class="stat__num" data-testid="stat-weekly">{{ cal.weekly === null ? '—' : cal.weekly }}</span><span class="stat__cap">이번 주 푼 문제</span></div>
              <div class="stat"><span class="stat__num" data-testid="stat-parts">{{ statData.summary.parts }}</span><span class="stat__cap">학습한 부위(4곳 중)</span></div>
            </div>

            <div class="duo duo--wide">
              <section class="card" data-testid="recent7-card">
                <h3 class="card__title">최근 7일 학습량</h3>
                <p v-if="cal.status !== 'ready'" class="muted pending tone" data-testid="recent7-pending">날짜 기준을 확인 중이에요.</p>
                <ol class="bars" data-testid="recent7">
                  <li v-for="(d, i) in cal.recent7" :key="d.date" class="bar" data-testid="recent7-item">
                    <span class="bar__num" aria-hidden="true">{{ d.count === null ? '—' : d.count }}</span>
                    <span class="bar__track" aria-hidden="true"><i class="bar__fill" :style="{ height: barPx[i] === null ? '0px' : barPx[i] + 'px' }"/></span>
                    <span class="bar__day" aria-hidden="true">{{ weekday(d.date) }}</span>
                    <span class="sr-only">{{ shortDate(d.date) }} {{ weekday(d.date) }}요일 {{ d.count === null ? '날짜 기준 확인 중' : d.count + '문제' }}</span>
                  </li>
                </ol>
                <p class="muted note tone">같은 문제를 다른 날 다시 풀면 날마다 한 번씩 세어서, 막대를 모두 더한 수는 이번 주 푼 문제 수와 다를 수 있어요.</p>
              </section>

              <section class="card" data-testid="regions-card">
                <h3 class="card__title">부위별 정답률</h3>
                <ul class="regions" data-testid="regions">
                  <li v-for="r in statData.regions" :key="r.code" class="region" data-testid="region-item">
                    <div class="region__head"><span>{{ r.label }}</span><span class="muted tone" data-testid="region-text">{{ regionLabel(r) }}</span></div>
                    <div v-if="r.ratePct !== null" class="meter" role="progressbar" :aria-label="r.label + ' 정답률'" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="r.ratePct"><i :style="{ width: r.ratePct + '%' }"/></div>
                    <div v-else class="meter" aria-hidden="true"/>
                  </li>
                </ul>
                <p v-if="statData.quality.unclassified > 0" class="muted note tone" data-testid="unclassified-note">부위를 확인할 수 없는 문제 {{ statData.quality.unclassified }}개는 위 막대에 넣지 않았어요(삭제되었거나 부위 정보가 없는 문제).</p>
              </section>
            </div>

            <p class="muted help tone" data-testid="stats-help">저장된 채점 기록 기준입니다. 같은 문제는 한 번만 세고, 정답률은 문제별 마지막 채점으로 계산하며 부분정답은 정답에 포함하지 않아요. 연속 학습일은 하루에 서로 다른 문제를 {{ cal.dailyGoal }}개 이상 푼 날만 세어요. 숫자는 실제 출석이나 공부 시간을 뜻하지 않아요.</p>
            <p v-if="qualityNote" class="muted help tone" data-testid="stats-quality">{{ qualityNote }}</p>
          </template>

          <section class="card">
            <h3 class="card__title">최근 저장된 문제 제출 <span class="muted">(최대 5건)</span></h3>
            <ul v-if="me.recent.length" class="list" data-testid="recent-list">
              <li v-for="r in me.recent" :key="r.reviewIdx" class="list__item" data-testid="recent-item">
                <span>{{ studyText(r) }} <span class="muted">· 문제 {{ r.studyIdx }}번 · 저장 시각 {{ savedAt(r.createdAt) }}</span></span>
                <span class="result" :class="resultClass(r.solutionLabel)">{{ r.solutionLabel }}</span>
              </li>
            </ul>
            <div v-else class="empty" data-testid="recent-empty">
              <p>아직 저장된 학습 기록이 없어요.</p>
              <router-link class="btn btn--primary btn--small" to="/learning">학습 시작하기</router-link>
            </div>
            <p class="muted note">가장 최근 5건만 보여요. 전체 기록은 <router-link to="/history">학습 기록</router-link>에서 볼 수 있어요.</p>
          </section>
        </div>
      </div>
    </div>
  </PageFrame>
</template>

<script>
import PageFrame from '../main/PageFrame.vue'
import {getUserSession} from '../login/authSession'
import {clearSessionIfOwner, isAccountSession, logout, onAccountChanged} from '../login/accountSession'
import {fetchMe, fetchStats, formatSavedAt} from './accountApi'
import {barHeights, encouragement, kstDateString, msUntilNextKstMidnight, rateText, regionText, shortDate, weekdayLabel} from './statsView'

const ERROR_TEXT = {
  login: '로그인 시간이 지났어요. 다시 로그인해 주세요.',
  relogin: '마이페이지를 보려면 한 번 다시 로그인해 주세요.',
  forbidden: '관리자 승인 후 사용할 수 있어요. 승인 여부는 관리자에게 문의해 주세요.',
  mismatch: '이 브라우저에 다른 계정이 로그인되어 화면을 지웠어요. 다시 로그인해 주세요.',
  retry: '내 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
}

export default {
  name: 'MyPage',
  components: {
    PageFrame
  },
  data() {
    return {
      state: 'loading',
      me: null,
      gen: 0,
      ctrl: null,
      leaving: false,
      statData: null,
      statsState: 'loading',
      statsGen: 0,
      statsCtrl: null,
      statsBusy: false,
      midTimer: null,
      checkedDay: '',
      unsubscribe: null
    }
  },
  computed: {
    errorText() {
      return ERROR_TEXT[this.state] || ''
    },
    realName() {
      return (this.me && this.me.profile.userName) || '이름 미등록'
    },
    realSub() {
      if (!this.me) return ''
      return `${this.me.profile.school || '학교 미등록'} · ${this.me.profile.major || '전공 미등록'}`
    },
    statsReady() {
      return this.statsState === 'ready' && !!this.statData
    },
    cal() {
      return this.statData ? this.statData.calendar : null
    },
    cheer() {
      return encouragement(this.statData)
    },
    barPx() {
      return this.cal ? barHeights(this.cal.recent7) : []
    },
    qualityNote() {
      if (!this.statData) return ''
      const q = this.statData.quality
      const parts = []
      if (q.ungraded > 0) parts.push(`채점되지 않은 제출 ${q.ungraded}건`)
      if (q.undated > 0) parts.push(`저장 시각이 없는 제출 ${q.undated}건(날짜 기준 숫자에서만)`)
      if (q.future) parts.push(`저장 시각이 지금보다 뒤인 제출 ${q.future}건(날짜 기준 숫자에서만)`)
      return parts.length ? `통계에서 제외한 기록: ${parts.join(', ')}.` : ''
    }
  },
  created() {
    this.load()
  },
  mounted() {
    document.addEventListener('visibilitychange', this.onVisible)
    // 다른 탭에서 계정 쿠키가 바뀌면 지금 계정을 다시 확인한다(다른 계정 정보면 mismatch 로 지운다)
    this.unsubscribe = onAccountChanged(() => this.load())
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.onVisible)
    if (this.unsubscribe) this.unsubscribe()
    this.invalidate()
  },
  methods: {
    resultClass(label) {
      if (label === '정답') return 'result--ok'
      if (label === '부분정답') return 'result--partial'
      if (label === '오답') return 'result--wrong'
      return 'result--none' // 결과 없음(미채점·알 수 없는 값)은 오답으로 보지 않는다
    },
    studyText(r) {
      if (!r.available) return '현재 열람할 수 없는 문제'
      return [r.partLabel, r.modalLabel].filter(Boolean).join(' ') || '문제 정보 없음'
    },
    savedAt(text) {
      return formatSavedAt(text) || '시각 없음'
    },
    weekday: weekdayLabel,
    shortDate,
    rate: rateText,
    regionLabel: regionText,
    weekMark(state) {
      return state === 'learned' ? '✓' : state === 'partial' ? '○' : state === 'future' ? '·' : state === 'unavailable' ? '?' : '–'
    },
    weekText(state) {
      return state === 'learned' ? '하루 목표 달성' : state === 'partial' ? '일부 풀었지만 목표 미달' : state === 'future' ? '아직 오지 않은 날' : state === 'unavailable' ? '날짜 기준 확인 중' : '기록 없음'
    },
    /** 이전 요청을 끊고 늦게 오는 응답을 버리게 한다(계정 전환·재시도·화면 이동). 프로필·통계 요청 모두. */
    invalidate() {
      this.gen += 1
      this.statsGen += 1
      if (this.ctrl) this.ctrl.abort()
      if (this.statsCtrl) this.statsCtrl.abort()
      this.ctrl = null
      this.statsCtrl = null
      this.statsBusy = false
      if (this.midTimer) clearTimeout(this.midTimer)
      this.midTimer = null
    },
    async load() {
      this.invalidate()
      const gen = this.gen
      this.me = null // 이전 계정의 정보를 먼저 비운다
      this.statData = null
      this.state = 'loading'
      this.statsState = 'loading'
      const owner = getUserSession()
      if (!isAccountSession(owner)) {
        this.state = 'relogin' // 쿠키 확인 전 방식의 로그인: 서버를 부르지 않고 다시 로그인을 안내한다
        return
      }
      const ctrl = new AbortController()
      this.ctrl = ctrl
      // 프로필과 통계는 서로 독립으로 동시에 요청한다. 통계가 실패해도 프로필·최근 5건은 보여 준다.
      const statsPromise = this.requestStats(ctrl.signal)
      try {
        const me = await fetchMe(ctrl.signal)
        if (gen !== this.gen) return
        // 화면 세션의 계정과 서버가 준 계정이 다르면(다른 탭 로그인 등) 그 정보를 그리지 않는다.
        const now = getUserSession()
        if (!now || now.idx !== me.profile.idx || now.user_id !== me.profile.userId) {
          this.state = 'mismatch'
          return
        }
        this.me = me
        this.state = 'ready'
      } catch (e) {
        if (gen !== this.gen) return
        this.me = null
        this.state = e && e.kind === 'login' ? 'login' : e && e.kind === 'forbidden' ? 'forbidden' : 'retry'
        return
      }
      await this.applyStats(statsPromise, gen, ctrl)
    },
    requestStats(signal) {
      return fetchStats(signal).then((value) => ({value}), (error) => ({error}))
    },
    /** 만료·미승인은 페이지 전체 오류, 그 밖의 실패·다른 계정 응답은 통계 영역만 오류. 맞는 계정일 때만 그린다. */
    acceptStats(result) {
      if (result.error) {
        const kind = result.error && result.error.kind
        if (kind === 'login' || kind === 'forbidden') {
          this.me = null
          this.statData = null
          this.state = kind
          return
        }
        this.statData = null
        this.statsState = 'error'
        return
      }
      const now = getUserSession()
      if (!now || !this.me || result.value.ownerIdx !== now.idx || result.value.ownerIdx !== this.me.profile.idx) {
        this.statData = null
        this.statsState = 'error' // 다른 계정의 통계는 그리지 않는다
        return
      }
      this.statData = result.value
      this.statsState = 'ready'
      this.scheduleMidnight()
    },
    async applyStats(promise, gen, ctrl) {
      const result = await promise
      if (gen !== this.gen || this.ctrl !== ctrl) return
      this.acceptStats(result)
    },
    /** 통계만 다시 받는다(다시 시도·자정 뒤 갱신). 프로필·최근 5건은 건드리지 않는다. */
    async loadStats() {
      if (this.statsBusy || this.state !== 'ready') return
      this.statsBusy = true
      this.statsGen += 1
      const statsGen = this.statsGen
      const ctrl = new AbortController()
      this.statsCtrl = ctrl
      if (!this.statData) this.statsState = 'loading'
      const result = await this.requestStats(ctrl.signal)
      if (statsGen !== this.statsGen) return
      this.statsBusy = false
      this.statsCtrl = null
      this.acceptStats(result)
    },
    /** 열어 둔 채 서울 자정이 지나면 서버 날짜를 한 번 다시 받는다(타이머 하나, 상시 polling 아님). */
    scheduleMidnight() {
      if (this.midTimer) clearTimeout(this.midTimer)
      this.midTimer = setTimeout(() => {
        this.midTimer = null
        if (document.visibilityState === 'visible') this.refreshIfDayChanged()
      }, msUntilNextKstMidnight(Date.now()))
    },
    /** 탭에 돌아오면 계정을 다시 확인한다(다른 탭 알림을 못 받았어도). 날짜가 바뀌었으면 통계도 새로 받는다. */
    onVisible() {
      if (document.visibilityState !== 'visible') return
      if (this.state === 'ready') return this.load()
      this.refreshIfDayChanged()
    },
    refreshIfDayChanged() {
      if (!this.statData || this.statsBusy) return
      const day = kstDateString(Date.now())
      if (day === this.statData.calendar.today || day === this.checkedDay) return
      this.checkedDay = day
      this.loadStats()
    },
    /** 만료·계정 불일치·이전 방식 로그인: 이 화면의 로그인을 끝내고 로그인 화면으로 보낸다. */
    async relogin() {
      if (this.leaving) return
      this.leaving = true
      const owner = getUserSession()
      if (this.state === 'mismatch' || !isAccountSession(owner)) {
        // 쿠키가 다른 계정이거나 원래 없다: 서버 로그인은 건드리지 않고 이 화면만 정리한다
        clearSessionIfOwner(owner)
      } else {
        await logout()
      }
      this.leaving = false
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.mypage {
  --ml-surface: #ffffff;
  --ml-surface-2: #f8fafc;
  --ml-surface-3: #eef2f7;
  --ml-border: #e2eaf1;
  --ml-border-strong: #d5e0e8;
  --ml-text: #1a2b4b;
  --ml-text-2: #5a6a7e;
  --ml-muted: #7a8798;
  --ml-accent-soft: #effaf8;
  --ml-accent-border: #bfe3df;
  --ml-accent-text: #2f6f68;
  --ml-error: #d64545;
  --ml-ok-bg: #dcfce7;
  --ml-ok-text: #166534;
  --ml-partial-bg: #ffe4e6;
  --ml-partial-text: #be123c;
  --ml-wrong-bg: #fee2e2;
  --ml-wrong-text: #991b1b;
  min-height: 100%;
  background: #eef3f7;
  color: var(--ml-text);
}

.mypage__inner {
  display: grid;
  gap: 16px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 32px 40px;
  box-sizing: border-box;
}

.mypage__head h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.03em;
}

.mypage__head p {
  margin: 8px 0 0;
  color: #7b8798;
  font-size: 14px;
}

.mp {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.card {
  padding: 22px 24px;
  background: var(--ml-surface);
  border: 1px solid var(--ml-border);
  border-radius: 14px;
  min-width: 0;
  box-sizing: border-box;
}

.card--profile {
  display: grid;
  gap: 8px;
  align-content: start;
}

.card__title {
  margin: 0 0 12px;
  font-size: 16px;
}

.name {
  margin: 0;
  font-size: 22px;
  overflow-wrap: anywhere;
}

.sub {
  margin: 0;
  color: var(--ml-muted);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border: 1px solid var(--ml-border);
  border-radius: 10px;
  background: var(--ml-surface-2);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.muted {
  color: var(--ml-muted);
  font-size: 12px;
}

.note {
  margin: 12px 0 0;
}

.muted.tone {
  color: var(--ml-text-2);
}

.result {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.result--ok { background: var(--ml-ok-bg); color: var(--ml-ok-text); }
.result--partial { background: var(--ml-partial-bg); color: var(--ml-partial-text); }
.result--wrong { background: var(--ml-wrong-bg); color: var(--ml-wrong-text); }
.result--none { background: var(--ml-surface-3); color: var(--ml-text-2); }

.empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 24px 12px;
  border: 1px dashed var(--ml-border-strong);
  border-radius: 12px;
  color: var(--ml-muted);
  font-size: 14px;
  text-align: center;
}

.empty p {
  margin: 0;
}

.status {
  display: grid;
  gap: 12px;
  font-size: 14px;
}

.status p {
  margin: 0;
}

.status--error {
  border-color: var(--ml-error);
}

.status__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid var(--ml-border-strong);
  border-radius: 999px;
  background: var(--ml-surface);
  color: var(--ml-text);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
}

.btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.btn--small {
  padding: 0 16px;
  font-size: 13px;
}

.btn--primary {
  border-color: #14b8a6;
  background: #14b8a6;
  color: #ffffff;
}

.cheer {
  margin: 0;
  padding: 14px 18px;
  border: 1px solid var(--ml-accent-border);
  border-radius: 12px;
  background: var(--ml-accent-soft);
  color: var(--ml-accent-text);
  font-size: 15px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.duo {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.duo--single {
  grid-template-columns: minmax(0, 1fr);
}

.duo--wide {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.btnrow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.streak__main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.streak__num {
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
  color: var(--ml-accent-text);
}

.streak__cap {
  font-size: 14px;
  font-weight: 600;
}

.pending {
  margin: 0 0 8px;
}

.dots {
  display: flex;
  gap: 6px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.dot {
  display: grid;
  justify-items: center;
  gap: 2px;
  flex: 1 1 0;
  min-width: 0;
  padding: 6px 0;
  border: 1px solid var(--ml-border);
  border-radius: 10px;
  background: var(--ml-surface-2);
  font-size: 12px;
  color: var(--ml-text-2);
}

.dot--learned {
  border-color: #2ec4b6;
  background: var(--ml-accent-soft);
  color: var(--ml-accent-text);
  font-weight: 700;
}

.dot--partial {
  border-style: dashed;
  border-color: #2ec4b6;
  color: var(--ml-accent-text);
}

.dot[aria-current='date'] {
  outline: 2px solid var(--ml-accent-text);
  outline-offset: 1px;
}

.dot__mark {
  font-size: 13px;
}

.today {
  margin: 10px 0 0;
  font-size: 14px;
  font-weight: 600;
}

.statgrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat {
  display: grid;
  gap: 4px;
  padding: 18px 8px;
  text-align: center;
  border: 1px solid var(--ml-border);
  border-radius: 14px;
  background: var(--ml-surface);
}

.stat__num {
  font-size: 30px;
  font-weight: 700;
  color: var(--ml-accent-text);
  overflow-wrap: anywhere;
}

.stat__cap {
  font-size: 12px;
  color: var(--ml-muted);
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  height: 150px;
}

.bar {
  display: grid;
  grid-template-rows: 16px 1fr 16px;
  justify-items: center;
  align-items: end;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  font-size: 12px;
  color: var(--ml-muted);
}

.bar__track {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 100%;
}

.bar__fill {
  display: block;
  width: 100%;
  background: #2ec4b6;
  border-radius: 6px 6px 0 0;
}

.regions {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.region__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 13px;
}

.meter {
  height: 10px;
  border-radius: 999px;
  background: var(--ml-surface-3);
  overflow: hidden;
}

.meter i {
  display: block;
  height: 100%;
  background: #2ec4b6;
}

.help {
  margin: 0;
  line-height: 1.5;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 860px) {
  .mypage__inner {
    padding: 20px 16px 32px;
  }

  .duo,
  .duo--wide {
    grid-template-columns: minmax(0, 1fr);
  }

  .statgrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
