<template>
  <div class="case-page">
    <MedHeader/>

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
          <p v-if="problemLoading" class="panel-status">문제 불러오는 중…</p>
          <p v-else-if="problemError" class="panel-status error">{{ problemError }}</p>
          <XrayViewer
              v-else
              ref="viewer"
              class="xray-fill"
              :image-src="imageSrc"
              :rois="rois"
              :tool="tool"
              @add-roi="addRoi"
              @remove-roi="removeRoi"
          />
          <p class="footer-hint">
            ⓘ 원본 의료 영상 파일과 ROI 좌표를 그대로 제출합니다. 여러 개를 그리면 마지막 ROI로 채점합니다.
          </p>
        </div>
      </section>

      <TermDictionary class="dict-fill"/>
    </main>
  </div>
</template>

<script>
import MedHeader from './MedHeader.vue'
import CaseInfoBar from './CaseInfoBar.vue'
import RoiToolbar from './RoiToolbar.vue'
import XrayViewer from './XrayViewer.vue'
import TermDictionary from './TermDictionary.vue'
import { getUserSession } from '../login/authSession'

const PROBLEM_API = 'http://127.0.0.1:8000/learning/problem'
const ROI_GRADE_API = 'http://127.0.0.1:8000/learning/roi-grade'
const IMAGE_BASE = 'http://125.134.136.59:3333'
const REVIEW_STORAGE_KEY = 'medlens.review'

function imagePath(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function buildImageUrl(path) {
  const rel = imagePath(path)
  if (!rel) return ''
  if (/^https?:\/\//i.test(rel)) return rel
  return `${IMAGE_BASE}${rel}`
}

function filenameFromPath(path) {
  const clean = imagePath(path).split('?')[0]
  const name = clean.split('/').pop()
  return name || 'upload.png'
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
    MedHeader,
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
      studyIdx: null,
      caseId: '-',
      caseSummary: '',
      problemLoading: false,
      problemError: '',
      submitting: false
    }
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
    this.revokeImageUrl()
  },
  methods: {
    revokeImageUrl() {
      if (this.imageObjectUrl) {
        URL.revokeObjectURL(this.imageObjectUrl)
        this.imageObjectUrl = ''
      }
    },
    async fetchOriginalImage(path) {
      const relative = imagePath(path)
      const urls = [relative, buildImageUrl(path)].filter(
          (url, index, list) => url && list.indexOf(url) === index
      )
      let lastError = null
      for (const url of urls) {
        try {
          const res = await fetch(url)
          if (!res.ok) {
            lastError = new Error(`이미지 오류 (${res.status})`)
            continue
          }
          const blob = await res.blob()
          if (!blob || blob.size < 64) {
            lastError = new Error('유효한 이미지가 아닙니다.')
            continue
          }
          return blob
        } catch (err) {
          lastError = err
        }
      }
      throw lastError || new Error('원본 이미지를 가져오지 못했습니다.')
    },
    async fetchProblem() {
      const stPart = this.$route.query.region || 'brain'
      const stModal = this.$route.query.type || 'CT'
      this.problemLoading = true
      this.problemError = ''
      this.rois = []
      this.imageFile = null
      this.problemImagePath = ''
      this.studyIdx = null
      this.revokeImageUrl()
      this.imageSrc = ''

      try {
        const user = getUserSession()
        const params = new URLSearchParams({
          st_part: stPart,
          st_modal: stModal
        })
        if (user?.idx != null) {
          params.set('user_idx', String(user.idx))
        }
        const res = await fetch(`${PROBLEM_API}?${params}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('풀 수 있는 새 문제가 없습니다.')
          }
          throw new Error(`API 오류 (${res.status})`)
        }
        const data = await res.json()
        if (!data.ok || !data.problem) {
          throw new Error('문제를 불러오지 못했습니다.')
        }

        const problem = data.problem
        const blob = await this.fetchOriginalImage(problem.st_image)
        const filename = filenameFromPath(problem.st_image)
        const type = blob.type || 'image/png'
        this.imageFile = new File([blob], filename, {type})
        this.imageObjectUrl = URL.createObjectURL(this.imageFile)
        this.imageSrc = this.imageObjectUrl
        this.problemImagePath = imagePath(problem.st_image)
        this.studyIdx = problem.idx ?? null
        this.caseId = String(problem.idx ?? '-').padStart(2, '0')
        this.caseSummary =
            `${stPart.toUpperCase()} · ${stModal} 영상 판독 학습 문제입니다.`
      } catch (e) {
        this.caseId = '-'
        this.imageSrc = ''
        this.imageFile = null
        this.problemImagePath = ''
        this.studyIdx = null
        this.caseSummary = ''
        this.problemError = e.message || '문제를 불러오지 못했습니다.'
      } finally {
        this.problemLoading = false
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
      const form = new FormData()
      form.append('image', this.imageFile, this.imageFile.name)
      form.append('normalized', 'true')
      form.append('include_overlay', 'true')
      const user = getUserSession()
      form.append('user_idx', String(user?.idx ?? 1))
      if (this.studyIdx != null) {
        form.append('study_idx', String(this.studyIdx))
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
        return {form, box}
      }

      form.append('roi_type', 'box')
      form.append('x', String(box.x))
      form.append('y', String(box.y))
      form.append('width', String(box.width))
      form.append('height', String(box.height))
      return {form, box}
    },
    async onSubmit() {
      if (this.submitting) return
      if (!this.imageFile) {
        alert('원본 이미지를 아직 불러오지 못했습니다.')
        return
      }
      if (!this.rois.length) {
        alert('ROI를 하나 이상 지정해 주세요.')
        return
      }

      const roi = this.rois[this.rois.length - 1]
      this.submitting = true

      try {
        const {form, box} = this.buildRoiPayload(roi)
        const res = await fetch(ROI_GRADE_API, {
          method: 'POST',
          body: form
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(errorDetail(data, `채점 오류 (${res.status})`))
        }

        const region = this.$route.query.region || 'brain'
        const type = this.$route.query.type || 'CT'
        const overlayPath = data.overlay_png_base64 && data.rn_image ? data.rn_image : ''
        const payload = {
          caseId: this.caseId,
          studyIdx: this.studyIdx,
          reviewIdx: data.review_idx || null,
          region,
          type,
          imagePath: this.problemImagePath,
          overlayPath,
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
        alert(e.message || '채점에 실패했습니다.')
      } finally {
        this.submitting = false
      }
    },
    onGoList() {
      alert('케이스 목록 화면은 아직 연결 전입니다.')
    }
  }
}
</script>

<style>
.case-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  text-align: left;
  overflow: hidden;
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
  padding: 12px 16px 16px;
  box-sizing: border-box;
}

.viewer-col {
  flex: 1;
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

.panel-status.error {
  color: #fca5a5;
}

.dict-fill {
  align-self: stretch;
  max-height: none;
  height: 100%;
}
</style>
