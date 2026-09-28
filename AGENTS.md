# 공통 하네스

어느 코딩 AI든 이 저장소에서 작업하기 전에 이 파일과 `docs/FEATURE_SPEC.md`를 읽고 그대로 구현한다. 기능의 완료 기준은 기능 명세서를 따른다. 명세에 없는 화면, 라이브러리, 폴더를 새로 만들지 않는다.

## 스택

- Vue 3, Options API, 단일 파일 컴포넌트. Composition API와 TypeScript로 바꾸지 않는다.
- 라우터는 `src/router/index.js`의 vue-router 4만 사용한다.
- HTTP는 `fetch`만 사용한다. axios, Pinia, UI 라이브러리를 추가하지 않는다.
- 화면 문구는 한국어로 둔다.

## 폴더

```
src/
  main.js              앱 시작, router 등록
  App.vue              router-view만 렌더
  router/index.js      경로와 로그인 이동
  components/
    login/             로그인, 세션
    signup/            회원가입
    Medical/           문제 풀이 (영상, ROI, 용어)
    Medical/review/    채점 리뷰
```

- 새 화면은 해당 기능 폴더에 `PascalCase.vue`로 둔다.
- 그 화면만 쓰는 상수와 순수 함수는 같은 폴더의 `.js` 파일로 뺀다.
- 스타일은 컴포넌트 `scoped` CSS에 둔다. 전역 스타일은 `App.vue`의 높이, 글꼴만 유지한다.

## 데이터

- 로그인 사용자: `sessionStorage` 키 `medlens_user`. 읽고 쓰기는 `src/components/login/authSession.js`만 사용한다.
- 채점 결과: `sessionStorage` 키 `medlens.review`. 읽고 쓰기는 `src/components/Medical/review/reviewModel.js`만 사용한다.
- 풀이 화면 쿼리: `region` (`brain` `chest` `abdomen` `knee`), `type` (예: `CT`).
- API 주소는 그 요청을 하는 파일 상단 상수로만 둔다. 기본 백엔드는 `http://127.0.0.1:8000`.

## 구현 습관

- 기존 컴포넌트의 props, emit, 클래스 이름을 유지한 채 행동을 고친다.
- 한 변경은 그 기능 폴더와, 필요하면 라우터까지만 건드린다.
- 기능을 끝내면 `docs/FEATURE_SPEC.md`의 해당 항목을 `[x]`로 바꾼다.

## 학습 문서

기능을 만들거나 고칠 때마다 `docs/learn/index.html`을 같이 고친다. AI가 짠 코드라도 사람이 브라우저에서 이 파일만 열어 따라갈 수 있어야 한다. 앱 빌드에 넣지 않고, 파일 그대로 연다.

바뀐 기능마다 그 절을 새로 쓰거나 고친다. 목차 링크도 맞춘다. 절마다 아래 네 가지를 빠뜨리지 않는다.

1. 무엇을 하나. 화면에서 사용자가 하는 일.
2. 어느 파일인가. 경로와, 그 파일이 그 일을 맡은 이유.
3. 동작 순서. 클릭이나 주소에서 저장, API, 다음 화면까지.
4. 확인하는 법. 브라우저에서 눌러 볼 절차와, 아직 안 되는 점.

코드는 그 순서를 보여주는 짧은 조각만 넣는다. 파일 전체를 붙이지 않는다.
