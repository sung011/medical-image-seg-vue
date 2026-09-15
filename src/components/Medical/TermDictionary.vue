<template>
  <aside class="dictionary">
    <h3>의학용어 사전</h3>
    <p v-if="metaLabel" class="meta">{{ metaLabel }}</p>
    <input
      v-model="query"
      type="search"
      class="search"
      placeholder="용어 검색 (한/영)"
    />
    <div class="filters">
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
          <strong>{{ term.en }}</strong>
          <span>{{ term.ko }}</span>
        </div>
        <p>{{ term.desc }}</p>
        <div class="chips">
          <span v-for="c in term.categories" :key="c">{{ c }}</span>
        </div>
      </li>
    </ul>
  </aside>
</template>

<script>
const GLOSSARY_API = 'http://127.0.0.1:8000/glossary'

function parsePgArray(value) {
  if (!value || typeof value !== 'string') return []
  const inner = value.replace(/^\{|\}$/g, '').trim()
  if (!inner) return []
  return inner.split(',').map((s) => s.trim()).filter(Boolean)
}

function mapItem(item) {
  const categories = parsePgArray(item.tags_ko)
  return {
    id: item.id,
    en: item.name_en || '',
    ko: item.name_ko || '',
    desc: item.definition_ko || '',
    categories
  }
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
      count: 0
    }
  },
  computed: {
    metaLabel() {
      if (!this.region && !this.type) return ''
      const parts = []
      if (this.region) parts.push(this.region)
      if (this.type) parts.push(this.type)
      return `${parts.join(' · ')} · ${this.count}개`
    },
    filteredTerms() {
      const q = this.query.trim().toLowerCase()
      const qRaw = this.query.trim()
      return this.terms.filter((term) => {
        const matchTag =
          this.filter === '전체' || term.categories.includes(this.filter)
        const matchQuery =
          !q ||
          term.en.toLowerCase().includes(q) ||
          term.ko.includes(qRaw) ||
          term.desc.includes(qRaw)
        return matchTag && matchQuery
      })
    }
  },
  watch: {
    '$route.query': {
      immediate: true,
      handler() {
        this.fetchGlossary()
      }
    }
  },
  methods: {
    async fetchGlossary() {
      const region = this.$route.query.region || 'brain'
      const type = this.$route.query.type || 'CT'
      this.region = region
      this.type = type
      this.loading = true
      this.error = ''

      try {
        const url = `${GLOSSARY_API}?region=${encodeURIComponent(region)}&type=${encodeURIComponent(type)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`API 오류 (${res.status})`)
        const data = await res.json()
        if (!data.ok) throw new Error('용어 사전을 불러오지 못했습니다.')

        const terms = (data.items || []).map(mapItem)
        const tagSet = new Set()
        terms.forEach((t) => t.categories.forEach((c) => tagSet.add(c)))

        this.terms = terms
        this.count = data.count ?? terms.length
        this.tags = ['전체', ...Array.from(tagSet).sort()]
        if (!this.tags.includes(this.filter)) this.filter = '전체'
      } catch (e) {
        this.terms = []
        this.count = 0
        this.tags = ['전체']
        this.filter = '전체'
        this.error = e.message || '용어 사전을 불러오지 못했습니다.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.dictionary {
  width: 280px;
  flex-shrink: 0;
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
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
  font-size: 13px;
}
.term-card p {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.45;
  color: #4b5563;
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
