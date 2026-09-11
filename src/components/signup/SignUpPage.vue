<template>
  <div class="signup-page">
    <TodoHeader />
    <div class="signup-main">
      <TodoRegisterInput />
    </div>
  </div>
</template>

<script>
import TodoHeader from './TodoHeader.vue'
import TodoRegisterInput from './TodoRegisterInput.vue'

export default {
  name: 'SignUpPage',
  components: {
    TodoHeader,
    TodoRegisterInput
  }
}
</script>

<style scoped>
.signup-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #f6f8fc;
}
.signup-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 16px 48px;
  box-sizing: border-box;
}
</style>
