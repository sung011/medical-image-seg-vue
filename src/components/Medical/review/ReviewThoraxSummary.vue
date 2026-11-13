<template>
  <div class="thorax-summary">
    <!-- 맨 위: 판정과 한 문장만 크게 -->
    <div class="verdict">
      <span class="verdict-chip" :class="resultClass">{{ resultLabel }}</span>
      <p class="verdict-line">{{ verdictLine }}</p>
    </div>

    <!-- 다른 부위 요약과 같은 카드 2개 -->
    <div class="stat-grid">
      <article class="stat-card">
        <span class="stat-icon teal"><i class="fa fa-check"></i></span>
        <p>정답 소견</p>
        <strong>{{ diseaseName }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-icon orange"><i class="fa fa-pie-chart"></i></span>
        <p>포함률</p>
        <strong>{{ coverageText }}</strong>
        <div class="bar"><span :style="{ width: (coveragePercent || 0) + '%' }"></span></div>
      </article>
    </div>
    <p class="basis">채점 기준 · {{ basisLabel }}</p>

    <!-- 접는 칸. "이 영상에서는"만 처음에 펼친다 -->
    <ReviewAccordion title="이 영상에서는" :open="open.case" @toggle="toggle('case')">
      <p>{{ caseLine }}</p>
      <p class="hint">왼쪽 사진에서 내가 그린 영역(주황 점선)과 색칠된 부위를 비교해 보세요.</p>
    </ReviewAccordion>

    <template v-if="note">
      <ReviewAccordion v-if="note.summary" title="정의" :open="open.summary" @toggle="toggle('summary')">
        <p>{{ note.summary }}</p>
      </ReviewAccordion>

      <ReviewAccordion v-if="note.appearance.length" title="영상 소견" :open="open.appearance" @toggle="toggle('appearance')">
        <ul class="bullets">
          <li v-for="(item, i) in note.appearance" :key="'a' + i">
            {{ item }}
            <a
                v-for="(src, j) in lineSources(i)"
                :key="'as' + i + '-' + j"
                class="src-tag"
                :href="src.url"
                :title="src.title"
                target="_blank"
                rel="noopener noreferrer"
            >출처</a>
          </li>
        </ul>
      </ReviewAccordion>

      <ReviewAccordion v-if="note.pitfall" title="판독 시 주의점" :open="open.pitfall" @toggle="toggle('pitfall')">
        <p>{{ note.pitfall }}</p>
      </ReviewAccordion>

      <!-- 서버 related: 이 소견이 생기는 원인 질환 목록 -->
      <ReviewAccordion v-if="note.related.length" title="주요 원인" :open="open.related" @toggle="toggle('related')">
        <ul class="bullets">
          <li v-for="(item, i) in note.related" :key="'r' + i">{{ item }}</li>
        </ul>
      </ReviewAccordion>

      <!-- 증상·소견 → 의심 질환 → 권고 검사, 그 아래 그 밖의 검사(confirm) -->
      <ReviewAccordion
          v-if="note.next_steps.length || note.confirm.length || note.confirm_note"
          title="권고 검사"
          :open="open.steps"
          @toggle="toggle('steps')"
      >
        <p v-if="note.confirm_note" class="hint">{{ note.confirm_note }}</p>
        <ul v-if="note.next_steps.length" class="steps">
          <li v-for="(step, i) in note.next_steps" :key="'t' + i">
            <p><span class="step-tag">증상·소견</span> {{ step.sign }}</p>
            <p><span class="step-tag">의심 질환</span> {{ step.suspect }}</p>
            <p><span class="step-tag">권고 검사</span> {{ step.next }}</p>
            <a
                v-if="step.source && step.source.url"
                :href="step.source.url"
                target="_blank"
                rel="noopener noreferrer"
            >출처: {{ step.source.title }}</a>
          </li>
        </ul>
        <template v-if="note.confirm.length">
          <p v-if="note.next_steps.length" class="sub-head">그 밖의 검사</p>
          <ul class="bullets">
            <li v-for="(item, i) in note.confirm" :key="'f' + i">{{ item }}</li>
          </ul>
        </template>
      </ReviewAccordion>

      <ReviewAccordion
          v-if="note.combinations.length"
          title="동반 소견별 의심 질환"
          :open="open.combinations"
          @toggle="toggle('combinations')"
      >
        <ul class="bullets">
          <li v-for="(item, i) in note.combinations" :key="'c' + i">{{ item }}</li>
        </ul>
      </ReviewAccordion>

      <ReviewAccordion
          v-if="note.appearance_extra.length"
          title="참고 (지침 확인 전)"
          :open="open.extra"
          @toggle="toggle('extra')"
      >
        <ul class="bullets">
          <li v-for="(item, i) in note.appearance_extra" :key="'x' + i">{{ item }}</li>
        </ul>
      </ReviewAccordion>
    </template>

    <ReviewAccordion title="참고자료" :open="open.refs" @toggle="toggle('refs')">
      <ul class="refs">
        <li v-for="ref in references" :key="ref.url">
          <a :href="ref.url" target="_blank" rel="noopener noreferrer">{{ ref.title }}</a>
          <p>{{ ref.url }}</p>
        </li>
      </ul>
    </ReviewAccordion>

    <!-- 안내 문장은 맨 아래 한 번만 -->
    <p class="disclaimer">{{ disclaimer }}</p>
  </div>
</template>

<script>
import ReviewAccordion from './ReviewAccordion.vue'

// 서버 해설에 빠진 칸이 있어도 화면이 깨지지 않게 빈 값으로 채운다
const NOTE_LISTS = ['appearance', 'appearance_extra', 'locations', 'related', 'confirm', 'combinations', 'references', 'next_steps']
// 사용자가 정한 흉부 안내 문장 (2026-10-27 결정)
const THORAX_DISCLAIMER = '의학 검토를 거치지 않은 학습용 참고 자료이며, 진단이 아닙니다.'

export default {
  name: 'ReviewThoraxSummary',
  components: {ReviewAccordion},
  props: {
    grade: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      open: {
        case: true,
        summary: false,
        appearance: false,
        pitfall: false,
        related: false,
        steps: false,
        combinations: false,
        extra: false,
        refs: false
      }
    }
  },
  computed: {
    // 서버가 정답 소견으로 고른 학습 해설. 없으면 null
    note() {
      const raw = this.grade.learning_note
      if (!raw) return null
      const note = {...raw}
      NOTE_LISTS.forEach((key) => {
        note[key] = Array.isArray(raw[key]) ? raw[key] : []
      })
      return note
    },
    resultClass() {
      if (this.grade.result === '정답') return 'ok'
      if (this.grade.result === '부분정답') return 'partial'
      return 'wrong'
    },
    resultLabel() {
      if (this.grade.result === '부분정답') return '부분 정답'
      return this.grade.result || '채점 대기'
    },
    verdictLine() {
      const total = this.grade.target_count || 0
      const found = this.grade.found_count || 0
      const count = total ? ` (의심 부위 ${total}곳 중 ${found}곳)` : ''
      if (this.grade.result === '정답') return `정답 부위를 잘 찾았어요.${count}`
      if (this.grade.result === '부분정답') return `정답 부위를 일부만 찾았어요.${count}`
      return `정답 부위를 찾지 못했어요.${count}`
    },
    diseaseName() {
      // 제출 뒤 서버가 주는 정답 소견이 먼저, 없으면 AI 최상위 소견
      return (
        this.grade.expected_disease ||
        (this.grade.classification && this.grade.classification.top_label_ko) ||
        '-'
      )
    },
    coveragePercent() {
      const value = Number(this.grade.recall)
      if (!Number.isFinite(value)) return null
      return Math.round(value * 100)
    },
    coverageText() {
      return this.coveragePercent == null ? '—' : `${this.coveragePercent}%`
    },
    // 채점 기준: 전문의가 표시한 박스인지, AI가 찾은 부위인지
    basisLabel() {
      return this.grade.target_source === 'dataset' ? '전문의 표시' : 'AI가 찾은 부위'
    },
    caseLine() {
      if (this.note && this.note.case_summary) return this.note.case_summary
      if (this.note && this.note.locations.length) return `${this.note.locations.join(' · ')}에 있습니다.`
      return `${this.diseaseName} 의심 부위를 정답 표시와 비교해 보세요.`
    },
    references() {
      if (this.note && this.note.references.length) return this.note.references
      const q = encodeURIComponent(
        (this.grade.classification && this.grade.classification.top_label) || 'chest x-ray'
      )
      return [{title: 'Radiopaedia - 검색 결과', url: `https://radiopaedia.org/search?lang=us&q=${q}`}]
    },
    disclaimer() {
      return THORAX_DISCLAIMER
    }
  },
  methods: {
    toggle(key) {
      this.open[key] = !this.open[key]
    },
    // 영상 소견 줄마다 붙는 출처 (서버가 appearance와 같은 순서로 준다)
    lineSources(index) {
      const all = (this.note && this.note.appearance_sources) || []
      return all[index] || []
    }
  }
}
</script>

<style scoped>
.verdict {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 0;
}
.verdict-chip {
  flex: none;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}
.verdict-chip.ok {
  background: #dcfce7;
  color: #166534;
}
.verdict-chip.partial {
  background: #ffe4e6;
  color: #be123c;
}
.verdict-chip.wrong {
  background: #fee2e2;
  color: #991b1b;
}
.verdict-line {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 14px 0 6px;
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
.basis {
  margin: 0 0 10px;
  font-size: 12px;
  color: #64748b;
}
.hint {
  font-size: 12px;
  color: #64748b;
}
.sub-head {
  margin: 10px 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}
.bullets {
  margin: 0;
  padding-left: 18px;
}
.bullets li + li {
  margin-top: 4px;
}
.src-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 0 7px;
  border: 1px solid #99f6e4;
  border-radius: 999px;
  background: #f0fdfa;
  font-size: 11px;
  font-weight: 600;
  color: #0f766e;
  text-decoration: none;
}
.src-tag:hover {
  background: #ccfbf1;
}
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
}
.steps li {
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #14b8a6;
  border-radius: 8px;
  background: #fff;
}
.steps p {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 4px;
}
.step-tag {
  flex: none;
  min-width: 64px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: #475569;
}
.steps a {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #94a3b8;
  text-decoration: none;
}
.steps a:hover {
  color: #0f766e;
  text-decoration: underline;
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
.disclaimer {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  font-size: 11px;
  color: #94a3b8;
}
p {
  margin: 0 0 8px;
}
</style>
