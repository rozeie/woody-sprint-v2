/**
 * 모의 AI 분석용 고정 문구. 의존성이 없다(테스트가 직접 import).
 * 이 문장들은 실제 AI 출력이 아니라 UI 확인용으로 미리 쓴 예시이며, 실제 개인화·검수 결과가 아니다.
 * 어투 원칙: 능력·수준을 평가하거나 점수화하지 않고, "~할 수 있어요" 식으로 단정하지 않는다.
 */

export const GROUP_FIXTURES: Record<
  string,
  { core: { label: string; description: string }; difficulty: string }
> = {
  "문제 정의와 리서치": {
    core: {
      label: "문제를 정의하고 근거로 설명하는 방법",
      description:
        "무엇이 진짜 문제인지 좁히고, 리서치와 데이터로 그 근거를 쌓아 가는 흐름을 살펴봐요.",
    },
    difficulty: "무엇을 문제로 보고 어떤 근거로 설명할지 정하는 일",
  },
  설계: {
    core: {
      label: "사용자 경험을 구조적으로 설계하는 방법",
      description:
        "화면 하나하나보다 흐름과 구조를 먼저 잡고, 의도를 설명할 수 있는 설계 습관을 살펴봐요.",
    },
    difficulty: "화면과 흐름을 어떤 구조로 설계할지 정하는 일",
  },
  "협업과 소통": {
    core: {
      label: "함께 일하는 사람들과 합의를 만드는 방법",
      description:
        "개발자, 기획자, 이해관계자와 같은 그림을 보며 의사결정을 이끄는 소통 방식을 살펴봐요.",
    },
    difficulty: "다른 직군과 의견을 맞추고 설득하는 일",
  },
  커리어: {
    core: {
      label: "내 경험을 직무 이야기로 정리하는 방법",
      description:
        "지금까지의 작업을 읽는 사람이 이해할 수 있는 이야기로 정리하는 방법을 살펴봐요.",
    },
    difficulty: "내 경험을 직무에 맞게 정리해서 보여주는 일",
  },
  기타: {
    core: {
      label: "지금 상황을 구체적인 학습 주제로 좁히는 방법",
      description: "적어 주신 고민을 하나의 학습 주제로 좁혀 보는 데서 시작해요.",
    },
    difficulty: "적어 주신 상황을 학습으로 연결하는 일",
  },
};

/** 칩 key(= 학습 주제 key)별 한 줄 설명. */
export const TOPIC_WHY: Record<string, string> = {
  "user-research": "사용자 이야기를 모아 문제의 근거로 쓰는 방법을 살펴봐요.",
  "problem-definition": "겉으로 드러난 요구에서 진짜 문제를 좁히는 방법을 살펴봐요.",
  "data-metrics": "숫자를 해석하고 성공 기준을 정하는 방법을 살펴봐요.",
  "ia-flow": "정보를 묶고 화면 사이의 흐름을 잡는 방법을 살펴봐요.",
  "ui-design": "화면 요소의 위계와 일관성을 다루는 방법을 살펴봐요.",
  "design-system": "반복되는 요소를 규칙으로 정리하는 방법을 살펴봐요.",
  "interaction-prototype": "동작을 설계하고 빠르게 검증하는 방법을 살펴봐요.",
  "ux-writing": "화면 속 문장이 행동을 돕도록 쓰는 방법을 살펴봐요.",
  "dev-collab": "개발자와 구현 가능성을 함께 맞춰 가는 방법을 살펴봐요.",
  "pm-collab": "기획자와 우선순위와 범위를 조율하는 방법을 살펴봐요.",
  stakeholder: "근거를 들어 의견이 다른 사람을 설득하는 방법을 살펴봐요.",
  "design-feedback": "피드백을 받아 디자인을 발전시키는 방법을 살펴봐요.",
  portfolio: "프로젝트를 문제 해결 이야기로 구성하는 방법을 살펴봐요.",
  interview: "작업 과정을 말로 설명하는 방법을 살펴봐요.",
  "role-direction": "직무가 하는 일과 나의 방향을 연결하는 방법을 살펴봐요.",
  "persona-journey": "사용자 유형과 여정을 정리해 문제가 생기는 지점을 찾는 방법을 살펴봐요.",
  "competitor-analysis": "비슷한 서비스를 비교해 내 서비스의 차이를 찾는 방법을 살펴봐요.",
  "hypothesis-test": "추측을 가설로 바꾸고 작게 검증하는 방법을 살펴봐요.",
  "usability-test": "사용자가 막히는 지점을 관찰하고 개선으로 옮기는 방법을 살펴봐요.",
  accessibility: "누구나 쓸 수 있도록 대비, 크기, 읽는 순서를 점검하는 방법을 살펴봐요.",
  "edge-states": "오류, 빈 화면, 로딩처럼 놓치기 쉬운 상황을 설계하는 방법을 살펴봐요.",
  "design-review": "리뷰의 목적을 정하고 의견을 모아 결론을 내는 방법을 살펴봐요.",
  "handoff-docs": "개발자가 헷갈리지 않도록 전달 문서를 정리하는 방법을 살펴봐요.",
  resume: "경험을 직무에 맞게 골라 간결하게 쓰는 방법을 살펴봐요.",
  "design-task": "과제의 요구를 파악하고 제한된 시간 안에 결과를 정리하는 방법을 살펴봐요.",
  "work-adapt": "새 팀에서 업무 흐름을 익히고 질문하는 방법을 살펴봐요.",
  "growth-plan": "지금 위치에서 다음 목표까지 필요한 학습을 계획하는 방법을 살펴봐요.",
};

/** 칩을 고르지 않고 '기타'만 쓴 경우에 제안하는 기본 주제. */
export const OTHER_ONLY_TOPICS = ["problem-definition", "stakeholder", "role-direction"];

export const SITUATION_PHRASE = {
  job_seeker: "취업을 준비하는 상황에서",
  junior: "실무에서 일하는 상황에서",
} as const;
