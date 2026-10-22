<template>
  <PageFrame>
    <div class="history-page">
      <LearningSidebar active-id="history" @guide="onGuide"/>
      <div class="history-page__main">
        <div class="history-page__panel">
          <header class="history-head">
            <div>
              <h1>학습 기록</h1>
              <p>나의 학습 현황을 확인하고, 부족한 부분을 보완해보세요.</p>
            </div>
            <label class="history-range">
              <span class="history-range__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
                  <path d="M3 10h18M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="1.6"/>
                </svg>
              </span>
              <select v-model="range" aria-label="기간">
                <option v-for="item in ranges" :key="item.id" :value="item.id">{{ item.label }}</option>
              </select>
            </label>
          </header>

          <p v-if="loading" class="history-empty">불러오는 중</p>
          <p v-else-if="error" class="history-empty history-empty--error">{{ error }}</p>
          <template v-else>
            <section class="history-stats" aria-label="학습 현황">
              <article class="stat-card">
                <div class="stat-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path d="M4 19V5M4 19h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    <path d="M7 15l4-4 3 2 5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <p class="stat-card__label">진도</p>
                <p class="stat-card__value">{{ summary.progress }}<span>%</span></p>
                <div class="stat-card__bar"><span :style="{ width: summary.progress + '%' }"></span></div>
                <p class="stat-card__caption">총 {{ summary.solved }} / {{ summary.total }} 케이스 완료</p>
              </article>
              <article class="stat-card">
                <div class="stat-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
                    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/>
                    <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
                  </svg>
                </div>
                <p class="stat-card__label">정답률</p>
                <p class="stat-card__value">{{ summary.accuracy }}<span>%</span></p>
                <div class="stat-card__bar"><span :style="{ width: summary.accuracy + '%' }"></span></div>
                <p class="stat-card__caption">총 {{ summary.correctStudies }} / {{ summary.solved }} 케이스 정답</p>
              </article>
              <article class="stat-card">
                <div class="stat-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                </div>
                <p class="stat-card__label">ROI 정확도</p>
                <p class="stat-card__value">{{ summary.roiAccuracy }}<span>%</span></p>
                <div class="stat-card__bar"><span :style="{ width: summary.roiAccuracy + '%' }"></span></div>
                <p class="stat-card__caption">정답 {{ summary.correctSubmissions }} / 제출 {{ summary.submissions }}</p>
              </article>
            </section>

            <section class="history-activity">
              <header class="history-activity__head">
                <h2>최근 학습 활동</h2>
                <button
                    v-if="canExpand"
                    type="button"
                    class="history-link"
                    @click="showAll"
                >
                  전체 학습 기록 보기
                  <span aria-hidden="true">›</span>
                </button>
              </header>

              <p v-if="!filteredItems.length" class="history-empty">이 기간에 학습 기록이 없어요.</p>
              <div v-else class="history-table-wrap">
                <table class="history-table">
                  <thead>
                  <tr>
                    <th>학습 일시</th>
                    <th>케이스</th>
                    <th>모드</th>
                    <th>소견</th>
                    <th>결과</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="item in visibleItems" :key="item.idx">
                    <td class="history-table__date">{{ item.dateLabel }}</td>
                    <td>
                      <button type="button" class="case-cell" @click="openCase(item)">
                        <span class="case-cell__thumb">
                          <img v-if="item.image" :src="item.image" alt=""/>
                        </span>
                        <span class="case-cell__text">
                          <strong>{{ item.caseLabel }}</strong>
                          <span>{{ item.partLabel }} {{ item.modalLabel }}</span>
                        </span>
                      </button>
                    </td>
                    <td><span class="mode-pill">문제 풀이</span></td>
                    <td class="history-table__finding">{{ item.disease }}</td>
                    <td>
                      <span class="result-badge" :class="'is-' + item.solution">{{ item.solutionLabel }}</span>
                    </td>
                  </tr>
                  </tbody>
                </table>
                <button v-if="canExpand" type="button" class="history-more" @click="showMore">
                  더보기
                  <span aria-hidden="true">⌄</span>
                </button>
              </div>
            </section>
          </template>
        </div>
      </div>
    </div>
  </PageFrame>
</template>

<script>
import PageFrame from '../main/PageFrame.vue'
import LearningSidebar from '../learning/LearningSidebar.vue'
import {getUserSession} from '../login/authSession'
import {showMessage} from '../../notify'
import {
    HISTORY_RANGES,
    PREVIEW_SIZE,
    fetchLearningHistory,
    filterByRange,
    summarizeHistory
} from './history'

export default {
  name: 'LearningHistoryPage',
  components: {
    PageFrame,
    LearningSidebar
  },
  data() {
    return {
      ranges: HISTORY_RANGES,
      range: 'all',
      items: [],
      totalStudies: 0,
      shown: PREVIEW_SIZE,
      loading: false,
      error: ''
    }
  },
  computed: {
    filteredItems() {
      return filterByRange(this.items, this.range)
    },
    summary() {
      return summarizeHistory(this.filteredItems, this.totalStudies)
    },
    visibleItems() {
      return this.filteredItems.slice(0, this.shown)
    },
    canExpand() {
      return this.shown < this.filteredItems.length
    }
  },
  watch: {
    range() {
      this.shown = PREVIEW_SIZE
    }
  },
  mounted() {
    this.loadHistory()
  },
  methods: {
    async loadHistory() {
      const user = getUserSession()
      const userIdx = user && Number(user.idx)
      if (!Number.isFinite(userIdx) || userIdx < 1) return
      this.loading = true
      this.error = ''
      try {
        const result = await fetchLearningHistory(userIdx)
        this.items = result.items
        this.totalStudies = result.totalStudies
      } catch (e) {
        this.items = []
        this.totalStudies = 0
        this.error = e.message || '학습 기록을 불러오지 못했습니다.'
      } finally {
        this.loading = false
      }
    },
    showMore() {
      this.shown += PREVIEW_SIZE
    },
    showAll() {
      this.shown = this.filteredItems.length
    },
    openCase(item) {
      const region = item.region || 'brain'
      const type = item.type || 'CT'
      const query = {region, type}
      if (item.studyIdx != null) query.idx = String(item.studyIdx)
      if (item.idx != null) query.review = String(item.idx)
      this.$router.push({path: '/medical/review', query})
    },
    onGuide() {
      showMessage('사용 가이드 화면은 아직 연결 전입니다.')
    }
  }
}
</script>

<style scoped>
.history-page {
  display: flex;
  min-height: 100%;
  background: #eef3f7;
  color: #1a2b4b;
}

.history-page__main {
  flex: 1;
  min-width: 0;
  padding: 28px 32px 40px;
  box-sizing: border-box;
}

.history-page__panel {
  padding: 28px 28px 32px;
  background: #fff;
  border: 1px solid #e2eaf1;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(26, 43, 75, 0.04);
  box-sizing: border-box;
}

.history-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.history-head h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.03em;
}

.history-head p {
  margin: 8px 0 0;
  color: #7b8798;
  font-size: 14px;
}

.history-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 1px solid #e2eaf1;
  border-radius: 10px;
  background: #fff;
  color: #31445f;
}

.history-range select {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
}

.stat-card {
  padding: 22px 22px 18px;
  border: 1px solid #e6eef5;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(26, 43, 75, 0.03);
}

.stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e7f7f5;
  color: #14b8a6;
}

.stat-card__label {
  margin: 16px 0 0;
  color: #607089;
  font-size: 14px;
}

.stat-card__value {
  margin: 6px 0 14px;
  color: #149c94;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}

.stat-card__value span {
  margin-left: 2px;
  font-size: 22px;
}

.stat-card__bar {
  height: 6px;
  border-radius: 999px;
  background: #e7eef3;
  overflow: hidden;
}

.stat-card__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #14b8a6;
}

.stat-card__caption {
  margin: 10px 0 0;
  color: #8b97a8;
  font-size: 13px;
}

.history-activity {
  margin-top: 28px;
  padding: 8px 4px 0;
}

.history-activity__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.history-activity__head h2 {
  margin: 0;
  font-size: 18px;
}

.history-link,
.history-more {
  border: 0;
  background: transparent;
  color: #607089;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.history-link:hover,
.history-more:hover {
  color: #149c94;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  padding: 14px 10px;
  border-bottom: 1px solid #eef2f6;
  color: #8b97a8;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
}

.history-table td {
  padding: 16px 10px;
  border-bottom: 1px solid #f3f6f9;
  vertical-align: middle;
  font-size: 14px;
}

.history-table__date {
  color: #607089;
  white-space: nowrap;
}

.history-table__finding {
  color: #31445f;
}

.case-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.case-cell__thumb {
  display: flex;
  width: 52px;
  height: 40px;
  overflow: hidden;
  border-radius: 8px;
  background: #111;
  flex: 0 0 auto;
}

.case-cell__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.case-cell__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.case-cell__text strong {
  color: #1a2b4b;
  font-size: 14px;
}

.case-cell__text span {
  color: #8b97a8;
  font-size: 12px;
}

.mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f4f7fb;
  color: #607089;
  font-size: 13px;
  white-space: nowrap;
}

.result-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.result-badge.is-C {
  background: #e7f7f5;
  color: #0f9b8e;
}

.result-badge.is-H {
  background: #fff1df;
  color: #d97706;
}

.result-badge.is-W {
  background: #fde8ee;
  color: #e11d48;
}

.history-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  margin-top: 8px;
  padding: 12px;
}

.history-empty {
  margin: 28px 0;
  color: #7b8798;
  text-align: center;
}

.history-empty--error {
  color: #e11d48;
}

@media (max-width: 980px) {
  .history-stats {
    grid-template-columns: 1fr;
  }

  .history-head {
    flex-direction: column;
  }
}
</style>
