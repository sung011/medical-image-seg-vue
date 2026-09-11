<template>
  <aside class="side-toolbar">
    <button type="button" title="확대" @click="$emit('zoom-in')">＋</button>
    <button type="button" title="축소" @click="$emit('zoom-out')">－</button>
    <button type="button" title="1:1" @click="$emit('zoom-reset')">1:1</button>
    <button
      type="button"
      title="팬"
      :class="{ active: mode === 'pan' }"
      @click="$emit('update:mode', mode === 'pan' ? 'draw' : 'pan')"
    >
      팬
    </button>
    <button type="button" title="윈도우" @click="$emit('window-toggle')">☀</button>
    <button type="button" title="리셋" @click="$emit('reset')">↺</button>
  </aside>
</template>

<script>
export default {
  name: 'ImageSideToolbar',
  props: {
    mode: {
      type: String,
      default: 'draw'
    }
  },
  emits: ['zoom-in', 'zoom-out', 'zoom-reset', 'update:mode', 'window-toggle', 'reset']
}
</script>

<style scoped>
.side-toolbar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 6px;
  background: #111827;
  /* border-radius: 8px; */
}
.side-toolbar button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #f3f4f6;
  font-size: 12px;
  cursor: pointer;
}
.side-toolbar button:hover,
.side-toolbar button.active {
  background: #374151;
}
</style>
