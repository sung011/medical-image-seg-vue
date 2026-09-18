<template>
  <aside class="login-brand">
    <div class="login-brand__glow" aria-hidden="true"/>
    <div class="login-brand__grid" aria-hidden="true"/>
    <div class="login-brand__content">
      <h1 class="login-brand__logo">
        <!--        <span class="login-brand__logo-med">Med</span><span class="login-brand__logo-lens">Lens</span>-->
      </h1>
      <p class="login-brand__tagline">의료영상 판독 학습</p>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'LoginBrandPanel'
}
</script>

<style scoped>
.login-brand {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: 48px 32px;
  background: radial-gradient(ellipse 80% 60% at 30% 40%, rgba(90, 178, 178, 0.18), transparent 55%),
  radial-gradient(ellipse 70% 50% at 70% 70%, rgba(255, 255, 255, 0.06), transparent 50%),
  linear-gradient(160deg, #1a2b4c 0%, #15233f 45%, #1e3558 100%);
  color: #fff;
  box-sizing: border-box;
}

.login-brand__glow {
  position: absolute;
  inset: 12% 8%;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 45%, rgba(180, 210, 230, 0.12) 0%, transparent 42%),
  radial-gradient(circle at 55% 55%, rgba(120, 170, 200, 0.08) 0%, transparent 50%);
  opacity: 0.9;
  pointer-events: none;
}

.login-brand__grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
  radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px);
  background-size: 48px 48px, 48px 48px, 16px 16px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, #000 20%, transparent 75%);
  pointer-events: none;
}

.login-brand__content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.login-brand__logo {
  margin: 0;
  font-size: clamp(40px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.login-brand__logo-med {
  color: #fff;
}

.login-brand__logo-lens {
  color: #5ab2b2;
}

.login-brand__tagline {
  margin: 14px 0 0;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.92);
}

@media (min-width: 768px) {
  .login-brand {
    min-height: 100%;
    padding: 64px 40px;
  }
}
</style>
