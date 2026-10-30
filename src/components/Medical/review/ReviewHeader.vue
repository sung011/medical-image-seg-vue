<template>
  <header class="review-header">
    <div class="brand">
      <BrandMark size="sm"/>
      <div class="brand-text">
        <span>SCORING AND EXPLANATION</span>
      </div>
    </div>
    <div class="actions">
      <button type="button" class="btn ghost" @click="$emit('next')">
        다음 문제 가져오기
      </button>
      <button type="button" class="btn primary" @click="$emit('done')">
        풀이완료
      </button>
      <button type="button" class="btn ghost" @click="onLogout">
        로그아웃
      </button>
    </div>
  </header>
</template>

<script>
import { clearUserSession } from '../../login/authSession'
import BrandMark from '../../main/BrandMark.vue'

const REVIEW_STORAGE_KEY = 'medlens.review'

export default {
  name: 'ReviewHeader',
  components: {
    BrandMark
  },
  emits: ['next', 'done'],
  methods: {
    onLogout() {
      clearUserSession()
      sessionStorage.removeItem(REVIEW_STORAGE_KEY)
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
  flex-shrink: 0;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
}
.brand-text span {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: #94a3b8;
}
.actions {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn.ghost {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}
.btn.ghost:hover {
  background: #f8fafc;
}
.btn.primary {
  border: none;
  background: #14b8a6;
  color: #fff;
}
.btn.primary:hover {
  background: #0d9488;
}
</style>
