<template>
  <PageFrame fill>
  <div class="case-page">
    <main class="content">
      <section class="viewer-col">
        <CaseInfoBar
            :case-id="caseId"
            :summary="caseSummary"
            @go-list="onGoList"
        />

        <div class="viewer-panel">
          <RoiToolbar
              v-model:tool="tool"
              :submitting="submitting"
              @submit="onSubmit"
          />
          <div v-if="problemLoading" class="panel-status is-wait" role="status">
            <div class="wait">
              <span class="wait__mark" aria-hidden="true">
                <span class="wait__spin"></span>
                <span class="wait__cross"></span>
              </span>
              <p class="wait__title">로딩중</p>
              <p v-if="slicePaths.length" class="wait__count">{{ sliceLoaded }} / {{ slicePaths.length }}</p>
            </div>
          </div>
          <p v-else-if="problemError" class="panel-status error">{{ problemError }}</p>
          <XrayViewer
              v-else
              ref="viewer"
              class="xray-fill"
              :image-src="imageSrc"
              :rois="rois"
              :tool="tool"
              :slice-index="sliceIndex"
              :slice-total="sliceTotal"
              :slice-loading="sliceLoading"
              @add-roi="addRoi"
              @remove-roi="removeRoi"
              @update:slice-index="onSliceIndex"
          />
          <p class="footer-hint">
            ⓘ 원본 의료 영상 파일과 ROI 좌표를 그대로 제출합니다. 여러 개를 그리면 마지막 ROI로 채점합니다.
            <template v-if="isMri && slicePaths.length > 1"> MRI는 슬라이더·마우스 휠로 슬라이스를 바꾼 뒤, 보이는 장으로 제출합니다.</template>
          </p>
        </div>
      </section>

      <TermDictionary class="dict-fill"/>
    </main>
  </div>
  </PageFrame>
</template>

<script>
import PageFrame from '../main/PageFrame.vue'
import CaseInfoBar from './CaseInfoBar.vue'
import RoiToolbar from './RoiToolbar.vue'
import XrayViewer from './XrayViewer.vue'
import TermDictionary from './TermDictionary.vue'
import {getUserSession} from '../login/authSession'
import { API_BASE } from '../../apiBase'
import { showMessage } from '../../notify'
import {
  brainMriAsGrade,
  gradeKneeRoi,
  kneeAsGrade,
  readBrainMri,
  readingKind
} from './readingGrade'

const PROBLEM_API = `${API_BASE}/learning/problem`
const ROI_GRADE_API = `${API_BASE}/learning/roi-grade`
const REVIEW_STORAGE_KEY = 'medlens.review'
const SLICE_CACHE_MAX = 48
const PREFETCH_RADIUS = 4

function imagePath(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function filenameFromPath(path) {
  const clean = imagePath(path).split('?')[0]
  const name = clean.split('/').pop()
  return name || 'upload.png'
}

/** MRI만 경로 배열을 쓰고, 그 외는 단일 경로 한 장으로 맞춘다. */
function normalizeStImages(stImage, isMri) {
  const asList = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => imagePath(item)).filter(Boolean)
    }
    if (typeof value !== 'string') return []
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map((item) => imagePath(item)).filter(Boolean)
        }
      } catch (_) {
        /* 단일 경로로 처리 */
      }
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1).trim()
      if (!inner) return []
      return inner
          .split(',')
          .map((part) => imagePath(part.trim().replace(/^"|"$/g, '')))
          .filter(Boolean)
    }
    const one = imagePath(trimmed)
    return one ? [one] : []
  }

  const paths = asList(stImage)
  if (!paths.length) return []
  if (isMri) return paths
  return [paths[0]]
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function containLayout(naturalW, naturalH, frameW, frameH) {
  const scale = Math.min(frameW / naturalW, frameH / naturalH)
  const width = naturalW * scale
  const height = naturalH * scale
  return {
    width,
    height,
    left: (frameW - width) / 2,
    top: (frameH - height) / 2
  }
}

function roiToImageBox(roi, layout, frameW, frameH) {
  const left = (roi.x / 100) * frameW
  const top = (roi.y / 100) * frameH
  const width = (roi.w / 100) * frameW
  const height = (roi.h / 100) * frameH
  const x1 = clamp01((left - layout.left) / layout.width)
  const y1 = clamp01((top - layout.top) / layout.height)
  const x2 = clamp01((left + width - layout.left) / layout.width)
  const y2 = clamp01((top + height - layout.top) / layout.height)
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  }
}

function errorDetail(payload, fallback) {
  const detail = payload && payload.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join('\n')
  }
  return fallback
}

export default {
  name: 'CaseSolvingPage',
  components: {
    PageFrame,
    CaseInfoBar,
    RoiToolbar,
    XrayViewer,
    TermDictionary
  },
  data() {
    return {
      tool: 'box',
      rois: [],
      imageSrc: '',
      imageFile: null,
      imageObjectUrl: '',
      problemImagePath: '',
      slicePaths: [],
      sliceIndex: 0,
      shownSliceIndex: 0,
      sliceLoading: false,
      sliceLoadToken: 0,
      fetchToken: 0,
      sliceLoaded: 0,
      studyIdx: null,
      caseId: '-',
      caseSummary: '',
      problemLoading: false,
      problemError: '',
      submitting: false
    }
  },
  computed: {
    isMri() {
      return String(this.$route.query.type || '').toUpperCase() === 'MRI'
    },
    sliceTotal() {
      return this.slicePaths.length > 1 ? this.slicePaths.length : 0
    }
  },
  created() {
    this.sliceCache = new Map()
    this.sliceInflight = new Map()
    this.sliceAccessOrder = []
    this.holdAllSlices = false
  },
  watch: {
    '$route.query': {
      immediate: true,
      handler() {
        this.fetchProblem()
      }
    }
  },
  beforeUnmount() {
    this.sliceLoadToken += 1
    this.fetchToken += 1
    this.clearSliceCache()
  },
  methods: {
    touchCacheKey(path) {
      const order = this.sliceAccessOrder
      const at = order.indexOf(path)
      if (at >= 0) order.splice(at, 1)
      order.push(path)
    },
    clearSliceCache() {
      if (this.sliceCache) {
        for (const entry of this.sliceCache.values()) {
          if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl)
        }
        this.sliceCache.clear()
      }
      if (this.sliceInflight) this.sliceInflight.clear()
      this.sliceAccessOrder = []
      this.holdAllSlices = false
      this.imageObjectUrl = ''
      this.imageSrc = ''
      this.imageFile = null
    },
    trimSliceCache(keepIndex) {
      if (this.holdAllSlices) return
      if (!this.sliceCache || this.sliceCache.size <= SLICE_CACHE_MAX) return
      const keep = new Set()
      const start = Math.max(0, keepIndex - PREFETCH_RADIUS)
      const end = Math.min(this.slicePaths.length - 1, keepIndex + PREFETCH_RADIUS)
      for (let i = start; i <= end; i += 1) {
        const path = this.slicePaths[i]
        if (path) keep.add(path)
      }
      while (this.sliceCache.size > SLICE_CACHE_MAX && this.sliceAccessOrder.length) {
        const oldest = this.sliceAccessOrder[0]
        if (keep.has(oldest)) {
          this.sliceAccessOrder.push(this.sliceAccessOrder.shift())
          if (this.sliceAccessOrder.every((key) => keep.has(key))) break
          continue
        }
        this.sliceAccessOrder.shift()
        const entry = this.sliceCache.get(oldest)
        if (entry?.objectUrl && entry.objectUrl !== this.imageSrc) {
          URL.revokeObjectURL(entry.objectUrl)
        }
        this.sliceCache.delete(oldest)
      }
    },
    async fetchProblemSlice(index) {
      const url = `${PROBLEM_API}/${this.studyIdx}/image?slice_index=${index}`
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(errorDetail(data, `이미지 오류 (${res.status})`))
      }
      const blob = await res.blob()
      if (!blob || blob.size < 64) {
        throw new Error('유효한 이미지가 아닙니다.')
      }
      return blob
    },
    async fetchStorageBlob(path) {
      const res = await fetch(path)
      if (!res.ok) {
        throw new Error('저장소 이미지를 불러오지 못했습니다.')
      }
      const blob = await res.blob()
      if (!blob || blob.size < 64) {
        throw new Error('유효한 이미지가 아닙니다.')
      }
      return blob
    },
    async fetchSliceBlob(path, index, useStorage) {
      if (useStorage && path && path.startsWith('/stylesheets/')) {
        try {
          return await this.fetchStorageBlob(path)
        } catch (e) {
          /* 저장소가 막히면 문제 API로 받는다 */
        }
      }
      return this.fetchProblemSlice(index)
    },
    rememberSlice(path, blob) {
      const cached = this.sliceCache.get(path)
      if (cached) {
        this.touchCacheKey(path)
        return cached
      }
      const filename = filenameFromPath(path)
      const type = blob.type || 'image/png'
      const file = new File([blob], filename, {type})
      const objectUrl = URL.createObjectURL(file)
      const entry = {file, objectUrl}
      this.sliceCache.set(path, entry)
      this.touchCacheKey(path)
      return entry
    },
    async ensureSliceEntry(path, index, useStorage = false) {
      const cached = this.sliceCache.get(path)
      if (cached) {
        this.touchCacheKey(path)
        return cached
      }
      const pending = this.sliceInflight.get(path)
      if (pending) return pending

      const request = this.fetchSliceBlob(path, index, useStorage)
          .then((blob) => {
            const entry = this.rememberSlice(path, blob)
            this.sliceInflight.delete(path)
            return entry
          })
          .catch((err) => {
            this.sliceInflight.delete(path)
            throw err
          })
      this.sliceInflight.set(path, request)
      return request
    },
    async preloadAllSlices(token) {
      const total = this.slicePaths.length
      const firstPath = this.slicePaths[0]
      let useStorage = false
      if (firstPath && firstPath.startsWith('/stylesheets/')) {
        try {
          const blob = await this.fetchStorageBlob(firstPath)
          if (token !== this.fetchToken) return
          this.rememberSlice(firstPath, blob)
          useStorage = true
        } catch (e) {
          useStorage = false
        }
      }
      if (useStorage && token === this.fetchToken) this.sliceLoaded = 1
      let next = useStorage ? 1 : 0
      const run = async () => {
        while (next < total) {
          if (token !== this.fetchToken) return
          const index = next
          next += 1
          const path = this.slicePaths[index]
          if (!path) continue
          await this.ensureSliceEntry(path, index, useStorage)
          if (token === this.fetchToken) this.sliceLoaded += 1
        }
      }
      const remain = Math.max(total - next, 0)
      const width = useStorage ? remain : Math.min(6, remain)
      if (width > 0) {
        await Promise.all(Array.from({length: width}, () => run()))
      }
      if (token !== this.fetchToken) return
      const missing = this.slicePaths.some((path) => path && !this.sliceCache.has(path))
      if (missing) {
        throw new Error('영상을 모두 불러오지 못했습니다.')
      }
    },
    prefetchAround(index) {
      if (this.slicePaths.length <= 1) return
      const start = Math.max(0, index - PREFETCH_RADIUS)
      const end = Math.min(this.slicePaths.length - 1, index + PREFETCH_RADIUS)
      for (let i = start; i <= end; i += 1) {
        if (i === index) continue
        const path = this.slicePaths[i]
        if (!path || this.sliceCache.has(path) || this.sliceInflight.has(path)) continue
        this.ensureSliceEntry(path, i).catch(() => {})
      }
    },
    async applySlice(index, {clearRois = false} = {}) {
      const path = this.slicePaths[index]
      if (!path) {
        throw new Error('영상 경로가 없습니다.')
      }
      const token = ++this.sliceLoadToken
      const cacheHit = this.sliceCache.has(path)
      if (!cacheHit) this.sliceLoading = true
      try {
        const entry = await this.ensureSliceEntry(path, index)
        if (token !== this.sliceLoadToken) return
        this.imageFile = entry.file
        this.imageObjectUrl = entry.objectUrl
        this.imageSrc = entry.objectUrl
        this.problemImagePath = path
        this.sliceIndex = index
        this.shownSliceIndex = index
        if (clearRois) this.rois = []
        this.trimSliceCache(index)
        if (!this.holdAllSlices) this.prefetchAround(index)
      } finally {
        if (token === this.sliceLoadToken) {
          this.sliceLoading = false
        }
      }
    },
    async onSliceIndex(nextIndex) {
      if (this.problemLoading || this.submitting) return
      const max = this.slicePaths.length - 1
      if (max < 0) return
      const index = Math.min(max, Math.max(0, Number(nextIndex) || 0))
      if (index === this.shownSliceIndex && this.imageSrc && index === this.sliceIndex) {
        return
      }
      const previousIndex = this.shownSliceIndex
      this.sliceIndex = index
      if (index !== previousIndex) this.rois = []
      try {
        await this.applySlice(index)
      } catch (e) {
        this.sliceIndex = this.shownSliceIndex
        showMessage(e.message || '슬라이스를 불러오지 못했습니다.', 'error')
      }
    },
    async loadProblem(stPart, stModal) {
      const requested = Number(this.$route.query.idx)
      if (Number.isFinite(requested) && requested >= 1) {
        return this.fetchProblemByIdx(requested)
      }
      const user = getUserSession()
      const params = new URLSearchParams({
        st_part: stPart,
        st_modal: stModal
      })
      if (user?.idx != null) {
        params.set('user_idx', String(user.idx))
      }
      const res = await fetch(`${PROBLEM_API}s?${params}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(errorDetail(data, `API 오류 (${res.status})`))
      }
      const items = Array.isArray(data.items) ? data.items : []
      const next = items.find((item) => !item.solved)
      if (!next || next.idx == null) {
        throw new Error('풀 수 있는 새 문제가 없습니다.')
      }
      return this.fetchProblemByIdx(next.idx)
    },
    async fetchProblemByIdx(studyIdx) {
      const res = await fetch(`${PROBLEM_API}/${studyIdx}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 404) {
          const detail = typeof data.detail === 'string' ? data.detail : '학습 문제를 찾을 수 없습니다.'
          throw new Error(detail)
        }
        throw new Error(errorDetail(data, `API 오류 (${res.status})`))
      }
      if (!data.ok || !data.problem) {
        throw new Error('문제를 불러오지 못했습니다.')
      }
      return data.problem
    },
    async fetchProblem() {
      const stPart = this.$route.query.region || 'brain'
      const stModal = this.$route.query.type || 'CT'
      const isMri = String(stModal).toUpperCase() === 'MRI'
      this.problemLoading = true
      this.problemError = ''
      this.rois = []
      this.problemImagePath = ''
      this.slicePaths = []
      this.sliceLoaded = 0
      this.sliceIndex = 0
      this.shownSliceIndex = 0
      this.studyIdx = null
      this.sliceLoadToken += 1
      this.fetchToken += 1
      const token = this.fetchToken
      this.clearSliceCache()

      try {
        const problem = await this.loadProblem(stPart, stModal)
        if (token !== this.fetchToken) return
        const paths = normalizeStImages(problem.st_image, isMri)
        if (!paths.length) {
          throw new Error('영상 경로가 없습니다.')
        }
        this.studyIdx = problem.idx ?? null
        if (this.studyIdx == null) {
          throw new Error('문제 번호가 없습니다.')
        }
        this.slicePaths = paths
        await this.preloadAllSlices(token)
        if (token !== this.fetchToken) return
        if (isMri) this.holdAllSlices = true
        await this.applySlice(0, {clearRois: true})
        this.caseId = String(problem.idx ?? '-').padStart(2, '0')
        const sliceNote = isMri ? ` · 슬라이스 ${paths.length}장` : ''
        this.caseSummary =
            `${stPart.toUpperCase()} · ${stModal} 영상 판독 학습 문제입니다.${sliceNote}`
      } catch (e) {
        this.caseId = '-'
        this.clearSliceCache()
        this.problemImagePath = ''
        this.slicePaths = []
        this.sliceIndex = 0
        this.shownSliceIndex = 0
        this.studyIdx = null
        this.caseSummary = ''
        this.problemError = e.message || '문제를 불러오지 못했습니다.'
      } finally {
        if (token === this.fetchToken) {
          this.problemLoading = false
        }
      }
    },
    addRoi(roi) {
      this.rois.push(roi)
    },
    removeRoi(id) {
      this.rois = this.rois.filter((r) => r.id !== id)
    },
    getNormalizedRoi(roi) {
      const layoutInfo = this.$refs.viewer && this.$refs.viewer.getImageLayout()
      if (!layoutInfo) {
        throw new Error('이미지가 아직 준비되지 않았습니다.')
      }
      const layout = containLayout(
          layoutInfo.naturalWidth,
          layoutInfo.naturalHeight,
          layoutInfo.frameWidth,
          layoutInfo.frameHeight
      )
      if (layout.width < 1 || layout.height < 1) {
        throw new Error('영상 표시 영역을 계산하지 못했습니다.')
      }
      const box = roiToImageBox(
          roi,
          layout,
          layoutInfo.frameWidth,
          layoutInfo.frameHeight
      )
      if (box.width <= 0 || box.height <= 0) {
        throw new Error('ROI가 영상 밖에 있습니다.')
      }
      return {layoutInfo, box}
    },
    buildRoiPayload(roi) {
      const {layoutInfo, box} = this.getNormalizedRoi(roi)
      const region = this.$route.query.region || 'brain'
      const type = this.$route.query.type || 'CT'
      const isMri = String(type).toUpperCase() === 'MRI'
      const form = new FormData()
      form.append('image', this.imageFile, this.imageFile.name)
      form.append('normalized', 'true')
      form.append('include_overlay', 'true')
      const user = getUserSession()
      form.append('user_idx', String(user?.idx ?? 1))
      if (this.studyIdx != null) {
        form.append('study_idx', String(this.studyIdx))
      }
      form.append('st_part', String(region))
      form.append('st_modal', String(type))
      if (isMri) {
        form.append('slice_index', String(this.shownSliceIndex))
        if (this.problemImagePath) {
          form.append('image_path', this.problemImagePath)
        }
      }

      if (roi.type === 'circle') {
        const cx = box.x + box.width / 2
        const cy = box.y + box.height / 2
        const radiusPx =
            Math.min(
                box.width * layoutInfo.naturalWidth,
                box.height * layoutInfo.naturalHeight
            ) / 2
        const radius =
            radiusPx / Math.min(layoutInfo.naturalWidth, layoutInfo.naturalHeight)
        form.append('roi_type', 'circle')
        form.append('cx', String(cx))
        form.append('cy', String(cy))
        form.append('radius', String(radius))
        return {form, box, region, type, isMri}
      }

      form.append('roi_type', 'box')
      form.append('x', String(box.x))
      form.append('y', String(box.y))
      form.append('width', String(box.width))
      form.append('height', String(box.height))
      return {form, box, region, type, isMri}
    },
    async requestReading(kind, form, box) {
      if (kind === 'brain-mri') {
        const user = getUserSession()
        const data = await readBrainMri(this.imageFile, {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          user_idx: user?.idx ?? 1,
          study_idx: this.studyIdx,
          slice_index: this.shownSliceIndex
        })
        return brainMriAsGrade(data)
      }
      if (kind === 'knee-mri') {
        const user = getUserSession()
        const data = await gradeKneeRoi({
          study_idx: this.studyIdx,
          roi_type: 'box',
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          slice_index: this.shownSliceIndex,
          user_idx: user?.idx ?? 1
        })
        return kneeAsGrade(data)
      }
      const res = await fetch(ROI_GRADE_API, { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(errorDetail(data, `채점 오류 (${res.status})`))
      }
      return data
    },
    async onSubmit() {
      if (this.submitting) return
      if (!this.imageFile) {
        showMessage('원본 이미지를 아직 불러오지 못했습니다.', 'warning')
        return
      }
      if (!this.rois.length) {
        showMessage('ROI를 하나 이상 지정해 주세요.', 'warning')
        return
      }

      const roi = this.rois[this.rois.length - 1]
      const region = this.$route.query.region || 'brain'
      const type = this.$route.query.type || 'CT'
      const kind = readingKind(region, type)
      if (kind === 'none') {
        showMessage('이 부위와 영상 종류에는 판독 모델이 없습니다. 뇌 CT, 뇌 MRI, 흉부 X-ray, 무릎 MRI만 판독합니다.', 'warning')
        return
      }
      if (kind === 'knee-mri' && roi.type !== 'box') {
        showMessage('무릎 MRI는 박스로만 채점합니다.', 'warning')
        return
      }
      this.submitting = true

      try {
        const {form, box, isMri} = this.buildRoiPayload(roi)
        if (isMri && kind !== 'brain-mri' && !this.problemImagePath) {
          throw new Error('제출할 MRI 슬라이스 경로가 없습니다.')
        }
        const data = await this.requestReading(kind, form, box, roi)
        if (!data) return

        const overlayPath = data.overlay_png_base64 && data.rn_image ? data.rn_image : ''
        const payload = {
          caseId: this.caseId,
          studyIdx: this.studyIdx,
          reviewIdx: data.review_idx || null,
          region,
          type,
          imagePath: this.problemImagePath,
          overlayPath,
          sliceIndex: isMri ? this.shownSliceIndex : null,
          sliceTotal: isMri ? this.slicePaths.length : null,
          userRoi: {type: roi.type, ...box},
          gradeResult: {...data, overlay_png_base64: overlayPath ? null : data.overlay_png_base64}
        }
        try {
          sessionStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(payload))
        } catch (err) {
          payload.gradeResult = {...payload.gradeResult, overlay_png_base64: null}
          sessionStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(payload))
        }
        await this.$router.push({
          path: '/medical/review',
          query: {region, type, idx: this.caseId}
        })
      } catch (e) {
        showMessage(e.message || '채점에 실패했습니다.', 'error')
      } finally {
        this.submitting = false
      }
    },
    onGoList() {
      showMessage('케이스 목록 화면은 아직 연결 전입니다.')
    }
  }
}
</script>

<style>
.case-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  text-align: left;
  overflow: hidden;
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

.viewer-col {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.viewer-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.footer-hint {
  margin: 0;
  padding: 10px 12px;
  flex-shrink: 0;
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.xray-fill {
  flex: 1;
  min-height: 0;
  position: relative;
}

.panel-status {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 13px;
  color: #64748b;
  background: #0b1220;
}

.panel-status.is-wait {
  background:
    radial-gradient(ellipse 55% 45% at 50% 42%, rgba(47, 111, 237, 0.22), transparent 62%),
    #0b1220;
}

.wait {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.wait__mark {
  position: relative;
  width: 58px;
  height: 58px;
}

.wait__spin {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: conic-gradient(from 20deg, rgba(255, 255, 255, 0.08), #2f6fed 45%, #7ed4cf 72%, rgba(255, 255, 255, 0.08) 88%);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px));
  animation: wait-spin 1s linear infinite;
}

.wait__cross {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translate(-50%, -50%);
}

.wait__cross::before,
.wait__cross::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: #fff;
  border-radius: 1px;
  transform: translate(-50%, -50%);
}

.wait__cross::before {
  width: 2px;
  height: 16px;
}

.wait__cross::after {
  width: 16px;
  height: 2px;
}

.wait__title {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.wait__count {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@keyframes wait-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wait__spin {
    animation: none;
  }
}

.panel-status.error {
  color: #fca5a5;
}

.dict-fill {
  align-self: stretch;
  max-height: none;
  height: 100%;
}
</style>
