<template>
  <header class="header_main">
    <div class="main-header">
      <router-link class="main-header__brand" to="/main">MedLens</router-link>
      <nav class="main-header__nav" aria-label="메인 메뉴">
        <router-link class="main-header__link" to="/learning">학습</router-link>
        <a class="main-header__link" href="#" @click.prevent>오답노트</a>
        <a class="main-header__link" href="#" @click.prevent>마이페이지</a>
        <button type="button" class="main-header__link main-header__inquiry" @click="onInquiry">
          문의하기
        </button>
      </nav>
      <div v-if="user" class="main-header__user" ref="userMenu">
        <span class="main-header__user-name">{{ user.user_name || user.user_id }}</span>
        <button
          type="button"
          class="main-header__avatar"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-haspopup="true"
          :title="user.user_name || user.user_id"
          @click="onUserMenu"
        >
          <span aria-hidden="true">{{ avatarLetter }}</span>
        </button>
        <div v-if="menuOpen" class="main-header__dropdown">
          <p class="main-header__dropdown-name">{{ user.user_name || user.user_id }}</p>
          <button type="button" class="main-header__logout" @click="onLogout">
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
  name: 'MainHeader',
  data() {
    return {
      user: getUserSession(),
      menuOpen: false
    }
  },
  computed: {
    avatarLetter() {
      const name = (this.user && (this.user.user_name || this.user.user_id)) || '학'
      return String(name).charAt(0)
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
    },
    onInquiry() {
      this.menuOpen = false
      this.$emit('open-inquiry')
    }
  }
}
</script>

<style scoped>
.header_main {
  background-color: #ffffff;
  padding: 8px 28px;
  border-top: 3px solid #2f6fed;
  border-bottom: 1px solid #e8edf5;
  box-sizing: border-box;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 0;
}

.main-header__brand {
  font-size: 22px;
  font-weight: 700;
  color: #1a2b4b;
  text-decoration: none;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}

.main-header__nav {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-left: auto;
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

.main-header__inquiry {
  border: none;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
}

.main-header__user {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.main-header__user-name {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.main-header__avatar {
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
  font-weight: 700;
  cursor: pointer;
}

.main-header__avatar:hover {
  background: #16304f;
}

.main-header__dropdown {
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

.main-header__dropdown-name {
  margin: 0 0 8px;
  padding: 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: #1a2b4c;
  white-space: nowrap;
}

.main-header__logout {
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

.main-header__logout:hover {
  background: #eef2f7;
}

@media (max-width: 720px) {
  .header_main {
    padding: 8px 14px;
  }

  .main-header__nav {
    gap: 16px;
  }

  .main-header__user-name {
    display: none;
  }
}
</style>
