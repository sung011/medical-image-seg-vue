<template>
  <aside class="side-toolbar">
    <button type="button" title="확대" @click="$emit('zoom-in')">
      <i class="fa fa-search-plus fa-2x mb2"></i>
      <span class="fontS12">확대</span>
    </button>
    <button type="button" title="축소" @click="$emit('zoom-out')">
      <i class="fa fa-search-minus fa-2x mb2"></i>
      <span class="fontS12">축소</span>
    </button>
    <button type="button" title="1:1" @click="$emit('zoom-reset')">
      <span class="fwb mb2">[ 1:1 ]</span>
      <span class="fontS12">기본크기</span>
    </button>
    <button
        type="button"
        title="팬"
        :class="{ active: mode === 'pan' }"
        @click="$emit('update:mode', mode === 'pan' ? 'draw' : 'pan')"
    >
      <i class="fa fa-hand-paper-o fa-2x mb2"></i>
      <span class="fontS12">팬</span>
    </button>
    <button type="button" title="윈도우" @click="$emit('window-toggle')">
      <i class="fa fa-sun-o fa-2x mb2"></i>
      <span class="fontS12">밝기</span>
    </button>
    <button type="button" title="리셋" @click="$emit('reset')">
      <i class="fa fa-refresh fa-2x mb2"></i>
      <span class="fontS12">리셋</span>
    </button>
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
.fontS12 {
  font-size: 12px;
  display: block;
}

.mb2 {
  margin-bottom: 2px;
}

.fwb {
  font-weight: bold;
  display: block;
}

.side-toolbar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 6px;
  background: #111827;
  /* border-radius: 8px; */
  position: absolute;
  left: 10px;
  z-index: 100;
  top: 40px;
  height: 380px;
  border-radius: 20px;
}

.side-toolbar button {
  width: 55px;
  height: 60px;
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
