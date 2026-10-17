/** 학습 자료·추천 타입. 의존성이 없다(테스트가 직접 import). */

export type ContentType = "concept" | "case" | "practice" | "framework" | "template";

/**
 * 외부 원문 정보. 공개된 원문을 직접 확인한 자료에만 둔다(없으면 가상 예시 자료다). 알 수 없는 값은 추정하지 않고 null로 둔다.
 * Stack은 원문을 복제하거나 번역하지 않고, 직접 쓴 요약과 해설만 제공한다.
 */
export type ContentSource = {
  title: string;
  /** 저자. 확인할 수 없으면 null */
  author: string | null;
  /** 발행 기관 */
  publisher: string;
  /** 새 탭으로 여는 원문 주소(https) */
  url: string;
  /** 확인 가능한 발행일(yyyy-mm-dd). 알 수 없으면 null */
  publishedAt: string | null;
  /** 원문을 직접 확인한 날(yyyy-mm-dd) */
  verifiedAt: string;
};

/** 자료 메타데이터. 리더용 본문(ReaderBody)은 따로 두며, 카드·미리보기 응답에는 포함하지 않는다. */
export type ContentFull = {
  id: string;
  title: string;
  /** 간단한 소개 */
  summary: string;
  /** 홈 카드용 한 문장 소개(약 30자 안팎, summary를 자른 것이 아니라 따로 쓴 문장) */
  shortSummary: string;
  /** 카드에 보이는 핵심 학습 내용 */
  keyLearnings: string[];
  type: ContentType;
  /** 학습 주제 key (고민 칩 key와 정렬된 임시 분류) */
  topics: string[];
  /** 원문 기반 자료면 Stack 요약을 읽는 시간(원문 전체가 아님). 가상 예시 자료는 예시 본문을 읽는 시간 */
  estMinutes: number;
  /** 외부 원문이 있는 자료에만 있다. 있으면 리더가 원문 기반 구성(요약, 미니미션, 회고)으로 열린다 */
  source?: ContentSource;
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
  /** 자료 분류(학습 방식)의 key. 카드 아이콘을 고르는 데 쓴다 */
  type: ContentType;
  /** 홈 카드에 보이는 한 문장 소개(약 30자 안팎) */
  shortSummary: string;
  /** 이 자료의 주제 중 사용자가 확정한 학습 주제와 겹치는 것의 이름(최대 2개). 겹치는 것이 없으면 빈 배열 */
  linkedTopicLabels: string[];
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
  /** 자료 분류(학습 방식)의 key. 상단 요약의 아이콘과 학습 방식 문구를 고르는 데 쓴다 */
  type: ContentType;
  typeLabel: string;
  /** 연결되는 고민 배지: 사용자가 확정한 학습 주제와 이 자료의 주제의 실제 교집합(홈 카드와 같은 기준, 개수 제한 없음). 없으면 빈 배열 */
  linkedTopicLabels: string[];
  /** 연결되는 이유를 한 문장으로 짧게(이 자료의 학습 방식에 맞는 상황). 새 사실을 만들지 않고 기존 학습 방식 설명을 쓴다 */
  reason: string;
  /** 간단한 소개(홈 카드에서는 짧은 소개만 보이므로 여기서 확인한다) */
  summary: string;
  /** 핵심 학습 내용(홈 카드에서 옮긴 짧은 항목) */
  keyLearnings: string[];
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

/**
 * 원문 기반 자료의 리더 데이터. 원문 요약은 Stack이 직접 쓴 것이다.
 * 미니미션과 회고는 데이터가 있을 때만 보여 주며(없으면 자동으로 만들지 않고 영역을 숨긴다), 선택 사항이다.
 */
export type SourceReader = {
  /** 원문 요약의 소제목별 구성(핵심 주장, 근거, 사례 등). 원문 내용만 담는다 */
  summary: { heading: string; paragraphs: string[]; points?: string[] }[];
  /** 내 고민과 연결해 보기: 이 자료의 주제 key별 설명. 사용자가 확정한 주제와 겹치는 것만 보여 준다. Stack의 해석이며 원문 내용이 아니다 */
  connections: { topicKey: string; text: string }[];
  /** 선택 미니미션. 원문의 핵심을 적용해 보는 작은 과제 1개 */
  miniMission?: { title: string; instruction: string; steps: string[]; estMinutes: number; placeholder: string };
  /** 선택 짧은 회고. 질문 1개 */
  reflection?: { question: string; placeholder: string };
};

type ReaderBase = {
  contentId: string;
  title: string;
  typeLabel: string;
  estMinutes: number;
};

/** 학습 리더가 받는 응답. 선택한 자료에만 제공한다. */
export type ReaderContent =
  | (ReaderBase & { kind: "example"; body: ReaderBody })
  | (ReaderBase & { kind: "source"; source: ContentSource; reader: SourceReader });