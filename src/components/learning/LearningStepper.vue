<template>
  <ol class="learning-stepper" aria-label="학습 설정 단계">
    <li
      class="learning-stepper__item"
      :class="{'is-on': regionSelected}"
    >
      <span class="learning-stepper__badge">1</span>
      <span class="learning-stepper__label">부위 선택</span>
    </li>
    <li
      class="learning-stepper__line"
      :class="{'is-on': regionSelected && modalitySelected}"
      aria-hidden="true"
    />
    <li
      class="learning-stepper__item"
      :class="{'is-on': modalitySelected}"
    >
      <span class="learning-stepper__badge">2</span>
      <span class="learning-stepper__label">영상 종류</span>
    </li>
  </ol>
</template>

<script>
export default {
  name: 'LearningStepper',
  props: {
    regionSelected: {
      type: Boolean,
      default: false
    },
    modalitySelected: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.learning-stepper {
  margin: 0 0 28px;
  padding: 0;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.learning-stepper__item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9aa6b5;
  font-size: 14px;
  font-weight: 600;
}

.learning-stepper__badge {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e8eef3;
  color: #8a96a6;
  font-size: 13px;
  transition: background 0.15s ease, color 0.15s ease;
}

.learning-stepper__item.is-on {
  color: #1a8f86;
}

.learning-stepper__item.is-on .learning-stepper__badge {
  background: #2bb3a8;
  color: #fff;
}

.learning-stepper__line {
  width: 72px;
  height: 2px;
  margin: 0 14px;
  background: #d7e1ea;
  list-style: none;
  transition: background 0.15s ease;
}

.learning-stepper__line.is-on {
  background: #2bb3a8;
}

@media (max-width: 720px) {
  .learning-stepper {
    flex-wrap: wrap;
    gap: 12px;
  }

  .learning-stepper__line {
    display: none;
  }
}
</style>
