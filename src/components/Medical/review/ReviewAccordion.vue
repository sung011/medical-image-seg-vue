<template>
  <section class="accordion">
    <button type="button" class="acc-title" @click="$emit('toggle')">
      {{ title }}
      <i class="fa" :class="open ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
    </button>
    <div v-show="open" class="acc-body">
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  name: 'ReviewAccordion',
  props: {
    title: {
      type: String,
      required: true
    },
    open: {
      type: Boolean,
      default: true
    }
  },
  emits: ['toggle']
}
</script>

<style scoped>
.accordion {
  border-top: 1px solid #e5e7eb;
}
.acc-title {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border: none;
  background: transparent;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.acc-body {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.55;
  color: #475569;
}
</style>
