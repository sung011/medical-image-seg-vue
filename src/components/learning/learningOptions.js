export const REGIONS = [
  {id: 'brain', label: '뇌', image: '/learning/region-brain.png'},
  {id: 'chest', label: '흉부', image: '/learning/region-chest.png'},
  {id: 'abdomen', label: '복부', image: '/learning/region-abdomen.png'},
  {id: 'knee', label: '무릎', image: '/learning/region-knee.png'}
]

export const MODALITIES = [
  {
    id: 'x-ray',
    label: 'X-ray',
    description: '일반 X-ray 영상',
    image: '/learning/modality-XRAY.png'
  },
  {
    id: 'CT',
    label: 'CT',
    description: '컴퓨터 단층촬영',
    image: '/learning/modality-CT.png'
  },
  {
    id: 'MRI',
    label: 'MRI',
    description: '자기 공명 영상',
    image: '/learning/modality-MRI.png'
  }
]

/** 부위별로 고를 수 있는 영상 종류 */
export const REGION_MODALITIES = {
  brain: ['CT', 'MRI'],
  chest: ['x-ray'],
  abdomen: ['CT', 'MRI'],
  knee: ['MRI']
}

export const SIDEBAR_ITEMS = [
  {id: 'setup', label: '학습하기', to: '/learning', active: true},
  {id: 'note', label: '오답노트', to: '/note'},
  {id: 'history', label: '학습 기록', to: '/history'},
  {id: 'bookmark', label: '북마크', to: null},
  {id: 'report', label: '리포트', to: null},
  {id: 'settings', label: '설정', to: null}
]

export function getModalitiesForRegion(region) {
  const allowed = REGION_MODALITIES[region] || []
  return MODALITIES.filter((item) => allowed.indexOf(item.id) !== -1)
}

export function isModalityAllowed(region, modality) {
  const allowed = REGION_MODALITIES[region] || []
  return Boolean(region && modality && allowed.indexOf(modality) !== -1)
}

export function canStartLearning(region, modality) {
  return isModalityAllowed(region, modality)
}
