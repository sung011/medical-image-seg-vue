<template>
  <div class="reg-box">
     
        <span class="re_tite">회원가입</span>
        <span class="sub_tite">1/2 계정 정보를 입력해 주세요</span>
        <div class="reg-button">
            <ul>
                <li :class="{ active: isFirstStep }">1 계정 정보</li>
                <li :class="{ active: !isFirstStep }">2 프로필·학교</li>
            </ul>
        </div>
        <hr>
        <!-- 폼 기본 제출(GET 주소에 비밀번호·답이 붙는 이동)을 막는다. 가입은 "가입 완료"의 finish → postSignup(POST) 한 경로만 쓴다(Enter·requestSubmit 으로는 가입하지 않는다). -->
        <form novalidate autocomplete="off" @submit.prevent>
            <div v-show="isFirstStep" class="reg-01">
                <div class="text-r">
                    <label for="email">이메일 아이디 * 필수</label>
                    <div class="field-row">
                        <input ref="emailInput" v-model="email" type="email" id="email" name="email" required maxlength="254" autocomplete="email" :disabled="sendingCode || verifyingCode || submitting" placeholder="name@example.com"/>
                        <button type="button" class="btn-sub" :disabled="sendingCode || verifyingCode || submitting" @click="sendCode">{{ sendingCode ? '보내는 중…' : '인증번호 받기' }}</button>
                    </div>
                </div>
                <div class="text-r">
                    <label for="email-code">이메일 인증번호 * 필수</label>
                    <div class="field-row">
                        <input v-model="emailCode" id="email-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" :disabled="sendingCode || verifyingCode || submitting" aria-describedby="email-code-status" placeholder="숫자 8자리"/>
                        <button type="button" class="btn-sub" :class="{ 'btn-sub--done': emailVerified }" :disabled="sendingCode || verifyingCode || submitting || emailVerified" @click="verifyEmailCode">{{ verifyingCode ? '확인 중…' : emailVerified ? '인증 완료' : '인증번호 확인' }}</button>
                    </div>
                    <p id="email-code-status" class="field-msg" :class="{ 'is-ok': emailVerified, 'is-error': codeError && !emailVerified }" aria-live="polite">{{ codeStatus || '받은 편지함의 인증번호를 입력하고 확인해 주세요.' }}</p>
                </div> 

                <div class="text-r">
                    <label for="password">비밀번호 * 필수</label>  
                    <input v-model="password" type="password" id="password" name="password" placeholder="비밀번호를 입력해 주세요."/>
                </div> 
                <div class="text-r">
                    <label for="repassword">비밀번호 확인 * 필수</label>  
                    <input v-model="repassword" type="password" id="repassword" name="repassword" placeholder="비밀번호를 다시 입력해 주세요."/>
                </div> 
                <div class="text-r">
                    <button type="button" :disabled="sendingCode || verifyingCode || submitting || !emailVerified" @click="nextStep">다음</button>
                </div> 
                <div class="text-r">
                    <router-link to="/login">이미 계정이 있으신가요? 로그인</router-link>
                </div>
                <div class="text-r">
                    <span>가입 후 직군을 선택하면 학습을 시작할 수 있습니다.</span>
                </div>
            </div>
            <div v-show="!isFirstStep" class="reg-02">
                <div class="text-r">
                    <label for="userNickname">이름 (닉네임) 최대 5자</label>  
                    <input v-model="userNickname" type="text" id="userNickname" name="userNickname" maxlength="5" placeholder="이름 (닉네임)을 입력해 주세요."/>
                </div> 
                <div class="text-r">
                    <label for="userBirth">생년월일</label>  
                    <input :value="userBirth" type="text" id="userBirth" name="userBirth" inputmode="numeric" maxlength="10" autocomplete="off" :class="{ 'is-invalid': birthError }" :aria-invalid="birthError ? 'true' : 'false'" aria-describedby="userBirth-msg" placeholder="YYYY-MM-DD (예: 2000-01-01)" @input="onBirthInput" @blur="birthTouched = true"/>
                    <p v-if="birthError" id="userBirth-msg" class="field-msg field-msg--under is-error" role="alert">{{ birthError }}</p>
                </div>
                <div class="text-r">
                    <label for="userSchool">학교</label>  
                    <input v-model="userSchool" type="text" id="userSchool" name="userSchool" placeholder="학교를 입력해 주세요."/>
                </div>
                <div class="text-r">
                    <label for="userMajor">전공</label>  
                    <input v-model="userMajor" type="text" id="userMajor" name="userMajor" placeholder="전공을 입력해 주세요."/>
                </div>

                <!-- 비밀번호 찾기 질문(선택형): 질문 하나를 골라 답 하나를 서버에 해시로만 저장한다. 비밀번호를 잊었을 때 이 답으로 본인을 확인한다. -->
                <div class="text-r recovery-q">
                    <label for="recovery-question" class="recovery-q__title">비밀번호 찾기 질문 * 필수</label>
                    <span class="recovery-q__hint">비밀번호를 잊었을 때 본인 확인에 써요. 남이 쉽게 알 수 없는 답을 적어 주세요. 영문 대소문자와 앞뒤·연속 공백은 구분하지 않아요.</span>
                    <select id="recovery-question" v-model="selectedQuestion" :disabled="submitting" required>
                        <option disabled value="">질문을 선택해 주세요</option>
                        <option v-for="q in questions" :key="q.id" :value="q.id">{{ q.label }}</option>
                    </select>
                </div>
                <div class="text-r">
                    <label for="recovery-answer">선택한 질문의 답 * 필수</label>
                    <input id="recovery-answer" v-model="selectedAnswer" :type="showAnswers ? 'text' : 'password'" maxlength="50" autocomplete="off" :disabled="submitting" placeholder="답을 입력해 주세요."/>
                </div>
                <div class="text-r">
                    <label class="recovery-q__toggle"><input v-model="showAnswers" type="checkbox" data-testid="signup-answer-toggle"/> 입력한 답 보기</label>
                </div>

                <div class="text-r">
                    <div class="w30">
                        <button type="button" :disabled="submitting" @click="isFirstStep = true">이전</button>
                    </div>
                    <div class="w70"> 
                        <button type="button" :disabled="submitting" @click="finish">가입 완료</button>
                    </div>
                </div>
            </div>
        </form>
    </div> 
    
</template>

<script>
import { API_BASE } from '../../apiBase'
import { showMessage } from '../../notify'

// 선택형 질문(security_question_choice_v2). 서버 CHOICE_QUESTION_IDS 와 같은 ID·순서다. 하나만 골라 답한다.
const RECOVERY_QUESTIONS = [
  { id: 'Q01', label: '처음 다닌 초등학교 이름' },
  { id: 'Q02', label: '어릴 때 사용하던 별명' },
  { id: 'Q03', label: '어릴 때 살았던 동네 이름' },
  { id: 'Q04', label: '내 보물 1호' }
]

/** 숫자만 골라 YYYY-MM-DD 모양으로 맞춘다(최대 8자리). */
function formatBirth(text) {
  const d = String(text || '').replace(/[^0-9]/g, '').slice(0, 8)
  if (d.length <= 4) return d
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`
}

/** 생년월일 확인. 형식·미래·만 14세는 서버 user_birth 와 같은 기준, 1900년 하한은 화면 입력 정책(서버에는 없음). 문제가 없으면 ''. */
function birthProblem(value, today = new Date()) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return '생년월일 8자리를 입력해 주세요. 예: 2000-01-01'
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '없는 날짜예요. 월·일을 확인해 주세요.'
  if (y < 1900) return '1900년 이후 날짜로 입력해 주세요.'
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (dt > t) return '오늘 이전 날짜로 입력해 주세요.'
  const age = t.getFullYear() - y - ((t.getMonth() < m - 1 || (t.getMonth() === m - 1 && t.getDate() < d)) ? 1 : 0)
  if (age < 14) return '만 14세 이상 가입할 수 있어요.'
  return ''
}
const FIELD_LABELS = { user_id: '이메일 아이디', email_code: '인증번호', user_pw: '비밀번호', user_name: '이름', user_birth: '생년월일', user_un: '학교', user_sp: '전공' }
const CODE_TEXT = {
  missing: '입력해 주세요.',
  empty: '입력해 주세요.',
  too_long: '너무 길어요.',
  too_short: '너무 짧아요. (비밀번호는 4글자 이상)',
  invalid_type: '형식이 맞지 않아요.',
  future_date: '오늘 이전 날짜로 입력해 주세요.',
  under_age: '만 14세 이상 가입할 수 있어요.',
  invalid_value: '형식을 확인해 주세요.'
}
const SPACES_RE = /\s+/g

/** \uc904\ubc14\uafc8\u00b7\ud0ed \uac19\uc740 \uc81c\uc5b4\ubb38\uc790\uc640 \uc904/\ubb38\ub2e8 \uad6c\ubd84\uc790\uac00 \uc788\ub294\uac00(\uc11c\ubc84\ub3c4 \uac70\uc808\ud55c\ub2e4). */
function hasControl(text) {
  for (const ch of text) {
    const c = ch.codePointAt(0)
    if (c <= 0x1f || (c >= 0x7f && c <= 0x9f) || c === 0x2028 || c === 0x2029) return true
  }
  return false
}

const SIGNUP_TIMEOUT_MS = 15000
const DUPLICATE_TEXT = '이미 사용 중인 아이디입니다.'
const UNKNOWN_TEXT = '가입 결과를 확인하지 못했어요. 같은 아이디로 로그인되는지 먼저 확인해 주세요. (자동으로 다시 보내지 않아요)'

/**
 * 가입 요청 하나. 응답 헤더를 받는 것부터 본문을 다 읽는 것까지 15초 제한을 한 수명으로 묶는다(계정 화면 호출과 같은 기준).
 * 돌려주는 값 { status, data } — data 는 JSON 이 아니면 null. 시간 초과·끊김은 throw.
 */
async function postSignup(path, payload) {
  const controller = new AbortController()
  const stopped = new Promise((resolve, reject) => {
    controller.signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true })
  })
  stopped.catch(() => {})
  const timer = setTimeout(() => controller.abort(), SIGNUP_TIMEOUT_MS)
  try {
    const response = await Promise.race([
      fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: controller.signal
      }),
      stopped
    ])
    const text = await Promise.race([response.text(), stopped])
    let data = null
    try {
      data = JSON.parse(text)
    } catch (e) {
      data = null
    }
    return { status: response.status, data }
  } finally {
    clearTimeout(timer)
  }
}

/** 성공 계약: 200 + JSON ok===true + 회원 번호(양의 정수)·보낸 아이디와 같은 user_id·이름 문자열. 하나라도 다르면 성공으로 보지 않는다. */
function isSignupSuccess(result, userId) {
  const d = result && result.data
  return !!result && result.status === 200 && !!d && typeof d === 'object' && d.ok === true &&
    Number.isInteger(d.idx) && d.idx > 0 && d.user_id === userId && typeof d.user_name === 'string'
}

/** 서버 오류를 고정 안내 문구로 바꾼다. 422 는 {loc, code} 만 쓰고 서버 원문·입력 값은 쓰지 않는다. 409 도 고정 문구. */
function signupError(status, payload, fallback) {
  const detail = payload && payload.detail
  if (status === 409) return DUPLICATE_TEXT
  if (status === 503) return '지금은 점검 중이에요. 잠시 후 다시 시도해 주세요.'
  if (status === 422 && Array.isArray(detail) && detail.length) {
    const lines = []
    for (const item of detail) {
      const loc = item && Array.isArray(item.loc) ? item.loc : []
      const code = item && typeof item.code === 'string' ? item.code : 'invalid_value'
      let line
      if (loc[1] === 'recovery_answers') {
        if (code === 'answers_count' || code === 'answers_duplicate' || loc.length === 2) line = '비밀번호 찾기 질문을 하나 선택하고 답변을 입력해 주세요.'
        else if (Number.isInteger(loc[2]) && loc[2] >= 0 && loc[2] <= 2) line = `선택한 질문의 답변: ${code === 'too_long' ? '50자 이내로 줄여 주세요.' : (CODE_TEXT[code] || CODE_TEXT.invalid_value)}`
        else line = '비밀번호 찾기 질문의 답을 확인해 주세요.'
      } else if (FIELD_LABELS[loc[1]]) {
        line = `${FIELD_LABELS[loc[1]]}: ${CODE_TEXT[code] || CODE_TEXT.invalid_value}`
      } else {
        line = '입력한 내용을 확인해 주세요.'
      }
      if (!lines.includes(line)) lines.push(line)
    }
    return lines.join('\n') || fallback
  }
  return fallback
}

/** 서버 정규화(answer_norm_v1)와 같은 기준의 사전 검사. 마지막 판단은 서버가 한다. */
function answerProblem(text) {
  if (typeof text !== 'string') return 'empty'
  if (hasControl(text)) return 'control'
  const value = text.normalize('NFC').trim().replace(SPACES_RE, ' ')
  if (!value) return 'empty'
  if (Array.from(value).length > 50 || new TextEncoder().encode(value).length > 72) return 'long'
  return ''
}

export default {
    computed: {
        birthError () {
            if (!this.userBirth) return this.birthTouched ? '생년월일을 입력해 주세요.' : ''
            if (!this.birthTouched && this.userBirth.length < 10) return ''
            return birthProblem(this.userBirth)
        },
        emailVerified () {
            return this.verifiedEmail === this.email.trim().toLowerCase() &&
                this.verifiedCode === this.emailCode && this.verifiedCode !== ''
        }
    },
    watch: {
        email () {
            this.emailCode = ''
            this.codeStatus = ''
            this.codeError = false
            this.verifiedEmail = ''
            this.verifiedCode = ''
        },
        selectedQuestion () {
            this.selectedAnswer = ''
        },
        emailCode () {
            this.verifiedEmail = ''
            this.verifiedCode = ''
            this.codeStatus = ''
            this.codeError = false
        }
    },
    data () {
        return {
            email: '',
            emailCode: '',
            codeStatus: '',
            codeError: false,
            sendingCode: false,
            verifyingCode: false,
            verifiedEmail: '',
            verifiedCode: '',
            password: '',
            repassword: '',
            userNickname: '',
            userBirth: '',
            birthTouched: false,
            userSchool: '',
            userMajor: '',
            // 비밀번호 찾기 질문 답(메모리에만 둔다. 저장소·주소·콘솔에 쓰지 않는다)
            questions: RECOVERY_QUESTIONS,
            selectedQuestion: '',
            selectedAnswer: '',
            showAnswers: false,
            submitting: false,
            alive: true,
            isFirstStep: true
        }
    },
    beforeUnmount () {
        // 화면을 떠나면 진행 중인 가입 결과로 안내·이동하지 않고, 입력한 비밀번호·답은 메모리에서 지운다.
        this.alive = false
        this.emailCode = ''
        this.password = ''
        this.repassword = ''
        this.selectedAnswer = ''
    },
    methods: {
        setCodeStatus (text, error = false) {
            this.codeStatus = text
            this.codeError = error
        },
        onBirthInput (event) {
            const formatted = formatBirth(event.target.value)
            this.userBirth = formatted
            if (event.target.value !== formatted) event.target.value = formatted
        },
        async sendCode () {
            if (this.sendingCode || this.verifyingCode || this.submitting) return
            if (!this.$refs.emailInput.validity.valid) {
                this.setCodeStatus('올바른 이메일 주소를 입력해 주세요.', true)
                this.$refs.emailInput.focus()
                return
            }
            this.sendingCode = true
            this.emailCode = ''
            this.setCodeStatus('')
            try {
                const result = await postSignup('/signup/email-code', { email: this.email.trim().toLowerCase() })
                if (!this.alive) return
                if (result.status === 202 && result.data?.ok === true) {
                    this.setCodeStatus('인증번호를 보냈어요. 10분 안에 입력해 주세요.')
                } else if (result.status === 429) {
                    this.setCodeStatus('요청이 너무 많아요. 잠시 후 다시 시도해 주세요.', true)
                } else if (result.status === 422) {
                    this.setCodeStatus('이메일 주소 형식을 확인해 주세요.', true)
                } else if (result.status === 503) {
                    this.setCodeStatus('지금은 메일을 보낼 수 없어요. 잠시 후 다시 시도해 주세요.', true)
                } else {
                    this.setCodeStatus('발송을 확인하지 못했어요. 받은 편지함을 확인해 주세요.', true)
                }
            } catch {
                if (this.alive) this.setCodeStatus('발송을 확인하지 못했어요. 받은 편지함을 확인해 주세요.', true)
            } finally {
                this.sendingCode = false
            }
        },
        async verifyEmailCode () {
            if (this.sendingCode || this.verifyingCode || this.submitting || this.emailVerified) return
            if (!this.$refs.emailInput.validity.valid || !/^[0-9]{8}$/.test(this.emailCode)) {
                this.setCodeStatus('이메일 주소와 인증번호 8자리를 입력해 주세요.', true)
                return
            }
            const email = this.email.trim().toLowerCase()
            const code = this.emailCode
            this.verifyingCode = true
            this.setCodeStatus('')
            try {
                const result = await postSignup('/signup/email-code/verify', { email, email_code: code })
                if (!this.alive || email !== this.email.trim().toLowerCase() || code !== this.emailCode) return
                if (result.status === 200 && result.data?.ok === true) {
                    this.verifiedEmail = email
                    this.verifiedCode = code
                    this.setCodeStatus('이메일 인증이 완료됐어요.')
                } else if (result.status === 400 || result.status === 422) {
                    this.setCodeStatus('인증번호가 맞는지 확인해 주세요. 만료되었다면 다시 받아 주세요.', true)
                } else if (result.status === 429) {
                    this.setCodeStatus('확인 요청이 너무 많아요. 잠시 후 다시 시도해 주세요.', true)
                } else if (result.status === 503) {
                    this.setCodeStatus('지금은 인증을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.', true)
                } else {
                    this.setCodeStatus('인증 결과를 확인하지 못했어요. 다시 확인해 주세요.', true)
                }
            } catch {
                if (this.alive && email === this.email.trim().toLowerCase() && code === this.emailCode) {
                    this.setCodeStatus('인증 결과를 확인하지 못했어요. 다시 확인해 주세요.', true)
                }
            } finally {
                this.verifyingCode = false
            }
        },
        nextStep () {
            if (this.sendingCode || this.verifyingCode || this.submitting) return
            if (!this.$refs.emailInput.validity.valid || !/^[0-9]{8}$/.test(this.emailCode)) {
                showMessage('이메일 주소와 인증번호 8자리를 입력해 주세요.', 'warning')
                return
            }
            if (!this.emailVerified) {
                showMessage('인증번호 확인을 먼저 완료해 주세요.', 'warning')
                return
            }
            if (!this.email.trim() || !this.password || !this.repassword) {
                showMessage('필수 항목을 모두 입력해 주세요.', 'warning')
                return
            }
            if (this.password !== this.repassword) {
                showMessage('비밀번호가 일치하지 않습니다.', 'warning')
                return
            }
            this.isFirstStep = false
        },
        async finish () {
            if (this.submitting || this.sendingCode || this.verifyingCode) return
            if (!this.emailVerified) {
                this.isFirstStep = true
                showMessage('인증번호 확인을 먼저 완료해 주세요.', 'warning')
                return
            }
            if (!this.userNickname.trim() || !this.userBirth.trim() || !this.userSchool.trim() || !this.userMajor.trim()) {
                showMessage('이름, 생년월일, 학교, 전공을 입력해 주세요.', 'warning')
                return
            }
            if (this.birthError || birthProblem(this.userBirth)) {
                this.birthTouched = true
                showMessage(this.birthError || birthProblem(this.userBirth), 'warning')
                return
            }
            if (!this.questions.some(q => q.id === this.selectedQuestion)) {
                showMessage('비밀번호 찾기 질문을 하나 선택해 주세요.', 'warning')
                return
            }
            const problem = answerProblem(this.selectedAnswer)
            if (problem) {
                const text = problem === 'empty' ? '답변을 입력해 주세요.' : problem === 'long' ? '답변은 50자(한글 약 24자) 이내로 입력해 주세요.' : '줄바꿈 같은 특수 문자는 쓸 수 없어요.'
                showMessage(text, 'warning')
                return
            }
            this.submitting = true
            const userId = this.email.trim().toLowerCase()
            let result = null
            try {
                result = await postSignup('/signup', {
                    user_id: userId,
                    email_code: this.emailCode,
                    user_pw: this.password,
                    user_name: this.userNickname.trim(),
                    user_birth: this.userBirth.trim(),
                    user_un: this.userSchool.trim(),
                    user_sp: this.userMajor.trim(),
                    recovery_answers: [{ question_id: this.selectedQuestion, answer: this.selectedAnswer }]
                })
            } catch (err) {
                result = null // 시간 초과·끊김·본문 정지: 가입됐는지 모른다
            } finally {
                this.submitting = false
            }
            if (!this.alive) return // 화면을 떠났다 → 안내·이동하지 않는다(자동 재전송도 없음)
            if (isSignupSuccess(result, userId)) {
                this.emailCode = ''
                this.password = ''
                this.repassword = ''
                this.selectedAnswer = ''
                await showMessage('가입되었습니다. 로그인해 주세요.', 'success')
                if (this.alive) this.$router.push('/login')
                return
            }
            if (!result || (result.status >= 200 && result.status < 300)) {
                // 200 인데 약속한 성공 모양이 아님(HTML·빈 JSON·ok:false·잘못된 타입) 또는 응답을 끝까지 받지 못함 → 미확정. 성공으로 보지 않는다.
                showMessage(UNKNOWN_TEXT, 'warning')
                return
            }
            if (result.status === 400 || result.status === 429) {
                this.isFirstStep = true
                this.emailCode = ''
                showMessage(result.status === 400
                    ? '이메일과 인증번호를 확인해 주세요. 만료된 번호는 다시 받아 주세요.'
                    : '확인 요청이 너무 많아요. 잠시 후 다시 시도해 주세요.', 'warning')
                return
            }
            showMessage(signupError(result.status, result.data, '가입을 저장하지 못했습니다.'), 'warning')
        }
    }
}
</script>

<style scoped>
.reg-box {
  box-sizing: border-box;
  width: min(100%, 640px);
  min-height: 628px;
  border: 1px solid #e5e9f0;
  background: #fff;
  border-radius: 8px;
  margin: 0 auto;
  padding: 36px 40px;
  text-align: left;
}
.re_tite {
  text-align: left;
  font-size: 28px;
  font-weight: bold;
  display: block;
}
.sub_tite {
  text-align: left;
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
  width: 87px;
  height: 31px;
  border: 1px solid #e5e9f0;
  background-color: #e5e9f0;
  border-radius: 20px;
  text-align: center;
  line-height: 31px;
  font-size: 12px;
  font-weight: bold;
  color: #000000;
}
.reg-button ul li:nth-child(2) {
  margin-left: 10px;
  color: #5c6579;
  background-color: #fff;
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
.text-r button {
  width: 100%;
  height: 48px;
  border: 1px solid #2ec4b6;
  background-color: #2ec4b6;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 18px;
  cursor: pointer;
}
.text-r button:disabled {
  opacity: .55;
  cursor: not-allowed;
}
/* 입력칸 옆 보조 버튼(인증번호 받기·확인): 큰 초록 버튼은 '다음' 하나만 남긴다 */
.field-row {
  display: flex;
  gap: 8px;
  margin-bottom: 26px;
}
.text-r .field-row input {
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
}
.text-r .btn-sub {
  flex: 0 0 112px;
  width: 112px;
  margin-bottom: 0;
  background-color: #fff;
  color: #1f9e92;
  border: 1px solid #2ec4b6;
  font-size: 13px;
}
.text-r .btn-sub--done:disabled {
  opacity: 1;
  background-color: #e8f8f6;
  color: #167466;
}
.field-msg {
  display: block;
  margin: -18px 0 18px;
  color: #5c6579;
  font-size: 12px;
}
.field-msg--under {
  margin-top: -20px;
}
.field-msg.is-ok {
  color: #167466;
  font-weight: bold;
}
.field-msg.is-error {
  color: #d93025;
}
.text-r input.is-invalid {
  border-color: #d93025;
  background-color: #fff6f5;
}
.text-r a {
  color: #2ec4b6;
  font-size: 12px;
  text-decoration: none;
  margin-bottom: 18px;
}
.text-r .w30 button {
  color: #1b2a57;
  font-size: 14px;
  font-weight: bold;
  border: 1px solid #e5e9f0;
  background-color: #fff;
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
.text-r .recovery-q__toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
}
.text-r .recovery-q__toggle input {
  width: auto;
  height: auto;
  margin: 0;
}
@media (max-width: 640px) {
  .reg-box {
    padding: 28px 20px;
    min-height: auto;
  }
  .re_tite {
    font-size: 24px;
  }
}
</style>