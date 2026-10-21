<template>
  <PageFrame fill>
    <div class="learning-page">
      <LearningSidebar active-id="setup" @guide="onGuide"/>
      <div class="learning-page__main">
        <div class="learning-page__panel">
          <LearningStepper
              :region-selected="Boolean(selectedRegion)"
              :modality-selected="Boolean(selectedModality)"
          />
          <RegionSelect v-model="selectedRegion"/>
          <ModalitySelect v-model="selectedModality" :region="selectedRegion"/>
          <LearningStartButton :disabled="!canStart" @start="onStart"/>
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
        path: '/medical',
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
  min-height: 100%;
  display: flex;
  background: #eef3f7;
  color: #1a2b4b;
  box-sizing: border-box;
}

.learning-page__main {
  flex: 1;
  min-width: 0;
  padding: 28px 32px 40px;
  box-sizing: border-box;
}

.learning-page__panel {
  //max-width: 920px;
  margin: 0 auto;
  padding: 28px 28px 24px;
  background: #fff;
  border: 1px solid #e2eaf1;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(26, 43, 75, 0.04);
  box-sizing: border-box;
  min-height: 95%;
}

@media (max-width: 800px) {
  .learning-page {
    flex-direction: column;
  }

  .learning-page__main {
    padding: 20px 16px 32px;
  }

  .learning-page__panel {
    padding: 20px 16px;
  }
}
</style>
