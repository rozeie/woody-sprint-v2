/**
 * UI 확인용 예시 학습 자료 목록. keyLearnings는 홈 카드용 짧은 구절이고, 구체적인 설명은 preview에 둔다. 의존성이 없다(테스트가 직접 import).
 * 이 자료들은 검수된 출시 콘텐츠가 아니라 화면 확인을 위해 미리 쓴 예시이며, 외부 자료를 옮긴 것이 아니다.
 * 주제 key는 고민 칩 key와 정렬한 임시 분류다(PRD §12.4 제안). 'ux-writing' 주제는 일부러 자료를 두지 않았다(후보 부족 상태 재현용).
 * 리더용 본문은 demo-content-bodies.ts에 따로 둔다(카드·미리보기 응답에는 포함하지 않는다).
 */
import type { ContentFull } from "../lib/content/types.ts";


export const DEMO_CONTENTS: readonly ContentFull[] = [
  {
    id: "user-interview-basics",
    title: "사용자 인터뷰, 무엇을 물어야 문제가 보일까",
    shortSummary: "좋은 질문과 유도 질문의 차이, 메모를 관찰과 해석으로 나누는 법을 배워요. 인터뷰 내용을 문제 정의로 연결하고 싶을 때 볼 수 있어요.",
    summary: "인터뷰를 ‘의견 수집’이 아니라 ‘문제 찾기’로 쓰기 위한 기본 개념을 정리해요.",
    keyLearnings: ["의견과 행동 구분", "질문 설계 원칙", "문제 후보로 바꾸기"],
    type: "concept",
    topics: ["user-research", "problem-definition"],
    estMinutes: 9,
    preview: {
      subject: "사용자 인터뷰의 목적과 질문 설계의 기본 개념",
      whatYouLearn: [
        "좋은 질문과 유도 질문의 차이",
        "한 번의 인터뷰로 알 수 있는 것과 알 수 없는 것",
        "메모를 ‘관찰’과 ‘해석’으로 나누어 적는 방법",
      ],
      actionAfter: [
        "내 프로젝트의 인터뷰 질문 3개를 다시 써 볼 수 있어요",
        "지난 인터뷰 메모에서 관찰과 해석을 나눠 볼 수 있어요",
      ],
    },
  },
  {
    id: "research-synthesis-case",
    title: "리서치 결과를 한 장으로 정리한 사례 살펴보기",
    shortSummary: "가상 프로젝트에서 인터뷰 메모와 지표를 한 표에 놓고 읽는 과정을 따라가요. 리서치 결과를 팀에 공유할 한 장으로 정리하고 싶을 때 볼 수 있어요.",
    summary: "인터뷰와 지표를 함께 읽고 발견을 정리한 가상의 프로젝트 사례를 따라가 봐요.",
    keyLearnings: ["메모 주제별 묶기", "정성과 숫자 함께 읽기", "한 장 요약 구성"],
    type: "case",
    topics: ["user-research", "data-metrics"],
    estMinutes: 11,
    preview: {
      subject: "리서치 결과를 종합하고 공유하는 과정을 사례로 보기",
      whatYouLearn: [
        "가상 프로젝트에서 메모를 정리하는 단계별 흐름",
        "정성 근거와 지표를 같은 표에 놓고 읽는 방식",
        "공유 자료에서 덜어낼 내용과 남길 내용",
      ],
      actionAfter: [
        "내 리서치 메모를 주제별로 묶어 볼 수 있어요",
        "팀에 공유할 한 장 요약의 뼈대를 만들어 볼 수 있어요",
      ],
    },
  },
  {
    id: "problem-framing-framework",
    title: "문제를 한 문장으로 정의하는 틀",
    shortSummary: "요구, 증상, 원인을 나누고 ‘누가, 언제, 왜 어려운가’로 문제를 적는 틀을 익혀요. 문제 문장을 팀과 확인하는 순서도 함께 다뤄요.",
    summary: "요구사항 뒤에 있는 문제를 한 문장으로 적어 보는 틀을 소개해요.",
    keyLearnings: ["요구와 문제 구분", "문제 문장 세 칸 틀", "팀과 합의하는 순서"],
    type: "framework",
    topics: ["problem-definition", "stakeholder"],
    estMinutes: 10,
    preview: {
      subject: "문제 정의 문장을 만드는 틀과 팀 합의 순서",
      whatYouLearn: [
        "요구, 증상, 원인을 구분하는 기준",
        "‘누가, 언제, 왜 어려운가’로 문제를 적는 틀",
        "문제 문장을 이해관계자와 확인하는 순서",
      ],
      actionAfter: [
        "진행 중인 프로젝트의 문제를 한 문장으로 써 볼 수 있어요",
        "팀원에게 문제 문장을 보여주고 의견을 물어볼 수 있어요",
      ],
    },
  },
  {
    id: "metrics-reading-practice",
    title: "지표를 보고 질문을 만드는 연습",
    shortSummary: "전환율 같은 지표의 정의를 확인하고 변화의 원인 후보를 질문으로 바꾸는 연습을 해요. 프로젝트 시작 전에 성공 기준을 적는 방법도 익혀요.",
    summary: "숫자 변화를 보고 ‘왜’를 묻는 질문으로 바꾸는 연습을 해요.",
    keyLearnings: ["지표에서 질문 만들기", "성공 기준 미리 쓰기", "숫자로 단정하지 않기"],
    type: "practice",
    topics: ["data-metrics", "problem-definition"],
    estMinutes: 12,
    preview: {
      subject: "지표 해석과 성공 기준 설정의 기초 연습",
      whatYouLearn: [
        "전환율 같은 지표의 정의를 먼저 확인하는 방법",
        "변화의 원인 후보를 나열하는 방법",
        "프로젝트 시작 전에 성공 기준을 적는 양식",
      ],
      actionAfter: [
        "내 서비스의 지표 하나를 골라 질문을 써 볼 수 있어요",
        "다음 작업의 성공 기준을 미리 적어 볼 수 있어요",
      ],
    },
  },
  {
    id: "flow-structure-concept",
    title: "화면보다 먼저 흐름과 구조를 보는 법",
    shortSummary: "화면을 그리기 전에 사용자 흐름을 먼저 그리고 메뉴 이름을 정하는 기준을 배워요. 정보 구조와 흐름을 어떻게 잡을지 정리하고 싶을 때 볼 수 있어요.",
    summary: "화면 하나를 그리기 전에 사용자의 흐름과 정보 구조를 먼저 잡는 개념을 정리해요.",
    keyLearnings: ["목표에서 시작하는 흐름", "정보 묶기와 이름 짓기", "간단한 프로토타입 확인"],
    type: "concept",
    topics: ["ia-flow", "interaction-prototype"],
    estMinutes: 10,
    preview: {
      subject: "정보 구조와 사용자 흐름 설계의 기본 개념",
      whatYouLearn: [
        "화면 목록보다 흐름을 먼저 그리는 이유",
        "메뉴와 항목 이름을 정하는 기준",
        "종이나 간단한 도구로 흐름을 확인하는 방법",
      ],
      actionAfter: [
        "진행 중인 작업의 핵심 흐름을 한 장으로 그려 볼 수 있어요",
        "메뉴 이름이 헷갈리는 곳을 찾아 볼 수 있어요",
      ],
    },
  },
  {
    id: "ui-hierarchy-practice",
    title: "화면의 위계를 바로잡는 UI 연습",
    shortSummary: "주 행동과 보조 행동을 나누고 간격과 정렬로 정보를 묶는 연습을 해요. 같은 화면을 단계별로 다듬으며 요소의 일관성도 맞춰 봐요.",
    summary: "같은 화면을 크기, 간격, 색의 순서로 다듬어 보며 위계를 연습해요.",
    keyLearnings: ["주 행동 하나 정하기", "크기와 간격으로 위계", "일관성 맞추기"],
    type: "practice",
    topics: ["ui-design", "design-system"],
    estMinutes: 8,
    preview: {
      subject: "화면 요소의 위계와 일관성을 다듬는 기초 연습",
      whatYouLearn: [
        "주 행동과 보조 행동을 구분하는 기준",
        "간격과 정렬만으로 정보를 묶는 방법",
        "같은 역할의 요소를 같은 모양으로 맞추는 방법",
      ],
      actionAfter: [
        "내 화면 하나에서 주 행동을 찾고 위계를 다시 잡아 볼 수 있어요",
        "비슷하지만 다르게 생긴 버튼을 찾아 맞춰 볼 수 있어요",
      ],
    },
  },
  {
    id: "design-system-rules-framework",
    title: "반복되는 요소를 규칙으로 정리하는 틀",
    shortSummary: "색이나 간격 값을 토큰으로 둘지 컴포넌트로 만들지 구분하는 기준을 배워요. 반복되는 요소를 규칙으로 남겨 팀이 찾기 쉽게 정리하는 방법도 다뤄요.",
    summary: "화면에서 반복되는 요소를 찾아 이름과 규칙으로 정리하는 순서를 소개해요.",
    keyLearnings: ["반복 요소 찾기", "토큰과 컴포넌트 구분", "규칙 문서화"],
    type: "framework",
    topics: ["design-system", "ui-design"],
    estMinutes: 11,
    preview: {
      subject: "디자인 시스템의 토큰과 컴포넌트를 나누는 틀",
      whatYouLearn: [
        "색이나 간격 같은 값을 토큰으로 두는 기준",
        "컴포넌트로 만들 것과 그대로 둘 것의 구분",
        "규칙을 팀이 찾기 쉽게 남기는 방법",
      ],
      actionAfter: [
        "내 프로젝트에서 반복되는 요소 5개를 목록으로 만들 수 있어요",
        "가장 자주 쓰는 값 하나를 토큰으로 정해 볼 수 있어요",
      ],
    },
  },
  {
    id: "dev-handoff-case",
    title: "개발자와 구현 범위를 맞춘 사례",
    shortSummary: "가상 사례로 구현 가능성을 일찍 묻는 질문과 상태, 예외를 함께 전달하는 방법을 따라가요. 개발자, 기획자와 범위를 맞춰야 할 때 참고할 수 있어요.",
    summary: "디자인을 넘기기 전과 후에 오간 대화를 가상의 사례로 따라가 봐요.",
    keyLearnings: ["구현 가능성 질문", "상태와 예외 정리", "범위 줄이는 방법"],
    type: "case",
    topics: ["dev-collab", "pm-collab"],
    estMinutes: 10,
    preview: {
      subject: "개발자, 기획자와 구현 범위를 맞추는 과정을 사례로 보기",
      whatYouLearn: [
        "구현 가능성을 일찍 묻는 질문 목록",
        "화면 외에 상태와 예외를 함께 전달하는 방법",
        "범위를 줄여야 할 때 우선순위를 말하는 방법",
      ],
      actionAfter: [
        "다음 전달 전에 개발자에게 물어볼 질문 3개를 정해 볼 수 있어요",
        "내 화면의 상태와 예외를 목록으로 적어 볼 수 있어요",
      ],
    },
  },
  {
    id: "persuade-with-evidence-practice",
    title: "근거로 의견을 설득하는 연습",
    shortSummary: "주장, 근거, 제안을 나눠 말하고 반대 의견에서 걱정되는 지점을 묻는 연습을 해요. 받은 피드백을 할 일 목록으로 바꾸는 방법도 익혀요.",
    summary: "의견이 다른 상대에게 근거를 들어 설명하고 피드백을 받는 연습을 해요.",
    keyLearnings: ["주장과 근거 나누기", "상대 걱정 먼저 정리", "피드백을 할 일로"],
    type: "practice",
    topics: ["stakeholder", "design-feedback", "pm-collab"],
    estMinutes: 9,
    preview: {
      subject: "근거 중심으로 설명하고 피드백을 받는 소통 연습",
      whatYouLearn: [
        "주장, 근거, 제안을 나눠 말하는 틀",
        "반대 의견에서 걱정되는 지점을 찾는 질문",
        "받은 피드백을 해야 할 일 목록으로 바꾸는 방법",
      ],
      actionAfter: [
        "다음 리뷰에서 주장과 근거를 나눠 말해 볼 수 있어요",
        "최근 받은 피드백을 수정 항목으로 정리해 볼 수 있어요",
      ],
    },
  },
  {
    id: "portfolio-story-framework",
    title: "프로젝트를 문제 해결 이야기로 구성하는 틀",
    shortSummary: "프로젝트를 문제, 접근, 결과, 배운 점으로 나누고 내가 한 일과 팀이 한 일을 구분해 적는 틀을 배워요. 지원하는 직무에 맞는 프로젝트를 고르는 기준도 다뤄요.",
    summary: "작업물을 나열하지 않고 문제와 선택의 이야기로 엮는 구성을 소개해요.",
    keyLearnings: ["네 단계로 나누기", "내 역할과 선택 이유", "보여줄 프로젝트 고르기"],
    type: "framework",
    topics: ["portfolio", "role-direction"],
    estMinutes: 12,
    preview: {
      subject: "포트폴리오 프로젝트를 문제 해결 이야기로 구성하는 틀",
      whatYouLearn: [
        "문제, 접근, 결과, 배운 점으로 나누는 구성",
        "‘내가 한 일’과 ‘팀이 한 일’을 구분해 적는 방법",
        "지원하는 직무에 맞춰 프로젝트를 고르는 기준",
      ],
      actionAfter: [
        "프로젝트 하나를 네 단계로 적어 볼 수 있어요",
        "내 역할을 한 문장으로 정리해 볼 수 있어요",
      ],
    },
  },
  {
    id: "explain-process-practice",
    title: "작업 과정을 말로 설명하는 연습",
    shortSummary: "프로젝트 소개를 30초로 줄이고 선택과 대안을 함께 말하는 순서를 연습해요. 면접 예상 질문과 답변의 뼈대도 만들어 봐요.",
    summary: "결과물이 아니라 과정과 이유를 말로 풀어 보는 연습을 해요.",
    keyLearnings: ["30초 맥락 전달", "선택의 이유 말하기", "예상 질문 정리"],
    type: "practice",
    topics: ["interview", "portfolio"],
    estMinutes: 10,
    preview: {
      subject: "면접에서 작업 과정을 말로 설명하는 기초 연습",
      whatYouLearn: [
        "프로젝트 소개를 30초로 줄이는 구성",
        "선택과 대안을 함께 말하는 순서",
        "예상 질문과 답변의 뼈대를 만드는 방법",
      ],
      actionAfter: [
        "프로젝트 하나를 30초로 소개하는 글을 써 볼 수 있어요",
        "예상 질문 3개와 답변 뼈대를 적어 볼 수 있어요",
      ],
    },
  },
];
