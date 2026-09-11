<template>
  <div
    ref="layer"
    class="roi-layer"
    :class="{ eraser: tool === 'eraser' }"
    @mousedown.prevent="onMouseDown"
  >
    <div
      v-for="roi in rois"
      :key="roi.id"
      class="roi-shape"
      :class="[roi.type, { erasable: tool === 'eraser' }]"
      :style="shapeStyle(roi)"
      @mousedown.stop.prevent="onRoiMouseDown(roi)"
    />
    <div
      v-if="draft"
      class="roi-shape draft"
      :class="draft.type"
      :style="shapeStyle(draft)"
    />
  </div>
</template>

<script>
export default {
  name: 'RoiLayer',
  props: {
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
      drawing: false,
      start: null,
      draft: null
    }
  },
  mounted() {
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
  },
  methods: {
    shapeStyle(roi) {
      return {
        left: `${roi.x}%`,
        top: `${roi.y}%`,
        width: `${roi.w}%`,
        height: `${roi.h}%`,
        borderRadius: roi.type === 'circle' ? '50%' : '0'
      }
    },
    getPoint(event) {
      const el = this.$refs.layer
      const rect = el.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100
      return {
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y))
      }
    },
    onMouseDown(event) {
      if (this.tool !== 'box' && this.tool !== 'circle') return
      this.drawing = true
      this.start = this.getPoint(event)
      this.draft = {
        type: this.tool,
        x: this.start.x,
        y: this.start.y,
        w: 0,
        h: 0
      }
    },
    onMouseMove(event) {
      if (!this.drawing || !this.start) return
      const point = this.getPoint(event)
      const x = Math.min(this.start.x, point.x)
      const y = Math.min(this.start.y, point.y)
      const w = Math.abs(point.x - this.start.x)
      const h = Math.abs(point.y - this.start.y)
      this.draft = { ...this.draft, x, y, w, h }
    },
    onMouseUp() {
      if (!this.drawing) return
      this.drawing = false
      if (this.draft && this.draft.w > 1.5 && this.draft.h > 1.5) {
        this.$emit('add-roi', {
          id: Date.now(),
          type: this.draft.type,
          x: this.draft.x,
          y: this.draft.y,
          w: this.draft.w,
          h: this.draft.h
        })
      }
      this.draft = null
      this.start = null
    },
    onRoiMouseDown(roi) {
      if (this.tool === 'eraser') {
        this.$emit('remove-roi', roi.id)
      }
    }
  }
}
</script>

<style scoped>
.roi-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  cursor: crosshair;
  touch-action: none;
}
.roi-layer.eraser {
  cursor: pointer;
}
.roi-shape {
  position: absolute;
  box-sizing: border-box;
  border: 2px dashed #2dd4bf;
  background: rgba(45, 212, 191, 0.12);
  pointer-events: auto;
}
.roi-shape.draft {
  opacity: 0.75;
  pointer-events: none;
}
.roi-shape.erasable {
  cursor: pointer;
}
</style>
