<template>
  <div class="roi-toolbar">
    <div class="tools">
      <button
        type="button"
        :class="{ active: tool === 'circle' }"
        @click="$emit('update:tool', 'circle')"
      >
        원
      </button>
      <button
        type="button"
        :class="{ active: tool === 'box' }"
        @click="$emit('update:tool', 'box')"
      >
        박스
      </button>
      <button
        type="button"
        :class="{ active: tool === 'eraser' }"
        @click="$emit('update:tool', 'eraser')"
      >
        지우기
      </button>
    </div>
    <p class="hint">① ROI를 드래그하여 영역을 지정하세요</p>
    <button type="button" class="submit-btn" @click="$emit('submit')">
      제출
    </button>
  </div>
</template>

<script>
export default {
  name: 'RoiToolbar',
  props: {
    tool: {
      type: String,
      default: 'box'
    }
  },
  emits: ['update:tool', 'submit']
}
</script>

<style scoped>
.roi-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  flex-shrink: 0;
  padding: 0 12px;
  background: #1f2937;
  color: #fff;
  border-radius: 8px 8px 0 0;
}
.tools {
  display: flex;
  gap: 6px;
}
.tools button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #e5e7eb;
  font-size: 13px;
  cursor: pointer;
}
.tools button.active {
  background: #14b8a6;
  color: #fff;
  font-weight: 600;
}
.hint {
  flex: 1;
  margin: 0;
  font-size: 12px;
  color: #cbd5e1;
  text-align: left;
}
.submit-btn {
  padding: 7px 16px;
  border: none;
  border-radius: 6px;
  background: #14b8a6;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.submit-btn:hover {
  background: #0d9488;
}
</style>
