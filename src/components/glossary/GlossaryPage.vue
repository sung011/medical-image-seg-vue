<template>
  <PageFrame fill>
    <div class="glossary-page">
      <div class="switcher" role="tablist" aria-label="사전 화면">
        <button type="button" role="tab" :aria-selected="view === 'columns'" :class="{ active: view === 'columns' }"
                @click="setView('columns')">세 칸
        </button>
        <button type="button" role="tab" :aria-selected="view === 'reading'" :class="{ active: view === 'reading' }"
                @click="setView('reading')">목록과 본문
        </button>
        <button type="button" role="tab" :aria-selected="view === 'cards'" :class="{ active: view === 'cards' }"
                @click="setView('cards')">카드
        </button>
      </div>

      <p v-if="loading" class="status">용어를 불러오는 중…</p>
      <p v-else-if="error" class="status error">{{ error }}</p>

      <div v-else-if="view === 'columns'" class="layout columns">
        <aside class="panel filters">
          <p class="filter-label">부위</p>
          <div class="pills pills--stack">
            <button type="button" :class="{ active: region === 'all' }" @click="region = 'all'">전체</button>
            <button v-for="item in regions" :key="item.id" type="button" :class="{ active: region === item.id }"
                    @click="region = item.id">{{ item.label }}
            </button>
          </div>
        </aside>

        <section class="panel list-panel">
          <h1>의학용어 사전</h1>
          <p class="meta">{{ metaLabel }}</p>
          <input v-model="query" type="search" class="search" placeholder="증상 또는 용어"/>
          <div class="pills">
            <button type="button" :class="{ active: kind === 'all' }" @click="kind = 'all'">전체</button>
            <button type="button" :class="{ active: kind === 'term' }" @click="kind = 'term'">용어</button>
            <button type="button" :class="{ active: kind === 'symptom' }" @click="kind = 'symptom'">증상</button>
          </div>
          <p v-if="!filtered.length" class="empty">검색 결과가 없습니다.</p>
          <ul v-else class="term-list">
            <li v-for="term in shown" :key="term.id">
              <button type="button" class="term-card" :class="{ active: selected && selected.id === term.id }"
                      @click="selectTerm(term)">
                <strong>{{ term.ko }} <span v-if="term.en">({{ term.en }})</span></strong>
                <p>{{ term.desc }}</p>
                <p v-if="term.descEn" class="desc-en">{{ term.descEn }}</p>
                <span class="chips">
                  <em v-for="tag in term.categories" :key="tag">{{ tag }}</em>
                </span>
              </button>
            </li>
          </ul>
          <button v-if="filtered.length > shown.length" type="button" class="more" @click="limit += 48">더 보기
            {{ shown.length }} / {{ filtered.length }}
          </button>
        </section>

        <aside v-if="selected" class="panel detail">
          <h2>{{ selected.ko }} <span v-if="selected.en">({{ selected.en }})</span></h2>
          <span class="chips">
            <em v-for="tag in selected.categories" :key="tag">{{ tag }}</em>
          </span>
          <p class="body">{{ selected.desc || '설명이 없습니다.' }}</p>
          <p v-if="selected.descEn" class="body desc-en">{{ selected.descEn }}</p>
          <p v-if="related.length" class="filter-label">관련 용어</p>
          <div v-if="related.length" class="chips chips--gap">
            <button v-for="item in related" :key="item.id" type="button" @click="selectTerm(item)">{{
                item.ko || item.en
              }}
            </button>
          </div>
        </aside>
      </div>

      <div v-else-if="view === 'reading'" class="layout reading">
        <section class="panel list-panel">
          <h1>의학용어 사전</h1>
          <input v-model="query" type="search" class="search" placeholder="증상 또는 용어"/>
          <div class="pills">
            <button type="button" :class="{ active: kind === 'all' }" @click="kind = 'all'">전체</button>
            <button type="button" :class="{ active: kind === 'term' }" @click="kind = 'term'">용어</button>
            <button type="button" :class="{ active: kind === 'symptom' }" @click="kind = 'symptom'">증상</button>
          </div>
          <div class="pills">
            <button type="button" :class="{ active: region === 'all' }" @click="region = 'all'">전체</button>
            <button v-for="item in regions" :key="item.id" type="button" :class="{ active: region === item.id }"
                    @click="region = item.id">{{ item.label }}
            </button>
          </div>
          <p v-if="!filtered.length" class="empty">검색 결과가 없습니다.</p>
          <ul v-else class="rows">
            <li v-for="term in shown" :key="term.id">
              <button type="button" class="row" :class="{ active: selected && selected.id === term.id }"
                      @click="selectTerm(term)">
                <strong>{{ term.ko }} <span v-if="term.en">({{ term.en }})</span></strong>
              </button>
            </li>
          </ul>
          <button v-if="filtered.length > shown.length" type="button" class="more" @click="limit += 48">더 보기
            {{ shown.length }} / {{ filtered.length }}
          </button>
        </section>

        <article v-if="selected" class="panel detail reading-body">
          <p class="meta">{{ detailMeta }}</p>
          <h2>{{ selected.ko }} <span v-if="selected.en">({{ selected.en }})</span></h2>
          <p v-if="selected.categories[0]" class="ko-line">
            <em>{{ selected.categories[0] }}</em>
          </p>
          <p class="body">{{ selected.desc || '설명이 없습니다.' }}</p>
          <p v-if="selected.descEn" class="body desc-en">{{ selected.descEn }}</p>
          <p v-if="related.length" class="filter-label">관련 용어</p>
          <div v-if="related.length" class="chips chips--gap">
            <button v-for="item in related" :key="item.id" type="button" @click="selectTerm(item)">{{
                item.ko || item.en
              }}
            </button>
          </div>
        </article>
        <p v-else class="panel empty">검색 결과가 없습니다.</p>
      </div>

      <div v-else class="layout cards">
        <div class="cards-body">
          <aside class="panel search-side">
            <p class="filter-label">검색</p>
            <input v-model="query" type="search" class="search" placeholder="증상 또는 용어"/>
            <div class="pills pills--stack">
              <button type="button" :class="{ active: kind === 'all' }" @click="kind = 'all'">전체</button>
              <button type="button" :class="{ active: kind === 'term' }" @click="kind = 'term'">용어</button>
              <button type="button" :class="{ active: kind === 'symptom' }" @click="kind = 'symptom'">증상</button>
            </div>
            <p class="hint">검색어와 부위는 서버에서 찾습니다. 용어는 이름만, 증상은 설명만 남깁니다.</p>
          </aside>
          <div class="cards-main">
            <div class="panel toolbar">
              <h1>의학용어 사전 <span>{{ filtered.length }}개</span></h1>
              <div class="pills">
                <button type="button" :class="{ active: region === 'all' }" @click="region = 'all'">전체</button>
                <button v-for="item in regions" :key="item.id" type="button" :class="{ active: region === item.id }"
                        @click="region = item.id">{{ item.label }}
                </button>
              </div>
            </div>
            <p v-if="!filtered.length" class="empty">검색 결과가 없습니다.</p>
            <ul v-else class="grid">
              <li v-for="term in shown" :key="term.id">
                <button type="button" class="grid-card" :class="{ active: sheet && sheet.id === term.id }"
                        @click="selectTerm(term)">
                  <strong>{{ term.ko }} <span v-if="term.en">({{ term.en }})</span></strong>
                  <p>{{ term.desc }}</p>
                  <p v-if="term.descEn" class="desc-en">{{ term.descEn }}</p>
                  <em v-if="term.categories[0]">{{ term.categories[0] }}</em>
                </button>
              </li>
              <li v-if="filtered.length > shown.length" class="grid-more">
                <button type="button" class="more" @click="limit += 48">더 보기 {{ shown.length }} / {{
                    filtered.length
                  }}
                </button>
              </li>
            </ul>
            <aside v-if="sheet" class="sheet">
              <button type="button" class="sheet-close" aria-label="설명 닫기" @click="sheetId = null">×</button>
              <h2>{{ sheet.ko }} <span v-if="sheet.en">({{ sheet.en }})</span></h2>
              <p class="body">{{ sheet.desc || '설명이 없습니다.' }}</p>
              <p v-if="sheet.descEn" class="body desc-en">{{ sheet.descEn }}</p>
              <div v-if="sheetRelated.length" class="chips chips--gap">
                <button v-for="item in sheetRelated" :key="item.id" type="button" @click="selectTerm(item)">
                  {{ item.ko || item.en }}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  </PageFrame>
</template>

<script>
import PageFrame from '../main/PageFrame.vue'
import {REGIONS} from '../learning/learningOptions'
import {searchGlossary, filterGlossary, relatedTerms, studyTarget} from './glossaryModel'

const REGION_LABELS = REGIONS.reduce((map, item) => {
  map[item.id] = item.label
  return map
}, {})

export default {
  name: 'GlossaryPage',
  components: {PageFrame},
  data() {
    return {
      terms: [],
      loading: false,
      error: '',
      query: '',
      kind: 'all',
      region: 'all',
      selectedId: null,
      sheetId: null,
      limit: 48,
      regions: REGIONS,
      searchTimer: null,
      requestId: 0,
      loaded: false
    }
  },
  computed: {
    view() {
      const value = this.$route.query.view
      if (value === 'reading' || value === 'cards') return value
      return 'columns'
    },
    filtered() {
      return filterGlossary(this.terms, {
        region: 'all',
        type: 'all',
        query: this.kind === 'all' ? '' : this.query,
        kind: this.kind
      })
    },
    shown() {
      return this.filtered.slice(0, this.limit)
    },
    selected() {
      return this.filtered.find((term) => term.id === this.selectedId) || this.filtered[0] || null
    },
    related() {
      return relatedTerms(this.filtered, this.selected)
    },
    target() {
      return studyTarget(this.selected, this.region, 'all')
    },
    sheet() {
      return this.filtered.find((term) => term.id === this.sheetId) || null
    },
    sheetRelated() {
      return relatedTerms(this.filtered, this.sheet)
    },
    metaLabel() {
      const region = this.region === 'all' ? '전체' : (REGION_LABELS[this.region] || this.region)
      return `${region} · ${this.filtered.length}개`
    },
    detailMeta() {
      const source = this.target
      if (!source) return ''
      return REGION_LABELS[source.region] || source.region
    }
  },
  watch: {
    query() {
      this.limit = 48
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => this.load(), 300)
    },
    kind() {
      this.limit = 48
    },
    region() {
      this.limit = 48
      clearTimeout(this.searchTimer)
      this.load()
    },
    filtered() {
      if (this.view === 'cards') {
        if (this.sheetId && !this.filtered.some((term) => term.id === this.sheetId)) {
          this.sheetId = null
        }
        return
      }
      if (this.selectedId && !this.filtered.some((term) => term.id === this.selectedId)) {
        this.selectedId = this.filtered[0] ? this.filtered[0].id : null
      }
    }
  },
  mounted() {
    this.load()
  },
  beforeUnmount() {
    clearTimeout(this.searchTimer)
    this.requestId += 1
  },
  methods: {
    async load() {
      const requestId = ++this.requestId
      if (!this.loaded) this.loading = true
      this.error = ''
      try {
        const regionLabel = this.region === 'all' ? '' : (REGION_LABELS[this.region] || '')
        const terms = await searchGlossary(this.query, regionLabel)
        if (requestId !== this.requestId) return
        this.terms = terms
        this.loaded = true
      } catch (error) {
        if (requestId !== this.requestId) return
        this.terms = []
        this.error = error.message || '용어 사전을 불러오지 못했습니다.'
      } finally {
        if (requestId === this.requestId) this.loading = false
      }
    },
    setView(view) {
      this.$router.replace({path: '/glossary', query: {view}})
    },
    selectTerm(term) {
      this.selectedId = term.id
      this.sheetId = term.id
    }
  }
}
</script>

<style scoped>
.glossary-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 16px;
  background: #f1f5f9;
  text-align: left;
  overflow: hidden;
}

.switcher {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.switcher button,
.pills button,
.filters button {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #334155;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.switcher button.active,
.pills button.active,
.filters button.active {
  background: #1e3a5f;
  border-color: #1e3a5f;
  color: #fff;
}

.status,
.empty {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.status.error {
  color: #e11d48;
}

.layout {
  flex: 1;
  min-height: 0;
}

.panel {
  min-height: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-sizing: border-box;
}

.columns {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) minmax(300px, 380px);
  gap: 16px;
}

.reading {
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 16px;
}

.filters,
.list-panel,
.detail,
.reading-body {
  overflow: auto;
  padding: 16px;
}

.filter-label {
  margin: 14px 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
}

.filters .filter-label:first-child {
  margin-top: 0;
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 5px;
}

.pills--stack {
  flex-direction: column;
  align-items: stretch;
}

.pills--stack button {
  border-radius: 8px;
}

h1 {
  margin: 0;
  font-size: 18px;
  color: #1e3a5f;
}

h1 span,
.meta {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.meta {
  margin: 6px 0 0;
}

.search {
  width: 100%;
  box-sizing: border-box;
  margin: 12px 0;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
}

.term-list,
.rows,
.grid {
  list-style: none;
  margin: 0;
  padding: 0;
}

.term-card,
.row,
.grid-card {
  width: 100%;
  margin-bottom: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.term-card.active,
.row.active,
.grid-card.active {
  border-color: #2f6fed;
  background: #f3f7ff;
  box-shadow: inset 3px 0 0 #2f6fed;
}

.term-card strong,
.row strong,
.grid-card strong,
.detail h2 {
  display: block;
  color: #1e3a5f;
  font-size: 15px;
}

.term-card span,
.row span,
.grid-card span,
.ko {
  color: #64748b;
  font-size: 13px;
}

.term-card p,
.grid-card p,
.body {
  margin: 8px 0 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.55;
}

.desc-en {
  color: #64748b;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.chips em,
.chips button,
.ko-line em {
  padding: 3px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
  font-style: normal;
}

.chips button {
  border: none;
  cursor: pointer;
}

.ko {
  margin: 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.ko-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 16px;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.reading-body h2 {
  margin: 4px 0 0;
  font-size: 32px;
}

.detail h2 span,
.reading-body h2 span {
  font-weight: 600;
  color: #64748b;
}

.more {
  display: block;
  margin: 8px auto 0;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #1e3a5f;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.cards {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cards-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 12px;
}

.cards-main {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-side {
  padding: 16px;
  overflow: auto;
}

.search-side .search {
  margin-top: 0;
}

.hint {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #64748b;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  flex-shrink: 0;
}

.toolbar h1 {
  flex-shrink: 0;
}

.toolbar .search {
  flex: 1;
  margin: 0;
}

.grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-content: start;
}

.grid-card {
  height: 100%;
  margin: 0;
}

.grid-more {
  grid-column: 1 / -1;
}

.sheet {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 2;
  width: min(360px, calc(100% - 32px));
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(26, 43, 76, 0.16);
}

.sheet h2 {
  margin: 0 28px 8px 0;
  font-size: 18px;
  color: #1e3a5f;
}

.sheet h2 span {
  font-weight: 600;
  color: #64748b;
}

.sheet-close {
  position: absolute;
  top: 8px;
  right: 10px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 22px;
  cursor: pointer;
}

@media (max-width: 960px) {
  .columns,
  .reading,
  .cards-body {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .glossary-page {
    overflow: auto;
  }
}
</style>
