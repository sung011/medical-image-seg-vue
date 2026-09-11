<template>
  <div class="case-page">
    <MedHeader />

    <main class="content">
      <section class="viewer-col">
        <CaseInfoBar
          case-id="02"
          @go-list="onGoList"
        />

        <div class="viewer-panel">
          <RoiToolbar
            v-model:tool="tool"
            @submit="onSubmit"
          />
          <XrayViewer
            class="xray-fill"
            :image-src="imageSrc"
            :rois="rois"
            :tool="tool"
            @add-roi="addRoi"
            @remove-roi="removeRoi"
          />
          <p class="footer-hint">
            ⓘ ROI는 하나 이상 지정할 수 있습니다. 지우기 도구로 ROI를 클릭하면 삭제됩니다.
          </p>
        </div>
      </section>

      <TermDictionary class="dict-fill" />
    </main>
  </div>
</template>

<script>
import MedHeader from './MedHeader.vue'
import CaseInfoBar from './CaseInfoBar.vue'
import RoiToolbar from './RoiToolbar.vue'
import XrayViewer from './XrayViewer.vue'
import TermDictionary from './TermDictionary.vue'

export default {
  name: 'CaseSolvingPage',
  components: {
    MedHeader,
    CaseInfoBar,
    RoiToolbar,
    XrayViewer,
    TermDictionary
  },
  data() {
    return {
      tool: 'box',
      rois: [],
      imageSrc: '/medical/xray-sample.png'
    }
  },
  methods: {
    addRoi(roi) {
      this.rois.push(roi)
    },
    removeRoi(id) {
      this.rois = this.rois.filter((r) => r.id !== id)
    },
    onSubmit() {
      if (!this.rois.length) {
        alert('ROI를 하나 이상 지정해 주세요.')
        return
      }
      console.log('제출 ROI:', this.rois)
      alert(`ROI ${this.rois.length}개 제출 (콘솔 확인)`)
    },
    onGoList() {
      alert('케이스 목록 화면은 아직 연결 전입니다.')
    }
  }
}
</script>

<style scoped>
.case-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  text-align: left;
  overflow: hidden;
}
.content {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
  padding: 12px 16px 16px;
  box-sizing: border-box;
}
.viewer-col {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
.footer-hint {
  margin: 0;
  padding: 10px 12px;
  flex-shrink: 0;
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}
.xray-fill {
  flex: 1;
  min-height: 0;
}
.dict-fill {
  align-self: stretch;
  max-height: none;
  height: 100%;
}
</style>
