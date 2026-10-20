<template>
  <div class="inquiry" @click.self="onClose">
    <section
      class="inquiry__card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-title"
    >
      <header class="inquiry__head">
        <div>
          <h2 id="inquiry-title" class="inquiry__title">문의 채팅</h2>
          <p class="inquiry__status">{{ statusText }}</p>
        </div>
        <button type="button" class="inquiry__x" aria-label="문의 채팅 닫기" @click="onClose">
          ×
        </button>
      </header>
      <div ref="log" class="inquiry__log">
        <div
          v-for="message in shownMessages"
          :key="message.id"
          class="inquiry__row"
          :class="'inquiry__row--' + message.role"
        >
          <p v-if="message.role === 'staff'" class="inquiry__name">담당자</p>
          <p class="inquiry__bubble">{{ message.text }}</p>
          <p v-if="message.time" class="inquiry__time">{{ message.time }}</p>
        </div>
      </div>
      <form class="inquiry__form" @submit.prevent="onSend">
        <input
          v-model="draft"
          class="inquiry__input"
          type="text"
          placeholder="메시지를 입력하세요"
          aria-label="문의 메시지"
          @input="startPolling"
        >
        <button type="submit" class="inquiry__send" aria-label="보내기" :disabled="!canSend">
          <span aria-hidden="true">➤</span>
        </button>
      </form>
    </section>
  </div>
</template>

<script>
import {inquiryUserIdx, loadInquiry, sendInquiry} from './inquiryChat'

const WELCOME = {
  id: 'welcome',
  role: 'staff',
  text: '안녕하세요. 어떤 점이 궁금하신가요?',
  time: ''
}

export default {
  name: 'InquiryChat',
  data() {
    return {
      userIdx: inquiryUserIdx(),
      threadIdx: null,
      closed: false,
      messages: [],
      draft: '',
      loading: false,
      sending: false,
      error: '',
      loadToken: 0
    }
  },
  computed: {
    shownMessages() {
      if (this.messages.length || this.loading || this.error) return this.messages
      return [WELCOME]
    },
    statusText() {
      if (this.error) return this.error
      if (!this.userIdx) return '로그인 후 문의를 보낼 수 있습니다.'
      if (this.loading) return '불러오는 중'
      return '메시지를 남겨 주세요'
    },
    canSend() {
      return Boolean(this.userIdx) && !this.sending && !this.loading && this.draft.trim()
    }
  },
  mounted() {
    this.timer = null
    this.refresh()
  },
  beforeUnmount() {
    this.stopPolling()
  },
  methods: {
    onClose() {
      this.$emit('close')
    },
    startPolling() {
      if (this.timer) return
      this.timer = window.setInterval(this.refresh, 5000)
    },
    stopPolling() {
      window.clearInterval(this.timer)
      this.timer = null
    },
    async refresh() {
      if (!this.userIdx || this.sending) return
      const token = this.loadToken + 1
      this.loadToken = token
      this.loading = this.messages.length === 0
      try {
        const result = await loadInquiry(this.userIdx)
        if (token !== this.loadToken || this.sending) return
        this.applyThread(result)
        this.error = ''
      } catch (e) {
        if (token === this.loadToken && !this.messages.length) {
          this.error = e.message || '문의를 불러오지 못했습니다.'
        }
      } finally {
        if (token === this.loadToken) this.loading = false
      }
    },
    applyThread(result) {
      const grew = result.messages.length !== this.messages.length
      this.threadIdx = result.threadIdx
      this.closed = result.closed
      this.messages = result.messages
      if (grew) this.scrollToEnd()
    },
    async onSend() {
      if (!this.canSend) return
      const text = this.draft
      this.sending = true
      this.loadToken += 1
      this.error = ''
      try {
        const result = await sendInquiry({
          userIdx: this.userIdx,
          threadIdx: this.threadIdx,
          closed: this.closed,
          text
        })
        this.draft = ''
        this.applyThread(result)
      } catch (e) {
        this.error = e.message || '문의를 보내지 못했습니다.'
      } finally {
        this.sending = false
      }
    },
    scrollToEnd() {
      this.$nextTick(() => {
        const log = this.$refs.log
        if (log) log.scrollTop = log.scrollHeight
      })
    }
  }
}
</script>

<style scoped>
.inquiry {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(26, 43, 75, 0.28);
  box-sizing: border-box;
}

.inquiry__card {
  width: min(420px, 100%);
  max-height: min(640px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(26, 43, 75, 0.18);
  overflow: hidden;
}

.inquiry__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
}

.inquiry__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a2b4b;
}

.inquiry__status {
  margin: 4px 0 0;
  font-size: 13px;
  color: #8a96a6;
}

.inquiry__x {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #5a6a7e;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.inquiry__x:hover {
  background: #f3f6f9;
}

.inquiry__log {
  flex: 1;
  min-height: 280px;
  padding: 8px 18px 16px;
  overflow-y: auto;
  background: #f8fafc;
}

.inquiry__row {
  display: flex;
  flex-direction: column;
  margin-top: 14px;
}

.inquiry__row--staff {
  align-items: flex-start;
}

.inquiry__row--user {
  align-items: flex-end;
}

.inquiry__name {
  margin: 0 0 6px;
  font-size: 12px;
  color: #8a96a6;
}

.inquiry__bubble {
  margin: 0;
  max-width: 85%;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.inquiry__row--staff .inquiry__bubble {
  background: #eef2f6;
  color: #1a2b4b;
}

.inquiry__row--user .inquiry__bubble {
  background: #14919b;
  color: #fff;
}

.inquiry__time {
  margin: 4px 0 0;
  font-size: 11px;
  color: #8a96a6;
}

.inquiry__form {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e8eef3;
}

.inquiry__input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #e2eaf1;
  border-radius: 999px;
  font: inherit;
  font-size: 14px;
  color: #1a2b4b;
}

.inquiry__input:focus {
  outline: 2px solid #b7e0dc;
  border-color: #14919b;
}

.inquiry__send {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: #14919b;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}

.inquiry__send:disabled {
  background: #c5d5d3;
  cursor: default;
}

.inquiry__send:not(:disabled):hover {
  background: #0f7f88;
}
</style>
