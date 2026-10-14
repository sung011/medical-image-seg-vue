<template>
  <header class="header_main">
    <div class="main-header">
      <router-link class="main-header__brand" to="/main">MedLens</router-link>
      <nav class="main-header__nav" aria-label="메인 메뉴">
        <router-link class="main-header__link" to="/learning">학습</router-link>
        <a class="main-header__link" href="#" @click.prevent>오답노트</a>
        <a class="main-header__link" href="#" @click.prevent>마이페이지</a>
      </nav>
    </div>

  </header>
</template>

<script>
export default {
  name: 'MainHeader'
}
</script>

<style scoped>

.header_main {
  background-color: #ffffff;
  padding: 8px 28px;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 18px;
  //border-bottom: 1px dashed #c5d4e0;
}

.main-header__brand {
  font-size: 22px;
  font-weight: 700;
  color: #1a2b4b;
  text-decoration: none;
  letter-spacing: -0.02em;
}

.main-header__nav {
  display: flex;
  align-items: center;
  gap: 28px;
}

.main-header__link {
  font-size: 15px;
  font-weight: 500;
  color: #5a6a7e;
  text-decoration: none;
}

.main-header__link:hover,
.main-header__link.router-link-active {
  color: #1a2b4b;
}
</style>
