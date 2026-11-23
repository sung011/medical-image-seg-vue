<template>
  <div class="login-page">
    <div class="login-page__stack">
      <div v-if="notice" class="login-page__notice" role="status" data-testid="login-notice">
        <p>{{ notice.text }}</p>
        <button
          v-if="notice.retryIdx"
          type="button"
          class="login-page__retry"
          data-testid="logout-retry"
          :disabled="retrying"
          @click="onRetryLogout"
        >
          {{ retrying ? '다시 시도하는 중…' : '서버 로그아웃 다시 시도' }}
        </button>
      </div>
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
  </div>
</template>

<script>
import LoginBrandPanel from './LoginBrandPanel.vue'
import LoginForm from './LoginForm.vue'
import { login, retryServerLogout, takeLoginNotice } from './accountSession'

// 로그인 실패 안내. 서버 원문은 쓰지 않는다.
const LOGIN_ERROR = {
  credentials: '아이디 또는 비밀번호가 올바르지 않습니다.',
  forbidden: '관리자 승인 후 사용할 수 있어요. 승인 여부는 관리자에게 문의해 주세요.',
  limited: '로그인 시도가 너무 많아요. 잠시 후 다시 해 주세요.',
  badinput: '아이디와 비밀번호를 확인해 주세요.',
  config: '학습 서버 설정이 맞지 않아 로그인할 수 없어요. 관리자에게 알려 주세요.',
  unsupported: '이 브라우저 주소에서는 로그인할 수 없어요. http://localhost 또는 http://127.0.0.1 주소로, 최신 Chrome·Edge·Firefox·Safari 에서 열어 주세요.',
  cookie: '로그인을 마치지 못했어요. 잠시 후 다시 로그인해 주세요.',
  network: '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'
}

export default {
  name: 'LoginPage',
  components: {
    LoginBrandPanel,
    LoginForm
  },
  data() {
    return {
      loading: false,
      errorMessage: '',
      notice: takeLoginNotice(),
      retrying: false
    }
  },
  methods: {
    async onRetryLogout() {
      if (!this.notice || !this.notice.retryIdx || this.retrying) return
      this.retrying = true
      const done = await retryServerLogout(this.notice.retryIdx)
      this.retrying = false
      this.notice = done
        ? { text: '서버 로그아웃까지 마쳤어요.' }
        : { ...this.notice, text: '이번에도 서버 로그아웃을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.' }
    },
    onLoginError(message) {
      this.errorMessage = message
    },
    async onLogin({ userId, userPw }) {
      this.loading = true
      this.errorMessage = ''

      try {
        // 같은 출처 로그인 한 번 + 쿠키로 본인 확인까지 끝나야 화면 세션을 저장한다(accountSession.login).
        await login(userId, userPw)
        this.notice = null
        await this.$router.push('/main')
      } catch (e) {
        const kind = e && e.kind
        this.errorMessage = LOGIN_ERROR[kind] || '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
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

.login-page__stack {
  width: min(100%, 920px);
  display: grid;
  gap: 12px;
}

.login-page__notice {
  display: grid;
  gap: 8px;
  justify-items: start;
  padding: 14px 18px;
  border: 1px solid #bfd8f5;
  border-radius: 12px;
  background: #eef6ff;
  color: #1d4f8c;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.login-page__notice p {
  margin: 0;
}

.login-page__retry {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid #1d4f8c;
  border-radius: 999px;
  background: #fff;
  color: #1d4f8c;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.login-page__retry:disabled {
  opacity: 0.6;
  cursor: default;
}

.login-page__card {
  width: 100%;
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
