<template>
  <header class="med-header">
    <div class="med-header__left">
      <router-link class="logo" to="/">
        <span class="logo-text"></span>
      </router-link>

      <span class="divider" aria-hidden="true"/>

      <span class="mode">CASE SOLVING</span>

      <span class="divider" aria-hidden="true"/>

      <span class="meta">{{ metaLabel }}</span>
    </div>

    <div class="med-header__right">
      <button type="button" class="guide-btn" @click="onGuide">
        <i class="fa fa-question-circle" aria-hidden="true"/>
        <span>가이드</span>
      </button>
      <span class="guide-btn">{{ user.user_name }}</span>
      <div v-if="user" class="user-menu" ref="userMenu">
        <button
            type="button"
            class="avatar-btn"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            aria-haspopup="true"
            :title="user.user_name || user.user_id"
            @click="menuOpen = !menuOpen"
        >
          <i class="fa fa-user" aria-hidden="true"/>
        </button>
        <div v-if="menuOpen" class="user-dropdown">
          <p class="user-dropdown__name">{{ user.user_name || user.user_id }}</p>
          <button type="button" class="user-dropdown__logout" @click="onLogout">
            로그아웃
          </button>
        </div>
      </div>
      <router-link v-else class="login-link" to="/login">로그인</router-link>
    </div>
  </header>
</template>

<script>
import {clearUserSession, getUserSession} from '../login/authSession'

const REVIEW_STORAGE_KEY = 'medlens.review'

const REGION_LABELS = {
  brain: '뇌',
  chest: '흉부',
  abdomen: '복부',
  knee: '무릎'
}

export default {
  name: 'MedHeader',
  data() {
    return {
      user: getUserSession(),
      menuOpen: false
    }
  },
  computed: {
    regionLabel() {
      const region = this.$route.query.region
      if (!region) return ''
      return REGION_LABELS[region] || region
    },
    typeLabel() {
      return this.$route.query.type || ''
    },
    metaLabel() {
      const parts = []
      if (this.regionLabel) parts.push(this.regionLabel)
      if (this.typeLabel) parts.push(this.typeLabel)
      parts.push('문제 풀이')
      return parts.join(' · ')
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
    onGuide() {
      window.alert('가이드 준비 중입니다.')
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
.med-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 56px;
  flex-shrink: 0;
  padding: 0 24px;
  background: #fff;
  border-top: 3px solid #2f6fed;
  border-bottom: 1px solid #e8edf5;
  color: #1a2b4c;
  box-sizing: border-box;
}

.med-header__left,
.med-header__right {
  display: flex;
  align-items: center;
  min-width: 0;
}

.med-header__left {
  gap: 14px;
}

.med-header__right {
  gap: 16px;
  flex-shrink: 0;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
}

.logo-icon {
  position: relative;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logo-icon__ring {
  width: 16px;
  height: 16px;
  border: 2px solid #1e3a5f;
  border-radius: 50%;
  box-sizing: border-box;
}

.logo-icon__cross::before,
.logo-icon__cross::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: #1e3a5f;
  transform: translate(-50%, -50%);
}

.logo-icon__cross::before {
  width: 2px;
  height: 20px;
}

.logo-icon__cross::after {
  width: 20px;
  height: 2px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1e3a5f;
}

.divider {
  width: 1px;
  height: 18px;
  background: #d7dee9;
  flex-shrink: 0;
}

.mode {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #2ec4b6;
}

.meta {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guide-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
}

.guide-btn:hover {
  color: #1e3a5f;
}

.guide-btn .fa {
  font-size: 15px;
}

.user-menu {
  position: relative;
}

.avatar-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: #1e3a5f;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.avatar-btn:hover {
  background: #16304f;
}

.user-dropdown {
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

.user-dropdown__name {
  margin: 0 0 8px;
  padding: 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: #1a2b4c;
  white-space: nowrap;
}

.user-dropdown__logout {
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

.user-dropdown__logout:hover {
  background: #eef2f7;
}

.login-link {
  color: #1e3a5f;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}

@media (max-width: 720px) {
  .med-header {
    padding: 0 14px;
  }

  .meta {
    display: none;
  }

  .guide-btn span {
    display: none;
  }
}
</style>
