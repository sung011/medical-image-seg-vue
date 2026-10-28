<template>
  <PageFrame>
    <div class="main-page__inner">


      <section class="hero">
        <div class="hero__text">
          <h1 class="hero__title">안녕하세요, {{ displayName }}님</h1>
          <p class="hero__subtitle">오늘도 지속적인 학습으로 목표를 향해 나아가요!</p>
          <router-link class="hero__cta" to="/learning">
            학습하기
            <span class="hero__cta-arrow" aria-hidden="true">›</span>
          </router-link>
        </div>
        <div class="hero__illust" aria-hidden="true">학습 일러스트</div>
      </section>

      <section class="nav-cards" aria-label="바로가기">
        <router-link class="nav-card" to="/learning">
          <h2 class="nav-card__title">학습 시작</h2>
          <p class="nav-card__desc">새로운 문제를 시작하거나 이어갈 수 있어요.</p>
        </router-link>
        <router-link class="nav-card" to="/note">
          <h2 class="nav-card__title">오답노트</h2>
          <p class="nav-card__desc">틀린 문제를 확인하고 실력을 향상시켜요.</p>
        </router-link>
        <router-link class="nav-card" to="/history">
          <h2 class="nav-card__title">학습 기록</h2>
          <p class="nav-card__desc">학습 분석을 통해 성장 과정을 확인해보세요.</p>
        </router-link>
        <router-link class="nav-card" to="/analyze">
          <h2 class="nav-card__title">화면 분석</h2>
          <p class="nav-card__desc">공유한 화면에서 영역을 골라 모델 점수를 확인해요.</p>
        </router-link>
      </section>

      <section class="status">
        <h2 class="status__title">오늘의 학습 현황</h2>
        <p v-if="statsLoading" class="status__empty">불러오는 중</p>
        <p v-else-if="statsError" class="status__empty">{{ statsError }}</p>
        <p v-else-if="!regionStats.length" class="status__empty">오늘 학습한 부위가 아직 없어요.</p>
        <ul v-else class="status__regions">
          <li v-for="item in regionStats" :key="item.region" class="status__region">
            <h3 class="status__region-name">{{ item.label }}</h3>
            <div class="status__grid">
              <div class="status__item">
                <p class="status__label">학습 시간</p>
                <p class="status__value">{{ item.studyMinutes }}분</p>
              </div>
              <div class="status__item">
                <p class="status__label">학습 문제</p>
                <p class="status__value">{{ item.solvedCount }}문제</p>
              </div>
              <div class="status__item">
                <p class="status__label">정답률</p>
                <p class="status__value">{{ item.accuracy }}%</p>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>
    <EventPromoPopups/>
  </PageFrame>
</template>

<script>
import PageFrame from './PageFrame.vue'
import EventPromoPopups from './EventPromoPopups.vue'
import {getUserSession} from '../login/authSession'
import {fetchTodayStudyStats} from './todayStudyStats'

export default {
  name: 'IndexPage',
  components: {
    PageFrame,
    EventPromoPopups
  },
  data() {
    const user = getUserSession()
    return {
      user,
      regionStats: [],
      statsLoading: false,
      statsError: ''
    }
  },
  computed: {
    displayName() {
      if (!this.user) return '학생'
      return this.user.user_name || this.user.user_id || '학생'
    }
  },
  mounted() {
    this.loadTodayStats()
  },
  methods: {
    async loadTodayStats() {
      const userIdx = this.user && Number(this.user.idx)
      if (!Number.isFinite(userIdx) || userIdx < 1) return
      this.statsLoading = true
      this.statsError = ''
      try {
        this.regionStats = await fetchTodayStudyStats(userIdx)
      } catch (e) {
        this.regionStats = []
        this.statsError = e.message || '오늘의 학습 현황을 불러오지 못했습니다.'
      } finally {
        this.statsLoading = false
      }
    }
  }
}
</script>

<style scoped>
.main-page__inner {
  margin: 0 auto;
  padding: 8px 28px 48px;
  box-sizing: border-box;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  margin-top: 28px;
  padding: 36px 40px;
  background: #fff;
  border: 1px solid #e2eaf1;
  border-radius: 16px;
}

.hero__text {
  flex: 1;
  min-width: 0;
}

.hero__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.3;
}

.hero__subtitle {
  margin: 12px 0 0;
  font-size: 15px;
  color: #7a8798;
  line-height: 1.5;
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 24px;
  padding: 12px 22px;
  border-radius: 999px;
  background: #4db6ac;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.hero__cta:hover {
  background: #3ea49a;
}

.hero__cta-arrow {
  font-size: 20px;
  line-height: 1;
  transform: translateY(-1px);
}

.hero__illust {
  flex: 0 0 260px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #d9f0ed;
  color: #6a9e98;
  font-size: 15px;
  font-weight: 500;
}

.nav-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.nav-card {
  display: block;
  padding: 22px 22px 24px;
  background: #fff;
  border: 1px solid #e2eaf1;
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.nav-card:hover {
  border-color: #b9d4cf;
  box-shadow: 0 4px 14px rgba(26, 43, 75, 0.06);
}

.nav-card__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.nav-card__desc {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: #7a8798;
}

.status {
  margin-top: 16px;
  padding: 28px 28px 24px;
  background: #fff;
  border: 1px solid #e2eaf1;
  border-radius: 16px;
}

.status__title {
  margin: 0 0 18px;
  font-size: 18px;
  font-weight: 700;
}

.status__empty {
  margin: 0;
  padding: 28px 16px;
  text-align: center;
  font-size: 14px;
  color: #8a96a6;
  border: 1px dashed #d5e0e8;
  border-radius: 12px;
  background: #f8fafc;
}

.status__regions {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status__region {
  padding: 18px 18px 16px;
  border: 1px solid #e6edf3;
  border-radius: 12px;
  background: #f8fafc;
}

.status__region-name {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
  color: #1a2b4b;
}

.status__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.status__item {
  padding: 18px 12px;
  text-align: center;
  border: 1px solid #e6edf3;
  border-radius: 10px;
  background: #fff;
}

.status__label {
  margin: 0;
  font-size: 13px;
  color: #8a96a6;
}

.status__value {
  margin: 8px 0 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

@media (max-width: 800px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
    padding: 28px 24px;
  }

  .hero__illust {
    flex: none;
    width: 100%;
    height: 120px;
  }

  .nav-cards {
    grid-template-columns: 1fr 1fr;
  }

  .status__grid {
    grid-template-columns: 1fr;
  }
}
</style>
