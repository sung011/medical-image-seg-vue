<template>
  <header class="signup-header">
    <div class="top-logo">
      <BrandMark tone="light"/>
    </div>
    <span class="top-span">의료영상을 배우고, 더 깊이 이해하다</span>
  </header>
</template>

<script>
import BrandMark from '../main/BrandMark.vue'

export default {
  name: 'TodoHeader',
  components: {
    BrandMark
  }
}
</script>

<style scoped>
.signup-header {
  background-color: #1a2b4b;
  color: white;
  height: 64px;
  padding-left: 28px;
  border-top: 3px solid #2f6fed;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}
.top-logo {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
.top-span {
  font-size: 12px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.82);
}

@media (max-width: 720px) {
  .signup-header {
    padding-left: 14px;
  }

  .top-span {
    display: none;
  }
}
</style>
