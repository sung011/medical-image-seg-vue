<template>
  <PageFrame fill>
    <div class="review-page">
      <p v-if="loading" class="review-status">채점 이미지를 불러오는 중</p>
      <p v-else-if="loadError" class="review-status review-status--error">{{ loadError }}</p>
      <main v-else class="content">
        <ReviewResultPanel
          :image-src="imageSrc"
          :overlay-src="overlaySrc"
          :user-roi="userRoi"
          :grade="grade"
          :using-mock="usingMock"
          :type="type"
          :slice-index="sliceIndex"
          :slice-total="sliceTotal"
        >
          <template #actions>
            <button v-if="canRetry" type="button" class="btn ghost" @click="onRetrySubmit">다시 제출</button>
            <button v-else type="button" class="btn ghost" @click="onNextProblem">다음 문제 가져오기</button>
            <button type="button" class="btn primary" @click="onDone">풀이완료</button>
          </template>
        </ReviewResultPanel>
        <ReviewSummaryPanel
          class="side-fill"
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
import {getUserSession} from '../../login/authSession'
import { createDefaultReview, fetchLearnerReview, fetchSavedReview, loadReviewFromStorage, mapRetryProblem } from './reviewModel'

export default {
  name: 'CaseReviewPage',
  components: {
    PageFrame,
    ReviewResultPanel,
    ReviewSummaryPanel
  },
  data() {
    return {
      ...createDefaultReview(),
      loading: false,
      loadError: '',
      studyIdx: null,
      retryProblem: null,
      retryChecked: false
    }
  },
  computed: {
    canRetry() {
      const reviewIdx = Number(this.$route.query.review)
      const fromHistory = Number.isFinite(reviewIdx) && reviewIdx >= 1
      if (!fromHistory) return false
      if (this.retryChecked) return this.retryProblem != null
      return this.retryStudyIdx != null
    },
    retryStudyIdx() {
      const fromReview = Number(this.studyIdx)
      if (Number.isFinite(fromReview) && fromReview >= 1) return fromReview
      const reviewIdx = Number(this.$route.query.review)
      const fromQuery = Number(this.$route.query.idx)
      if (!Number.isFinite(reviewIdx) || reviewIdx < 1) return null
      if (!Number.isFinite(fromQuery) || fromQuery < 1) return null
      return fromQuery
    }
  },
  mounted() {
    this.loadReview()
  },
  watch: {
    '$route.query.review'() {
      this.loadReview()
    }
  },
  methods: {
    applyReview(saved) {
      this.usingMock = saved.usingMock
      this.grade = saved.grade
      this.imageSrc = saved.imageSrc
      this.userRoi = saved.userRoi
      this.overlaySrc = saved.overlaySrc
      this.type = saved.type || this.$route.query.type || ''
      this.sliceIndex = saved.sliceIndex
      this.sliceTotal = saved.sliceTotal
      const studyIdx = Number(saved.studyIdx)
      this.studyIdx = Number.isFinite(studyIdx) && studyIdx >= 1 ? studyIdx : null
    },
    async loadRetry(reviewIdx, userIdx) {
      this.retryProblem = null
      this.retryChecked = false
      try {
        const review = await fetchLearnerReview(reviewIdx, userIdx)
        this.retryProblem = mapRetryProblem(review && review.problem)
        this.retryChecked = true
      } catch (_) {
        this.retryChecked = false
      }
    },
    async loadReview() {
      const reviewIdx = Number(this.$route.query.review)
      if (!Number.isFinite(reviewIdx) || reviewIdx < 1) {
        this.retryProblem = null
        this.retryChecked = false
        const saved = loadReviewFromStorage()
        if (saved) this.applyReview(saved)
        return
      }
      const user = getUserSession()
      const userIdx = user && Number(user.idx)
      this.loading = true
      this.loadError = ''
      this.usingMock = false
      this.imageSrc = ''
      this.overlaySrc = ''
      this.userRoi = null
      if (!Number.isFinite(userIdx) || userIdx < 1) {
        this.loading = false
        this.loadError = '로그인 정보가 없습니다.'
        return
      }
      try {
        this.applyReview(await fetchSavedReview(reviewIdx, userIdx))
        await this.loadRetry(reviewIdx, userIdx)
      } catch (e) {
        this.loadError = e.message || '채점 기록을 불러오지 못했습니다.'
      } finally {
        this.loading = false
      }
    },
    reviewQuery() {
      return {
        region: this.$route.query.region || 'brain',
        type: this.$route.query.type || 'CT'
      }
    },
    onRetrySubmit() {
      const problem = this.retryProblem
      const studyIdx = problem ? problem.idx : this.retryStudyIdx
      if (studyIdx == null) return
      this.$router.push({
        path: '/medical',
        query: {
          region: (problem && problem.region) || this.$route.query.region || 'brain',
          type: (problem && problem.type) || this.$route.query.type || this.type || 'CT',
          idx: String(studyIdx)
        }
      })
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
  background: #f1f5f9;
  text-align: left;
  overflow: hidden;
}
.review-status {
  margin: 24px 16px;
  color: #64748b;
}
.review-status--error {
  color: #e11d48;
}
.btn {
  padding: 8px 12px;
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
.btn.ghost:hover {
  background: #eef2f7;
}
.btn.primary {
  border: none;
  background: #14b8a6;
  color: #fff;
}
.btn.primary:hover {
  background: #0d9488;
}
.content {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  grid-template-rows: minmax(0, 1fr);
  gap: 16px;
  padding: 12px 16px 16px;
  box-sizing: border-box;
}
.side-fill {
  align-self: stretch;
  height: 100%;
  max-height: none;
}
@media (max-width: 860px) {
  .content {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    overflow: auto;
  }
  .side-fill {
    height: auto;
  }
}
</style>
