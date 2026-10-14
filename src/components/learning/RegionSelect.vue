<template>
  <section class="select-block" :class="{'is-selected': Boolean(modelValue)}">
    <h2 class="select-block__title">
      <span class="select-block__num">1</span>
      부위 선택
    </h2>
    <div class="select-block__grid select-block__grid--regions">
      <RegionOptionCard
        v-for="option in options"
        :key="option.id"
        :option="option"
        :selected="option.id === modelValue"
        @select="$emit('update:modelValue', $event)"
      />
    </div>
  </section>
</template>

<script>
import {REGIONS} from './learningOptions'
import RegionOptionCard from './RegionOptionCard.vue'

export default {
  name: 'RegionSelect',
  components: {RegionOptionCard},
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      options: REGIONS
    }
  }
}
</script>

<style scoped>
.select-block {
  margin-bottom: 28px;
}

.select-block__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: #9aa6b5;
  transition: color 0.15s ease;
}

.select-block.is-selected .select-block__title {
  color: #1a2b4b;
}

.select-block__num {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e8eef3;
  color: #8a96a6;
  font-size: 12px;
  transition: background 0.15s ease, color 0.15s ease;
}

.select-block.is-selected .select-block__num {
  background: #2bb3a8;
  color: #fff;
}

.select-block__grid--regions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .select-block__grid--regions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
