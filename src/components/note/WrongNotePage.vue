<template>
  <PageFrame>
    <div class="note-page">
      <LearningSidebar active-id="note" @guide="onGuide"/>
      <div class="note-page__main">
        <div class="note-page__panel">
          <header class="note-head">
            <h1>오답노트</h1>
            <p>틀린 문제와 부분 정답 문제를 다시 확인하고 복습해보세요.</p>
          </header>

          <div class="note-toolbar">
            <div class="note-filters" role="tablist" aria-label="채점 결과">
              <button
                  v-for="item in filters"
                  :key="item.id"
                  type="button"
                  class="note-filter"
                  :class="{ 'is-active': filter === item.id }"
                  @click="setFilter(item.id)"
              >
                {{ item.label }}
              </button>
            </div>
            <label class="note-sort">
              <span class="note-sort__label">정렬</span>
              <select v-model="sort" @change="page = 1">
                <option v-for="item in sorts" :key="item.id" :value="item.id">{{ item.label }}</option>
              </select>
            </label>
          </div>

          <p v-if="loading" class="note-empty">불러오는 중</p>
          <p v-else-if="error" class="note-empty note-empty--error">{{ error }}</p>
          <p v-else-if="!visibleNotes.length" class="note-empty">틀린 문제가 아직 없어요.</p>
          <ul v-else class="note-grid">
            <li v-for="item in pagedNotes" :key="item.idx" class="note-card">
              <div class="note-card__image">
                <img v-if="item.image" :src="item.image" alt=""/>
                <span class="note-card__orient">R</span>
              </div>
              <div class="note-card__body">
                <div class="note-card__head">
                  <h2>{{ item.disease }}</h2>
                  <span class="note-badge" :class="'is-' + item.solution">{{ item.solutionLabel }}</span>
                </div>
                <p class="note-card__meta">{{ item.partLabel }} {{ item.modalLabel }}</p>
                <p class="note-card__date">{{ item.dateLabel }}</p>
                <button type="button" class="note-card__retry" @click="onRetry(item)">다시 풀기</button>
              </div>
            </li>
          </ul>

          <nav v-if="showPager" class="note-pager" aria-label="페이지">
            <button type="button" class="note-pager__arrow" :disabled="page <= 1" @click="page = page - 1">‹</button>
            <button
                v-for="number in pages"
                :key="number"
                type="button"
                class="note-pager__page"
                :class="{ 'is-active': number === page }"
                @click="page = number"
            >
              {{ number }}
            </button>
            <button type="button" class="note-pager__arrow" :disabled="page >= pages.length" @click="page = page + 1">
              ›
            </button>
          </nav>
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
  NOTE_FILTERS,
  NOTE_SORTS,
  fetchWrongNotes,
  filterNotes,
  pageCount,
  pageItems,
  sortNotes
} from './wrongNote'

export default {
  name: 'WrongNotePage',
  components: {
    PageFrame,
    LearningSidebar
  },
  data() {
    return {
      filters: NOTE_FILTERS,
      sorts: NOTE_SORTS,
      notes: [],
      filter: 'all',
      sort: 'newest',
      page: 1,
      loading: false,
      error: ''
    }
  },
  computed: {
    visibleNotes() {
      return sortNotes(filterNotes(this.notes, this.filter), this.sort)
    },
    pages() {
      const count = pageCount(this.visibleNotes.length)
      return Array.from({length: count}, (_, index) => index + 1)
    },
    pagedNotes() {
      return pageItems(this.visibleNotes, this.page)
    },
    showPager() {
      return !this.loading && !this.error && this.visibleNotes.length > 0
    }
  },
  watch: {
    pages(next) {
      if (this.page > next.length) this.page = next.length
    }
  },
  mounted() {
    this.loadNotes()
  },
  methods: {
    setFilter(id) {
      this.filter = id
      this.page = 1
    },
    async loadNotes() {
      const user = getUserSession()
      const userIdx = user && Number(user.idx)
      if (!Number.isFinite(userIdx) || userIdx < 1) return
      this.loading = true
      this.error = ''
      try {
        this.notes = await fetchWrongNotes(userIdx)
      } catch (e) {
        this.notes = []
        this.error = e.message || '오답노트를 불러오지 못했습니다.'
      } finally {
        this.loading = false
      }
    },
    onGuide() {
      showMessage('사용 가이드 화면은 아직 연결 전입니다.')
    },
    onRetry(item) {
      const region = item.region || 'brain'
      const type = item.type || 'CT'
      const query = {region, type}
      if (item.studyIdx != null) query.idx = String(item.studyIdx)
      this.$router.push({
        path: '/medical',
        query
      })
    }
  }
}
</script>

<style scoped>
.note-page {
  display: flex;
  min-height: 100%;
  background: #eef3f7;
  color: #1a2b4b;
}

.note-page__main {
  flex: 1;
  min-width: 0;
  padding: 28px 32px 40px;
  box-sizing: border-box;
}

.note-page__panel {
  padding: 28px 28px 32px;
  background: #fff;
  border: 1px solid #e2eaf1;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(26, 43, 75, 0.04);
  box-sizing: border-box;
  height: 100%;
}

.note-head h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.03em;
}

.note-head p {
  margin: 8px 0 0;
  color: #7b8798;
  font-size: 14px;
}

.note-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 22px 0 18px;
}

.note-filters {
  display: flex;
  gap: 8px;
}

.note-filter {
  min-width: 72px;
  padding: 8px 16px;
  border: 1px solid #d7e2ea;
  border-radius: 999px;
  background: #fff;
  color: #3d4d63;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.note-filter.is-active {
  border-color: #14b8a6;
  background: #14b8a6;
  color: #fff;
}

.note-sort {
  display: inline-flex;
  align-items: center;
}

.note-sort__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.note-sort select {
  min-width: 108px;
  padding: 8px 32px 8px 14px;
  border: 1px solid #d7e2ea;
  border-radius: 10px;
  background: #fff;
  color: #3d4d63;
  font-size: 14px;
  font-weight: 600;
}

.note-empty {
  margin: 48px 0;
  text-align: center;
  color: #7b8798;
  font-size: 14px;
}

.note-empty--error {
  color: #b91c1c;
}

.note-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 320px));
  justify-content: start;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.note-card {
  border: 1px solid #e6edf3;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
}

.note-card__image {
  position: relative;
  height: 148px;
  background: #0f172a;
}

.note-card__image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.note-card__orient {
  position: absolute;
  top: 8px;
  left: 10px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.note-card__body {
  padding: 12px 14px 14px;
}

.note-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.note-card__head h2 {
  margin: 0;
  font-size: 16px;
  letter-spacing: -0.02em;
}

.note-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.note-badge.is-W {
  background: #fde8ee;
  color: #e11d48;
}

.note-badge.is-H {
  background: #fff1df;
  color: #d97706;
}

.note-card__meta,
.note-card__date {
  margin: 6px 0 0;
  color: #8b97a8;
  font-size: 12px;
}

.note-card__retry {
  width: 100%;
  margin-top: 12px;
  padding: 8px 10px;
  border: 1px solid #99f6e4;
  border-radius: 10px;
  background: #fff;
  color: #0f766e;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.note-card__retry:hover {
  background: #f0fdfa;
}

.note-pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 28px;
}

.note-pager__arrow,
.note-pager__page {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
}

.note-pager__page.is-active {
  background: #14b8a6;
  color: #fff;
  font-weight: 700;
}

.note-pager__arrow:disabled {
  opacity: 0.35;
  cursor: default;
}

@media (max-width: 800px) {
  .note-page {
    flex-direction: column;
  }

  .note-page__main {
    padding: 20px 16px 32px;
  }

  .note-page__panel {
    padding: 20px 16px;
  }

  .note-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .note-grid {
    grid-template-columns: 1fr;
  }
}
</style>
