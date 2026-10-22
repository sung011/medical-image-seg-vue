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
      <article class="stat-card">
        <span class="stat-icon pink"><i class="fa fa-dot-circle-o"></i></span>
        <p>ROI 정확도</p>
        <strong>{{ accuracyLabel }}</strong>
        <div class="bar"><span :style="{ width: (accuracyPercent || 0) + '%' }"></span></div>
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
      <template v-if="!usingMock && (ichFindings.length || germinomaFindings.length)">
        <p v-if="ichFindings.length" class="findings-group">출혈 (ICH)</p>
        <ul v-if="ichFindings.length" class="prob-list">
          <li v-for="item in ichFindings" :key="'ich-' + (item.label || item.label_ko)">
            <div class="prob-row">
              <span>{{ item.label_ko || item.label }}</span>
              <strong>{{ scorePercent(item.score) }}%</strong>
            </div>
            <div class="bar"><span :style="{ width: scorePercent(item.score) + '%' }"></span></div>
          </li>
        </ul>
        <p v-if="germinomaFindings.length" class="findings-group">Germinoma</p>
        <ul v-if="germinomaFindings.length" class="prob-list">
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
    germinoma() {
      return this.grade.germinoma || null
    },
    ichFindings() {
      const findings =
        (this.grade.classification && this.grade.classification.findings) || []
      return findings
    },
    germinomaFindings() {
      if (!this.germinoma) return []
      return this.germinoma.findings || []
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
    accuracyLabel() {
      if (this.grade.result === '정답') return '일치'
      if (this.grade.result === '부분정답') return '부분 일치'
      return '불일치'
    },
    accuracyPercent() {
      const value = Number(this.grade.iou)
      if (!Number.isFinite(value)) return null
      return Math.round(Math.min(1, value) * 100)
    },
    explanationLines() {
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
      this.ichFindings.slice(0, 4).forEach((item) => {
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
    }
  }
}
</script>

<style scoped>
.summary-col {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
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
  grid-template-columns: 1fr 1fr 1fr;
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
.stat-icon.pink {
  background: #fb7185;
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
