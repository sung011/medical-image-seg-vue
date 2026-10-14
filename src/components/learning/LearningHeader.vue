<template>
  <header class="learning-header">
    <h1 class="learning-header__title">{{ title }}</h1>
    <div class="learning-header__right">
      <button type="button" class="learning-header__bell" aria-label="알림">
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none">
          <path d="M10 2a5 5 0 00-5 5v2.2c0 .7-.2 1.3-.6 1.9L3.5 13h13l-.9-1.9c-.4-.6-.6-1.2-.6-1.9V7a5 5 0 00-5-5z" stroke="#5a6a7e" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M8 15.5a2 2 0 004 0" stroke="#5a6a7e" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>
      <button type="button" class="learning-header__user" @click="$emit('user-menu')">
        <span class="learning-header__avatar">{{ avatarLetter }}</span>
        <span class="learning-header__name">{{ displayName }}</span>
        <span class="learning-header__caret" aria-hidden="true">▾</span>
      </button>
    </div>
  </header>
</template>

<script>
export default {
  name: 'LearningHeader',
  props: {
    title: {
      type: String,
      default: '학습하기'
    },
    displayName: {
      type: String,
      default: '학생'
    }
  },
  computed: {
    avatarLetter() {
      const name = this.displayName || '학'
      return name.charAt(0)
    }
  }
}
</script>

<style scoped>
.learning-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.learning-header__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a2b4b;
  letter-spacing: -0.03em;
}

.learning-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.learning-header__bell {
  width: 40px;
  height: 40px;
  border: 1px solid #e2eaf1;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.learning-header__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border: 1px solid #e2eaf1;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  color: #1a2b4b;
}

.learning-header__avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2bb3a8;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.learning-header__name {
  font-size: 14px;
  font-weight: 600;
}

.learning-header__caret {
  color: #8a96a6;
  font-size: 12px;
}
</style>
