<template>
  <PageFrame>
    <div class="caselist-page">
      <LearningSidebar active-id="setup" @guide="onGuide"/>
      <div class="caselist-page__main">
        <div class="caselist-page__panel">
          <header class="case-head">
            <div>
              <h1>{{ regionLabel }} · {{ typeLabel }} 케이스</h1>
              <p v-if="loaded">전체 {{ count }}개 중 {{ solvedCount }}개를 풀었어요. 풀고 싶은 케이스를 골라 주세요.</p>
              <p v-else>케이스를 고르면 문제 풀이 화면으로 이동해요.</p>
            </div>
            <router-link class="case-head__back" to="/learning">부위·영상 다시 고르기</router-link>
          </header>

          <div class="case-toolbar">
            <div class="case-filters" role="tablist" aria-label="보기">
              <button
                  v-for="item in filters"
                  :key="item.id"
                  type="button"
                  class="case-filter"
                  :class="{ 'is-active': filter === item.id }"
                  @click="filter = item.id"
              >
                {{ item.label }}
              </button>
            </div>
            <button type="button" class="case-next" :disabled="!hasUnsolved" @click="onSolveNext">
              안 푼 문제 바로 풀기
            </button>
          </div>

          <p v-if="loading" class="case-empty">불러오는 중</p>
          <p v-else-if="error" class="case-empty case-empty--error">{{ error }}</p>
          <p v-else-if="!count" class="case-empty">아직 등록된 케이스가 없어요.</p>
          <p v-else-if="!shown.length" class="case-empty">이 조건에 맞는 케이스가 없어요.</p>
          <ul v-else class="case-grid">
            <li v-for="item in shown" :key="item.idx">
              <router-link class="case-card" :to="routeOf(item)">
                <span class="case-card__no">CASE {{ pad(item.number) }}</span>
                <span class="case-badge" :class="'is-' + badge(item)">{{ item.last_solution_label || '안 푼 문제' }}</span>
                <span class="case-card__date">{{ dateText(item) }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </PageFrame>
</template>

<script>
import PageFrame from '../main/PageFrame.vue'
import LearningSidebar from './LearningSidebar.vue'
import {API_BASE} from '../../apiBase'
import {getUserSession} from '../login/authSession'
import {showMessage} from '../../notify'
import {MODALITIES, REGIONS} from './learningOptions'
import {
  CASE_FILTERS,
  badgeKind,
  filterCases,
  formatSolvedDate,
  padCase,
  solveRoute
} from './caseList'

const PROBLEM_LIST_API = `${API_BASE}/learning/problems`

export default {
  name: 'CaseListPage',
  components: {PageFrame, LearningSidebar},
  data() {
    return {
      items: [],
      count: 0,
      solvedCount: 0,
      loaded: false,
      loading: false,
      error: '',
      filter: 'all',
      filters: CASE_FILTERS
    }
  },
  computed: {
    region() {
      return this.$route.query.region || ''
    },
    type() {
      return this.$route.query.type || ''
    },
    regionLabel() {
      const found = REGIONS.find((item) => item.id === this.region)
      return found ? found.label : this.region
    },
    typeLabel() {
      const found = MODALITIES.find((item) => item.id === this.type)
      return found ? found.label : this.type
    },
    shown() {
      return filterCases(this.items, this.filter)
    },
    hasUnsolved() {
      return this.items.some((item) => !item.solved)
    }
  },
  watch: {
    '$route.query'() {
      this.fetchCases()
    }
  },
  mounted() {
    this.fetchCases()
  },
  methods: {
    pad: padCase,
    badge: badgeKind,
    onGuide() {
      showMessage('사용 가이드 화면은 아직 연결 전입니다.')
    },
    dateText(item) {
      return item.last_solved_at ? `최근 풀이 ${formatSolvedDate(item.last_solved_at)}` : '아직 풀지 않음'
    },
    routeOf(item) {
      return solveRoute(this.region, this.type, item.idx)
    },
    onSolveNext() {
      // idx 없이 열면 풀이 화면이 안 푼 첫 문제를 고른다
      this.$router.push(solveRoute(this.region, this.type))
    },
    async fetchCases() {
      if (!this.region || !this.type) {
        this.$router.replace('/learning')
        return
      }
      const user = getUserSession()
      this.loading = true
      this.error = ''
      try {
        // 서버 기본값(200)보다 문제가 많을 수 있어 최대치(500)까지 요청한다
        const params = new URLSearchParams({st_part: this.region, st_modal: this.type, limit: '500'})
        if (user && user.idx != null) params.set('user_idx', String(user.idx))
        const res = await fetch(`${PROBLEM_LIST_API}?${params}`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const detail = typeof data.detail === 'string' ? data.detail : `API 오류 (${res.status})`
          throw new Error(detail)
        }
        this.items = Array.isArray(data.items) ? data.items : []
        this.count = data.count != null ? data.count : this.items.length
        this.solvedCount = data.solved_count != null ? data.solved_count : this.items.filter((item) => item.solved).length
        this.loaded = true
      } catch (e) {
        this.items = []
        this.count = 0
        this.error = e.message || '케이스 목록을 불러오지 못했습니다.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.caselist-page {
  display: flex;
  min-height: 100%;
  background: #eef3f7;
  color: #1a2b4b;
}

.caselist-page__main {
  flex: 1;
  min-width: 0;
  padding: 28px 32px 40px;
  box-sizing: border-box;
}

.caselist-page__panel {
  padding: 28px 28px 32px;
  background: #fff;
  border: 1px solid #e2eaf1;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(26, 43, 75, 0.04);
  box-sizing: border-box;
  min-height: 100%;
}

.case-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.case-head h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.03em;
}

.case-head p {
  margin: 8px 0 0;
  color: #7b8798;
  font-size: 14px;
}

.case-head__back {
  font-size: 13px;
  font-weight: 600;
  color: #0f766e;
  text-decoration: none;
}

.case-head__back:hover {
  text-decoration: underline;
}

.case-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: 22px 0 18px;
}

.case-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.case-filter {
  padding: 8px 16px;
  border: 1px solid #d7e0e8;
  border-radius: 999px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #5b6b7e;
  cursor: pointer;
}

.case-filter.is-active {
  border-color: #14b8a6;
  background: #14b8a6;
  color: #fff;
}

.case-next {
  padding: 9px 16px;
  border: 0;
  border-radius: 8px;
  background: #14b8a6;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
}

.case-next:disabled {
  background: #cbd5e1;
  cursor: default;
}

.case-empty {
  margin: 48px 0;
  text-align: center;
  color: #7b8798;
  font-size: 14px;
}

.case-empty--error {
  color: #b91c1c;
}

.case-grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.case-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 14px;
  border: 1px solid #e2eaf1;
  border-radius: 12px;
  background: #fff;
  text-decoration: none;
  color: #1a2b4b;
}

.case-card:hover {
  border-color: #14b8a6;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.12);
}

.case-card__no {
  font-size: 15px;
  font-weight: 700;
}

.case-card__date {
  font-size: 12px;
  color: #7b8798;
}

.case-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.case-badge.is-new {
  background: #e0f2fe;
  color: #0369a1;
}

.case-badge.is-bad {
  background: #fee2e2;
  color: #b91c1c;
}

.case-badge.is-half {
  background: #fef3c7;
  color: #92400e;
}

.case-badge.is-good {
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 860px) {
  .caselist-page__main {
    padding: 16px;
  }
}
</style>
