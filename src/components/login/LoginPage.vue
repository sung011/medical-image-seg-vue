<template>
  <div class="login-page">
    <div class="login-page__card">
      <LoginBrandPanel class="login-page__brand" />
      <LoginForm
        class="login-page__form"
        :loading="loading"
        :error-message="errorMessage"
        @login="onLogin"
        @login-error="onLoginError"
      />
    </div>
  </div>
</template>

<script>
import LoginBrandPanel from './LoginBrandPanel.vue'
import LoginForm from './LoginForm.vue'
import { saveUserSession } from './authSession'
import { API_BASE, apiCredentials } from '../../apiBase'

const LOGIN_API = `${API_BASE}/login`

export default {
  name: 'LoginPage',
  components: {
    LoginBrandPanel,
    LoginForm
  },
  data() {
    return {
      loading: false,
      errorMessage: ''
    }
  },
  methods: {
    onLoginError(message) {
      this.errorMessage = message
    },
    async onLogin({ userId, userPw }) {
      this.loading = true
      this.errorMessage = ''

      try {
        const res = await fetch(LOGIN_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: apiCredentials(),
          body: JSON.stringify({ userId, userPw })
        })
        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data.ok) {
          const detail = data.detail
          const message =
            (typeof detail === 'string' && detail) ||
            (detail && typeof detail === 'object' && typeof detail.message === 'string' && detail.message) ||
            data.message ||
            '아이디 또는 비밀번호가 올바르지 않습니다.'
          throw new Error(message)
        }

        saveUserSession(data)
        await this.$router.push('/main')
      } catch (e) {
        const msg = e && e.message ? String(e.message) : ''
        if (/failed to fetch|networkerror|network|load failed|unavailable/i.test(msg)) {
          this.errorMessage =
            '서버에 연결하지 못했습니다. npm run serve 를 재시작한 뒤 다시 시도해 주세요.'
        } else {
          this.errorMessage = msg || '로그인에 실패했습니다.'
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
  background: #f3f5f9;
}

.login-page__card {
  width: min(100%, 920px);
  display: grid;
  grid-template-columns: 1fr;
  overflow: hidden;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 40px rgba(26, 43, 76, 0.12);
}

.login-page__brand,
.login-page__form {
  min-width: 0;
}

@media (min-width: 768px) {
  .login-page__card {
    grid-template-columns: 1fr 1fr;
    min-height: 520px;
  }
}
</style>
