<template>
  <div class="intro">
    <header class="intro__header">
      <div class="intro__header-inner">
        <a class="intro__brand" href="#intro" @click.prevent="scrollTo('intro')">
          <BrandMark size="md" tone="ink"/>
        </a>
        <nav class="intro__nav" aria-label="소개 메뉴">
          <a href="#intro" @click.prevent="scrollTo('intro')">서비스 소개</a>
          <a href="#how" @click.prevent="scrollTo('features')">핵심 기능</a>
          <a href="#guide" @click.prevent="scrollTo('guide')">이용 안내</a>
          <a href="#faq" @click.prevent="scrollTo('faq')">FAQ</a>
        </nav>
        <router-link class="intro__login" to="/login">로그인</router-link>
      </div>
    </header>

    <main>
      <section id="intro" class="hero">
        <div class="hero__bg" aria-hidden="true"/>
        <div class="hero__inner">
          <div class="hero__copy">
            <h1 class="hero__title">
              <span class="hero__medi">Medi</span><span class="hero__scan">scan</span>
              <span class="hero__note">Note</span>
            </h1>
            <p class="hero__headline">
              판독을 배우는 <em>가장 확실한</em> 방법
            </p>
            <p class="hero__desc">
              실제 영상을 바탕으로 ROI를 직접 표시하고, AI 채점으로 바로 확인할 수 있습니다.
            </p>
            <router-link class="btn btn--navy" to="/signup">
              무료로 시작하기 <span aria-hidden="true">→</span>
            </router-link>
          </div>
          <div class="hero__visual" aria-hidden="true">
            <img
                src="/intro/hero-xray.png"
                alt=""
                class="hero__shot"
            >
          </div>
        </div>
      </section>

      <!--      <section id="how" class="how">
              <div class="section-inner">
                <h2 class="section-title">사용 방법</h2>
                <p class="section-sub">세 단계로 쉽고 정확하게 판독 실력을 확인하세요.</p>
                <ol class="how__steps">
                  <li class="how__step">
                    <span class="how__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/>
                        <path d="M8.5 13.5c1.2 1.4 2.3 2 3.5 2s2.3-.6 3.5-2" stroke="currentColor" stroke-width="1.6"
                              stroke-linecap="round"/>
                        <circle cx="9.5" cy="10" r="1" fill="currentColor"/>
                        <circle cx="14.5" cy="10" r="1" fill="currentColor"/>
                      </svg>
                    </span>
                    <h3>부위 선택</h3>
                    <p>흉부·복부·근골격 등 학습할 해부학 부위를 고릅니다.</p>
                  </li>
                  <li class="how__step">
                    <span class="how__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.6"
                              stroke-dasharray="3 2.5"/>
                        <path d="M9 12h6M12 9v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                      </svg>
                    </span>
                    <h3>ROI 표시</h3>
                    <p>영상 위에서 관심 영역을 드래그로 직접 표시합니다.</p>
                  </li>
                  <li class="how__step">
                    <span class="how__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M8 4.5h8a2 2 0 0 1 2 2V19l-3-1.5L12 19l-3-1.5L6 19V6.5a2 2 0 0 1 2-2z" stroke="currentColor"
                              stroke-width="1.6" stroke-linejoin="round"/>
                        <path d="M9.5 11.5l1.8 1.8 3.4-3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                              stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <h3>채점 확인</h3>
                    <p>AI가 정답과 비교해 포함률·피드백을 바로 보여 줍니다.</p>
                  </li>
                </ol>
              </div>
            </section>-->

      <section id="features" class="features">
        <div class="section-inner">
          <p class="features__eyebrow">핵심 기능</p>
          <h2 class="section-title">영상 학습의 모든 순간을 연결합니다</h2>
          <p class="section-sub">Mediscan Note는 학습 · 분석 · 리뷰를 하나의 흐름으로 지원합니다.</p>
          <div class="features__grid">
            <article v-for="item in featureCards" :key="item.title" class="feature-card">
              <div class="feature-card__body">
                <span class="feature-card__icon" aria-hidden="true">
                  <svg v-if="item.icon === 'book'" viewBox="0 0 24 24" fill="none">
                    <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16.5H7.5A2.5 2.5 0 0 0 5 22V5.5z" stroke="currentColor"
                          stroke-width="1.6"/>
                    <path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H19" stroke="currentColor" stroke-width="1.6"/>
                  </svg>
                  <svg v-else-if="item.icon === 'target'" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/>
                    <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/>
                    <circle cx="12" cy="12" r="1.4" fill="currentColor"/>
                  </svg>
                  <svg v-else-if="item.icon === 'doc'" viewBox="0 0 24 24" fill="none">
                    <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z"
                          stroke="currentColor" stroke-width="1.6"/>
                    <path d="M14 3.5V8h4.5M8.5 12h7M8.5 15.5h5" stroke="currentColor" stroke-width="1.6"
                          stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="item.icon === 'glossary'" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4.5h9.5A2.5 2.5 0 0 1 18 7v13H8.5A2.5 2.5 0 0 0 6 22.5V4.5z" stroke="currentColor"
                          stroke-width="1.6"/>
                    <path d="M9.5 9h5M9.5 12.5h5M9.5 16h3.5" stroke="currentColor" stroke-width="1.6"
                          stroke-linecap="round"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" stroke-width="1.6"/>
                    <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                </span>
                <h3>{{ item.title }}</h3>
                <p>{{ item.desc }}</p>
                <!--                <router-link class="feature-card__link" :to="item.to">
                                  {{ item.cta }} <span aria-hidden="true">→</span>
                                </router-link>-->
              </div>
              <div class="feature-card__thumb" aria-hidden="true">
                <img :src="item.image" alt="">
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="guide" class="env">
        <div class="section-inner env__inner">
          <div class="env__copy">
            <h2 class="section-title section-title--left">실제 진단 현장을 닮은 학습 환경</h2>
            <p>
              CT·MRI·X-ray 등 다양한 모달리티와 실제 케이스로
              현장감 있는 판독 실력을 키울 수 있습니다.
            </p>
            <a class="env__link" href="#modalities" @click.prevent="scrollTo('modalities')">
              지원 모달리티 보기 <span aria-hidden="true">→</span>
            </a>
            <ul id="modalities" class="env__modalities">
              <li>뇌 — CT · MRI</li>
              <li>흉부 — X-ray</li>
              <li>복부 — CT</li>
              <li>무릎 — MRI</li>
            </ul>
          </div>
          <div class="env__visual" aria-hidden="true">
            <img src="/learning/modality-XRAY.png" alt="" class="env__img">
          </div>
        </div>
      </section>

      <section id="faq" class="faq">
        <div class="section-inner">
          <h2 class="section-title">FAQ</h2>
          <p class="section-sub">자주 묻는 질문을 모았습니다.</p>
          <ul class="faq__list">
            <li v-for="item in faqs" :key="item.q" class="faq__item">
              <h3>{{ item.q }}</h3>
              <p>{{ item.a }}</p>
            </li>
          </ul>
        </div>
      </section>

      <section id="start" class="cta">
        <div class="section-inner cta__inner">
          <h2>지금 로그인하고 시작하세요</h2>
          <p>Mediscan Note와 함께 판독 실력을 한 단계 성장시키세요.</p>
          <router-link class="btn btn--teal" to="/login">
            로그인하고 시작하기 <span aria-hidden="true">→</span>
          </router-link>
        </div>
      </section>
    </main>

    <footer class="intro__footer">
      <div class="intro__footer-inner">
        <div class="intro__footer-brand">
          <BrandMark size="sm" tone="ink"/>
          <p>© 2026 Mediscan Note. All rights reserved.</p>
        </div>
        <div class="intro__footer-links">
          <!--          <span>이용약관</span>
                    <span>개인정보처리방침</span>
                    <a href="mailto:support@mediscan.note">문의하기</a>-->
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import BrandMark from '../main/BrandMark.vue'

export default {
  name: 'IntroPage',
  components: {
    BrandMark
  },
  data() {
    return {
      featureCards: [
        {
          title: '영상 학습',
          desc: '실제 CT·MRI·X-ray 케이스로 부위별 판독 흐름을 익힙니다.',
          image: '/learning/region-brain.png',
          icon: 'book',
          cta: '자세히 보기',
          to: '/login'
        },
        {
          title: 'ROI',
          desc: '관심 영역을 원·박스로 표시하고 정답과 바로 비교합니다.',
          image: '/learning/modality-CT.png',
          icon: 'target',
          cta: '자세히 보기',
          to: '/login'
        },
        {
          title: '리뷰',
          desc: '채점 결과와 소견을 다시 보며 판독 포인트를 정리합니다.',
          image: '/learning/region-chest.png',
          icon: 'doc',
          cta: '자세히 보기',
          to: '/login'
        },
        {
          title: '용어 사전',
          desc: '영상 소견과 의학 용어를 검색해 학습 중 바로 확인합니다.',
          image: '/learning/region-abdomen.png',
          icon: 'glossary',
          cta: '사전 전체 보기',
          to: '/login'
        },
        {
          title: '리뷰노트',
          desc: '불일치·부분일치만 모아 다시 풀며 약점을 보완합니다.',
          image: '/learning/region-knee.png',
          icon: 'note',
          cta: '리뷰노트 보기',
          to: '/login'
        }
      ],
      faqs: [
        {
          q: '회원가입 없이 체험할 수 있나요?',
          a: '학습·채점·리뷰노트는 로그인 후 이용할 수 있습니다. 소개 페이지에서 서비스 구성을 먼저 확인한 뒤 가입하거나 로그인하세요.'
        },
        {
          q: '어떤 영상을 학습하나요?',
          a: '뇌 CT·MRI, 흉부 X-ray, 복부 CT, 무릎 MRI를 지원합니다. 학습 설정에서 부위와 영상 종류를 고른 뒤 문제를 풉니다.'
        },
        {
          q: '채점은 어떻게 이뤄지나요?',
          a: '영상 위에 ROI를 그린 뒤 제출하면 서버가 정답 영역과 비교해 일치·부분일치·불일치와 포함률을 보여 줍니다.'
        }
      ]
    }
  },
  methods: {
    scrollTo(id) {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({behavior: 'smooth', block: 'start'})
      }
    }
  }
}
</script>

<style scoped>
.intro {
  --navy: #1a2b4b;
  --blue: #2f6fed;
  --teal: #1f8f86;
  --teal-soft: #5ab2b2;
  --text: #243247;
  --muted: #5b6b7c;
  --line: rgba(26, 43, 75, 0.1);
  --bg: #f4f8fb;
  min-height: 100%;
  color: var(--text);
  background: #fff;
}

.intro__header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}

.intro__header-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.intro__brand {
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
}

.intro__nav {
  display: none;
  flex: 1;
  justify-content: center;
  gap: 28px;
}

.intro__nav a {
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.intro__nav a:hover {
  color: var(--navy);
}

.intro__login {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 18px;
  border: 1.5px solid var(--navy);
  border-radius: 999px;
  color: var(--navy);
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
}

.intro__login:hover {
  background: rgba(26, 43, 75, 0.05);
}

.section-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-title {
  margin: 0;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--navy);
  text-align: center;
}

.section-title--left {
  text-align: left;
}

.section-sub {
  margin: 10px auto 0;
  max-width: 520px;
  text-align: center;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.6;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 15px;
  font-weight: 700;
}

.btn--navy {
  background: var(--navy);
  color: #fff;
}

.btn--navy:hover {
  background: #243764;
}

.btn--teal {
  background: var(--teal);
  color: #fff;
}

.btn--teal:hover {
  background: #187a72;
}

.hero {
  position: relative;
  overflow: hidden;
  padding: 56px 0 72px;
}

.hero__bg {
  position: absolute;
  inset: 0;
  background-color: #eef5f8;
  background-image: radial-gradient(ellipse 55% 50% at 78% 42%, rgba(120, 190, 195, 0.22), transparent 62%),
  linear-gradient(180deg, #e8f2f5 0%, #f4f9fb 55%, #ffffff 100%);
  pointer-events: none;
}

.hero__bg::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.55;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='98' viewBox='0 0 56 98'%3E%3Cpath d='M28 0l28 16v33L28 65 0 49V16zM28 33l28 16v33L28 98 0 82V49z' fill='none' stroke='%2378bec3' stroke-opacity='0.28' stroke-width='1'/%3E%3C/svg%3E");
  background-size: 56px 98px;
  mask-image: radial-gradient(ellipse 70% 65% at 78% 42%, #000 20%, transparent 75%);
  pointer-events: none;
}

.hero__inner {
  position: relative;
  z-index: 1;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  gap: 36px;
  align-items: center;
}

.hero__title {
  margin: 0;
  font-size: clamp(40px, 6vw, 64px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.hero__medi {
  color: var(--navy);
}

.hero__scan {
  color: var(--blue);
}

.hero__note {
  margin-left: 10px;
  color: var(--teal);
}

.hero__headline {
  margin: 18px 0 0;
  font-size: clamp(20px, 2.6vw, 28px);
  font-weight: 700;
  color: var(--navy);
  letter-spacing: -0.02em;
}

.hero__headline em {
  font-style: normal;
  color: var(--teal);
}

.hero__desc {
  margin: 14px 0 28px;
  max-width: 420px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
}

.hero__visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero__shot {
  display: block;
  //width: min(100%, 380px);
  width: min(100%, 500px);
  height: auto;
  filter: drop-shadow(0 18px 36px rgba(26, 43, 75, 0.18));
  user-select: none;
  pointer-events: none;
}

.how {
  padding: 64px 0;
  background: #fff;
}

.how__steps {
  list-style: none;
  margin: 40px 0 0;
  padding: 28px 18px;
  display: grid;
  gap: 28px;
  background: #f7fafc;
  border: 1px solid var(--line);
  border-radius: 20px;
}

.how__step {
  text-align: center;
  padding: 8px 12px;
}

.how__icon {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(31, 143, 134, 0.1);
  color: var(--teal);
  margin-bottom: 14px;
}

.how__icon svg {
  width: 26px;
  height: 26px;
}

.how__step h3 {
  margin: 0;
  font-size: 17px;
  color: var(--navy);
}

.how__step p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.features {
  padding: 72px 0;
  background: linear-gradient(180deg, #f3f8fb 0%, #eef5f8 100%);
}

.features__eyebrow {
  margin: 0 0 8px;
  text-align: center;
  color: var(--teal);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.features__grid {
  margin-top: 36px;
  display: grid;
  gap: 18px;
}

.feature-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 22px;
  background: #fff;
  border: 1px solid rgba(26, 43, 75, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(26, 43, 75, 0.05);
}

.feature-card__icon {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(31, 143, 134, 0.1);
  color: var(--teal);
  margin-bottom: 12px;
}

.feature-card__icon svg {
  width: 20px;
  height: 20px;
}

.feature-card h3 {
  margin: 0;
  font-size: 18px;
  color: var(--navy);
}

.feature-card p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.feature-card__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 14px;
  color: var(--teal);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.feature-card__link:hover {
  color: #187a72;
}

.feature-card__thumb {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  overflow: hidden;
  background: #d9e4ef;
  flex-shrink: 0;
}

.feature-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.env {
  padding: 72px 0;
  background: #fff;
}

.env__inner {
  display: grid;
  gap: 28px;
  align-items: center;
}

.env__copy p {
  margin: 14px 0 0;
  max-width: 440px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
}

.env__link {
  display: inline-flex;
  margin-top: 18px;
  color: var(--teal);
  font-weight: 700;
  text-decoration: none;
  font-size: 14px;
}

.env__modalities {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.env__modalities li {
  color: var(--navy);
  font-size: 14px;
  font-weight: 600;
}

.env__visual {
  border-radius: 20px;
  overflow: hidden;
  min-height: 240px;
  background: linear-gradient(135deg, rgba(26, 43, 75, 0.55), rgba(31, 143, 134, 0.35)),
  #1a2b4b;
  box-shadow: 0 18px 40px rgba(26, 43, 75, 0.12);
}

.env__img {
  width: 100%;
  height: 100%;
  min-height: 240px;
  object-fit: cover;
  opacity: 0.92;
  mix-blend-mode: luminosity;
}

.faq {
  padding: 64px 0;
  background: var(--bg);
}

.faq__list {
  list-style: none;
  margin: 32px 0 0;
  padding: 0;
  display: grid;
  gap: 14px;
}

.faq__item {
  padding: 20px 22px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
}

.faq__item h3 {
  margin: 0;
  font-size: 16px;
  color: var(--navy);
}

.faq__item p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.65;
}

.cta {
  padding: 72px 0;
  background: linear-gradient(180deg, #f7fbfc 0%, #eaf4f5 100%);
}

.cta__inner {
  text-align: center;
}

.cta h2 {
  margin: 0;
  font-size: clamp(24px, 3vw, 32px);
  color: var(--navy);
  letter-spacing: -0.03em;
}

.cta p {
  margin: 12px 0 28px;
  color: var(--muted);
  font-size: 15px;
}

.intro__footer {
  border-top: 1px solid var(--line);
  background: #fff;
}

.intro__footer-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.intro__footer-brand p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.intro__footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--muted);
  font-size: 13px;
}

.intro__footer-links a {
  color: inherit;
  text-decoration: none;
}

.intro__footer-links a:hover {
  color: var(--navy);
}

@media (min-width: 768px) {
  .intro__nav {
    display: flex;
  }

  .hero__inner {
    grid-template-columns: 1.05fr 0.95fr;
    padding-top: 24px;
  }

  .how__steps {
    grid-template-columns: repeat(3, 1fr);
    padding: 32px 12px;
    gap: 0;
  }

  .how__step {
    position: relative;
    padding: 8px 28px;
  }

  .how__step:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 18%;
    bottom: 18%;
    right: 0;
    border-right: 1px dashed rgba(26, 43, 75, 0.18);
  }

  .features__grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .features__grid .feature-card:nth-child(-n + 3) {
    grid-column: span 2;
  }

  .features__grid .feature-card:nth-child(4) {
    grid-column: 2 / 4;
  }

  .features__grid .feature-card:nth-child(5) {
    grid-column: 4 / 6;
  }

  .env__inner {
    grid-template-columns: 1fr 1.05fr;
    gap: 48px;
  }

  .intro__footer-inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
