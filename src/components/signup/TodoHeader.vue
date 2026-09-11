<template>
  <header class="signup-header">
    <div class="top-logo">MedLens</div>
    <span class="top-span">의료영상을 배우고, 더 깊이 이해하다</span>
  </header>
</template>

<script>
export default {
  name: 'TodoHeader'
}
</script>

<style scoped>
.signup-header {
  background-color: #2c3e50;
  color: white;
  height: 64px;
  padding-left: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.top-logo {
  font-weight: bold;
  font-size: 20px;
  white-space: nowrap;
}
.top-span {
  font-size: 12px;
  white-space: nowrap;
}
</style>
