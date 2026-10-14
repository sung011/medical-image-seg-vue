<template>
  <button
      type="button"
      class="region-card"
      :class="{'is-selected': selected}"
      :aria-pressed="selected ? 'true' : 'false'"
      @click="$emit('select', option.id)"
  >
    <span v-if="option.mvp" class="region-card__mvp">MVP</span>
    <span class="region-card__illust" aria-hidden="true">
      <img
          class="region-card__img"
          :src="option.image"
          :alt="option.label"
          draggable="false"
      >
    </span>
    <span class="region-card__label">{{ option.label }}</span>
  </button>
</template>

<script>
export default {
  name: 'RegionOptionCard',
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
.region-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 22px 12px 18px;
  border: 1.5px solid #e2eaf1;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  color: #1a2b4b;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  height: 250px;
  justify-content: flex-start;
}

.region-card:hover {
  border-color: #9fd9d3;
}

.region-card.is-selected {
  border-color: #2bb3a8;
  box-shadow: 0 0 0 1px #2bb3a8;
  color: #1a8f86;
}

.region-card__mvp {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 7px;
  border-radius: 6px;
  background: #2bb3a8;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.region-card__illust {
  //width: 96px;
  width: 165px;
  //height: 96px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.region-card__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  pointer-events: none;
}

.region-card__label {
  font-size: 15px;
  font-weight: 700;
}
</style>
