<template>
  <aside class="learning-sidebar">
    <!--    <router-link class="learning-sidebar__brand" to="/main" aria-label="Mediscan Note">
          <BrandMark size="sm"/>
        </router-link>-->

    <nav class="learning-sidebar__nav" aria-label="학습 메뉴">
      <component
          :is="item.to ? 'router-link' : 'a'"
          v-for="item in items"
          :key="item.id"
          class="learning-sidebar__link"
          :class="{'is-active': item.id === activeId}"
          :to="item.to || undefined"
          :href="item.to ? undefined : '#'"
          @click="onNavClick($event, item)"
      >
        <span class="learning-sidebar__icon" aria-hidden="true" v-html="iconSvg(item.id)"/>
        <span>{{ item.label }}</span>
      </component>
    </nav>

    <div class="learning-sidebar__help">
      <p>궁금한 점이 있으신가요?<br>사용 가이드를 확인해보세요.</p>
      <button type="button" class="learning-sidebar__guide" @click="$emit('guide')">
        가이드 보기
        <span aria-hidden="true">↗</span>
      </button>
    </div>
  </aside>
</template>

<script>
import {SIDEBAR_ITEMS} from './learningOptions'
import BrandMark from '../main/BrandMark.vue'

const ICON_SVG = {
  setup: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.7"/><path d="M10 6v4l2.5 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  note: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none"><rect x="4" y="3" width="12" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M7 8h6M7 11h6M7 14h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  history: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none"><path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  bookmark: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none"><path d="M6 3.5h8v13l-4-2.5-4 2.5v-13z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  report: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none"><path d="M5 15V9M10 15V5M15 15v-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  settings: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M10 3.5v2M10 14.5v2M3.5 10h2M14.5 10h2M5.4 5.4l1.4 1.4M13.2 13.2l1.4 1.4M14.6 5.4l-1.4 1.4M6.8 13.2l-1.4 1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
}

export default {
  name: 'LearningSidebar',
  components: {
    BrandMark
  },
  props: {
    activeId: {
      type: String,
      default: 'setup'
    }
  },
  data() {
    return {
      items: SIDEBAR_ITEMS
    }
  },
  methods: {
    iconSvg(id) {
      return ICON_SVG[id] || ICON_SVG.setup
    },
    onNavClick(event, item) {
      if (!item.to) {
        event.preventDefault()
      }
    }
  }
}
</script>

<style scoped>
.learning-sidebar {
  width: 232px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 22px 16px;
  background: #fff;
  border-right: 1px solid #e6edf3;
  box-sizing: border-box;
  min-height: 90vh;
}

.learning-sidebar__brand {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
  text-decoration: none;
  color: #1a2b4b;
}

.learning-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.learning-sidebar__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 10px;
  color: #5a6a7e;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-left: 3px solid transparent;
}

.learning-sidebar__link:hover {
  background: #f3f8f8;
  color: #1a2b4b;
}

.learning-sidebar__link.is-active {
  background: #e7f7f5;
  color: #1a8f86;
  border-left-color: #2bb3a8;
  font-weight: 700;
}

.learning-sidebar__icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.learning-sidebar__help {
  margin-top: 24px;
  padding: 16px;
  border-radius: 12px;
  background: #f4f7fa;
}

.learning-sidebar__help p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #6b7889;
}

.learning-sidebar__guide {
  margin-top: 12px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #d7e1ea;
  border-radius: 8px;
  background: #fff;
  color: #1a2b4b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.learning-sidebar__guide:hover {
  border-color: #2bb3a8;
  color: #1a8f86;
}
</style>
