<template>
  <div v-if="events.length" class="event-popups" aria-label="이벤트 홍보">
    <article
      v-for="event in events"
      :key="event.id"
      class="event-popup"
      :class="{ 'event-popup--dragging': drag && drag.id === event.id }"
      :style="popupStyle(event.id)"
    >
      <header
        class="event-popup__head"
        @pointerdown="onDragStart(event.id, $event)"
        @mousedown="onDragStart(event.id, $event)"
      >
        <h2 class="event-popup__title">
          {{ event.title }}
          <span v-if="event.period" class="event-popup__period">{{ event.period }}</span>
        </h2>
        <button
            type="button"
            class="event-popup__x"
            :aria-label="event.title + ' 닫기'"
            @click="onClose(event.id)"
        >
          ×
        </button>
      </header>
      <img
          v-if="event.imageUrl && !broken[event.id]"
          class="event-popup__image"
          :src="event.imageUrl"
          :alt="event.title"
          @error="onImageError(event.id)"
      >
      <a
          v-if="event.external"
          class="event-popup__join"
          :href="event.link"
          target="_blank"
          rel="noopener noreferrer"
      >참여하기</a>
      <router-link v-else-if="event.link" class="event-popup__join" :to="event.link">
        참여하기
      </router-link>
      <div class="event-popup__actions">
        <button type="button" class="event-popup__hide" @click="onHideToday(event.id)">
          오늘 하루 보지 않기
        </button>
        <button type="button" class="event-popup__close" @click="onClose(event.id)">
          닫기
        </button>
      </div>
    </article>
  </div>
</template>

<script>
import {dismissEventForToday, fetchVisibleEventPopups} from './eventPopups'

export default {
  name: 'EventPromoPopups',
  data() {
    return {
      events: [],
      positions: {},
      drag: null,
      broken: {},
      alive: true
    }
  },
  mounted() {
    this.load()
  },
  beforeUnmount() {
    this.alive = false
    this.onDragEnd()
  },
  methods: {
    async load() {
      try {
        const events = await fetchVisibleEventPopups()
        if (!this.alive) return
        this.positions = this.layout(events)
        this.events = events
      } catch (e) {
        if (this.alive) this.events = []
      }
    },
    drop(id) {
      this.events = this.events.filter((event) => event.id !== id)
    },
    onClose(id) {
      this.drop(id)
    },
    onHideToday(id) {
      dismissEventForToday(id)
      this.drop(id)
    },
    onImageError(id) {
      this.broken = {...this.broken, [id]: true}
    },
    cardWidth() {
      const viewport = window.innerWidth || 1200
      return Math.min(500, Math.max(260, viewport - 48))
    },
    layout(events) {
      const width = this.cardWidth()
      const margin = 24
      const gap = 16
      const viewport = window.innerWidth || 1200
      const positions = {}
      let x = margin
      let y = 96
      events.forEach((event) => {
        if (x > margin && x + width > viewport - margin) {
          x = margin
          y += 36
        }
        positions[event.id] = {x, y}
        x += width + gap
      })
      return positions
    },
    popupStyle(id) {
      const pos = this.positions[id] || {x: 24, y: 96}
      return {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: this.drag && this.drag.id === id ? 40 : 31
      }
    },
    onDragStart(id, event) {
      if (this.drag) return
      if (event.button != null && event.button !== 0) return
      if (event.target.closest && event.target.closest('button, a')) return
      const current = this.positions[id] || {x: 24, y: 96}
      const pointer = event.pointerId != null
      this.drag = {
        id,
        offsetX: event.clientX - current.x,
        offsetY: event.clientY - current.y,
        moveEvent: pointer ? 'pointermove' : 'mousemove',
        upEvent: pointer ? 'pointerup' : 'mouseup'
      }
      window.addEventListener(this.drag.moveEvent, this.onDragMove)
      window.addEventListener(this.drag.upEvent, this.onDragEnd)
    },
    onDragMove(event) {
      if (!this.drag) return
      const maxX = Math.max(0, window.innerWidth - 120)
      const maxY = Math.max(0, window.innerHeight - 64)
      const x = Math.min(Math.max(0, event.clientX - this.drag.offsetX), maxX)
      const y = Math.min(Math.max(0, event.clientY - this.drag.offsetY), maxY)
      this.positions = {
        ...this.positions,
        [this.drag.id]: {x, y}
      }
    },
    onDragEnd() {
      if (this.drag) {
        window.removeEventListener(this.drag.moveEvent, this.onDragMove)
        window.removeEventListener(this.drag.upEvent, this.onDragEnd)
      }
      this.drag = null
    }
  }
}
</script>

<style scoped>
.event-popups {
  position: fixed;
  inset: 0;
  z-index: 30;
  pointer-events: none;
}

.event-popup {
  position: absolute;
  pointer-events: auto;
  width: 500px;
  max-width: calc(100vw - 48px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(26, 43, 75, 0.16);
  overflow: hidden;
}

.event-popup--dragging {
  box-shadow: 0 18px 40px rgba(26, 43, 75, 0.24);
}

.event-popup__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 14px 12px;
  color: #1a2b4b;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.event-popup--dragging .event-popup__head {
  cursor: grabbing;
}

.event-popup__title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.event-popup__period {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #7a8798;
  white-space: nowrap;
}

.event-popup__x {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #5a6a7e;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.event-popup__image {
  display: block;
  width: calc(100% - 28px);
  height: 100%;
  margin: 0 14px;
  object-fit: contain;
  background: #f8fafc;
  border-radius: 10px;
}

.event-popup__join {
  display: block;
  margin: 12px 14px 0;
  padding: 11px 12px;
  border-radius: 8px;
  background: #14919b;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

.event-popup__join:hover {
  background: #0f7f88;
}

.event-popup__actions {
  display: flex;
  align-items: center;
  margin-top: 12px;
  border-top: 1px solid #e8eef3;
}

.event-popup__hide,
.event-popup__close {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: #5a6a7e;
  font-size: 12px;
  cursor: pointer;
}

.event-popup__hide {
  border-right: 1px solid #e8eef3;
}

.event-popup__hide:hover,
.event-popup__close:hover,
.event-popup__x:hover {
  background: rgba(26, 43, 75, 0.06);
}

.event-popup__x {
  cursor: pointer;
}
</style>
