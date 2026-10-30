<template>
  <span class="brand" :class="['brand--' + size, 'brand--' + tone]">
    <span class="brand__mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M7 4.5H5.2A1.2 1.2 0 0 0 4 5.7V7.5M17 4.5h1.8A1.2 1.2 0 0 1 20 5.7V7.5M7 19.5H5.2A1.2 1.2 0 0 1 4 18.3V16.5M17 19.5h1.8a1.2 1.2 0 0 0 1.2-1.2V16.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M12 8.2v7.6M8.2 12h7.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="brand__name">
      <span class="brand__medi">Medi</span><span class="brand__scan">scan</span>
      <span class="brand__note">Note</span>
    </span>
  </span>
</template>

<script>
export default {
  name: 'BrandMark',
  props: {
    size: {
      type: String,
      default: 'md'
    },
    tone: {
      type: String,
      default: 'ink'
    }
  }
}
</script>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  line-height: 1;
  white-space: nowrap;
  color: inherit;
}

.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 9px;
  background: #1a2b4b;
  color: #fff;
}

.brand__mark svg {
  display: block;
}

.brand__name {
  display: inline-flex;
  align-items: baseline;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.brand__medi {
  color: #1a2b4b;
}

.brand__scan {
  color: #2f6fed;
}

.brand__note {
  margin-left: 6px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #1f8f86;
}

.brand--sm {
  gap: 8px;
}

.brand--sm .brand__mark {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.brand--sm .brand__mark svg {
  width: 15px;
  height: 15px;
}

.brand--sm .brand__name {
  font-size: 15px;
}

.brand--sm .brand__note {
  font-size: 11px;
}

.brand--md {
  gap: 9px;
}

.brand--md .brand__mark {
  width: 32px;
  height: 32px;
}

.brand--md .brand__mark svg {
  width: 17px;
  height: 17px;
}

.brand--md .brand__name {
  font-size: 20px;
}

.brand--md .brand__note {
  font-size: 12px;
}

.brand--lg {
  gap: 14px;
}

.brand--lg .brand__mark {
  width: 52px;
  height: 52px;
  border-radius: 14px;
}

.brand--lg .brand__mark svg {
  width: 28px;
  height: 28px;
}

.brand--lg .brand__name {
  font-size: clamp(36px, 4.6vw, 52px);
}

.brand--lg .brand__note {
  margin-left: 10px;
  font-size: 0.38em;
  letter-spacing: 0.12em;
}

.brand--light .brand__mark {
  background: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.brand--light .brand__medi {
  color: #fff;
}

.brand--light .brand__scan {
  color: #7ed4cf;
}

.brand--light .brand__note {
  color: rgba(255, 255, 255, 0.82);
}

@media (max-width: 720px) {
  .brand--md .brand__mark {
    width: 28px;
    height: 28px;
  }

  .brand--md .brand__name {
    font-size: 16px;
  }

  .brand--md .brand__note {
    font-size: 11px;
  }
}
</style>
