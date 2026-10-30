<template>
  <aside class="summary-col">
    <h2>결과 요약</h2>
    <p v-if="sliceLabel" class="slice-meta">제출 슬라이스 · {{ sliceLabel }}</p>
    <div class="stat-grid">
      <article class="stat-card">
        <span class="stat-icon teal"><i class="fa fa-check"></i></span>
        <p>추정 병명</p>
        <strong>{{ diseaseName }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-icon orange"><i class="fa fa-pie-chart"></i></span>
        <p>포함률</p>
        <strong>{{ coverageText }}</strong>
        <div class="bar"><span :style="{ width: (coveragePercent || 0) + '%' }"></span></div>
      </article>
    </div>

    <p v-if="germinomaTitle" class="germinoma-meta">{{ germinomaTitle }}</p>

    <ReviewAccordion
      title="병명 해설"
      :open="open.explain"
      @toggle="toggle('explain')"
    >
      <p v-for="(line, i) in explanationLines" :key="i">{{ line }}</p>
    </ReviewAccordion>

    <ReviewAccordion
      title="주요 영상 소견"
      :open="open.findings"
      @toggle="toggle('findings')"
    >
      <template v-if="!usingMock && (primaryFindings.length || showGerminoma)">
        <p v-if="primaryFindings.length" class="findings-group">{{ findingsTitle }}</p>
        <ul v-if="primaryFindings.length" class="prob-list">
          <li v-for="item in primaryFindings" :key="'finding-' + (item.label || item.label_ko)">
            <div class="prob-row">
              <span>{{ item.label_ko || item.label }}</span>
              <strong>{{ findingScoreText(item) }}</strong>
            </div>
            <div v-if="item.status !== 'not_evaluated'" class="bar"><span :style="{ width: scorePercent(item.score) + '%' }"></span></div>
          </li>
        </ul>
        <p v-if="showGerminoma" class="findings-group">Germinoma</p>
        <ul v-if="showGerminoma" class="prob-list">
          <li v-for="item in germinomaFindings" :key="'g-' + (item.label || item.label_ko)">
            <div class="prob-row">
              <span>{{ item.label_ko || item.label }}</span>
              <strong>{{ scorePercent(item.score) }}%</strong>
            </div>
            <div class="bar"><span :style="{ width: scorePercent(item.score) + '%' }"></span></div>
          </li>
        </ul>
        <p v-if="grade.overlay_summary" class="overlay-note">{{ grade.overlay_summary }}</p>
      </template>
      <ul v-else class="bullets">
        <li v-for="(item, i) in findingLines" :key="i">{{ item }}</li>
      </ul>
    </ReviewAccordion>

    <ReviewAccordion
      title="핵심 의학용어"
      :open="open.terms"
      @toggle="toggle('terms')"
    >
      <div class="chips">
        <span v-for="term in terms" :key="term">{{ term }}</span>
      </div>
    </ReviewAccordion>

    <ReviewAccordion
      title="참고자료"
      :open="open.refs"
      @toggle="toggle('refs')"
    >
      <ul class="refs">
        <li v-for="ref in references" :key="ref.url">
          <a :href="ref.url" target="_blank" rel="noopener noreferrer">
            {{ ref.title }}
          </a>
          <p>{{ ref.url }}</p>
        </li>
      </ul>
    </ReviewAccordion>
  </aside>
</template>

<script>
import ReviewAccordion from './ReviewAccordion.vue'

export default {
  name: 'ReviewSummaryPanel',
  components: { ReviewAccordion },
  props: {
    grade: {
      type: Object,
      required: true
    },
    usingMock: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: ''
    },
    sliceIndex: {
      type: Number,
      default: null
    },
    sliceTotal: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      open: {
        explain: true,
        findings: true,
        terms: true,
        refs: true
      }
    }
  },
  computed: {
    sliceLabel() {
      if (String(this.type).toUpperCase() !== 'MRI') return ''
      if (this.sliceIndex == null || !Number.isFinite(this.sliceIndex)) return ''
      const current = this.sliceIndex + 1
      if (this.sliceTotal != null && this.sliceTotal > 0) {
        return `${current} / ${this.sliceTotal}`
      }
      return String(current)
    },
    readingTask() {
      return (this.grade.classification && this.grade.classification.task) || ''
    },
    findingsTitle() {
      if (this.readingTask === 'thorax') return '흉부 소견'
      if (this.readingTask === 'brain-mri') return '뇌 MRI'
      if (this.readingTask === 'knee' || this.readingTask === 'knee-mri') return '무릎 MRI'
      return '출혈 (ICH)'
    },
    primaryFindings() {
      return (this.grade.classification && this.grade.classification.findings) || []
    },
    germinoma() {
      return this.grade.germinoma || null
    },
    ichFindings() {
      if (this.readingTask === 'thorax' || this.readingTask === 'brain-mri' || this.readingTask === 'knee' || this.readingTask === 'knee-mri') {
        return []
      }
      return this.primaryFindings
    },
    germinomaFindings() {
      if (!this.germinoma) return []
      return this.germinoma.findings || []
    },
    showGerminoma() {
      if (this.readingTask && this.readingTask !== 'hemorrhage') return false
      return this.germinomaFindings.length > 0
    },
    germinomaTitle() {
      if (!this.germinoma) return ''
      const name = this.germinoma.top_label_ko || this.germinoma.top_label || '생식세포종양'
      const pct = this.scorePercent(this.germinoma.confidence)
      return `Germinoma · ${name} ${pct}%`
    },
    topicParticle() {
      const name = this.diseaseName || ''
      const code = name.charCodeAt(name.length - 1)
      const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
      return hasBatchim ? '으로' : '로'
    },
    diseaseName() {
      if (this.readingTask === 'thorax' || this.readingTask === 'brain-mri' || this.readingTask === 'knee' || this.readingTask === 'knee-mri') {
        const top =
          (this.grade.classification && this.grade.classification.top_label_ko) ||
          this.grade.disease ||
          ''
        if (top) return top
        if (this.readingTask === 'knee' || this.readingTask === 'knee-mri') return 'ACL'
      }
      const ich =
        (this.grade.classification && this.grade.classification.top_label_ko) ||
        ''
      if (ich && this.germinoma) {
        const gName =
          this.germinoma.top_label_ko || this.germinoma.top_label || '생식세포종양'
        return `${ich} · ${gName}`
      }
      if (ich) return ich
      if (this.germinoma) {
        return this.germinoma.top_label_ko || this.germinoma.top_label || '생식세포종양'
      }
      if (this.grade.disease) return this.grade.disease
      if (this.usingMock) return '폐 결절'
      return '병명 없음'
    },
    coveragePercent() {
      const value = Number(this.grade.recall)
      if (!Number.isFinite(value)) return null
      return Math.round(value * 100)
    },
    coverageText() {
      if (this.coveragePercent == null) return '—'
      return `${this.coveragePercent}%`
    },
    explanationLines() {
      const note = this.grade.learning_note
      if (!this.usingMock && note && (note.summary || note.case_summary || (note.appearance || []).length)) {
        const lines = []
        if (note.name) lines.push(note.name)
        if (note.summary) lines.push(note.summary)
        if (note.case_summary) lines.push(note.case_summary)
        ;(note.appearance || []).forEach((line) => {
          if (line) lines.push(line)
        })
        if (note.pitfall) lines.push(note.pitfall)
        return lines
      }
      if (this.usingMock) {
        return [
          '출혈(ICH)과 생식세포종양(germinoma) 분류 결과를 함께 확인할 수 있습니다.',
          '위치와 범위를 정답 표시·오버레이와 비교해 보세요.'
        ]
      }
      const lines = [
        `${this.diseaseName}${this.topicParticle} 추정되는 이상 부위입니다. 위치와 범위를 정답 표시와 비교해 보세요.`
      ]
      if (this.grade.overlay_summary) lines.push(this.grade.overlay_summary)
      if (this.germinomaTitle) lines.push(this.germinomaTitle)
      return lines
    },
    findingLines() {
      if (this.usingMock) {
        return [
          '출혈 (ICH): 지주막하출혈 82%, 두개내출혈 81%',
          'Germinoma: 생식세포종양 36%',
          '정답 오버레이와 선택한 ROI 범위를 비교해 보세요.'
        ]
      }
      const lines = []
      if (this.grade.overlay_summary) lines.push(this.grade.overlay_summary)
      this.ichFindings.slice(0, 3).forEach((item) => {
        lines.push(
          `${item.label_ko || item.label} (${this.scorePercent(item.score)}%)`
        )
      })
      this.germinomaFindings.forEach((item) => {
        lines.push(
          `Germinoma · ${item.label_ko || item.label} (${this.scorePercent(item.score)}%)`
        )
      })
      return lines.length
        ? lines
        : ['표시된 이상 부위를 기준으로 소견을 확인해 주세요.']
    },
    terms() {
      if (this.usingMock) {
        return [
          '지주막하출혈(subarachnoid)',
          '두개내출혈(any)',
          '생식세포종양(germinoma)'
        ]
      }
      const chips = []
      const named = (this.readingTask === 'thorax' || this.readingTask === 'brain-mri' || this.readingTask === 'knee-mri')
        ? this.primaryFindings
        : this.ichFindings
      named.slice(0, 4).forEach((item) => {
        if (item.label_ko && item.label) chips.push(`${item.label_ko}(${item.label})`)
        else chips.push(item.label_ko || item.label)
      })
      this.germinomaFindings.forEach((item) => {
        if (item.label_ko && item.label) chips.push(`${item.label_ko}(${item.label})`)
        else chips.push(item.label_ko || item.label || '생식세포종양')
      })
      return chips.length ? chips : [this.diseaseName]
    },
    references() {
      const top =
        (this.grade.classification && this.grade.classification.top_label) ||
        (this.germinoma && this.germinoma.top_label) ||
        'intracranial hemorrhage'
      const q = encodeURIComponent(top)
      const refs = [
        {
          title: 'Radiopaedia - 검색 결과',
          url: `https://radiopaedia.org/search?lang=us&q=${q}`
        }
      ]
      if (this.germinoma) {
        refs.push({
          title: 'Radiopaedia - Germinoma',
          url: 'https://radiopaedia.org/articles/intracranial-germinoma'
        })
      }
      return refs
    }
  },
  methods: {
    toggle(key) {
      this.open[key] = !this.open[key]
    },
    scorePercent(score) {
      const value = Number(score)
      if (!Number.isFinite(value)) return 0
      return Math.round(Math.min(1, Math.max(0, value)) * 100)
    },
    findingScoreText(item) {
      if (item.status === 'not_evaluated') return item.reason || '평가하지 않음'
      if (item.verdict) {
        const prob = Number(item.score)
        return Number.isFinite(prob) ? `${item.verdict} (${prob.toFixed(3)})` : item.verdict
      }
      return `${this.scorePercent(item.score)}%`
    }
  }
}
</script>

<style scoped>
.summary-col {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-sizing: border-box;
}
h2 {
  margin: 0;
  font-size: 15px;
  color: #1e3a5f;
}
.slice-meta {
  margin: 6px 0 0;
  font-size: 12px;
  color: #0369a1;
}
.germinoma-meta {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: #0f766e;
}
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 14px 0 8px;
}
.stat-card {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
}
.stat-card p {
  margin: 0 0 4px;
  font-size: 12px;
  color: #64748b;
}
.stat-card strong {
  display: block;
  font-size: 15px;
  color: #0f172a;
}
.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-bottom: 6px;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
}
.stat-icon.teal {
  background: #14b8a6;
}
.stat-icon.orange {
  background: #f59e0b;
}
@media (max-width: 860px) {
  .summary-col {
    width: 100%;
    height: max-content;
    min-height: max-content;
    overflow: visible;
  }
}
.bar {
  height: 6px;
  margin-top: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #14b8a6;
}
.findings-group {
  margin: 10px 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}
.findings-group:first-child {
  margin-top: 0;
}
.prob-list {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
}
.prob-list li + li {
  margin-top: 8px;
}
.prob-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: #334155;
}
.prob-row strong {
  font-size: 13px;
  color: #0f172a;
}
.overlay-note {
  margin: 10px 0 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}
.bullets {
  margin: 0;
  padding-left: 18px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chips span {
  padding: 6px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
}
.refs {
  list-style: none;
  margin: 0;
  padding: 0;
}
.refs a {
  color: #0f766e;
  font-weight: 600;
  text-decoration: none;
}
.refs a:hover {
  text-decoration: underline;
}
.refs p {
  margin: 2px 0 10px;
  font-size: 12px;
  color: #94a3b8;
  word-break: break-all;
}
p {
  margin: 0 0 8px;
}
</style>
