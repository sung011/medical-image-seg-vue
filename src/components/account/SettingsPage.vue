<template>
  <PageFrame>
    <div class="settings">
      <div class="settings__inner">
        <header class="settings__head">
          <h1>설정</h1>
          <p>내 정보를 수정하고 비밀번호를 바꿔요.</p>
        </header>

        <section v-if="phase === 'loading'" class="card" role="status" data-testid="settings-loading">
          <p class="hint">내 정보를 불러오는 중이에요…</p>
        </section>

        <section v-else-if="phase !== 'ready'" class="card card--error" role="alert" data-testid="settings-error">
          <p class="msg msg--err">{{ phaseText }}</p>
          <div class="actions">
            <button v-if="phase === 'retry' || phase === 'switched'" type="button" class="btn" data-testid="settings-retry" @click="load">{{ phase === 'switched' ? '다시 불러오기' : '다시 시도' }}</button>
            <button v-else type="button" class="btn btn--primary" data-testid="settings-relogin" @click="expire(phaseText)">다시 로그인</button>
          </div>
        </section>

        <fieldset v-else class="lock" :disabled="busy" data-testid="settings-real">
          <form class="card" novalidate data-testid="profile-form" @submit.prevent="askSave">
            <h2 class="card__title">내 정보</h2>
            <p class="hint" data-testid="settings-account">아이디 {{ settings.profile.userId }} · 아이디와 생년월일은 바꿀 수 없어요.</p>
            <label class="label" for="sp-name">이름 (닉네임) 최대 10자</label>
            <input id="sp-name" v-model="form.name" class="input" type="text" maxlength="10" autocomplete="off" data-testid="sp-name" :aria-invalid="fieldBad('user_name')" aria-describedby="sp-help"/>
            <label class="label" for="sp-school">학교 최대 20자</label>
            <input id="sp-school" v-model="form.school" class="input" type="text" maxlength="20" autocomplete="off" data-testid="sp-school" :aria-invalid="fieldBad('user_un')" aria-describedby="sp-help"/>
            <label class="label" for="sp-major">전공 최대 20자</label>
            <input id="sp-major" v-model="form.major" class="input" type="text" maxlength="20" autocomplete="off" data-testid="sp-major" :aria-invalid="fieldBad('user_sp')" aria-describedby="sp-help"/>
            <label class="label" for="sp-pw">현재 비밀번호 (저장하려면 필요해요)</label>
            <input id="sp-pw" v-model="form.pw" class="input" :type="showPw ? 'text' : 'password'" autocomplete="current-password" data-testid="sp-pw" :aria-invalid="fieldBad('current_password')" aria-describedby="sp-help"/>
            <p id="sp-help" class="hint">비밀번호 찾기는 아이디·이름·생년월일과 가입 때 등록한 질문의 답으로 본인을 확인해요. 이름을 바꾸면 바뀐 이름이 기준이 되고, 학교·전공은 확인에 쓰지 않아요.</p>

            <p v-if="profileMsg" class="msg" :class="profileMsg.ok ? 'msg--ok' : 'msg--err'" :role="profileMsg.ok ? 'status' : 'alert'" aria-live="polite" data-testid="profile-msg">{{ profileMsg.text }}</p>

            <div v-if="confirming" class="confirm" role="group" aria-label="저장 확인" data-testid="profile-confirm">
              <p class="confirm__title">이 내용으로 저장할까요?</p>
              <ul class="confirm__list">
                <li data-testid="confirm-name">이름 {{ settings.profile.userName || '미등록' }} → <b>{{ trimmed.name }}</b></li>
                <li data-testid="confirm-school">학교 {{ settings.profile.school }} → <b>{{ trimmed.school }}</b></li>
                <li data-testid="confirm-major">전공 {{ settings.profile.major }} → <b>{{ trimmed.major }}</b></li>
              </ul>
              <div class="actions">
                <button ref="confirmBtn" type="button" class="btn btn--primary" data-testid="sp-confirm" :disabled="saving" @click="doSave">저장 확인</button>
                <button type="button" class="btn" data-testid="sp-cancel" :disabled="saving" @click="cancelConfirm">취소</button>
              </div>
            </div>
            <div v-else class="actions">
              <button type="submit" class="btn btn--primary" data-testid="sp-save" :disabled="!changed || saving">{{ saving ? '저장하는 중…' : '저장' }}</button>
              <button v-if="profileMsg && profileMsg.reload" type="button" class="btn" data-testid="sp-reload" :disabled="saving" @click="load">다시 불러오기</button>
              <button type="button" class="btn btn--small" data-testid="sp-toggle-pw" :aria-pressed="showPw ? 'true' : 'false'" @click="showPw = !showPw">{{ showPw ? '비밀번호 숨기기' : '비밀번호 표시' }}</button>
            </div>
          </form>

          <form class="card" novalidate data-testid="password-form" @submit.prevent="submitPassword">
            <h2 class="card__title">비밀번호 변경</h2>
            <label class="label" for="pw-cur">현재 비밀번호</label>
            <input id="pw-cur" v-model="pw.cur" class="input" :type="pw.show ? 'text' : 'password'" autocomplete="current-password" data-testid="pw-cur" :aria-invalid="pwFieldBad('current_password')" aria-describedby="pw-help"/>
            <label class="label" for="pw-new">새 비밀번호 (4글자 이상)</label>
            <input id="pw-new" v-model="pw.next" class="input" :type="pw.show ? 'text' : 'password'" autocomplete="new-password" data-testid="pw-new" :aria-invalid="pwFieldBad('new_password')" aria-describedby="pw-help"/>
            <label class="label" for="pw-confirm">새 비밀번호 확인</label>
            <input id="pw-confirm" v-model="pw.confirm" class="input" :type="pw.show ? 'text' : 'password'" autocomplete="new-password" data-testid="pw-confirm" :aria-invalid="pwFieldBad('new_password_confirm')" aria-describedby="pw-help"/>
            <p id="pw-help" class="hint">변경하면 이 브라우저는 로그아웃되고, 새 비밀번호로 다시 로그인해야 해요. 다른 기기의 로그인은 이 방법으로 끝나지 않아요.</p>
            <p v-if="pwMsg" class="msg msg--err" role="alert" aria-live="polite" data-testid="pw-msg">{{ pwMsg }}</p>
            <div class="actions">
              <button type="submit" class="btn btn--primary" data-testid="pw-submit" :disabled="pwBusy">{{ pwBusy ? '변경하는 중…' : '비밀번호 변경' }}</button>
              <button type="button" class="btn btn--small" data-testid="pw-toggle" :aria-pressed="pw.show ? 'true' : 'false'" @click="pw.show = !pw.show">{{ pw.show ? '비밀번호 숨기기' : '비밀번호 표시' }}</button>
            </div>
          </form>

          <section class="card" data-testid="settings-account-card">
            <h2 class="card__title">계정</h2>
            <p class="hint">회원 탈퇴는 아직 제공하지 않습니다.</p>
            <div class="actions">
              <router-link class="btn" to="/mypage" data-testid="settings-back">마이페이지로 돌아가기</router-link>
              <button type="button" class="btn" data-testid="settings-logout" :disabled="leaving" @click="onLogout">로그아웃</button>
            </div>
          </section>
        </fieldset>
      </div>
    </div>
  </PageFrame>
</template>

<script>
import PageFrame from '../main/PageFrame.vue'
import {getUserSession, saveUserSession} from '../login/authSession'
import {
  changePasswordAndEndSession,
  clearSessionIfOwner,
  isAccountSession,
  isPasswordChangePending,
  logout,
  onAccountChanged,
  saveProfileFor,
  setLoginNotice,
  takePasswordOutcome,
  waitForPasswordChange
} from '../login/accountSession'
import {fetchSettings, passwordProblem} from './accountApi'

const PHASE_TEXT = {
  retry: '내 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  login: '로그인 시간이 지났어요. 다시 로그인해 주세요.',
  relogin: '설정을 쓰려면 한 번 다시 로그인해 주세요.',
  forbidden: '관리자 승인 후 사용할 수 있어요. 승인 여부는 관리자에게 문의해 주세요.',
  mismatch: '이 브라우저에 다른 계정이 로그인되어 화면을 지웠어요. 다시 로그인해 주세요.',
  switched: '화면의 계정이 바뀌어서 이전 계정의 정보를 지웠어요. 지금 계정의 정보를 다시 불러와 주세요.'
}
const SWITCHED_WRITE = '이 브라우저에 다른 계정이 로그인되어 있어 요청을 보내지 않았어요. 다시 로그인해 주세요.'
const FIELD_LABEL = {user_name: '이름', user_un: '학교', user_sp: '전공', current_password: '현재 비밀번호', expected_version: '불러온 정보', new_password: '새 비밀번호', new_password_confirm: '새 비밀번호 확인'}
const PW_PENDING = '비밀번호 변경이 진행 중이에요. 끝날 때까지 기다려 주세요.'
// 화면을 떠난 사이 끝난 비밀번호 변경의 실패·미확정 안내(같은 계정이 설정 화면에 다시 들어왔을 때 한 번).
const LEFT_OUTCOME_TEXT = {
  unknown: '이전에 시작한 비밀번호 변경이 끝났는지 확인하지 못했어요. 새 비밀번호로 로그인해 보고, 안 되면 이전 비밀번호를 사용해 주세요.',
  badpassword: '이전에 시도한 비밀번호 변경은 현재 비밀번호가 맞지 않아 변경되지 않았어요.',
  limited: '이전에 시도한 비밀번호 변경은 시도가 너무 많아 처리되지 않았어요. 10분 후에 다시 해 주세요.',
  forbidden: '이전에 시도한 비밀번호 변경은 관리자 승인 전이라 처리되지 않았어요.',
  switched: '이전에 시도한 비밀번호 변경은 다른 계정이 로그인되어 있어 보내지 않았어요.',
  mismatch: '이전에 시도한 비밀번호 변경은 입력이 맞지 않아 변경되지 않았어요.',
  samepassword: '이전에 시도한 비밀번호 변경은 입력이 맞지 않아 변경되지 않았어요.',
  badinput: '이전에 시도한 비밀번호 변경은 입력이 맞지 않아 변경되지 않았어요.'
}

function mineOf(a, b) {
  return !!a && !!b && a.idx === b.idx && a.user_id === b.user_id
}

export default {
  name: 'SettingsPage',
  components: {
    PageFrame
  },
  data() {
    return {
      alive: true,
      leaving: false,
      phase: 'loading',
      settings: null,
      owner: null,
      gen: 0,
      ctrl: null,
      form: {name: '', school: '', major: '', pw: ''},
      confirming: false,
      saving: false,
      showPw: false,
      profileMsg: null,
      badFields: [],
      pw: {cur: '', next: '', confirm: '', show: false},
      pwBusy: false,
      pwMsg: '',
      pwBad: [],
      unsubscribe: null
    }
  },
  computed: {
    /** 저장·비밀번호 변경·로그아웃 중 하나라도 진행 중이면 서로를 막는다. */
    busy() {
      return this.saving || this.pwBusy || this.leaving
    },
    phaseText() {
      return PHASE_TEXT[this.phase] || ''
    },
    trimmed() {
      return {name: (this.form.name || '').trim(), school: (this.form.school || '').trim(), major: (this.form.major || '').trim()}
    },
    changed() {
      if (!this.settings) return false
      const p = this.settings.profile
      return this.trimmed.name !== (p.userName || '') || this.trimmed.school !== p.school || this.trimmed.major !== p.major
    }
  },
  created() {
    this.load()
  },
  mounted() {
    // 다른 탭에서 계정 쿠키가 바뀌면 지금 계정을 다시 확인한다(진행 중인 쓰기가 없을 때만)
    this.unsubscribe = onAccountChanged(() => {
      if (!this.busy) this.load()
    })
    document.addEventListener('visibilitychange', this.onVisible)
  },
  beforeUnmount() {
    this.alive = false
    if (this.unsubscribe) this.unsubscribe()
    document.removeEventListener('visibilitychange', this.onVisible)
    this.invalidate() // 읽기 요청만 끊는다. 보낸 쓰기는 끊지 않고 결과 표시만 하지 않는다.
    this.wipePasswords()
  },
  methods: {
    ownerNow() {
      return getUserSession()
    },
    invalidate() {
      this.gen += 1
      if (this.ctrl) this.ctrl.abort()
      this.ctrl = null
    },
    begin() {
      this.invalidate()
      const ctrl = new AbortController()
      this.ctrl = ctrl
      return {gen: this.gen, signal: ctrl.signal}
    },
    sameAccount() {
      return mineOf(this.owner, getUserSession())
    },
    wipePasswords() {
      this.form.pw = ''
      this.pw.cur = ''
      this.pw.next = ''
      this.pw.confirm = ''
    },
    fieldBad(name) {
      return this.badFields.includes(name) ? 'true' : null
    },
    pwFieldBad(name) {
      return this.pwBad.includes(name) ? 'true' : null
    },
    applySettings(result) {
      this.settings = result
      this.form.name = result.profile.userName || ''
      this.form.school = result.profile.school
      this.form.major = result.profile.major
      this.form.pw = ''
    },
    dropSwitched() {
      this.settings = null
      this.profileMsg = null
      this.badFields = []
      this.confirming = false
      this.wipePasswords()
      this.phase = 'switched'
    },
    onVisible() {
      if (document.visibilityState === 'visible' && this.phase === 'ready' && !this.busy && !this.changed && !this.confirming) this.load()
    },
    async load() {
      if (this.busy) return
      const {gen, signal} = this.begin()
      this.owner = this.ownerNow()
      this.settings = null
      this.phase = 'loading'
      this.profileMsg = null
      this.badFields = []
      this.confirming = false
      this.wipePasswords()
      if (!isAccountSession(this.owner)) {
        this.phase = this.owner ? 'relogin' : 'login'
        return
      }
      try {
        const result = await fetchSettings(signal)
        if (gen !== this.gen) return
        if (!this.sameAccount()) return this.dropSwitched()
        // 응답의 계정이 이 화면 계정과 같을 때만 그린다(다른 탭 로그인 등).
        if (result.profile.idx !== this.owner.idx || result.profile.userId !== this.owner.user_id) {
          this.phase = 'mismatch'
          return
        }
        this.applySettings(result)
        this.phase = 'ready'
        this.showLeftOutcome()
      } catch (e) {
        if (gen !== this.gen) return
        if (!this.sameAccount()) return this.dropSwitched()
        this.phase = e && e.kind === 'login' ? 'login' : e && e.kind === 'forbidden' ? 'forbidden' : 'retry'
      }
    },
    showLeftOutcome() {
      const owner = this.owner
      const apply = () => {
        if (!this.alive || this.phase !== 'ready' || !this.sameAccount()) return
        const kind = takePasswordOutcome(owner)
        if (kind) this.pwMsg = LEFT_OUTCOME_TEXT[kind] || LEFT_OUTCOME_TEXT.unknown
      }
      if (isPasswordChangePending()) waitForPasswordChange().then(apply)
      else apply()
    },
    /** 만료·계정 불일치: 이 화면 계정만 정리하고 로그인으로 보낸다(그 사이 다른 계정이 되었다면 건드리지 않는다). */
    expire(text) {
      const owner = this.owner || getUserSession()
      if (!clearSessionIfOwner(owner)) return
      setLoginNotice({text})
      this.$router.push('/login')
    },
    askSave() {
      if (this.busy || !this.changed) return
      if (isPasswordChangePending()) return this.setProfileError(PW_PENDING)
      this.profileMsg = null
      this.badFields = []
      const t = this.trimmed
      if (!t.name || t.name.length > 10) return this.setProfileError('이름은 1~10자로 입력해 주세요.', ['user_name'])
      if (!t.school || t.school.length > 20) return this.setProfileError('학교는 1~20자로 입력해 주세요.', ['user_un'])
      if (!t.major || t.major.length > 20) return this.setProfileError('전공은 1~20자로 입력해 주세요.', ['user_sp'])
      if (!this.form.pw) return this.setProfileError('저장하려면 현재 비밀번호를 입력해 주세요.', ['current_password'])
      if (new TextEncoder().encode(this.form.pw).length > 72) return this.setProfileError('비밀번호는 UTF-8 기준 72바이트 이내예요.', ['current_password'])
      this.confirming = true
      this.$nextTick(() => this.$refs.confirmBtn && this.$refs.confirmBtn.focus())
    },
    cancelConfirm() {
      if (this.busy) return
      this.confirming = false
    },
    setProfileError(text, fields = [], extra = {}) {
      this.profileMsg = {ok: false, text, ...extra}
      this.badFields = fields
    },
    async doSave() {
      if (this.busy || !this.settings || !this.alive) return
      if (isPasswordChangePending()) return this.setProfileError(PW_PENDING)
      const t = this.trimmed
      const gen = this.gen
      const owner = this.owner
      this.saving = true
      this.profileMsg = null
      this.badFields = []
      try {
        // 서버가 확정하기 전에는 화면의 이름을 먼저 바꾸지 않는다. 쓰기 요청은 화면 이동으로 끊지 않는다.
        const result = await saveProfileFor(owner, {userName: t.name, school: t.school, major: t.major, currentPassword: this.form.pw, expectedVersion: this.settings.version})
        if (!this.alive || gen !== this.gen || !this.sameAccount()) return
        this.confirming = false
        this.applySettings(result)
        const now = this.ownerNow()
        if (mineOf(owner, now)) saveUserSession({...now, user_name: result.profile.userName}) // 같은 계정일 때만 머리글 이름을 바꾼다
        this.profileMsg = {ok: true, text: '저장했어요. 마이페이지에 반영돼요.'}
      } catch (e) {
        if (!this.alive || gen !== this.gen || !this.sameAccount()) return
        this.confirming = false
        this.form.pw = ''
        this.explainProfileError(e)
      } finally {
        this.saving = false
      }
    },
    explainProfileError(e) {
      const kind = e && e.kind
      if (kind === 'login') return this.expire(PHASE_TEXT.login)
      if (kind === 'switched') return this.setProfileError(SWITCHED_WRITE)
      if (kind === 'forbidden') return this.setProfileError(PHASE_TEXT.forbidden)
      if (kind === 'badpassword') return this.setProfileError('현재 비밀번호가 맞지 않아요. 다시 입력해 주세요.', ['current_password'])
      if (kind === 'conflict') return this.setProfileError('다른 곳에서 정보가 바뀌었어요. 다시 불러온 뒤 확인해 주세요.', [], {reload: true})
      if (kind === 'limited') return this.setProfileError('시도가 너무 많아요. 10분 후에 다시 해 주세요.')
      if (kind === 'badinput') {
        const names = (e.fields || []).map((f) => FIELD_LABEL[f]).filter(Boolean)
        return this.setProfileError(names.length ? `${names.join('·')} 입력을 확인해 주세요.` : '입력을 확인해 주세요.', e.fields || [])
      }
      // 저장됐는지 모른다: 자동으로 다시 보내지 않고 다시 불러와 확인하게 한다.
      return this.setProfileError('저장 여부를 확인하지 못했어요. 아래 "다시 불러오기"로 현재 저장된 정보를 확인해 주세요.', [], {reload: true})
    },
    async submitPassword() {
      if (this.busy || !this.alive) return
      this.pwMsg = ''
      this.pwBad = []
      if (isPasswordChangePending()) return this.setPwError(PW_PENDING)
      const {cur, next, confirm} = this.pw
      if (!cur) return this.setPwError('현재 비밀번호를 입력해 주세요.', ['current_password'])
      const problem = passwordProblem(next)
      if (problem === 'short') return this.setPwError('새 비밀번호는 4글자 이상으로 입력해 주세요.', ['new_password'])
      if (problem === 'long') return this.setPwError('새 비밀번호가 너무 길어요. (UTF-8 기준 72바이트 이하)', ['new_password'])
      if (next !== confirm) return this.setPwError('새 비밀번호와 확인을 같게 입력해 주세요.', ['new_password_confirm'])
      if (next === cur) return this.setPwError('새 비밀번호는 현재 비밀번호와 달라야 해요.', ['new_password'])
      const gen = this.gen
      const owner = this.owner
      const router = this.$router
      this.pwBusy = true
      // 요청~결과 확인~세션 정리·로그인 이동은 공통 수명이 끝까지 맡는다(화면을 떠나도 끊기지 않는다).
      const result = await changePasswordAndEndSession(owner, cur, next, confirm, () => router.push('/login'))
      this.pwBusy = false
      if (!this.alive || gen !== this.gen) return
      this.wipePasswords()
      if (result.ok || result.handled) return
      if (!mineOf(owner, getUserSession())) {
        takePasswordOutcome(null)
        return
      }
      takePasswordOutcome(getUserSession())
      this.explainPasswordError(result.error)
    },
    setPwError(text, fields = []) {
      this.pwMsg = text
      this.pwBad = fields
    },
    explainPasswordError(e) {
      const kind = e && e.kind
      if (kind === 'login') return this.expire(PHASE_TEXT.login)
      if (kind === 'switched') return this.setPwError(SWITCHED_WRITE)
      if (kind === 'forbidden') return this.setPwError(PHASE_TEXT.forbidden)
      if (kind === 'badpassword') return this.setPwError('현재 비밀번호가 맞지 않아요. 다시 입력해 주세요.', ['current_password'])
      if (kind === 'mismatch') return this.setPwError('새 비밀번호와 확인이 달라요.', ['new_password_confirm'])
      if (kind === 'samepassword') return this.setPwError('새 비밀번호는 현재 비밀번호와 달라야 해요.', ['new_password'])
      if (kind === 'limited') return this.setPwError('시도가 너무 많아요. 10분 후에 다시 해 주세요.')
      if (kind === 'badinput') {
        const names = (e.fields || []).map((f) => FIELD_LABEL[f]).filter(Boolean)
        return this.setPwError(names.length ? `${names.join('·')} 입력을 확인해 주세요.` : '입력을 확인해 주세요.', e.fields || [])
      }
      // 변경됐는지 모른다: 자동으로 다시 보내지 않는다.
      return this.setPwError('변경 여부를 확인하지 못했어요. 새 비밀번호로 로그인해 보고, 안 되면 이전 비밀번호를 사용해 주세요.')
    },
    async onLogout() {
      if (this.busy) return
      if (isPasswordChangePending()) return this.setPwError(PW_PENDING)
      this.leaving = true
      this.wipePasswords()
      await logout()
      this.leaving = false
      if (!getUserSession()) this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.settings {
  min-height: 100%;
  background: #eef3f7;
  color: #1a2b4b;
}

.settings__inner {
  display: grid;
  gap: 16px;
  max-width: 640px;
  margin: 0 auto;
  padding: 28px 32px 40px;
  box-sizing: border-box;
}

.settings__head h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.03em;
}

.settings__head p {
  margin: 8px 0 0;
  color: #7b8798;
  font-size: 14px;
}

.lock {
  display: grid;
  gap: 16px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
}

.card {
  display: grid;
  gap: 8px;
  padding: 22px 24px;
  background: #ffffff;
  border: 1px solid #e2eaf1;
  border-radius: 14px;
  min-width: 0;
  box-sizing: border-box;
}

.card--error {
  border-color: #d64545;
}

.card__title {
  margin: 0 0 4px;
  font-size: 16px;
}

.hint {
  margin: 0;
  color: #5a6a7e;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.label {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #3d4d63;
}

.input {
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid #d5e0e8;
  border-radius: 10px;
  background: #ffffff;
  color: #1a2b4b;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
}

.input[aria-invalid='true'] {
  border-color: #d64545;
}

.input:disabled {
  background: #f8fafc;
  color: #7a8798;
}

.msg {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.msg--ok {
  color: #166534;
}

.msg--err {
  color: #b42318;
}

.confirm {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid #bfd8f5;
  border-radius: 10px;
  background: #eef6ff;
}

.confirm__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.confirm__list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid #d5e0e8;
  border-radius: 999px;
  background: #ffffff;
  color: #1a2b4b;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
}

.btn--small {
  padding: 0 16px;
  font-size: 13px;
}

.btn--primary {
  border-color: #14b8a6;
  background: #14b8a6;
  color: #ffffff;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 860px) {
  .settings__inner {
    padding: 20px 16px 32px;
  }
}
</style>
