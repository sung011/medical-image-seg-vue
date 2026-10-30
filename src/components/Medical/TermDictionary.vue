<template>
  <aside class="dictionary">
    <h3>의학용어 사전</h3>
    <p v-if="metaLabel" class="meta">{{ metaLabel }}</p>
    <input
      v-model="query"
      type="search"
      class="search"
      placeholder="증상 또는 용어"
    />
    <div v-if="tags.length > 1" class="filters">
      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        :class="{ active: filter === tag }"
        @click="filter = tag"
      >
        {{ tag }}
      </button>
    </div>

    <p v-if="loading" class="status">불러오는 중…</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <p v-else-if="!filteredTerms.length" class="status">검색 결과가 없습니다.</p>
    <ul v-else class="term-list">
      <li v-for="term in filteredTerms" :key="term.id" class="term-card">
        <div class="term-title">
          <strong>{{ term.ko }} <span v-if="term.en">({{ term.en }})</span></strong>
        </div>
        <p>{{ term.desc }}</p>
        <p v-if="term.descEn" class="desc-en">{{ term.descEn }}</p>
        <div v-if="term.parts.length" class="chips">
          <span v-for="part in term.parts" :key="part">{{ part }}</span>
        </div>
      </li>
    </ul>
  </aside>
</template>

<script>
import { searchGlossary } from '../glossary/glossaryModel'

const PART_WORDS = ['뇌', '심장', '폐', '흉부', '복부', '무릎']

function partsIn(term) {
  const text = `${term.ko} ${term.desc} ${term.descEn}`
  return PART_WORDS.filter((word) => text.includes(word))
}

const REGION_LABELS = {
  brain: '뇌',
  chest: '흉부',
  abdomen: '복부',
  knee: '무릎'
}

export default {
  name: 'TermDictionary',
  data() {
    return {
      query: '',
      filter: '전체',
      tags: ['전체'],
      terms: [],
      loading: false,
      error: '',
      region: '',
      type: '',
      searchTimer: null,
      requestId: 0
    }
  },
  computed: {
    metaLabel() {
      const region = REGION_LABELS[this.region] || this.region
      if (!region) return ''
      const type = this.type ? ` · ${this.type}` : ''
      return `${region}${type} · ${this.filteredTerms.length}개`
    },
    filteredTerms() {
      if (this.filter === '전체') return this.terms
      return this.terms.filter((term) => term.parts.includes(this.filter))
    }
  },
  watch: {
    '$route.query': {
      immediate: true,
      handler() {
        clearTimeout(this.searchTimer)
        this.fetchGlossary(false)
      }
    },
    query() {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => this.fetchGlossary(true), 300)
    }
  },
  beforeUnmount() {
    clearTimeout(this.searchTimer)
    this.requestId += 1
  },
  methods: {
    async fetchGlossary(keepList) {
      const requestId = ++this.requestId
      const region = this.$route.query.region || 'brain'
      const type = this.$route.query.type || 'CT'
      this.region = region
      this.type = type
      if (!keepList) this.loading = true
      this.error = ''

      try {
        const q = this.query.trim()
        const regionLabel = REGION_LABELS[region] || ''
        const found = await searchGlossary(q, q ? '' : regionLabel)
        if (requestId !== this.requestId) return
        this.applyTerms(found.map((term) => ({ ...term, parts: partsIn(term) })))
      } catch (e) {
        if (requestId !== this.requestId) return
        this.terms = []
        this.tags = ['전체']
        this.filter = '전체'
        this.error = e.message || '용어 사전을 불러오지 못했습니다.'
      } finally {
        if (requestId === this.requestId) this.loading = false
      }
    },
    applyTerms(terms) {
      const present = new Set()
      terms.forEach((term) => term.parts.forEach((part) => present.add(part)))
      this.terms = terms
      this.tags = ['전체', ...PART_WORDS.filter((word) => present.has(word))]
      if (!this.tags.includes(this.filter)) this.filter = '전체'
    }
  }
}
</script>

<style scoped>
.dictionary {
  min-width: 0;
  padding: 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  height: 100%;
  max-height: none;
  box-sizing: border-box;
}
h3 {
  margin: 0;
  font-size: 15px;
  color: #1e3a5f;
}
.meta {
  margin: 0;
  font-size: 11px;
  color: #64748b;
}
.search {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.filters button {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #f8fafc;
  font-size: 12px;
  cursor: pointer;
}
.filters button.active {
  background: #1e3a5f;
  border-color: #1e3a5f;
  color: #fff;
}
.status {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}
.status.error {
  color: #b91c1c;
}
.term-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.term-card {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}
.term-title {
  margin-bottom: 6px;
  font-size: 13px;
  color: #1e3a5f;
}
.term-title span {
  font-weight: 600;
  color: #64748b;
}
.term-card p {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.45;
  color: #4b5563;
}
.desc-en {
  color: #64748b;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.chips span {
  padding: 2px 6px;
  border-radius: 4px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 11px;
}
</style>
