<template>
  <section class="viewer-col">
    <div class="case-info">
      <div class="result-head">
        <span class="case-id">결과</span>
        <span class="badge" :class="resultClass">{{ resultLabel }}</span>
        <span v-if="sliceLabel" class="slice-badge">{{ sliceLabel }}</span>
      </div>
      <div class="case-actions">
        <slot name="actions" />
      </div>
    </div>

    <div class="viewer-panel">
      <XrayViewer
          v-if="imageSrc"
          ref="viewer"
          class="xray-fill"
          :image-src="imageSrc"
          :overlay-src="overlaySrc"
          :drawable="false"
          :rois="[]"
          @image-load="updateLayout"
      >
        <template #marks>
          <div
              v-if="answerShape && !overlaySrc"
              class="shape answer"
              :class="answerShape.type"
              :style="shapeStyle(answerShape)"
          />
          <div
              v-for="(roi, index) in displayUserRois"
              :key="'user-roi-' + index"
              class="shape user"
              :class="roi.type"
              :style="shapeStyle(roi)"
          />
        </template>
        <template #hud>
          <ul class="legend">
            <li>
              <span class="swatch user"></span>
              사용자 선택 영역
            </li>
            <li>
              <span class="swatch answer"></span>
              {{ answerLabel }}
            </li>
            <!-- 정답이 데이터셋(의사) 박스일 때 AI가 찾은 부위는 참고로만 알린다 -->
            <li v-if="hasAiReference">
              <span class="swatch ai"></span>
              AI가 찾은 부위 (참고)
            </li>
          </ul>
        </template>
      </XrayViewer>
      <div class="footer-hint">
      <p class="feedback">{{ feedbackText }}</p>
      <!-- 틀린 이유 (서버가 내 ROI와 정답 부위를 비교해 만든 문장) -->
      <ul v-if="tips.length" class="tips">
        <li v-for="(tip, i) in tips" :key="'tip-' + i">{{ tip }}</li>
      </ul>
      <!-- 맞은 정도 한 줄 (서버가 만든 문장. 숫자만 말한다) -->
      <p v-if="isThorax && grade.metrics_text" class="metrics-note">{{ grade.metrics_text }}</p>
      <!-- 정답 표시는 의사 한 사람의 표시라 위치는 믿되 크기는 참고만. 채점 기준이 AI면 그렇다고 밝힌다 -->
      <p v-if="answerWord === '정답 부위' && isDataset" class="answer-note">
        색칠된 {{ answerWord }}는 의사가 표시한 위치예요. 크기는 의사마다 차이가 있어 참고로 보세요.
      </p>
      <p v-else-if="answerWord === '정답 부위'" class="answer-note">
        이번 채점은 AI가 찾은 부위를 기준으로 했어요. 색칠된 곳은 의사가 표시한 정답이 아니라 AI가 찾은 위치이니 참고로 보세요.
      </p>
      <ul v-if="kneeFindings.length" class="finding-list">
        <li v-for="item in kneeFindings" :key="'knee-' + (item.label || item.label_ko)">
          {{ findingLine(item) }}
        </li>
      </ul>
      <p v-if="kneeDisclaimer" class="disclaimer">{{ kneeDisclaimer }}</p>
    </div>
    </div>
  </section>
</template>

<script>
import XrayViewer from '../XrayViewer.vue'
import { containLayout, formatResult, resultClass as gradeResultClass } from './reviewModel'

export default {
  name: 'ReviewResultPanel',
  components: { XrayViewer },
  props: {
    imageSrc: {
      type: String,
      default: ''
    },
    overlaySrc: {
      type: String,
      default: ''
    },
    userRoi: {
      type: Object,
      default: null
    },
    userRois: {
      type: Array,
      default: null
    },
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
      layout: null
    }
  },
  computed: {
    displayUserRois() {
      if (Array.isArray(this.userRois) && this.userRois.length) {
        return this.userRois.filter(Boolean)
      }
      return this.userRoi ? [this.userRoi] : []
    },
    resultLabel() {
      return formatResult(this.grade.result)
    },
    resultClass() {
      return gradeResultClass(this.grade.result)
    },
    sliceLabel() {
      if (this.sliceIndex == null || !Number.isFinite(this.sliceIndex)) return ''
      const current = this.sliceIndex + 1
      if (this.sliceTotal != null && this.sliceTotal > 0) {
        return `슬라이스 ${current} / ${this.sliceTotal}`
      }
      return `슬라이스 ${current}`
    },
    isThorax() {
      return Boolean(this.grade.classification && this.grade.classification.task === 'thorax')
    },
    // 틀린 이유 목록. 흉부만 보여 준다 (뇌 CT도 feedback을 주지만 그 화면은 바꾸지 않는다)
    tips() {
      if (!this.isThorax) return []
      return Array.isArray(this.grade.feedback) ? this.grade.feedback : []
    },
    // 흉부는 정답이 소견이라 "정답 부위", 그 밖에는 "정답 병변"
    answerWord() {
      return this.isThorax ? '정답 부위' : '정답 병변'
    },
    // 받침에 맞춘 조사 (부위를/병변을, 부위와/병변과)
    answerObj() {
      return this.answerWord === '정답 부위' ? '정답 부위를' : '정답 병변을'
    },
    answerWith() {
      return this.answerWord === '정답 부위' ? '정답 부위와' : '정답 병변과'
    },
    // 채점 기준이 데이터셋(전문의) 박스인지. 아니면 AI가 찾은 부위가 기준이다
    isDataset() {
      return this.grade.target_source === 'dataset'
    },
    answerLabel() {
      return this.grade.target_source === 'ai' ? 'AI가 찾은 부위 (참고)' : this.answerWord
    },
    hasAiReference() {
      return (
        this.grade.target_source === 'dataset' &&
        Array.isArray(this.grade.ai_targets) &&
        this.grade.ai_targets.length > 0
      )
    },
    // 흉부 의심 부위별 결과 한 줄 (예: 의심 부위 2곳 중 1곳을 찾았습니다.)
    regionText() {
      const total = this.grade.target_count
      if (this.usingMock || !total) return ''
      const found = this.grade.found_count || 0
      const wide = this.grade.too_wide ? ' 다만 그린 범위가 의심 부위보다 많이 넓습니다.' : ''
      return ` 의심 부위 ${total}곳 중 ${found}곳을 찾았습니다.${wide}`
    },
    feedbackText() {
      if (this.usingMock) {
        return `${this.answerObj} 부분적으로 포함했으나 범위가 정답보다 넓습니다. 정상 폐실질 및 심 음영을 확인해주세요.`
      }
      const task = this.grade.classification && this.grade.classification.task
      const graded = this.grade.result === '정답' || this.grade.result === '부분정답' || this.grade.result === '오답'
      if ((task === 'knee-mri' || task === 'knee') && !graded) {
        return this.grade.overlay_summary || '무릎 MRI를 채점하지 못했습니다.'
      }
      if (this.grade.result === '판독') {
        const name = (this.grade.classification && this.grade.classification.top_label_ko) || '소견'
        return `뇌 MRI로 판독했습니다. 가장 높은 소견은 ${name}입니다. 뇌 CT 출혈 모델은 사용하지 않습니다.`
      }
      const sliceHint = this.sliceLabel ? ` (${this.sliceLabel})` : ''
      const regions = this.regionText
      if (this.grade.result === '정답') {
        return `${this.answerObj} 잘 포함했습니다. 선택한 범위가 실제 이상 부위와 대체로 일치합니다.${regions}${sliceHint}`
      }
      if (this.grade.result === '부분정답') {
        return `${this.answerObj} 부분적으로 포함했으나 범위가 정답과 완전히 같지는 않습니다. 색칠된 위치와 비교해 보세요.${regions}${sliceHint}`
      }
      return `선택한 영역이 ${this.answerWith} 거의 겹치지 않습니다. 색칠된 정답 위치를 다시 확인해 주세요.${regions}${sliceHint}`
    },
    kneeFindings() {
      if (!this.grade.classification || this.grade.classification.task !== 'knee-mri') return []
      return this.grade.classification.findings || []
    },
    kneeDisclaimer() {
      if (!this.kneeFindings.length) return ''
      return this.grade.disclaimer || ''
    },
    answerShape() {
      const box = this.grade.abnormality_bbox
      if (!box) {
        if (!this.usingMock) return null
        return { type: 'circle', x: 0.52, y: 0.28, width: 0.22, height: 0.22 }
      }
      return {
        type: 'box',
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      }
    }
  },
  mounted() {
    this.$nextTick(this.updateLayout)
    window.addEventListener('resize', this.updateLayout)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateLayout)
  },
  methods: {
    updateLayout() {
      const viewer = this.$refs.viewer
      const frame = viewer && viewer.getImageLayout()
      if (!frame) return
      this.layout = containLayout(
        frame.naturalWidth,
        frame.naturalHeight,
        frame.frameWidth,
        frame.frameHeight
      )
    },
    findingLine(item) {
      const name = item.label_ko || item.label || '소견'
      if (item.status === 'not_evaluated') return `${name} · ${item.reason || '평가하지 않음'}`
      const prob = Number(item.score)
      const score = Number.isFinite(prob) ? ` (${prob.toFixed(3)})` : ''
      const verdict = item.verdict || name
      return `${name} · ${verdict}${score}`
    },
    shapeStyle(shape) {
      if (!this.layout || !shape) return { display: 'none' }
      return {
        left: `${this.layout.left + shape.x * this.layout.width}px`,
        top: `${this.layout.top + shape.y * this.layout.height}px`,
        width: `${shape.width * this.layout.width}px`,
        height: `${shape.height * this.layout.height}px`,
        borderRadius: shape.type === 'circle' ? '50%' : '0'
      }
    }
  }
}
</script>

<style scoped>
.viewer-col {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.case-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.case-id {
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
}
.case-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.viewer-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
.result-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.badge.ok {
  background: #dcfce7;
  color: #166534;
}
.badge.partial {
  background: #ffe4e6;
  color: #be123c;
}
.badge.wrong {
  background: #fee2e2;
  color: #991b1b;
}
.badge.read {
  background: #dbeafe;
  color: #1d4ed8;
}
.finding-list {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.6;
  color: #0f172a;
}
.disclaimer {
  margin: 8px 0 0;
  font-size: 12px;
  color: #64748b;
}
.slice-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #e0f2fe;
  color: #075985;
}
.footer-hint {
  margin: 0;
  padding: 10px 12px;
  flex-shrink: 0;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}
.feedback {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}
.xray-fill {
  flex: 1;
  min-height: 0;
  position: relative;
}
@media (max-width: 860px) {
  .viewer-col {
    min-height: 520px;
  }
  .case-info,
  .case-actions {
    flex-wrap: wrap;
  }
}
.shape {
  position: absolute;
  z-index: 2;
  box-sizing: border-box;
  pointer-events: none;
}
.shape.user {
  border: 2px dashed #f59e0b;
  background: rgba(245, 158, 11, 0.08);
}
.shape.answer {
  border: 2px solid #14b8a6;
  background: rgba(20, 184, 166, 0.45);
}
.legend {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 4;
  margin: 0;
  padding: 8px 10px;
  list-style: none;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 12px;
}
.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
}
.swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-sizing: border-box;
}
.swatch.user {
  border: 2px dashed #f59e0b;
  background: transparent;
}
.swatch.answer {
  background: #14b8a6;
}
.swatch.ai {
  border: 2px solid #4073ff;
  border-radius: 3px;
  background: transparent;
}
.tips {
  margin: 8px 0 0;
  padding: 8px 12px;
  list-style: none;
  border-radius: 8px;
  background: #fff7ed;
  font-size: 13px;
  line-height: 1.5;
  color: #9a3412;
}
.tips li + li {
  margin-top: 2px;
}
.metrics-note {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: #0f766e;
}
.answer-note {
  margin: 8px 0 0;
  font-size: 12px;
  color: #64748b;
}
</style>
