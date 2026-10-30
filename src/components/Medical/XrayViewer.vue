<template>
  <div class="xray-wrap">
    <ImageSideToolbar
        :mode="viewMode"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @zoom-reset="zoom = 1"
        @update:mode="setMode"
        @window-toggle="toggleWindow"
        @reset="resetView"
    />

    <div class="viewport" @wheel="onWheel">
      <div class="stage" :style="stageStyle">
        <div ref="imageFrame" class="image-frame">
          <img
              ref="xrayImage"
              class="xray-image"
              :src="imageSrc"
              alt="Chest X-ray"
              draggable="false"
              @error="onImageError"
              @load="$emit('image-load')"
          />
          <img
              v-if="overlaySrc"
              class="overlay-image"
              :src="overlaySrc"
              alt="이상 부위 표시"
              draggable="false"
          />
          <RoiLayer
              v-if="drawable && viewMode !== 'pan'"
              :rois="rois"
              :tool="tool"
              @add-roi="$emit('add-roi', $event)"
              @remove-roi="$emit('remove-roi', $event)"
          />
          <slot name="marks" />
        </div>
      </div>

      <div
          v-if="viewMode === 'pan'"
          class="pan-layer"
          @mousedown.prevent="onPanStart"
      />

      <div class="overlay-meta">
        <div>W {{ windowW }} / L {{ windowL }}</div>
        <div>Zoom {{ zoom.toFixed(2) }}x</div>
        <div v-if="hasSlices">Slice {{ sliceIndex + 1 }} / {{ sliceTotal }}</div>
      </div>
      <div class="orient">R</div>
      <div v-if="hasSlices" class="slice-bar">
        <button
            type="button"
            class="slice-btn"
            :disabled="sliceLoading || sliceIndex <= 0"
            @click="stepSlice(-1)"
        >
          ◀
        </button>
        <input
            class="slice-range"
            type="range"
            min="0"
            :max="sliceTotal - 1"
            :value="sliceIndex"
            :disabled="sliceLoading"
            @input="onSliceInput"
        />
        <button
            type="button"
            class="slice-btn"
            :disabled="sliceLoading || sliceIndex >= sliceTotal - 1"
            @click="stepSlice(1)"
        >
          ▶
        </button>
      </div>
      <p v-if="sliceLoading" class="slice-loading">슬라이스 불러오는 중…</p>
      <p v-if="imageError" class="image-error">이미지를 불러오지 못했습니다.</p>
      <slot name="hud" />
    </div>
  </div>
</template>

<script>
import ImageSideToolbar from './ImageSideToolbar.vue'
import RoiLayer from './RoiLayer.vue'

export default {
  name: 'XrayViewer',
  components: {ImageSideToolbar, RoiLayer},
  props: {
    imageSrc: {
      type: String,
      required: true
    },
    rois: {
      type: Array,
      default: () => []
    },
    tool: {
      type: String,
      default: 'box'
    },
    overlaySrc: {
      type: String,
      default: ''
    },
    sliceIndex: {
      type: Number,
      default: 0
    },
    sliceTotal: {
      type: Number,
      default: 0
    },
    sliceLoading: {
      type: Boolean,
      default: false
    },
    drawable: {
      type: Boolean,
      default: true
    }
  },
  emits: ['add-roi', 'remove-roi', 'update:slice-index', 'image-load'],
  data() {
    return {
      zoom: 1,
      pan: {x: 0, y: 0},
      brightness: 1,
      contrast: 1,
      windowW: 4096,
      windowL: 2048,
      viewMode: 'draw',
      panning: false,
      panStart: null,
      imageError: false
    }
  },
  watch: {
    tool() {
      if (this.tool === 'box' || this.tool === 'circle' || this.tool === 'eraser') {
        this.viewMode = 'draw'
      }
    },
    imageSrc() {
      this.imageError = false
    }
  },
  computed: {
    hasSlices() {
      return this.sliceTotal > 1
    },
    stageStyle() {
      return {
        transform: `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`,
        filter: `brightness(${this.brightness}) contrast(${this.contrast})`
      }
    }
  },
  mounted() {
    window.addEventListener('mousemove', this.onPanMove)
    window.addEventListener('mouseup', this.onPanEnd)
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onPanMove)
    window.removeEventListener('mouseup', this.onPanEnd)
  },
  methods: {
    setMode(mode) {
      this.viewMode = mode === 'pan' ? 'pan' : 'draw'
    },
    onImageError() {
      this.imageError = true
    },
    zoomIn() {
      this.zoom = Math.min(3, +(this.zoom + 0.1).toFixed(2))
    },
    zoomOut() {
      this.zoom = Math.max(0.4, +(this.zoom - 0.1).toFixed(2))
    },
    toggleWindow() {
      if (this.brightness === 1) {
        this.brightness = 1.25
        this.contrast = 1.2
        this.windowL = 1800
      } else {
        this.brightness = 1
        this.contrast = 1
        this.windowL = 2048
      }
    },
    resetView() {
      this.zoom = 1
      this.pan = {x: 0, y: 0}
      this.brightness = 1
      this.contrast = 1
      this.windowW = 4096
      this.windowL = 2048
      this.viewMode = 'draw'
    },
    getImageLayout() {
      const img = this.$refs.xrayImage
      const frame = this.$refs.imageFrame
      if (!img || !frame || !img.naturalWidth || !img.naturalHeight) {
        return null
      }
      return {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        frameWidth: frame.clientWidth,
        frameHeight: frame.clientHeight
      }
    },
    onPanStart(event) {
      if (this.viewMode !== 'pan') return
      this.panning = true
      this.panStart = {
        x: event.clientX - this.pan.x,
        y: event.clientY - this.pan.y
      }
    },
    onPanMove(event) {
      if (!this.panning || !this.panStart) return
      this.pan = {
        x: event.clientX - this.panStart.x,
        y: event.clientY - this.panStart.y
      }
    },
    onPanEnd() {
      this.panning = false
      this.panStart = null
    },
    emitSlice(index) {
      if (!this.hasSlices) return
      const next = Math.min(this.sliceTotal - 1, Math.max(0, index))
      if (next === this.sliceIndex) return
      this.$emit('update:slice-index', next)
    },
    stepSlice(delta) {
      this.emitSlice(this.sliceIndex + delta)
    },
    onSliceInput(event) {
      this.emitSlice(Number(event.target.value))
    },
    onWheel(event) {
      if (!this.hasSlices) return
      event.preventDefault()
      if (event.deltaY === 0) return
      this.stepSlice(event.deltaY > 0 ? 1 : -1)
    }
  }
}
</script>

<style scoped>
.xray-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}

.viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #0b1220;
  border-radius: 0 0 8px 0;
}

.stage {
  position: absolute;
  inset: 0;
  transform-origin: center center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-frame {
  position: relative;
  width: 100%;
  height: 100%;
  background: #111827;
}

.xray-image,
.overlay-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

.xray-image {
  background: #000;
}

.overlay-image {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.pan-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  cursor: grab;
}

.overlay-meta {
  position: absolute;
  left: 12px;
  bottom: 10px;
  z-index: 4;
  color: #e5e7eb;
  font-size: 11px;
  line-height: 1.4;
  text-align: left;
  pointer-events: none;
}

.orient {
  position: absolute;
  top: 10px;
  left: 90px;
  //left: 12px;
  z-index: 4;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  pointer-events: none;
}

.image-error {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: #fca5a5;
  background: rgba(0, 0, 0, 0.55);
}

.slice-bar {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 42px;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
}

.slice-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 1px solid #475569;
  border-radius: 4px;
  background: #1e293b;
  color: #e2e8f0;
  cursor: pointer;
}

.slice-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.slice-range {
  flex: 1;
  min-width: 0;
  accent-color: #38bdf8;
}

.slice-loading {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  margin: 0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.75);
}
</style>
