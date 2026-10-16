/**
 * 학습 방향 분석 결과의 타입과 순수 규칙 (PRD F1-04·F1-05). UI·저장소와 무관.
 * 확정: 핵심 방향 1개(읽기 전용) + 세부 주제 2~3개 제안, 세부 주제 개별 삭제·추가, 확정해야 추천으로 이어짐,
 *       세부 주제 0개 확정 불가(수용 기준), 점수화·능력 단정 금지.
 * 미확정(PRD D-10): 주제 추가 방식·최대 개수·다시 분석하기 횟수 — 값은 호출 측(임시 설정)에서 받는다.
 * 이 파일은 순수 함수만 두고 테스트가 직접 import한다.
 */
import { sanitizeDraft, type OnboardingDraft } from "./onboarding-rules.ts";

export const MIN_AI_TOPICS = 2;
export const MAX_AI_TOPICS = 3;

export type CoreDirection = { label: string; description: string };

export type AnalysisResult = {
  /** AI가 해석한 현재 어려움 (단정하지 않는 어투) */
  interpretation: string;
  /** 읽기 전용 핵심 학습 방향 1개 */
  coreDirection: CoreDirection;
  /** AI가 제안한 세부 학습 주제 2~3개 */
  subTopics: { key: string; label: string; why: string }[];
  /** 추천 학습 방향 간단 설명 */
  directionSummary: string;
};

export type TopicItem = {
  key: string;
  label: string;
  /** AI 제안 주제는 설명이 있고, 사용자가 추가한 주제는 없다 */
  why?: string;
  source: "ai" | "user";
};

/** 결과 화면의 편집 상태. 확정 전까지의 초안이다. */
export type DirectionDraft = {
  /** 분석에 사용한 입력의 스냅샷 (결과 화면의 "입력한 고민"에 표시) */
  input: OnboardingDraft;
  analysis: AnalysisResult;
  topics: TopicItem[];
  reanalysisCount: number;
};

/** 사용자가 확정한 학습 방향 — 추천(3단계)의 기준이 된다. */
export type ConfirmedDirection = {
  coreDirection: CoreDirection;
  topics: { key: string; label: string }[];
  edited: boolean;
  reanalysisCount: number;
  confirmedAt: string;
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/** 분석 결과가 약속된 형태인지 검증한다. 실패하면 오류로 취급해 재시도하게 한다. */
export function validateAnalysis(
  value: unknown,
  allowedTopicKeys: readonly string[],
): { ok: true } | { ok: false; reason: string } {
  if (!isObj(value)) return { ok: false, reason: "not-object" };
  if (!isStr(value.interpretation)) return { ok: false, reason: "interpretation" };
  if (!isStr(value.directionSummary)) return { ok: false, reason: "summary" };
  const core = value.coreDirection;
  if (!isObj(core) || !isStr(core.label) || !isStr(core.description)) {
    return { ok: false, reason: "core-direction" };
  }
  const topics = value.subTopics;
  if (!Array.isArray(topics)) return { ok: false, reason: "sub-topics" };
  if (topics.length < MIN_AI_TOPICS || topics.length > MAX_AI_TOPICS) {
    return { ok: false, reason: "sub-topic-count" };
  }
  const seen = new Set<string>();
  for (const t of topics) {
    if (!isObj(t) || !isStr(t.key) || !isStr(t.label) || !isStr(t.why)) {
      return { ok: false, reason: "sub-topic-shape" };
    }
    if (!allowedTopicKeys.includes(t.key)) return { ok: false, reason: "unknown-topic" };
    if (seen.has(t.key)) return { ok: false, reason: "duplicate-topic" };
    seen.add(t.key);
  }
  return { ok: true };
}

export function topicsFromAnalysis(analysis: AnalysisResult): TopicItem[] {
  return analysis.subTopics.map((t) => ({ ...t, source: "ai" as const }));
}

export function removeTopic(topics: readonly TopicItem[], key: string): TopicItem[] {
  return topics.filter((t) => t.key !== key);
}

export type AddBlockedReason = "duplicate" | "max";

/** 세부 주제 추가. 이미 있거나 최대 개수에 도달하면 차단한다. */
export function addTopic(
  topics: readonly TopicItem[],
  candidate: { key: string; label: string },
  max: number,
): { topics: TopicItem[]; blocked?: AddBlockedReason } {
  if (topics.some((t) => t.key === candidate.key)) {
    return { topics: [...topics], blocked: "duplicate" };
  }
  if (topics.length >= max) {
    return { topics: [...topics], blocked: "max" };
  }
  return {
    topics: [...topics, { key: candidate.key, label: candidate.label, source: "user" }],
  };
}

/** 추가 가능한 주제(이미 있는 주제 제외). */
export function availableToAdd<T extends { key: string }>(
  catalog: readonly T[],
  topics: readonly TopicItem[],
): T[] {
  return catalog.filter((c) => !topics.some((t) => t.key === c.key));
}

/** 세부 주제가 0개이면 확정할 수 없다 (PRD F1-05 수용 기준 ⑦). */
export function canConfirm(topics: readonly TopicItem[]): boolean {
  return topics.length >= 1;
}

/** AI 제안과 현재 목록이 다른지(주제 구성이 달라졌는지). 삭제 후 다시 추가해 같아지면 수정 아님. */
export function isEdited(analysis: AnalysisResult, topics: readonly TopicItem[]): boolean {
  const a = analysis.subTopics.map((t) => t.key).sort().join("|");
  const b = topics.map((t) => t.key).sort().join("|");
  return a !== b;
}

export function toConfirmed(draft: DirectionDraft, nowIso: string): ConfirmedDirection {
  return {
    coreDirection: { ...draft.analysis.coreDirection },
    topics: draft.topics.map((t) => ({ key: t.key, label: t.label })),
    edited: isEdited(draft.analysis, draft.topics),
    reanalysisCount: draft.reanalysisCount,
    confirmedAt: nowIso,
  };
}

/** 저장소에서 읽은 알 수 없는 값을 안전한 결과 초안으로 만든다. 형태가 맞지 않으면 null. */
export function sanitizeDirectionDraft(
  raw: unknown,
  allowedTopicKeys: readonly string[],
  allowedChipKeys: readonly string[],
  detailMax: number,
  maxTopics: number,
): DirectionDraft | null {
  if (!isObj(raw)) return null;
  if (!validateAnalysis(raw.analysis, allowedTopicKeys).ok) return null;
  const analysis = raw.analysis as AnalysisResult;
  const topics: TopicItem[] = [];
  if (Array.isArray(raw.topics)) {
    for (const t of raw.topics) {
      if (
        isObj(t) &&
        isStr(t.key) &&
        isStr(t.label) &&
        allowedTopicKeys.includes(t.key) &&
        !topics.some((x) => x.key === t.key) &&
        topics.length < maxTopics
      ) {
        topics.push({
          key: t.key,
          label: t.label,
          why: typeof t.why === "string" ? t.why : undefined,
          source: t.source === "user" ? "user" : "ai",
        });
      }
    }
  }
  return {
    input: sanitizeDraft(raw.input, allowedChipKeys, detailMax),
    analysis,
    topics,
    reanalysisCount:
      typeof raw.reanalysisCount === "number" && raw.reanalysisCount >= 0
        ? Math.floor(raw.reanalysisCount)
        : 0,
  };
}

/** 확정 값 복원. 주제가 0개이거나 형태가 맞지 않으면 null(= 확정되지 않음으로 취급). */
export function sanitizeConfirmed(
  raw: unknown,
  allowedTopicKeys: readonly string[],
): ConfirmedDirection | null {
  if (!isObj(raw)) return null;
  const core = raw.coreDirection;
  if (!isObj(core) || !isStr(core.label) || !isStr(core.description)) return null;
  if (!Array.isArray(raw.topics)) return null;
  const topics: { key: string; label: string }[] = [];
  for (const t of raw.topics) {
    if (isObj(t) && isStr(t.key) && isStr(t.label) && allowedTopicKeys.includes(t.key) && !topics.some((x) => x.key === t.key)) {
      topics.push({ key: t.key, label: t.label });
    }
  }
  if (topics.length === 0) return null;
  return {
    coreDirection: { label: core.label, description: core.description },
    topics,
    edited: raw.edited === true,
    reanalysisCount:
      typeof raw.reanalysisCount === "number" && raw.reanalysisCount >= 0
        ? Math.floor(raw.reanalysisCount)
        : 0,
    confirmedAt: typeof raw.confirmedAt === "string" ? raw.confirmedAt : "",
  };
}
