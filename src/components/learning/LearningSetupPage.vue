<template>
  <PageFrame fill>
    <div class="learning-page">
      <LearningSidebar active-id="setup" @guide="onGuide"/>
      <div class="learning-page__main">
        <div class="learning-page__panel">
          <div class="learning-page__content">
            <LearningStepper
                :region-selected="Boolean(selectedRegion)"
                :modality-selected="Boolean(selectedModality)"
            />
            <RegionSelect v-model="selectedRegion"/>
            <ModalitySelect v-model="selectedModality" :region="selectedRegion"/>
          </div>
          <div class="learning-page__actions">
            <LearningStartButton :disabled="!canStart" @start="onStart"/>
          </div>
        </div>
      </div>
    </div>
  </PageFrame>
</template>

<script>
import {canStartLearning, isModalityAllowed} from './learningOptions'
import PageFrame from '../main/PageFrame.vue'
import LearningSidebar from './LearningSidebar.vue'
import LearningStepper from './LearningStepper.vue'
import RegionSelect from './RegionSelect.vue'
import ModalitySelect from './ModalitySelect.vue'
import LearningStartButton from './LearningStartButton.vue'
import {showMessage} from '../../notify'

export default {
  name: 'LearningSetupPage',
  components: {
    PageFrame,
    LearningSidebar,
    LearningStepper,
    RegionSelect,
    ModalitySelect,
    LearningStartButton
  },
  data() {
    return {
      selectedRegion: '',
      selectedModality: ''
    }
  },
  computed: {
    canStart() {
      return canStartLearning(this.selectedRegion, this.selectedModality)
    }
  },
  watch: {
    selectedRegion() {
      if (!isModalityAllowed(this.selectedRegion, this.selectedModality)) {
        this.selectedModality = ''
      }
    }
  },
  methods: {
    onGuide() {
      showMessage('사용 가이드 화면은 아직 연결 전입니다.')
    },
    onStart() {
      if (!this.canStart) return
      this.$router.push({
        path: '/cases',
        query: {
          region: this.selectedRegion,
          type: this.selectedModality
        }
      })
    }
  }
}
</script>

<style scoped>
.learning-page {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  background: #eef3f7;
  color: #1a2b4b;
  box-sizing: border-box;
  overflow: hidden;
}

.learning-page__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 28px 32px 24px;
  box-sizing: border-box;
  overflow: hidden;
}

.learning-page__panel {
  flex: 1;
  min-height: 0;
  margin: 0 auto;
  width: 100%;
  padding: 28px 28px 20px;
  background: #fff;
  border: 1px solid #e2eaf1;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(26, 43, 75, 0.04);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.learning-page__content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 4px;
  padding-right: 6px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #c5d5d3 #f8fafc;
  scrollbar-gutter: stable;
}

.learning-page__content::-webkit-scrollbar {
  width: 9px;
}

.learning-page__content::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 999px;
}

.learning-page__content::-webkit-scrollbar-thumb {
  background: #c5d5d3;
  border-radius: 999px;
  border: 2px solid #f8fafc;
}

.learning-page__actions {
  flex-shrink: 0;
  padding-top: 16px;
  border-top: 1px solid #eef2f6;
  background: #fff;
}

@media (max-width: 800px) {
  .learning-page {
    flex-direction: column;
  }

  .learning-page__main {
    padding: 16px 12px 12px;
  }

  .learning-page__panel {
    padding: 16px 14px 12px;
    border-radius: 14px;
  }
}
</style>
