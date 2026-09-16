<template>
  <div class="review-page">
    <ReviewHeader @next="onNextProblem" @done="onDone"/>
    <main class="content">
      <ReviewResultPanel
        :image-src="imageSrc"
        :overlay-src="overlaySrc"
        :user-roi="userRoi"
        :grade="grade"
        :using-mock="usingMock"
      />
      <ReviewSummaryPanel
        :grade="grade"
        :using-mock="usingMock"
      />
    </main>
  </div>
</template>

<script>
import ReviewHeader from './ReviewHeader.vue'
import ReviewResultPanel from './ReviewResultPanel.vue'
import ReviewSummaryPanel from './ReviewSummaryPanel.vue'
import { createDefaultReview, loadReviewFromStorage } from './reviewModel'

export default {
  name: 'CaseReviewPage',
  components: {
    ReviewHeader,
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
      this.$router.push({ path: '/medical', query: this.reviewQuery() })
    }
  }
}
</script>

<style scoped>
.review-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #eef3f8;
  text-align: left;
  overflow: hidden;
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
