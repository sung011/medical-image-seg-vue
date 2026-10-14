# learning 폴더

학습 설정 화면(`/learning`)용 컴포넌트다. 부위와 영상 종류를 고른 뒤 「학습 시작」으로 문제 풀이(`/medical`)에 들어간다.

## 화면 조립

| 파일 | 역할 |
|------|------|
| `LearningSetupPage.vue` | 페이지 전체. 사이드바·헤더·스텝퍼·선택 영역·시작 버튼을 모으고, 선택 상태와 이동을 맡는다. |

## 레이아웃

| 파일 | 역할 |
|------|------|
| `LearningSidebar.vue` | 왼쪽 메뉴(학습하기, 학습 기록, 북마크, 리포트, 설정)와 가이드 안내 박스. |
| `LearningHeader.vue` | 상단 제목 「학습하기」, 알림, 로그인한 사용자 이름. |
| `LearningStepper.vue` | 위쪽 단계 표시. 부위가 선택되면 `1`, 영상 종류가 선택되면 `2`에 색이 들어온다. |

## 부위 선택

| 파일 | 역할 |
|------|------|
| `RegionSelect.vue` | 「1. 부위 선택」 구역. 뇌·흉부·복부·무릎 카드를 나열한다. |
| `RegionOptionCard.vue` | 부위 카드 하나. 이미지와 라벨을 보여 주고, 클릭하면 그 부위를 고른다. |

## 영상 종류

| 파일 | 역할 |
|------|------|
| `ModalitySelect.vue` | 「2. 영상 종류」 구역. 고른 부위에 맞는 영상만 보여 준다. |
| `ModalityOptionCard.vue` | 영상 종류 카드 하나. 썸네일·이름·설명을 보여 주고, 클릭하면 그 종류를 고른다. |

## 시작

| 파일 | 역할 |
|------|------|
| `LearningStartButton.vue` | 「학습 시작」 버튼. 부위와 영상 종류가 모두 있을 때만 활성화된다. |

## 상수·함수

| 파일 | 역할 |
|------|------|
| `learningOptions.js` | 부위·영상 목록, 부위별 허용 영상(`REGION_MODALITIES`), 이미지 경로, `canStartLearning()` 등. |

부위별 영상 종류:

| 부위 | 고를 수 있는 영상 |
|------|------------------|
| 뇌 | CT, MRI (X-ray 없음) |
| 흉부 | X-ray만 |
| 복부 | CT, MRI |
| 무릎 | MRI만 |

## 이미지

카드에 쓰는 PNG는 `public/learning/`에 있다.

- 부위: `region-brain.png`, `region-chest.png`, `region-abdomen.png`, `region-knee.png`
- 영상: `modality-XRAY.png`, `modality-CT.png`, `modality-MRI.png`

## 동작 흐름

1. `/learning` 진입(세션 없으면 `/login`).
2. 처음에는 선택이 없고 「학습 시작」은 꺼져 있다.
3. 부위·영상 종류를 하나씩 고른다.
4. 둘 다 고르면 「학습 시작」이 켜진다.
5. 누르면 `/medical?region=...&type=...` 으로 이동한다.
