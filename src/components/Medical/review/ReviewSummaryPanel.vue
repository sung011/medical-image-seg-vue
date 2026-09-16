<template>
  <aside class="summary-col">
    <h2>결과 요약</h2>
    <div class="stat-grid">
      <article class="stat-card">
        <span class="stat-icon teal"><i class="fa fa-check"></i></span>
        <p>추정 병명</p>
        <strong>{{ diseaseName }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-icon orange"><i class="fa fa-pie-chart"></i></span>
        <p>포함률</p>
        <strong>{{ coveragePercent }}%</strong>
        <div class="bar"><span :style="{ width: coveragePercent + '%' }"></span></div>
      </article>
      <article class="stat-card">
        <span class="stat-icon pink"><i class="fa fa-dot-circle-o"></i></span>
        <p>ROI 정확도</p>
        <strong>{{ accuracyLabel }}</strong>
        <div class="bar"><span :style="{ width: accuracyPercent + '%' }"></span></div>
      </article>
    </div>

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
      <ul class="bullets">
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
    diseaseName() {
      return (
        (this.grade.classification && this.grade.classification.top_label_ko) ||
        '폐 결절'
      )
    },
    coveragePercent() {
      const value = Number(this.grade.recall)
      if (!Number.isFinite(value)) return 68
      return Math.round(value * 100)
    },
    accuracyLabel() {
      if (this.grade.result === '정답') return '일치'
      if (this.grade.result === '부분정답') return '부분 일치'
      return '불일치'
    },
    accuracyPercent() {
      const value = Number(this.grade.iou)
      if (!Number.isFinite(value)) return 55
      return Math.round(Math.min(1, value) * 100)
    },
    explanationLines() {
      if (this.usingMock) {
        return [
          '폐 결절은 폐 실질 내에 보이는 3cm 미만의 국소적인 음영입니다.',
          '양성 결절과 악성 결절의 감별이 중요하며, 크기·모양·위치를 종합적으로 평가합니다.'
        ]
      }
      const name = this.diseaseName
      const summary = this.grade.overlay_summary
      const lines = [
        `${name}으로 추정되는 이상 부위입니다. 위치와 범위를 정답 표시와 비교해 보세요.`
      ]
      if (summary) lines.push(summary)
      return lines
    },
    findingLines() {
      if (this.usingMock) {
        return [
          '우측 중폐야 경계가 비교적 명확한 결절성 음영 관찰됨',
          '주변 폐 실질에 특이 소견 관찰되지 않음',
          '늑골, 횡격막 이상 소견 관찰되지 않음'
        ]
      }
      const findings =
        (this.grade.classification && this.grade.classification.findings) || []
      const top = findings.slice(0, 3).map((item) => {
        const label = item.label_ko || item.label
        const score = Number(item.score)
        const pct = Number.isFinite(score) ? ` (${Math.round(score * 100)}%)` : ''
        return `${label}${pct}`
      })
      if (this.grade.overlay_summary) top.unshift(this.grade.overlay_summary)
      return top.length
        ? top
        : ['표시된 이상 부위를 기준으로 소견을 확인해 주세요.']
    },
    terms() {
      if (this.usingMock) {
        return [
          '폐결절(nodule)',
          '고형결절(solid nodule)',
          '악성가능성(nodule)',
          '중폐야(middle lobe)'
        ]
      }
      const findings =
        (this.grade.classification && this.grade.classification.findings) || []
      const chips = findings.slice(0, 4).map((item) => {
        if (item.label_ko && item.label) return `${item.label_ko}(${item.label})`
        return item.label_ko || item.label
      })
      return chips.length ? chips : [this.diseaseName]
    },
    references() {
      const q = encodeURIComponent(
        (this.grade.classification && this.grade.classification.top_label) ||
          'pulmonary nodule'
      )
      return [
        {
          title: 'Radiopaedia - 검색 결과',
          url: `https://radiopaedia.org/search?lang=us&q=${q}`
        },
        {
          title: 'Fleischner Society Guidelines (2017)',
          url: 'https://pubs.rsna.org/doi/10.1148/radiol.2017161659'
        }
      ]
    }
  },
  methods: {
    toggle(key) {
      this.open[key] = !this.open[key]
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
