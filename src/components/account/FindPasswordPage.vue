<template>
  <div class="find-page">
    <TodoHeader />
    <div class="find-main">
      <div class="reg-box">
        <span class="re_tite">비밀번호 찾기</span>
        <span class="sub_tite">{{ step === 1 ? '1/2 가입 정보와 비밀번호 찾기 질문의 답을 입력해 주세요' : '2/2 새 비밀번호를 입력해 주세요' }}</span>
        <div class="reg-button">
          <ul>
            <li :class="{ active: step === 1 }">1 본인 확인</li>
            <li :class="{ active: step === 2 }">2 새 비밀번호</li>
          </ul>
        </div>
        <hr>
        <!-- 폼 기본 제출(GET 주소에 답·비밀번호가 붙는 이동)을 막는다. 요청은 버튼의 verify/reset(POST)만 쓴다. -->
        <form novalidate autocomplete="off" @submit.prevent>
          <div v-show="step === 1" class="step-1">
            <div class="text-r">
              <label for="find-user-id">이메일 아이디</label>
              <input id="find-user-id" v-model="userId" type="text" maxlength="254" autocomplete="username" :disabled="busy" placeholder="가입한 이메일 아이디"/>
            </div>
            <div class="text-r">
              <label for="find-user-name">이름 (닉네임)</label>
              <input id="find-user-name" v-model="userName" type="text" maxlength="10" autocomplete="off" :disabled="busy" placeholder="가입할 때 입력한 이름"/>
            </div>
            <div class="text-r">
              <label for="find-user-birth">생년월일</label>
              <input id="find-user-birth" :value="userBirth" type="text" inputmode="numeric" maxlength="10" autocomplete="off" :disabled="busy"
                     :class="{ 'is-invalid': birthError }" :aria-invalid="birthError ? 'true' : 'false'" aria-describedby="find-user-birth-msg"
                     placeholder="YYYY-MM-DD (예: 2000-01-01)" @input="onBirthInput" @blur="birthTouched = true"/>
              <p v-if="birthError" id="find-user-birth-msg" class="field-msg field-msg--under is-error" role="alert">{{ birthError }}</p>
            </div>

            <div class="text-r recovery-q">
              <span class="recovery-q__title">비밀번호 찾기 질문</span>
              <span class="recovery-q__hint">가입할 때 고른 질문과 그 답을 입력해 주세요. 영문 대소문자와 앞뒤·연속 공백은 구분하지 않아요.</span>
            </div>
            <div class="text-r">
              <label for="find-question">등록한 질문</label>
              <select id="find-question" v-model="selectedQuestion" :disabled="busy">
                <option disabled value="">질문을 선택해 주세요</option>
                <option v-for="q in choiceQuestions" :key="q.id" :value="q.id">{{ q.label }}</option>
              </select>
            </div>
            <div class="text-r">
              <label for="find-answer">답</label>
              <input id="find-answer" v-model="selectedAnswer" type="text" maxlength="50" autocomplete="off" :disabled="busy" placeholder="답을 입력해 주세요."/>
            </div>

            <p v-if="message" class="form-msg is-error" role="alert">{{ message }}</p>
            <div class="text-r">
              <button type="button" class="btn-main" :disabled="busy" @click="verify">{{ busy ? '확인 중…' : '본인 확인' }}</button>
            </div>
          </div>

          <div v-show="step === 2" class="step-2">
            <p class="form-msg is-ok">본인 확인이 끝났어요. 새 비밀번호를 정해 주세요.</p>
            <div class="text-r">
              <label for="find-new-pw">새 비밀번호</label>
              <input id="find-new-pw" v-model="newPw" type="password" maxlength="72" autocomplete="new-password" :disabled="busy" placeholder="4글자 이상"/>
            </div>
            <div class="text-r">
              <label for="find-new-pw2">새 비밀번호 확인</label>
              <input id="find-new-pw2" v-model="newPw2" type="password" maxlength="72" autocomplete="new-password" :disabled="busy" placeholder="한 번 더 입력해 주세요."/>
            </div>
            <p v-if="message" class="form-msg is-error" role="alert">{{ message }}</p>
            <div class="text-r">
              <div class="w30">
                <button type="button" :disabled="busy" @click="backToStep1">이전</button>
              </div>
              <div class="w70">
                <button type="button" class="btn-main" :disabled="busy" @click="reset">{{ busy ? '변경 중…' : '비밀번호 변경' }}</button>
              </div>
            </div>
          </div>
        </form>
        <div class="text-r links">
          <router-link to="/login">로그인으로 돌아가기</router-link>
          <router-link to="/find-id">아이디 찾기</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TodoHeader from '../signup/TodoHeader.vue'
import { showMessage } from '../../notify'
import {
  CHOICE_QUESTIONS, answerProblem, birthProblem, errorText, formatBirth, isOk, passwordProblem, postJson
} from './findPasswordApi'

export default {
  name: 'FindPasswordPage',
  components: { TodoHeader },
  data () {
    return {
      step: 1,
      userId: '',
      userName: '',
      userBirth: '',
      birthTouched: false,
      choiceQuestions: CHOICE_QUESTIONS,
      // 답·새 비밀번호는 메모리에만 둔다(주소·저장소·콘솔에 쓰지 않는다)
      selectedQuestion: '',
      selectedAnswer: '',
      newPw: '',
      newPw2: '',
      message: '',
      busy: false,
      alive: true
    }
  },
  computed: {
    birthError () {
      if (!this.userBirth) return this.birthTouched ? '생년월일을 입력해 주세요.' : ''
      if (!this.birthTouched && this.userBirth.length < 10) return ''
      return birthProblem(this.userBirth)
    }
  },
  watch: {
    selectedQuestion () {
      this.selectedAnswer = ''
    }
  },
  beforeUnmount () {
    // 화면을 떠나면 진행 중인 결과로 안내·이동하지 않고, 답·비밀번호를 메모리에서 지운다.
    this.alive = false
    this.clearSecrets()
  },
  methods: {
    clearSecrets () {
      this.selectedAnswer = ''
      this.newPw = ''
      this.newPw2 = ''
    },
    onBirthInput (event) {
      const formatted = formatBirth(event.target.value)
      this.userBirth = formatted
      if (event.target.value !== formatted) event.target.value = formatted
    },
    identityProblem () {
      if (!this.userId.trim() || !this.userName.trim()) return '이메일 아이디와 이름을 입력해 주세요.'
      this.birthTouched = true
      const birth = birthProblem(this.userBirth)
      if (birth) return birth
      if (!this.choiceQuestions.some(q => q.id === this.selectedQuestion)) return '등록한 질문을 선택해 주세요.'
      return answerProblem(this.selectedAnswer)
    },
    payload () {
      const answers = [{ question_id: this.selectedQuestion, answer: this.selectedAnswer }]
      return { user_id: this.userId.trim(), user_name: this.userName.trim(), user_birth: this.userBirth, answers }
    },
    async verify () {
      if (this.busy) return
      const problem = this.identityProblem()
      if (problem) {
        this.message = problem
        return
      }
      this.busy = true
      this.message = ''
      let result = null
      try {
        result = await postJson('/find-pw/verify', this.payload())
      } catch (err) {
        result = null
      } finally {
        this.busy = false
      }
      if (!this.alive) return
      if (isOk(result)) {
        this.newPw = ''
        this.newPw2 = ''
        this.step = 2
        return
      }
      this.message = result ? errorText(result.status, result.data, 1) : errorText(0, null, 1)
    },
    backToStep1 () {
      if (this.busy) return
      this.newPw = ''
      this.newPw2 = ''
      this.message = ''
      this.step = 1
    },
    async reset () {
      if (this.busy) return
      const problem = passwordProblem(this.newPw, this.newPw2)
      if (problem) {
        this.message = problem
        return
      }
      this.busy = true
      this.message = ''
      let result = null
      try {
        result = await postJson('/find-pw', { ...this.payload(), user_pw: this.newPw, user_pw_confirm: this.newPw2 })
      } catch (err) {
        result = null
      } finally {
        this.busy = false
      }
      if (!this.alive) return
      if (isOk(result)) {
        this.clearSecrets()
        await showMessage('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.', 'success')
        if (this.alive) this.$router.push('/login')
        return
      }
      if (result && result.status === 404) {
        // 그 사이 답·정보가 바뀌었을 수 있다 → 1단계에서 다시 확인
        this.newPw = ''
        this.newPw2 = ''
        this.step = 1
      }
      this.message = result ? errorText(result.status, result.data, 2) : errorText(0, null, 2)
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
/* 가입 화면(TodoRegisterInput)과 같은 카드·입력·버튼 모양 */
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
.reg-button {
  margin-top: 18px;
}
.reg-button ul {
  display: flex;
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.reg-button ul li {
  min-width: 87px;
  padding: 0 10px;
  box-sizing: border-box;
  height: 31px;
  border: 1px solid #e5e9f0;
  background-color: #fff;
  border-radius: 20px;
  text-align: center;
  line-height: 31px;
  font-size: 12px;
  font-weight: bold;
  color: #5c6579;
}
.reg-button ul li + li {
  margin-left: 10px;
}
.reg-button ul .active {
  border: 1px solid #2ec4b6;
  background-color: #2ec4b6;
  color: #000000;
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
.text-r input,
.text-r select {
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
.w30 {
  width: calc(30% - 12px);
  margin-right: 12px;
  display: inline-block;
}
.w70 {
  width: 70%;
  display: inline-block;
}
.recovery-q__title {
  display: block;
  font-weight: bold;
  margin-bottom: 4px;
}
.recovery-q__hint {
  display: block;
  color: #5c6579;
  font-size: 12px;
  margin-bottom: 12px;
}
.field-msg {
  display: block;
  color: #5c6579;
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
.is-ok {
  color: #167466;
  font-weight: bold;
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
