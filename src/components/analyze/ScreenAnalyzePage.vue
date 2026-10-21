<template>
  <PageFrame fill>
    <div class="analyze">
      <main class="analyze-main">
        <section class="panel">
          <div class="panel-head">
            <h2>1. 화면 캡처 & ROI 박스</h2>
            <div class="steps">
              <span class="step" :class="{ on: step > 0 }">① 화면 공유</span>
              <span class="step" :class="{ on: step > 1 }">② 네모 박스 드래그</span>
              <span class="step" :class="{ on: step > 2 }">③ 분석</span>
            </div>
            <div class="toolbar">
              <button type="button" :disabled="sharing" @click="onShare">화면 공유 시작</button>
              <button type="button" class="secondary" :disabled="!hasRoi" @click="onClear">박스 지우기</button>
              <button type="button" :disabled="!hasRoi || analyzing" @click="onAnalyze">선택 영역 분석</button>
              <button
                  type="button"
                  class="secondary"
                  :class="{ 'is-loading': explaining }"
                  :disabled="!hasAnalysis || explaining"
                  @click="onExplain"
              >AI 해설 (MedGemma)
              </button>
              <button type="button" class="secondary" :disabled="!sharing" @click="stopShare">공유 종료</button>
            </div>
            <div class="status" :class="{ 'is-busy': statusBusy }">{{ status }}</div>
          </div>

          <div class="panel-scroll panel-scroll--capture">
            <div ref="stageWrap" class="stage-wrap" @wheel.passive="onStageWheel" @scroll.passive="drawRoi">
              <div v-show="!sharing" class="placeholder">
                버튼을 눌러 PACS·뷰어·이미지 창을 공유하세요.<br/>
                공유 후 <strong>휠로 스크롤</strong>하고, <strong>드래그로 네모 박스</strong>를 그리세요.
              </div>
              <div v-show="sharing" class="stage">
                <div ref="mediaStack" class="media-stack" :style="stackStyle">
                  <video
                      ref="video"
                      class="share-video"
                      autoplay
                      playsinline
                      muted
                      :style="stackStyle"
                  ></video>
                  <canvas
                      ref="overlay"
                      class="overlay"
                      :style="stackStyle"
                      @pointerdown="onPointerDown"
                      @pointermove="onPointerMove"
                      @pointerup="onPointerUp"
                      @pointercancel="onPointerUp"
                  ></canvas>
                </div>
              </div>
            </div>
            <p class="hint">
              팁: <strong>마우스 휠</strong>로 위아래 스크롤 → <strong>드래그</strong>로 영역 선택.
              모니터 전체보다 <strong>영상 창만</strong> 공유하면 더 안정적입니다.
            </p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>2. 분석 결과</h2>
          </div>
          <div ref="resultScroll" class="panel-scroll panel-scroll--result">
            <img v-if="cropUrl" class="preview" :src="cropUrl" alt="선택한 ROI 미리보기"/>
            <img v-if="overlayUrl" class="preview preview-gap" :src="overlayUrl" alt="이상 부위 오버레이"/>

            <div v-if="!analysis" class="result-card">
              <h3>대기 중</h3>
              <div class="meta">화면을 공유하고 네모 박스를 그린 뒤 분석을 실행하세요.</div>
            </div>

            <div v-else class="result-card">
              <h3>{{ resultTitle }}</h3>
              <div class="meta">
                <div>ROI 크기: <strong>{{ analysis.roi.width }}×{{ analysis.roi.height }}</strong></div>
                <div>밝기 평균/편차: <strong>{{ analysis.image_stats.mean }}</strong> / <strong>{{
                    analysis.image_stats.std
                  }}</strong></div>
                <div>추론 시간: <strong>{{ analysis.latency_ms }}ms</strong></div>
                <div v-if="analysis.overlay_summary">이상 부위: <strong>{{ analysis.overlay_summary }}</strong></div>
              </div>
              <div class="prob-list">
                <div v-for="group in probGroups" :key="group.title" class="prob-group">
                  <p class="prob-label">{{ group.title }}</p>
                  <div v-for="finding in group.findings" :key="group.title + finding.label" class="finding">
                    <div class="finding-row">
                      <span>{{ finding.label_ko }}</span>
                      <strong>{{ percent(finding.score) }}%</strong>
                    </div>
                    <div class="bar"><span :style="{ width: percent(finding.score) + '%' }"></span></div>
                  </div>
                </div>
              </div>

              <div v-if="explainVisible" ref="explainBox" class="result-card explain-card">
                <h3>한국어 판독 (MedGemma + AI참고)</h3>
                <div v-if="explainLoading" class="explain-loading">
                  <div class="spinner" aria-hidden="true"></div>
                  <p>MedGemma가 한국어 판독문을 생성 중입니다<span class="loading-dots"></span></p>
                  <p class="sub">Hugging Face Inference API로 원격 생성합니다. (로컬 8GB 다운로드 없음)</p>
                </div>
                <p v-else-if="explainError" class="explain-error">해설 생성 실패: {{ explainError }}</p>
                <div v-else class="report-wrap">
                  <div
                      v-for="section in explainSections"
                      :key="section.title"
                      class="report-section"
                      :class="section.tone"
                  >
                    <div class="report-head">【{{ section.title }}】</div>
                    <div class="report-body">
                      <template v-for="(block, index) in section.blocks" :key="section.title + index">
                        <div v-if="block.type === 'note'" class="note">{{ block.text }}</div>
                        <div v-else-if="block.type === 'text'">{{ block.text }}</div>
                      </template>
                      <ul v-if="bullets(section).length">
                        <li v-for="(block, index) in bullets(section)" :key="section.title + 'b' + index">{{
                            block.text
                          }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div v-if="!explainSections.length" class="report-body">판독문 없음</div>
                </div>
              </div>
            </div>

            <div class="disclaimer">
              ※ 본 화면은 <strong>가능성 검증용 프로토타입</strong>입니다.
              실제 의료 진단이 아니며, 최종 판단은 의사에게 있습니다.
              분석은 B4+ConvNeXt+ResNet18 앙상블 API를 사용하며, 해설은 HuggingFace MedGemma를 사용합니다.
            </div>
          </div>
        </section>
      </main>
    </div>
  </PageFrame>
</template>

<script>
import PageFrame from '../main/PageFrame.vue'
import {analyzeScreenRoi, cropRect, explainScreenRoi, parseReport} from './screenAnalyze'

export default {
  name: 'ScreenAnalyzePage',
  components: {
    PageFrame
  },
  data() {
    return {
      sharing: false,
      hasRoi: false,
      hasAnalysis: false,
      analyzing: false,
      explaining: false,
      step: 0,
      status: 'Chrome/Edge에서 열어 주세요. (화면 공유 API)',
      statusBusy: false,
      stackStyle: {},
      analysis: null,
      cropUrl: '',
      overlayUrl: '',
      explainVisible: false,
      explainLoading: false,
      explainError: '',
      explainSections: []
    }
  },
  computed: {
    resultTitle() {
      if (!this.analysis || !this.analysis.classification) return '의심 소견'
      const top = this.analysis.classification
      const germinoma = this.analysis.germinoma
      let title = `출혈 최상위: ${top.top_label_ko}`
      if (germinoma) {
        title += ` · germinoma: ${germinoma.top_label_ko} ${this.percent(germinoma.confidence)}%`
      }
      return title
    },
    probGroups() {
      if (!this.analysis || !this.analysis.classification) return []
      const groups = [{
        title: '출혈 (ICH)',
        findings: this.analysis.classification.findings || []
      }]
      if (this.analysis.germinoma && this.analysis.germinoma.findings) {
        groups.push({title: 'Germinoma', findings: this.analysis.germinoma.findings})
      }
      return groups
    }
  },
  created() {
    this.stream = null
    this.roi = null
    this.drawing = false
    this.startX = 0
    this.startY = 0
    this.activePointerId = null
    this.resizeObserver = null
    this.lastRoiBlob = null
  },
  beforeUnmount() {
    this.stopShare()
  },
  methods: {
    percent(score) {
      return (Number(score) * 100).toFixed(0)
    },
    bullets(section) {
      return (section.blocks || []).filter((block) => block.type === 'bullet')
    },
    setStatus(message, busy = false) {
      this.status = message
      this.statusBusy = busy
    },
    resetAnalysis() {
      this.analysis = null
      this.hasAnalysis = false
      this.cropUrl = ''
      this.overlayUrl = ''
      this.explainVisible = false
      this.explainLoading = false
      this.explainError = ''
      this.explainSections = []
      this.lastRoiBlob = null
      if (this.$refs.resultScroll) this.$refs.resultScroll.scrollTop = 0
    },
    syncOverlaySize() {
      const video = this.$refs.video
      const overlay = this.$refs.overlay
      const stageWrap = this.$refs.stageWrap
      if (!video || !overlay || !stageWrap) return
      const videoWidth = video.videoWidth || 0
      const videoHeight = video.videoHeight || 0
      const cssWidth = Math.max(1, Math.round(stageWrap.clientWidth))
      const cssHeight = videoWidth > 0 && videoHeight > 0
          ? Math.max(1, Math.round(cssWidth * (videoHeight / videoWidth)))
          : Math.max(1, Math.round(video.clientHeight || video.offsetHeight || 1))
      this.stackStyle = {width: `${cssWidth}px`, height: `${cssHeight}px`}
      if (overlay.width !== cssWidth || overlay.height !== cssHeight) {
        overlay.width = cssWidth
        overlay.height = cssHeight
      }
      this.drawRoi()
    },
    drawRoi() {
      const overlay = this.$refs.overlay
      if (!overlay) return
      const ctx = overlay.getContext('2d')
      ctx.clearRect(0, 0, overlay.width, overlay.height)
      if (!this.roi) return
      ctx.fillStyle = 'rgba(43, 179, 168, 0.18)'
      ctx.strokeStyle = '#2bb3a8'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.fillRect(this.roi.x, this.roi.y, this.roi.w, this.roi.h)
      ctx.strokeRect(this.roi.x, this.roi.y, this.roi.w, this.roi.h)
      ctx.setLineDash([])
      ctx.fillStyle = '#2bb3a8'
      ctx.font = '12px sans-serif'
      ctx.fillText('분석 영역 (ROI)', this.roi.x + 8, Math.max(16, this.roi.y - 8))
    },
    pointerPos(event) {
      const overlay = this.$refs.overlay
      const rect = overlay.getBoundingClientRect()
      if (!rect.width || !rect.height) return {x: 0, y: 0}
      const x = ((event.clientX - rect.left) / rect.width) * overlay.width
      const y = ((event.clientY - rect.top) / rect.height) * overlay.height
      return {
        x: Math.max(0, Math.min(overlay.width, x)),
        y: Math.max(0, Math.min(overlay.height, y))
      }
    },
    onPointerDown(event) {
      if (!this.stream) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      this.drawing = true
      this.activePointerId = event.pointerId
      event.currentTarget.style.touchAction = 'none'
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch (err) { /* 캡처 미지원 */
      }
      const point = this.pointerPos(event)
      this.startX = point.x
      this.startY = point.y
      this.roi = {x: point.x, y: point.y, w: 0, h: 0}
      this.drawRoi()
      event.preventDefault()
    },
    onPointerMove(event) {
      if (!this.drawing || (this.activePointerId !== null && event.pointerId !== this.activePointerId)) return
      const point = this.pointerPos(event)
      this.roi = {
        x: Math.min(this.startX, point.x),
        y: Math.min(this.startY, point.y),
        w: Math.abs(point.x - this.startX),
        h: Math.abs(point.y - this.startY)
      }
      this.drawRoi()
      const wrap = this.$refs.stageWrap.getBoundingClientRect()
      if (event.clientY > wrap.bottom - 40) this.$refs.stageWrap.scrollTop += 18
      else if (event.clientY < wrap.top + 40) this.$refs.stageWrap.scrollTop -= 18
      event.preventDefault()
    },
    onPointerUp(event) {
      if (!this.drawing) return
      if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return
      this.drawing = false
      this.activePointerId = null
      event.currentTarget.style.touchAction = 'pan-y'
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch (err) { /* 캡처 없음 */
      }
      if (this.roi && this.roi.w > 8 && this.roi.h > 8) {
        this.hasRoi = true
        this.step = Math.max(this.step, 2)
        this.setStatus('ROI 선택 완료 · ‘선택 영역 분석’을 누르세요.')
        return
      }
      this.roi = null
      this.hasRoi = false
      this.drawRoi()
    },
    onStageWheel() {
      requestAnimationFrame(() => this.syncOverlaySize())
    },
    async onShare() {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {frameRate: 10},
          audio: false
        })
        this.stream = stream
        const video = this.$refs.video
        video.srcObject = stream
        this.sharing = true
        this.step = Math.max(this.step, 1)
        this.setStatus('화면 공유 중 · 휠로 스크롤, 드래그로 영역 선택')
        const ready = () => {
          this.syncOverlaySize()
          requestAnimationFrame(() => {
            this.syncOverlaySize()
            requestAnimationFrame(() => this.syncOverlaySize())
          })
        }
        video.onloadedmetadata = ready
        video.onloadeddata = ready
        video.onresize = ready
        if (video.readyState >= 1) ready()
        if (this.resizeObserver) this.resizeObserver.disconnect()
        this.resizeObserver = new ResizeObserver(() => this.syncOverlaySize())
        this.resizeObserver.observe(this.$refs.stageWrap)
        const track = stream.getVideoTracks()[0]
        if (track) track.addEventListener('ended', this.stopShare)
        window.addEventListener('resize', this.syncOverlaySize)
      } catch (e) {
        this.setStatus('화면 공유가 취소되었거나 권한이 없습니다.')
      }
    },
    stopShare() {
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop())
        this.stream = null
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      window.removeEventListener('resize', this.syncOverlaySize)
      if (this.$refs.video) this.$refs.video.srcObject = null
      this.sharing = false
      this.stackStyle = {}
      this.roi = null
      this.hasRoi = false
      this.drawRoi()
      this.resetAnalysis()
      this.step = 0
      this.analyzing = false
      this.explaining = false
      this.setStatus('공유가 종료되었습니다.')
    },
    onClear() {
      this.roi = null
      this.hasRoi = false
      this.drawRoi()
      this.resetAnalysis()
      this.step = this.sharing ? 1 : 0
      this.setStatus('박스를 지웠습니다 · 다시 드래그하세요.')
    },
    cropRoi() {
      const video = this.$refs.video
      const overlay = this.$refs.overlay
      this.syncOverlaySize()
      const rect = cropRect(this.roi, overlay.width, overlay.height, video.videoWidth, video.videoHeight)
      if (!rect) return null
      const canvas = document.createElement('canvas')
      canvas.width = rect.sw
      canvas.height = rect.sh
      canvas.getContext('2d').drawImage(
          video,
          rect.sx,
          rect.sy,
          rect.sw,
          rect.sh,
          0,
          0,
          rect.sw,
          rect.sh
      )
      return canvas
    },
    async onAnalyze() {
      const canvas = this.cropRoi()
      if (!canvas) {
        this.setStatus('박스가 너무 작습니다. 다시 그려 주세요.')
        return
      }
      this.analyzing = true
      this.hasAnalysis = false
      this.step = 3
      this.setStatus('앙상블 모델 분석 중…')
      this.cropUrl = canvas.toDataURL('image/png')
      try {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        const result = await analyzeScreenRoi(blob)
        this.lastRoiBlob = blob
        this.analysis = result
        this.hasAnalysis = true
        this.overlayUrl = result.overlay_png_base64
            ? `data:image/png;base64,${result.overlay_png_base64}`
            : ''
        this.explainVisible = false
        this.explainLoading = false
        this.explainError = ''
        this.explainSections = []
        this.setStatus(`분석 완료 (${result.latency_ms}ms) · AI 해설을 요청할 수 있습니다.`)
      } catch (e) {
        this.setStatus(`분석 실패: ${e.message}`)
      } finally {
        this.analyzing = false
      }
    },
    async onExplain() {
      if (!this.analysis || !this.lastRoiBlob) return
      this.explaining = true
      this.explainVisible = true
      this.explainLoading = true
      this.explainError = ''
      this.explainSections = []
      this.setStatus('MedGemma 해설 생성 중… (HF Inference API)', true)
      this.$nextTick(() => {
        if (this.$refs.explainBox) {
          this.$refs.explainBox.scrollIntoView({behavior: 'smooth', block: 'nearest'})
        }
      })
      try {
        const result = await explainScreenRoi(this.lastRoiBlob, this.analysis)
        this.explainSections = parseReport(result.explanation)
        this.explainLoading = false
        this.step = 3
        this.setStatus(`해설 완료 (${result.latency_ms}ms)`)
      } catch (e) {
        this.explainLoading = false
        this.explainError = e.message
        this.setStatus(`해설 실패: ${e.message}`)
      } finally {
        this.explaining = false
      }
    }
  }
}
</script>

<style scoped>
.analyze {
  --line: #e2eaf1;
  --text: #1a2b4b;
  --muted: #7a8798;
  --accent: #2bb3a8;
  --accent-dim: #1a8f86;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #eef3f7;
  color: var(--text);
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

.analyze-main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 2.4fr 0.9fr;
  gap: 18px;
  padding: 18px 24px;
  overflow: hidden;
}

.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(26, 43, 75, 0.04);
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 15px;
}

.panel-head {
  flex-shrink: 0;
}

.panel-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 4px;
  padding-right: 6px;
  scrollbar-width: thin;
  scrollbar-color: #c5d5d3 #f8fafc;
}

.panel-scroll--capture {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-scroll--result {
  overflow-y: scroll;
  scrollbar-gutter: stable;
}

.panel-scroll--result::-webkit-scrollbar {
  width: 9px;
}

.panel-scroll--result::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 999px;
}

.panel-scroll--result::-webkit-scrollbar-thumb {
  background: #c5d5d3;
  border-radius: 999px;
  border: 2px solid #f8fafc;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.step {
  font-size: 12px;
  color: #8a96a6;
  background: #e8eef3;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 6px 10px;
}

.step.on {
  color: #fff;
  background: var(--accent);
  font-weight: 700;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  background: var(--accent);
}

button.secondary {
  background: #f3f6f9;
  color: #5a6a7e;
  border: 1px solid var(--line);
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

button.is-loading {
  position: relative;
  color: transparent !important;
  pointer-events: none;
}

button.is-loading::after {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(43, 179, 168, 0.25);
  border-top-color: #2bb3a8;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.stage-wrap {
  position: relative;
  width: 100%;
  background: #0f172a;
  border-radius: 12px;
  border: 1px solid #d7dee9;
  flex: 1;
  min-height: 280px;
  overflow-x: hidden;
  overflow-y: scroll;
  scrollbar-width: thin;
  scrollbar-color: #64748b #0f172a;
}

.placeholder {
  color: #cbd5e1;
  text-align: center;
  padding: 80px 24px;
  font-size: 14px;
  line-height: 1.6;
}

.media-stack {
  position: relative;
  line-height: 0;
}

.share-video {
  display: block;
  pointer-events: none;
  user-select: none;
}

.overlay {
  position: absolute;
  left: 0;
  top: 0;
  cursor: crosshair;
  touch-action: pan-y;
  z-index: 2;
}

.hint {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.result-card {
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  margin-top: 10px;
}

.result-card h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

.bar {
  height: 8px;
  border-radius: 999px;
  background: #e8eef3;
  overflow: hidden;
  margin: 6px 0 12px;
}

.bar > span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--accent-dim), var(--accent));
}

.meta {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.meta strong {
  color: var(--text);
}

.preview {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid var(--line);
}

.preview-gap {
  margin-top: 8px;
}

.prob-label {
  margin: 8px 0 4px;
  font-size: 12px;
  opacity: 0.75;
}

.finding-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.disclaimer {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 12px;
  line-height: 1.5;
}

.status {
  font-size: 12px;
  color: var(--accent);
  min-height: 18px;
  margin-bottom: 8px;
}

.status.is-busy {
  color: #b45309;
}

.explain-card {
  background: #fff;
}

.explain-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 28px 16px;
  text-align: center;
  border-radius: 10px;
  background: rgba(46, 196, 182, 0.06);
  border: 1px dashed rgba(46, 196, 182, 0.35);
}

.explain-loading p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.explain-loading .sub {
  font-size: 12px;
  color: var(--muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(46, 196, 182, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
}

.loading-dots::after {
  content: "";
  animation: dots 1.4s steps(4, end) infinite;
}

.explain-error {
  color: #b91c1c;
  font-size: 13px;
  line-height: 1.65;
}

.report-wrap {
  display: grid;
  gap: 10px;
}

.report-section {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
}

.report-section.hl {
  border-color: #9fd9d3;
  background: rgba(43, 179, 168, 0.08);
}

.report-section.warn {
  border-color: #fed7aa;
  background: #fff7ed;
}

.report-head {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 6px;
}

.report-body {
  font-size: 13px;
  line-height: 1.65;
}

.report-body ul {
  margin: 0;
  padding-left: 18px;
}

.report-body .note {
  color: var(--muted);
  font-size: 12px;
  margin-top: 6px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes dots {
  0% {
    content: "";
  }
  25% {
    content: ".";
  }
  50% {
    content: "..";
  }
  75% {
    content: "...";
  }
  100% {
    content: "";
  }
}

@media (max-width: 960px) {
  .analyze {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }

  .analyze-main {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .panel {
    min-height: 55vh;
    max-height: 55vh;
  }
}
</style>
