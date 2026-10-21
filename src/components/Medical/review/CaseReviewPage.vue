<template>
  <PageFrame fill>
    <div class="review-page">
      <div class="review-actions">
        <button type="button" class="btn ghost" @click="onNextProblem">다음 문제 가져오기</button>
        <button type="button" class="btn primary" @click="onDone">풀이완료</button>
      </div>
      <main class="content">
      <ReviewResultPanel
        :image-src="imageSrc"
        :overlay-src="overlaySrc"
        :user-roi="userRoi"
        :grade="grade"
        :using-mock="usingMock"
        :type="type"
        :slice-index="sliceIndex"
        :slice-total="sliceTotal"
      />
      <ReviewSummaryPanel
        :grade="grade"
        :using-mock="usingMock"
        :type="type"
        :slice-index="sliceIndex"
        :slice-total="sliceTotal"
      />
    </main>
    </div>
  </PageFrame>
</template>

<script>
import PageFrame from '../../main/PageFrame.vue'
import ReviewResultPanel from './ReviewResultPanel.vue'
import ReviewSummaryPanel from './ReviewSummaryPanel.vue'
import { createDefaultReview, loadReviewFromStorage } from './reviewModel'

export default {
  name: 'CaseReviewPage',
  components: {
    PageFrame,
    ReviewResultPanel,
    ReviewSummaryPanel
  },
  data() {
    return createDefaultReview()
  },
  mounted() {
    const saved = loadReviewFromStorage()
    if (!saved) return
    this.usingMock = saved.usingMock
    this.grade = saved.grade
    this.imageSrc = saved.imageSrc
    this.userRoi = saved.userRoi
    this.overlaySrc = saved.overlaySrc
    this.type = saved.type || this.$route.query.type || ''
    this.sliceIndex = saved.sliceIndex
    this.sliceTotal = saved.sliceTotal
  },
  methods: {
    reviewQuery() {
      return {
        region: this.$route.query.region || 'brain',
        type: this.$route.query.type || 'CT'
      }
    },
    onNextProblem() {
      this.$router.push({ path: '/medical', query: this.reviewQuery() })
    },
    onDone() {
      this.$router.push('/main')
    }
  }
}
</script>

<style scoped>
.review-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #eef3f8;
  text-align: left;
  overflow: hidden;
}
.review-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px 0;
  flex-shrink: 0;
}
.btn {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn.ghost {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}
.btn.primary {
  border: none;
  background: #14b8a6;
  color: #fff;
}
.content {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
}
</style>
