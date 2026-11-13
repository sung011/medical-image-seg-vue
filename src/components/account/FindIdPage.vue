<template>
  <div class="find-page">
    <TodoHeader />
    <div class="find-main">
      <div class="reg-box">
        <span class="re_tite">아이디 찾기</span>
        <span class="sub_tite">가입할 때 입력한 이름과 생년월일로 아이디를 찾아요. 아이디는 일부만 보여 드려요.</span>
        <hr>
        <!-- 폼 기본 제출(GET 주소에 이름·생년월일이 붙는 이동)을 막는다. 요청은 '아이디 찾기' 버튼의 POST 만 쓴다. -->
        <form novalidate autocomplete="off" @submit.prevent>
          <div class="text-r">
            <label for="find-id-name">이름 (닉네임)</label>
            <input id="find-id-name" v-model="userName" type="text" maxlength="10" autocomplete="off" :disabled="busy" placeholder="가입할 때 입력한 이름"/>
          </div>
          <div class="text-r">
            <label for="find-id-birth">생년월일</label>
            <input id="find-id-birth" :value="userBirth" type="text" inputmode="numeric" maxlength="10" autocomplete="off" :disabled="busy"
                   :class="{ 'is-invalid': birthError }" :aria-invalid="birthError ? 'true' : 'false'" aria-describedby="find-id-birth-msg"
                   placeholder="YYYY-MM-DD (예: 2000-01-01)" @input="onBirthInput" @blur="birthTouched = true"/>
            <p v-if="birthError" id="find-id-birth-msg" class="field-msg field-msg--under is-error" role="alert">{{ birthError }}</p>
          </div>
          <p v-if="message" class="form-msg is-error" role="alert">{{ message }}</p>
          <div class="text-r">
            <button type="button" class="btn-main" :disabled="busy" @click="search">{{ busy ? '찾는 중…' : '아이디 찾기' }}</button>
          </div>
        </form>

        <div v-if="foundIds.length" class="result" aria-live="polite" data-testid="find-id-result">
          <p class="result__title">{{ resultTitle }}</p>
          <ul class="result__list">
            <li v-for="(id, i) in foundIds" :key="i">{{ id }}</li>
          </ul>
          <p v-if="foundTotal > foundIds.length" class="result__more" data-testid="find-id-more">같은 이름·생년월일로 가입한 아이디가 많아 앞의 {{ foundIds.length }}개만 보여 드려요. 나머지 {{ foundTotal - foundIds.length }}개는 관리자에게 문의해 주세요.</p>
          <p class="result__hint">개인정보 보호를 위해 아이디 일부를 가렸어요. 전체 아이디가 기억나지 않으면 관리자에게 문의해 주세요.</p>
          <div class="text-r result__actions">
            <div class="w50">
              <button type="button" @click="go('/find-password')">비밀번호 찾기</button>
            </div>
            <div class="w50">
              <button type="button" class="btn-main" @click="go('/login')">로그인하기</button>
            </div>
          </div>
        </div>

        <div class="text-r links">
          <router-link to="/login">로그인으로 돌아가기</router-link>
          <router-link to="/find-password">비밀번호 찾기</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TodoHeader from '../signup/TodoHeader.vue'
import { birthProblem, findIdErrorText, formatBirth, maskedIdsFrom, postJson } from './findPasswordApi'

export default {
  name: 'FindIdPage',
  components: { TodoHeader },
  data () {
    return {
      userName: '',
      userBirth: '',
      birthTouched: false,
      foundIds: [],
      foundTotal: 0,
      message: '',
      busy: false,
      alive: true
    }
  },
  computed: {
    resultTitle () {
      if (this.foundTotal === 1) return '가입한 아이디를 찾았어요.'
      return `가입한 아이디 ${this.foundTotal}개를 찾았어요.`
    },
    birthError () {
      if (!this.userBirth) return this.birthTouched ? '생년월일을 입력해 주세요.' : ''
      if (!this.birthTouched && this.userBirth.length < 10) return ''
      return birthProblem(this.userBirth)
    }
  },
  watch: {
    // 입력을 바꾸면 이전 결과를 지운다(다른 사람의 결과가 남아 보이지 않게)
    userName () { this.clearResult() },
    userBirth () { this.clearResult() }
  },
  beforeUnmount () {
    this.alive = false
    this.clearResult()
  },
  methods: {
    clearResult () {
      this.foundIds = []
      this.foundTotal = 0
    },
    onBirthInput (event) {
      const formatted = formatBirth(event.target.value)
      this.userBirth = formatted
      if (event.target.value !== formatted) event.target.value = formatted
    },
    async search () {
      if (this.busy) return
      this.clearResult()
      if (!this.userName.trim()) {
        this.message = '이름을 입력해 주세요.'
        return
      }
      this.birthTouched = true
      const birth = birthProblem(this.userBirth)
      if (birth) {
        this.message = birth
        return
      }
      this.busy = true
      this.message = ''
      let result = null
      try {
        result = await postJson('/find-id', { user_name: this.userName.trim(), user_birth: this.userBirth })
      } catch (err) {
        result = null
      } finally {
        this.busy = false
      }
      if (!this.alive) return
      const found = maskedIdsFrom(result)
      if (found) {
        this.foundIds = found.ids
        this.foundTotal = found.total
        return
      }
      this.message = findIdErrorText(result)
    },
    go (path) {
      this.clearResult()
      this.$router.push(path)
    }
  }
}
</script>

<style scoped>
.find-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #f6f8fc;
}
.find-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 16px 48px;
  box-sizing: border-box;
}
/* 가입·비밀번호 찾기 화면과 같은 카드·입력·버튼 모양 */
.reg-box {
  box-sizing: border-box;
  width: min(100%, 640px);
  border: 1px solid #e5e9f0;
  background: #fff;
  border-radius: 8px;
  margin: 0 auto;
  padding: 36px 40px;
  text-align: left;
}
.re_tite {
  font-size: 28px;
  font-weight: bold;
  display: block;
}
.sub_tite {
  font-size: 13px;
  color: #5c6579;
  display: block;
  margin-top: 18px;
}
hr {
  margin: 18px 0;
  border: 1px solid #e5e9f0;
}
.text-r {
  text-align: left;
  font-size: 13px;
  color: #1b2a57;
  margin-bottom: 8px;
  display: block;
}
.text-r label {
  display: block;
  margin-bottom: 8px;
}
.text-r input {
  width: 100%;
  height: 48px;
  border: 1px solid #e5e9f0;
  border-radius: 4px;
  padding-left: 12px;
  box-sizing: border-box;
  background-color: #f6f8fc;
  margin-bottom: 26px;
}
.text-r input.is-invalid {
  border-color: #d93025;
  background-color: #fff6f5;
}
.text-r button {
  width: 100%;
  height: 48px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 18px;
  cursor: pointer;
  color: #1b2a57;
  border: 1px solid #e5e9f0;
  background-color: #fff;
}
.text-r .btn-main {
  border: 1px solid #2ec4b6;
  background-color: #2ec4b6;
  color: white;
}
.text-r button:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.field-msg {
  display: block;
  font-size: 12px;
}
.field-msg--under {
  margin: -20px 0 18px;
}
.form-msg {
  font-size: 13px;
  margin: 0 0 14px;
}
.is-error {
  color: #d93025;
}
.result {
  border: 1px solid #2ec4b6;
  background: #e8f8f6;
  border-radius: 6px;
  padding: 18px 18px 6px;
  margin: 4px 0 18px;
}
.result__title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: bold;
  color: #167466;
}
.result__list {
  margin: 0 0 10px;
  padding-left: 18px;
  font-size: 15px;
  color: #1b2a57;
  word-break: break-all;
}
.result__list li + li {
  margin-top: 4px;
}
.result__more {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: bold;
  color: #1b2a57;
}
.result__hint {
  margin: 0 0 14px;
  font-size: 12px;
  color: #5c6579;
}
.result__actions {
  display: flex;
  gap: 12px;
}
.w50 {
  flex: 1;
}
.links {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
}
.links a {
  color: #2ec4b6;
  font-size: 12px;
  text-decoration: none;
}
@media (max-width: 640px) {
  .reg-box {
    padding: 28px 20px;
  }
  .re_tite {
    font-size: 24px;
  }
}
</style>
