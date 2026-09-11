<template>
  <aside class="dictionary">
    <h3>의학용어 사전</h3>
    <input
      v-model="query"
      type="search"
      class="search"
      placeholder="용어 검색"
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
    <ul class="term-list">
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
const SAMPLE_TERMS = [
  {
    id: 1,
    en: 'Pneumothorax',
    ko: '기흉',
    desc: '흉막강에 공기가 차서 폐가 일부 또는 전부 허탈되는 상태.',
    categories: ['흉부', '폐']
  },
  {
    id: 2,
    en: 'Pleural effusion',
    ko: '흉수',
    desc: '흉막강에 액체가 고여 있는 소견. CXR에서 늑골횡격막각 둔화로 관찰.',
    categories: ['흉부', '폐']
  },
  {
    id: 3,
    en: 'Consolidation',
    ko: '경화',
    desc: '폐포가 체액·염증 삼출물로 채워져 음영이 증가한 소견.',
    categories: ['폐']
  }
]

export default {
  name: 'TermDictionary',
  data() {
    return {
      query: '',
      filter: '전체',
      tags: ['전체', '흉부', '폐'],
      terms: SAMPLE_TERMS
    }
  },
  computed: {
    filteredTerms() {
      const q = this.query.trim().toLowerCase()
      return this.terms.filter((term) => {
        const matchTag =
          this.filter === '전체' || term.categories.includes(this.filter)
        const matchQuery =
          !q ||
          term.en.toLowerCase().includes(q) ||
          term.ko.includes(this.query.trim())
        return matchTag && matchQuery
      })
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
