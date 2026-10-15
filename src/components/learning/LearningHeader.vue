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
      <div v-if="user" class="learning-header__user-wrap" ref="userMenu">
        <button
          type="button"
          class="learning-header__user"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-haspopup="true"
          @click="onUserMenu"
        >
          <span class="learning-header__avatar">{{ avatarLetter }}</span>
          <span class="learning-header__name">{{ displayName }}</span>
          <span class="learning-header__caret" aria-hidden="true">▾</span>
        </button>
        <div v-if="menuOpen" class="learning-header__dropdown">
          <p class="learning-header__dropdown-name">{{ displayName }}</p>
          <button type="button" class="learning-header__logout" @click="onLogout">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import {clearUserSession, getUserSession} from '../login/authSession'

const REVIEW_STORAGE_KEY = 'medlens.review'

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
  data() {
    return {
      user: getUserSession(),
      menuOpen: false
    }
  },
  computed: {
    avatarLetter() {
      const name = this.displayName || '학'
      return name.charAt(0)
    }
  },
  mounted() {
    document.addEventListener('click', this.onDocClick)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocClick)
  },
  methods: {
    onDocClick(e) {
      const menu = this.$refs.userMenu
      if (menu && !menu.contains(e.target)) {
        this.menuOpen = false
      }
    },
    onUserMenu() {
      this.menuOpen = !this.menuOpen
    },
    onLogout() {
      this.menuOpen = false
      clearUserSession()
      sessionStorage.removeItem(REVIEW_STORAGE_KEY)
      this.user = null
      this.$router.push('/login')
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

.learning-header__user-wrap {
  position: relative;
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
  background: #1e3a5f;
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

.learning-header__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  padding: 10px;
  border: 1px solid #e5e9f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(26, 43, 76, 0.12);
  z-index: 20;
}

.learning-header__dropdown-name {
  margin: 0 0 8px;
  padding: 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: #1a2b4c;
  white-space: nowrap;
}

.learning-header__logout {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e9f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.learning-header__logout:hover {
  background: #eef2f7;
}
</style>
