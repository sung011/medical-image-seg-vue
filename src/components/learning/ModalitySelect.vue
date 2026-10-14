<template>
  <section class="select-block" :class="{'is-selected': Boolean(modelValue)}">
    <h2 class="select-block__title">
      <span class="select-block__num">2</span>
      영상 종류
    </h2>
    <p v-if="!region" class="select-block__hint">부위를 먼저 선택해 주세요.</p>
    <div v-else class="select-block__grid" :style="gridStyle">
      <ModalityOptionCard
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
import {getModalitiesForRegion} from './learningOptions'
import ModalityOptionCard from './ModalityOptionCard.vue'

export default {
  name: 'ModalitySelect',
  components: {ModalityOptionCard},
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    region: {
      type: String,
      default: ''
    }
  },
  computed: {
    options() {
      return getModalitiesForRegion(this.region)
    },
    gridStyle() {
      const count = this.options.length || 1
      return {
        gridTemplateColumns: `repeat(${Math.min(count, 3)}, 1fr)`
      }
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

.select-block__hint {
  margin: 0;
  padding: 18px 16px;
  border: 1px dashed #d5e0e8;
  border-radius: 12px;
  background: #f8fafc;
  color: #8a96a6;
  font-size: 14px;
  text-align: center;
}

.select-block__grid {
  display: grid;
  gap: 12px;
}

@media (max-width: 900px) {
  .select-block__grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
