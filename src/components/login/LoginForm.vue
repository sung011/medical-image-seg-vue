<template>
  <section class="login-form">
    <div class="login-form__inner">
      <h2 class="login-form__title">로그인</h2>

      <form class="login-form__fields" @submit.prevent="onSubmit">
        <label class="login-form__field">
          <span class="sr-only">아이디/이메일</span>
          <input
            v-model.trim="email"
            type="text"
            name="email"
            autocomplete="username"
            placeholder="아이디/이메일"
          >
          <i class="fa fa-envelope-o login-form__icon" aria-hidden="true" />
        </label>

        <label class="login-form__field">
          <span class="sr-only">비밀번호</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="비밀번호"
          >
          <i class="fa fa-lock login-form__icon" aria-hidden="true" />
        </label>

        <p v-if="errorMessage" class="login-form__error">{{ errorMessage }}</p>

        <button class="login-form__submit" type="submit" :disabled="loading">
          {{ loading ? '로그인 중…' : '로그인' }}
        </button>
      </form>

      <div class="login-form__divider" role="separator">
        <span>또는</span>
      </div>

      <router-link class="login-form__signup" to="/signup">회원가입</router-link>

      <p class="login-form__footer">교육·학습용 서비스</p>
    </div>
  </section>
</template>

<script>
export default {
  name: 'LoginForm',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    onSubmit() {
      if (this.loading) return
      if (!this.email || !this.password) {
        this.$emit('login-error', '아이디/이메일과 비밀번호를 입력해 주세요.')
        return
      }
      this.$emit('login', {
        userId: this.email,
        userPw: this.password
      })
    }
  }
}
</script>

<style scoped>
.login-form {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 28px 32px;
  background: #fff;
  box-sizing: border-box;
}

.login-form__inner {
  width: 100%;
  max-width: 360px;
  text-align: center;
}

.login-form__title {
  margin: 0 0 28px;
  font-size: 28px;
  font-weight: 700;
  color: #1a2b4c;
  letter-spacing: -0.02em;
}

.login-form__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-form__field {
  position: relative;
  display: block;
}

.login-form__field input {
  width: 100%;
  height: 48px;
  padding: 0 44px 0 14px;
  border: 1px solid #d7dde8;
  border-radius: 8px;
  background: #fff;
  box-sizing: border-box;
  font-size: 14px;
  color: #1a2b4c;
  outline: none;
  transition: border-color 0.15s ease;
}

.login-form__field input::placeholder {
  color: #9aa3b5;
}

.login-form__field input:focus {
  border-color: #5ab2b2;
}

.login-form__icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #b0b8c9;
  font-size: 15px;
  pointer-events: none;
}

.login-form__error {
  margin: 4px 0 0;
  font-size: 13px;
  color: #d64545;
  text-align: left;
}

.login-form__submit {
  width: 100%;
  height: 48px;
  margin-top: 8px;
  border: none;
  border-radius: 8px;
  background: #5ab2b2;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.login-form__submit:hover:not(:disabled) {
  background: #4ea3a3;
}

.login-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-form__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0 18px;
  color: #9aa3b5;
  font-size: 13px;
}

.login-form__divider::before,
.login-form__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e9f0;
}

.login-form__signup {
  display: inline-block;
  color: #5ab2b2;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.login-form__signup:hover {
  text-decoration: underline;
}

.login-form__footer {
  margin: 36px 0 0;
  font-size: 12px;
  color: #9aa3b5;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (min-width: 768px) {
  .login-form {
    padding: 56px 48px 40px;
  }

  .login-form__title {
    font-size: 32px;
    margin-bottom: 32px;
  }
}
</style>
