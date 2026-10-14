<template>
  <button
      type="button"
      class="modality-card"
      :class="{'is-selected': selected}"
      :aria-pressed="selected ? 'true' : 'false'"
      @click="$emit('select', option.id)"
  >
    <span v-if="option.mvp" class="modality-card__mvp">MVP</span>
    <span class="modality-card__thumb" aria-hidden="true">
      <img
          class="modality-card__img"
          :src="option.image"
          :alt="option.label"
          draggable="false"
      >
    </span>
    <span class="modality-card__text">
      <span class="modality-card__label">{{ option.label }}</span>
      <span class="modality-card__desc">{{ option.description }}</span>
    </span>
  </button>
</template>

<script>
export default {
  name: 'ModalityOptionCard',
  props: {
    option: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.modality-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid #e2eaf1;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  color: #1a2b4b;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.modality-card:hover {
  border-color: #9fd9d3;
}

.modality-card.is-selected {
  border-color: #2bb3a8;
  box-shadow: 0 0 0 1px #2bb3a8;
}

.modality-card.is-selected .modality-card__label {
  color: #1a8f86;
}

.modality-card__mvp {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  padding: 3px 7px;
  border-radius: 6px;
  background: #2bb3a8;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.modality-card__thumb {
  //flex: 0 0 72px;
  //width: 72px;
  width: 140px;
  //height: 72px;
  border-radius: 12px;
  overflow: hidden;
  background: #111;
}

.modality-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  user-select: none;
  pointer-events: none;
}

.modality-card__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.modality-card__label {
  font-size: 20px;
  font-weight: 700;
}

.modality-card__desc {
  font-size: 17px;
  color: #7a8798;
}
</style>
