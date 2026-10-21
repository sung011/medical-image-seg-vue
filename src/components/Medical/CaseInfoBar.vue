<template>
  <section class="case-info">
    <div class="case-text">
      <span class="case-id">CASE {{ caseId }}</span>
      <p class="summary">{{ summary }}</p>
    </div>
    <div class="case-actions">
      <div class="guide-menu" ref="guideMenu">
        <button
          type="button"
          class="guide-btn"
          :aria-expanded="guideOpen ? 'true' : 'false'"
          aria-controls="solving-guide"
          @click="onGuide"
        >
          가이드
        </button>
        <div v-if="guideOpen" id="solving-guide" class="guide-panel" role="region" aria-label="풀이 방법">
          <p class="guide-panel__title">풀이 방법</p>
          <ol>
            <li>원 또는 박스를 고른 뒤 영상 위를 드래그해 영역을 지정합니다. 지우기로 지울 수 있습니다.</li>
            <li>제출을 누르면 그린 영역 중 마지막 ROI로 채점합니다.</li>
            <li>채점이 끝나면 리뷰 화면에서 판정과 오버레이를 확인합니다.</li>
          </ol>
        </div>
      </div>
      <button type="button" class="list-btn" @click="$emit('go-list')">
        케이스 목록
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: 'CaseInfoBar',
  props: {
    caseId: {
      type: [String, Number],
      default: '02'
    },
    summary: {
      type: String,
      default:
        // '72세 남성. 호흡곤란과 흉통으로 내원. CXR에서 우측 기흉 및 흉수 의 의이 의되어 판독 학습을 진행합니다.'
        ''
    }
  },
  emits: ['go-list'],
  data() {
    return {
      guideOpen: false
    }
  },
  mounted() {
    document.addEventListener('click', this.onDocClick)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocClick)
  },
  methods: {
    onDocClick(event) {
      const guide = this.$refs.guideMenu
      if (guide && !guide.contains(event.target)) this.guideOpen = false
    },
    onGuide() {
      this.guideOpen = !this.guideOpen
    }
  }
}
</script>

<style scoped>
.case-info {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
}
.case-id {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
}
.summary {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
}
.list-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.case-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.guide-menu {
  position: relative;
}
.guide-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.guide-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  padding: 12px 14px;
  border: 1px solid #e5e9f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(26, 43, 76, 0.12);
  text-align: left;
  z-index: 20;
}
.guide-panel__title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1a2b4c;
}
.guide-panel ol {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  font-size: 13px;
  line-height: 1.5;
}
.guide-panel li + li {
  margin-top: 6px;
}
.list-btn:hover {
  background: #eef2f7;
}
</style>
