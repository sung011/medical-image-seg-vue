<template>
  <header class="med-header">
    <div class="brand">
      <span class="logo">MedLens</span>
      <span class="slogan">의료영상을 배우고, 더 깊이 이해하다</span>
    </div>
    <nav class="nav">
      <span class="mode">CASE SOLVING</span>
      <router-link to="/">홈</router-link>
      <a href="#">케이스 목록</a>
      <a href="#">학습 기록</a>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'MedHeader'
}
</script>

<style scoped>
.med-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  flex-shrink: 0;
  padding: 0 24px;
  background: #1e3a5f;
  color: #fff;
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.logo {
  font-size: 20px;
  font-weight: 700;
}
.slogan {
  font-size: 12px;
  opacity: 0.85;
}
.nav {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
}
.mode {
  margin-right: 8px;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.12);
  font-weight: 600;
}
.nav a {
  color: #fff;
  text-decoration: none;
  opacity: 0.9;
}
.nav a:hover {
  opacity: 1;
  text-decoration: underline;
}
</style>
