<template>
  <section class="result-col">
    <div class="result-head">
      <h2>결과</h2>
      <span class="badge" :class="resultClass">{{ resultLabel }}</span>
    </div>
    <p class="feedback">{{ feedbackText }}</p>

    <div ref="frame" class="image-panel">
      <img
        v-if="imageSrc"
        ref="xray"
        class="xray"
        :src="imageSrc"
        alt="판독 영상"
        @load="updateLayout"
      />
      <img
        v-if="overlaySrc"
        class="overlay"
        :src="overlaySrc"
        alt="정답 병변"
      />
      <div
        v-if="answerShape && !overlaySrc"
        class="shape answer"
        :class="answerShape.type"
        :style="shapeStyle(answerShape)"
      />
      <div
        v-if="userRoi"
        class="shape user"
        :class="userRoi.type"
        :style="shapeStyle(userRoi)"
      />
      <span class="orient">R</span>
      <ul class="legend">
        <li>
          <span class="swatch user"></span>
          사용자 선택 영역
        </li>
        <li>
          <span class="swatch answer"></span>
          정답 병변
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
import { containLayout, formatResult, resultClass as gradeResultClass } from './reviewModel'

export default {
  name: 'ReviewResultPanel',
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
      layout: null
    }
  },
  computed: {
    resultLabel() {
      return formatResult(this.grade.result)
    },
    resultClass() {
      return gradeResultClass(this.grade.result)
    },
    feedbackText() {
      if (this.usingMock) {
        return '정답 병변을 부분적으로 포함했으나 범위가 정답보다 넓습니다. 정상 폐실질 및 심 음영을 확인해주세요.'
      }
      if (this.grade.result === '정답') {
        return '정답 병변을 잘 포함했습니다. 선택한 범위가 실제 이상 부위와 대체로 일치합니다.'
      }
      if (this.grade.result === '부분정답') {
        return '정답 병변을 부분적으로 포함했으나 범위가 정답과 완전히 같지는 않습니다. 색칠된 위치와 비교해 보세요.'
      }
      return '선택한 영역이 정답 병변과 거의 겹치지 않습니다. 색칠된 정답 위치를 다시 확인해 주세요.'
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
      const frame = this.$refs.frame
      if (!frame || !frame.clientWidth) return
      const img = this.$refs.xray
      const naturalW = img && img.naturalWidth ? img.naturalWidth : frame.clientWidth
      const naturalH = img && img.naturalHeight ? img.naturalHeight : frame.clientHeight
      this.layout = containLayout(
        naturalW,
        naturalH,
        frame.clientWidth,
        frame.clientHeight
      )
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
.result-col {
  flex: 1.05;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 16px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}
.result-head {
  display: flex;
  align-items: center;
  gap: 10px;
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
.feedback {
  margin: 8px 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #64748b;
}
.image-panel {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #0b1220;
  border-radius: 10px;
}
.xray,
.overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
.overlay {
  z-index: 1;
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
.orient {
  position: absolute;
  top: 12px;
  left: 14px;
  z-index: 3;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}
.legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 3;
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
</style>
