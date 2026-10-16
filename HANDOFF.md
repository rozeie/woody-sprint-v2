# Stack 작업 인계 문서 (HANDOFF)

작성일: 2026-10-17 (작업은 2026-10-16에 진행)
상태: **온보딩 전체와 홈 1차 개편까지 구현, 마지막 커밋 이후의 변경은 커밋과 push 하지 않은 상태**
다음 작업: 홈의 **"나의 학습 방향" 요약 영역 추가**. 그 전에 사용자가 돌아오면 **추천 카드에 대한 추가 수정 의견을 먼저 확인**한다.

> 이 문서에는 가운데 점 문자와 구분용 점 문자를 쓰지 않았습니다. 이 규칙은 앞으로도 유지합니다.

---

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 서비스 | Stack(구 North). 프로덕트 디자이너를 위한 모바일 우선 학습 PWA 데모 |
| 성격 | **UI 데모.** 실제 AI, DB, 서버, 로그인, 알림 없음. 모든 저장은 브라우저 localStorage(`stack-demo:v1:*`) |
| 흐름 | `/` 소개, `/onboarding`(입력 4단계), `/onboarding/analyzing`, `/direction`(5단계 결과 확인과 확정), `/home`, `/content/[id]/preview`, `/read/[id]`, `/library`, `/settings`(준비 중 안내) |
| 스택 | Next.js 16.4.1(Cache Components, 이전 화면이 숨겨진 채 유지됨), React 19.3, Tailwind 4, TypeScript 5. 추가 라이브러리 없음 |
| 저장소 | https://github.com/rozeie/woody-sprint-v2.git, 브랜치 main. 마지막 push는 `006a1ef` |

---

## 2. 문서 위치와 규칙

| 파일 | 역할 |
|---|---|
| **`PRD-v0.6.md`** | **최신 PRD.** 홈 학습 스택 30일(v0.4), 홈 추천 카드 간소화와 카드 클릭 시 미리보기 이동(v0.5), 추천 교체 남은 시간과 회차 전환, 만료 선택 거절(v0.6) |
| `PRD.md`(v0.1), `PRD-v0.2.md`, `PRD-v0.3.md`, `PRD-v0.4.md`, `PRD-v0.5.md` | 이전 버전. 수정 금지(보존). 변경 이력은 최신 파일 부록 B에 모두 유지 |
| `DESIGN.md`(v0.2.1) | 원본 보존, 수정하지 않음. 충돌은 결정 기록에 남긴다 |
| **`docs/ui-style-guide.md`** | 소개 화면과 온보딩에서 실제 구현된 UI 기준(색, 글자, 카드, 그래픽, 버튼, 바텀시트, 피드백, 내비게이션). 홈 개편은 아직 이 문서에 반영하지 않았다 |
| **`docs/ui-demo-decisions.md`** | 구현 중 정한 임시 결정, 충돌, 미확정. 섹션 끝쪽에 "홈 개편 1차 수정"부터 "홈 개편 6차"까지가 최신. **작업 전에 먼저 읽을 문서** |
| `CLAUDE.md` | PRD 버전 관리 규칙(수정 금지, 제목의 "North"는 그대로) |

지켜야 할 규칙
- PRD를 바꾸려면 새 버전 파일(`PRD-v0.7.md` 등)을 만들고 하단에 변경 이력(버전, 날짜, 수정 항목, 변경 전, 변경 후, 이유)을 남기며 이전 이력을 유지한다. 요청한 부분만 고치고 미확정을 확정으로 올리지 않는다.
- 단계별로 요청한 범위만 구현한다. 커밋과 push는 사용자가 요청할 때만 한다.
- **가운데 점 사용 금지**: 화면 문구, 메타데이터, 접근성 라벨, CSS 구분 문자에서 가운데 점 문자와 구분용 불릿을 쓰지 않는다. 점 모양 목록도 쓰지 않는다. 자동 검사 `tests/no-middle-dot.test.mts`.
- 새 라이브러리를 추가하지 않는다.
- Git: 로컬 작성자 `rozeie <rozeie@users.noreply.github.com>`. 커밋 메시지 끝에 `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. 강제 푸시와 origin 변경 금지.
- **참고 이미지는 커밋에서 제외하고 로컬에 유지한다**: `reference-intro.png`, `reference-topics.jpg`, `reference-home.png`(추적되지 않는 상태). 커밋할 때는 `git add -A -- . ':!reference-intro.png' ':!reference-topics.jpg' ':!reference-home.png'`.
- 공통 디자인(사용자 지시): 화면 배경 #F9FAFB, primary #15B574(hover #15B876, pressed #10A66B), 그린 CTA 글자는 흰색, 최상단 UI 데모 배너 유지. 흰 글자와 #15B574 대비는 2.66 대 1로 미달이나 사용자 지시로 유지한다(결정 대기, 임의로 어두운 그린으로 바꾸지 않는다).

---

## 3. 실행 방법

```
npm install
npm run dev -- --port 3000   # http://localhost:3000
npm run lint
npm run typecheck
npm test                     # Node 내장 테스트 러너(.mts)
npm run build                # 이번 세션에는 실행하지 않았다
```

- `globals.css` 변경이 개발 서버에 반영되지 않으면, 이 프로젝트의 node 프로세스(명령줄에 `woody-sprint-v2`와 `next` 포함)만 종료한 뒤 다시 실행한다.
- 렌더 중에 `Date.now()`나 `new Date()`를 읽으면 Cache Components가 오류를 낸다(홈의 현재 시각은 효과 안에서 채운다).
- 데모 장치: `/onboarding/analyzing?demo=error|error-once|slow`, `/direction?demo=error|error-once`.
- 저장 데이터 초기화는 브라우저의 사이트 데이터 삭제 또는 시크릿 창.

---

## 4. 완료한 작업

### 이전 세션에서 커밋과 push 완료 (`006a1ef`까지)
- 소개 화면, 온보딩 입력 4단계(고민 영역, 현재 상황, 추가 설명, 시작 전 안내)와 5칸 진행 표시, 분석 화면, 5단계 결과 화면(핵심 방향 카드, 그래픽 세부 주제 카드, 더보기 삭제와 실행 취소, 주제 추가 바텀시트, 재분석 확인창, 가로 한 줄 CTA), 온보딩 상단 바(서비스명 없음, 쉐브론)

### 이번 세션: 홈 개편 (아직 커밋하지 않음)
| 영역 | 내용 | 주요 파일 |
|---|---|---|
| 상단 대표 섹션 | #15B574 배경, 흰 글자 제목과 두 문장 설명(두 번째 문장은 새 줄), 흰색 계열 스택 그래픽, CTA 없음 | `src/components/home/HomeHero.tsx` |
| 학습 스택 | 오늘 포함 최근 30일(`STACK_DAYS` = 30), 10열 3행, 칸 약 25px, 칸마다 버튼(날짜와 "학습 기록 있음/없음"), 누르거나 방향키로 확인, 요약 "최근 30일, 학습한 날 N일", 기준 안내 "하루 총 5분 이상 읽으면 기록돼요."(날짜별 긴 목록 제거) | `StudyStack.tsx`, `src/lib/stack-rules.ts` |
| 이어서 읽기 | 선택한 미완료 자료가 있을 때만, 오늘의 추천 위. 시작 전 "학습 시작", 시작 기록이 있으면 "이어서 읽기" | `HomeGate.tsx`, `ContinueReading.tsx` |
| 오늘의 추천 카드 | 카드 전체가 상세 미리보기로 가는 하나의 링크. 상단: 학습 방식 아이콘(#15B574 10% 원형), 그린 학습 방식 문구(개념 이해하기, 사례 탐색, 직접 실습해보기, 프레임워크 익히기), 콘텐츠명, 약 30자 한 문장 소개. 하단: 예상 시간, 연결 주제 배지(확정 주제와 자료 주제의 교집합, 최대 2개), 선택된 자료의 작은 "선택됨". 선택 버튼과 안내 문구 없음 | `RecommendationCard.tsx`, `icons.tsx` |
| 추천 교체 | 헤더 오른쪽에 "교체까지 N시간 N분"(1시간 미만은 N분). 한국 시간 기준 매일 오후 6시, 시간 경과와 화면 복귀 시 갱신, 새 회차 전환(직전 추천과 선택한 자료 제외, 부족하면 기존 부족 상태). 선택과 읽기 기록 보존. 열어 둔 미리보기에서 이전 회차 자료의 선택은 거절하고 안내 | `src/lib/recommendation-cycle.ts`, `HomeGate.tsx`, `demo-repository.ts`, `useSelectAction.ts` |
| 하단 내비게이션 | 현재 탭 아이콘과 글자 #15B574 | `BottomNav.tsx` |
| 상세 미리보기 | 홈에서 뺀 정보를 위해 소개 문장과 "핵심 학습 내용" 섹션만 추가(디자인 개편은 하지 않음) | `PreviewScreen.tsx` |
| 공통 데모 배너 | "자동 교체는 아직 없어요"를 정정: 읽기 시간 측정은 없고, 추천은 서버가 아니라 이 브라우저에서 접속할 때 오후 6시(한국 시간) 기준으로 바뀐다 | `DemoNotice.tsx` |

커밋하지 않은 파일 전체(새 파일 포함): `PRD-v0.4.md`, `PRD-v0.5.md`, `PRD-v0.6.md`, `docs/ui-style-guide.md`, `docs/ui-demo-decisions.md`, `HANDOFF.md`, `src/components/home/HomeHero.tsx`, `StudyStack.tsx`, `RecommendationCard.tsx`, `HomeGate.tsx`, `BottomNav.tsx`, `DemoNotice.tsx`, `PreviewScreen.tsx`, `SelectArea.tsx`(홈 카드용 배치 제거), `useSelectAction.ts`, `icons.tsx`, `src/config/demo-contents.ts`(`shortSummary` 추가), `src/lib/content/*`, `src/lib/data/demo-repository.ts`, `src/lib/selection-rules.ts`, `src/lib/stack-rules.ts`, `src/lib/recommendation-cycle.ts`, `tests/recommendation.test.mts`, `tests/recommendation-cycle.test.mts`.

---

## 5. 다음 작업과 이후 작업

**다음 작업: "나의 학습 방향" 요약 영역 추가 (홈).** 사용자가 돌아오면 **추천 카드에 대한 추가 수정 의견이 있는지 먼저 확인**한 뒤 시작한다. 요구 내용은 사용자에게 다시 받는다(확정한 핵심 학습 방향과 세부 주제를 요약하는 영역으로 예상되나 위치와 내용은 임의로 정하지 않는다).

이후 남은 작업(순서는 사용자와 합의)
1. 상세 미리보기와 선택 흐름 개편(선택 후 안내 방식 정리, "선택한 학습 자료는 변경할 수 없어요." 안내 정리 포함)
2. 앱 전체 폭 제한과 중앙 정렬(현재 홈 개편 중에는 건드리지 않기로 함)
3. 추천 카드 외곽 스트로크 제거
4. 빈 상태 확인(추천 0개와 1개 부족 상태, 선택 자료 없음, 학습 기록 없음 등)
5. **스택이 쌓이는 모션은 훨씬 나중 작업**

---

## 6. 검증 결과 (이번 세션 마지막 실행)

| 항목 | 결과 |
|---|---|
| `npm run lint` | 통과 |
| `npm run typecheck` | 통과 |
| `npm test` | **120개 통과, 0개 실패**(회차 계산 6개, 소개 문장 길이, 제외 후보 선정 포함) |
| `npm run build` | 이번 세션 미실행 |
| 브라우저 검증(390px, Playwright와 Edge) | 홈 대표 섹션, 30일 학습 스택, 이어서 읽기 순서, 추천 카드(구조, 배지 기준, 클릭과 키보드 이동), 선택 상태, 시간 제어 검증(17:55 확정, 오후 6시 경계 전환, 열어 둔 미리보기의 선택 거절, 다음 날 교체와 선택 보존, 며칠 뒤 재방문). 모두 통과. 실제 오후 6시를 기다리지 않고 Playwright 시계를 썼다 |

브라우저 검증 스크립트는 저장소 밖 임시 폴더에 있다(정리될 수 있음):
`C:\Users\charl\AppData\Local\Temp\claude\D--woody-sprint-v2\2a60b340-6ab2-426a-a07e-62152c559acb\scratchpad\` 의 `check30.mjs`(학습 스택), `check31.mjs`(대표 섹션과 스택 위계), `check34.mjs`(이어서 읽기 순서, 일부 항목은 카드 개편 전 기준), `check36.mjs`(추천 교체 시간 제어), `check37.mjs`(추천 카드). playwright-core는 `...\bb9f4376-b5e3-45dc-872e-03f1336618e6\scratchpad\e2e\` 모듈을 쓴다. 필요하면 프로젝트 안(예: `tests/e2e`)으로 옮길지 결정한다.

---

## 7. 미구현 사항과 한계

- 읽기 시간 측정은 없다. 학습 스택은 항상 모든 칸이 "학습 기록 없음"이며 가짜 기록을 만들지 않는다(활성 칸의 실제 화면은 브라우저에서 확인하지 못했고 단위 테스트로만 확인).
- 추천 교체는 **브라우저 시계로 현재 회차를 판단해 localStorage를 바꾸는 데모 동작**이다. 서버가 정해진 시간에 추천을 만드는 기능, 클라이언트 시계 불신, `(user_id, cycle_key)` 유일 제약, 여러 탭과 기기 동시성은 구현하지 않았다.
- 새 회차 후보에서 직전 추천과 선택한 자료를 제외하는 방식은 임시 선택이다(PRD D-08 미확정).
- 실제 AI 분석과 개인화 추천, 회고, 설정(방향 재설정), 알림, 로그인, 서버 저장은 없다. 추가 설명은 모의 분석 결과에 반영되지 않는다(후속 구현 항목으로 기록).
- 학습 스택 칸의 터치 영역이 44px보다 작다(390px에서 약 25px).
- Figma 아이콘(TDS) 파일은 로그인 없이 열 수 없어 사용 조건을 확인하지 못했다. 카드 아이콘은 직접 그린 SVG다. 사용 조건을 확인하면 교체할 수 있다.
- 실기기(iOS, Android) safe area와 모바일 키보드, 스크린리더 실제 낭독, 1280px 이상 폭, 높이 520px 이하에서 토스트 배치는 확인하지 않았다.
- 5단계(리더) 사용자 로컬 확인 결과는 아직 받지 못했다.
- 홈에서 "이어서 읽기"는 선택 자료의 상태에 따라 버튼이 바뀐다. 읽기 시작 기록은 리더 화면이 열릴 때 남으며 실제 읽은 시간이 아니다.

---

## 8. 문서 간 불일치와 확인 요청

| 항목 | 내용 |
|---|---|
| PRD와 홈 순서 | `PRD-v0.6.md` §9.2의 홈 구성 나열은 "오늘의 추천 2개, 학습 스택(최근 30일), 이어서 읽기"이며 현재 구현(이어서 읽기가 추천 위)과 다르다. 새 PRD 버전은 사용자 승인 후에 만든다 |
| PRD와 DESIGN §9 | DESIGN은 7열 4행 28칸 배열이며 구현은 10열 3행 30칸이다(DESIGN은 수정하지 않았고 결정 기록에 남김) |
| 그린 CTA 대비 | 흰 글자 대 #15B574, 흰 배경 위 #15B574 글자(탭, 텍스트 버튼)의 대비 미달. 해결안(버튼용 어두운 그린 등) 사용자 결정 대기 |
| PRD v0.3 이후와 구현 | 온보딩 문구와 단계 구성 일부가 PRD와 다르다(현재 구현 기준이 우선, 결정 기록 참조) |
| 결정 기록 | `docs/ui-demo-decisions.md`의 "온보딩 4단계 개편" 섹션에 4칸 진행 바 표가 남아 있다(현재는 5칸, 이후 섹션이 우선) |
| UI 기준 문서 | `docs/ui-style-guide.md`는 홈 개편(대표 섹션, 스택, 카드, 교체 남은 시간)을 아직 반영하지 않았다 |

---

## 9. 다음 세션 시작 체크리스트

1. 이 문서, `docs/ui-demo-decisions.md`(끝쪽 홈 섹션), `docs/ui-style-guide.md`, `PRD-v0.6.md`를 읽는다.
2. `git status`로 커밋하지 않은 변경을 확인하고 `npm test`, `npm run lint`, `npm run typecheck`를 실행한다.
3. `npm run dev -- --port 3000`으로 개발 서버를 띄운다(포트 사용 여부 확인).
4. 사용자에게 **추천 카드에 대한 추가 수정 의견**을 먼저 묻는다.
5. 그다음 **"나의 학습 방향" 요약 영역**의 요구를 받아 진행한다. 위치, 내용, 문구는 임의로 정하지 않는다.
6. 커밋과 push는 사용자가 요청할 때만 한다(참고 이미지 3개 제외).
