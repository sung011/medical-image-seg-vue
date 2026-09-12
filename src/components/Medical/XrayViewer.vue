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

    <div class="viewport">
      <div class="stage" :style="stageStyle">
        <div class="image-frame">
          <img
              class="xray-image"
              :src="imageSrc"
              alt="Chest X-ray"
              draggable="false"
              @error="onImageError"
          />
          <RoiLayer
              v-if="viewMode !== 'pan'"
              :rois="rois"
              :tool="tool"
              @add-roi="$emit('add-roi', $event)"
              @remove-roi="$emit('remove-roi', $event)"
          />
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
      </div>
      <div class="orient">R</div>
      <p v-if="imageError" class="image-error">이미지를 불러오지 못했습니다.</p>
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
    }
  },
  emits: ['add-roi', 'remove-roi'],
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
    }
  },
  computed: {
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
    }
  }
}
</script>

<style scoped>
.xray-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  /* gap: 8px; */
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

.xray-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  background: #000;
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
</style>
