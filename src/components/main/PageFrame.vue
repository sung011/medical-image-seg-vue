<template>
  <div class="page-frame" :class="{ 'page-frame--fill': fill }">
    <MainHeader @open-inquiry="chatOpen = true"/>
    <div class="page-frame__body">
      <slot/>
    </div>
    <InquiryChat v-if="chatOpen" @close="chatOpen = false"/>
  </div>
</template>

<script>
import MainHeader from './MainHeader.vue'
import InquiryChat from './InquiryChat.vue'

export default {
  name: 'PageFrame',
  components: {
    MainHeader,
    InquiryChat
  },
  props: {
    fill: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      chatOpen: false
    }
  }
}
</script>

<style scoped>
.page-frame {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #eef3f7;
  color: #1a2b4b;
  box-sizing: border-box;
}

.page-frame--fill {
  height: 100vh;
  overflow: hidden;
}

.page-frame__body {
  flex: 1;
  min-height: 0;
}

.page-frame--fill .page-frame__body {
  display: flex;
  flex-direction: column;
}
</style>
