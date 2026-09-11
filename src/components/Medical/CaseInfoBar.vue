<template>
  <section class="case-info">
    <div class="case-text">
      <span class="case-id">CASE {{ caseId }}</span>
      <p class="summary">{{ summary }}</p>
    </div>
    <button type="button" class="list-btn" @click="$emit('go-list')">
      케이스 목록
    </button>
  </section>
</template>

<script>
export default {
  name: 'CaseInfoBar',
  props: {
    caseId: {
      type: [String, Number],
      default: '02'
    },
    summary: {
      type: String,
      default:
        // '72세 남성. 호흡곤란과 흉통으로 내원. CXR에서 우측 기흉 및 흉수 의 의이 의되어 판독 학습을 진행합니다.'
        ''
    }
  },
  emits: ['go-list']
}
</script>

<style scoped>
.case-info {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
}
.case-id {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
}
.summary {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
}
.list-btn {
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  cursor: pointer;
}
.list-btn:hover {
  background: #eef2f7;
}
</style>
