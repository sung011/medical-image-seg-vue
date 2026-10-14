<template>
  <button
    type="button"
    class="learning-start"
    :disabled="disabled"
    @click="$emit('start')"
  >
    학습 시작
  </button>
</template>

<script>
export default {
  name: 'LearningStartButton',
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.learning-start {
  width: 100%;
  padding: 16px 20px;
  border: 0;
  border-radius: 12px;
  background: #2bb3a8;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.learning-start:hover:not(:disabled) {
  background: #239991;
}

.learning-start:disabled {
  background: #b7d9d5;
  cursor: not-allowed;
}
</style>
