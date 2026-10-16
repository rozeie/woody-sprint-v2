/** 학습 자료·추천 타입. 의존성이 없다(테스트가 직접 import). */

export type ContentType = "concept" | "case" | "practice" | "framework" | "template";

/** 자료 메타데이터. 리더용 본문(ReaderBody)은 따로 두며, 카드·미리보기 응답에는 포함하지 않는다. */
export type ContentFull = {
  id: string;
  title: string;
  /** 간단한 소개 */
  summary: string;
  /** 카드에 보이는 핵심 학습 내용 */
  keyLearnings: string[];
  type: ContentType;
  /** 학습 주제 key (고민 칩 key와 정렬된 임시 분류) */
  topics: string[];
  estMinutes: number;
  preview: {
    /** ① 이 자료가 다루는 주제(한 문장) */
    subject: string;
    /** ② 구체적으로 학습할 내용 */
    whatYouLearn: string[];
    /** ⑤ 학습 후 이해하거나 시도할 수 있는 행동 */
    actionAfter: string[];
  };
};

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  concept: "개념",
  case: "사례",
  practice: "실습",
  framework: "프레임워크",
  template: "템플릿",
};

/** 홈 추천 카드에 필요한 정보 (본문 제외) */
export type RecommendationCard = {
  contentId: string;
  title: string;
  summary: string;
  keyLearnings: string[];
  typeLabel: string;
  topicLabels: string[];
  estMinutes: number;
  /** 고민과 연결되는 추천 이유(한 문장) */
  reason: string;
};

/** 상세 미리보기 5항목 (본문 제외) */
export type ContentPreview = {
  contentId: string;
  title: string;
  typeLabel: string;
  /** ① 다루는 주제 */
  subject: string;
  topicLabels: string[];
  /** ② 구체적으로 학습할 내용 */
  whatYouLearn: string[];
  /** ③ 현재 내 고민과 연결되는 이유(카드의 한 문장보다 구체적인 설명) */
  connection: string;
  /** ④ 예상 학습 소요 시간(분) */
  estMinutes: number;
  /** ⑤ 학습 후 이해하거나 시도할 수 있는 행동 */
  actionAfter: string[];
};

export type RecommendationItem = {
  contentId: string;
  /** 카드용 한 문장 */
  reason: string;
  /** 미리보기용 구체적 설명 */
  detail: string;
  matchedTopicKeys: string[];
};

/** 저장 형식 버전. 올리면 이전 형식으로 저장된 묶음은 버리고 다시 만든다. */
export const RECOMMENDATION_VERSION = 3;

/** 확정 직후(또는 홈 첫 진입 시) 만든 추천 묶음. 데모에서는 고정이며 18:00 교체는 구현하지 않는다. */
export type RecommendationSet = {
  /** 묶음 식별자. 선택은 이 id에 연결되어 세트당 1개로 제한된다. */
  id: string;
  version: number;
  createdAt: string;
  directionTopicKeys: string[];
  items: RecommendationItem[];
  /** 적합한 자료 수에 따른 상태: 2개=none, 1개=one, 0개=zero */
  shortage: "none" | "one" | "zero";
};

/** 리더 본문(PRD F3-01 순서: 학습 목표, 핵심 개념과 원리, 상세 설명, 실무 사례, 실제 적용 방법, 이해 점검, 참고 자료) */
export type ReaderBody = {
  goal: string;
  concepts: { term: string; explanation: string }[];
  detail: string[];
  caseStudy: { title: string; situation: string; approach: string; result: string };
  steps: { step: string; tip: string }[];
  /** 채점 없는 읽기용 질문(PRD 퀴즈 시스템 제외). 정답·점수가 없다. */
  checks: string[];
  /** 참고용. 학습 완결에 필요하지 않다. 데모에서는 실제 출처가 아닌 자리 표시다. */
  references: { title: string; note: string }[];
};

/** 학습 리더가 받는 응답. 선택한 자료에만 제공한다. */
export type ReaderContent = {
  contentId: string;
  title: string;
  typeLabel: string;
  estMinutes: number;
  body: ReaderBody;
};