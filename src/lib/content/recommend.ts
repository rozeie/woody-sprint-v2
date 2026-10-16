/**
 * 모의 추천 규칙 (PRD F2-02·F2-07). 순수 함수 — 실제 개인화 알고리즘이 아니라 UI 데모용 태그 매칭이다.
 * - 확정한 세부 주제와 겹치는 자료만 후보(관련성 없는 자료로 채우지 않는다).
 * - 점수(겹친 주제 수)가 높은 순, 같으면 목록 순서. 두 번째는 가능하면 첫 번째와 다른 유형.
 * - 후보가 2개 미만이면 있는 만큼만 돌려준다(0~1개).
 * - 추천 이유: 카드에는 한 문장(reason), 미리보기에는 구체적인 설명(detail).
 */
import type { OnboardingDraft } from "../onboarding-rules.ts";
import {
  RECOMMENDATION_VERSION,
  type ContentFull,
  type ContentType,
  type RecommendationItem,
  type RecommendationSet,
} from "./types.ts";

export type Picked = { content: ContentFull; matched: string[] };

export function pickRecommendations(
  catalog: readonly ContentFull[],
  topicKeys: readonly string[],
): Picked[] {
  const scored = catalog
    .map((content, order) => {
      const matched = content.topics.filter((k) => topicKeys.includes(k));
      return { content, matched, order };
    })
    .filter((c) => c.matched.length >= 1)
    .sort((a, b) => b.matched.length - a.matched.length || a.order - b.order);

  if (scored.length === 0) return [];
  const first = scored[0];
  const rest = scored.slice(1);
  const second = rest.find((c) => c.content.type !== first.content.type) ?? rest[0];
  return [first, ...(second ? [second] : [])].map(({ content, matched }) => ({ content, matched }));
}

/** 카드용: 짧은 어구 */
const TYPE_SHORT: Record<ContentType, string> = {
  concept: "개념부터 정리하고 싶을 때 맞아요",
  case: "사례로 감을 잡고 싶을 때 맞아요",
  practice: "바로 해 보는 연습이 필요할 때 맞아요",
  framework: "판단 기준을 세우고 싶을 때 맞아요",
  template: "바로 쓸 양식이 필요할 때 맞아요",
};

/** 미리보기용: 접근 방식 설명 */
const TYPE_DETAIL: Record<ContentType, string> = {
  concept: "개념을 먼저 이해한 뒤 내 상황에 옮겨 보고 싶을 때 맞는 방식이에요.",
  case: "다른 프로젝트가 어떻게 풀렸는지 따라가며 내 상황에 비춰 보고 싶을 때 맞는 방식이에요.",
  practice: "직접 손을 움직이며 바로 해 보고 싶을 때 맞는 방식이에요.",
  framework: "판단 기준이 되는 틀을 세워 두고 싶을 때 맞는 방식이에요.",
  template: "바로 가져다 쓸 양식으로 시작하고 싶을 때 맞는 방식이에요.",
};

/**
 * 사용자가 실제로 고른 고민(칩)과 겹친 주제 라벨을 돌려준다. 겹친 것이 없으면(AI 제안·직접 추가로 확정한
 * 주제만 겹친 경우) 빈 배열이다. 고민 전체를 나열하지 않고 이 자료와 이어지는 것만 쓰기 위한 용도다.
 */
export function concernLabelsFor(
  matchedKeys: readonly string[],
  input: OnboardingDraft | null,
  labelOf: (key: string) => string,
): string[] {
  if (!input) return [];
  return matchedKeys.filter((k) => input.concernKeys.includes(k)).map(labelOf);
}

/** 카드용 추천 이유 — 고민과 연결되는 한 문장. */
export function buildReason(args: {
  content: ContentFull;
  matchedLabels: string[];
  concernLabels: string[];
}): string {
  const { content, matchedLabels, concernLabels } = args;
  const lead =
    concernLabels.length > 0
      ? `‘${concernLabels.join(", ")}’ 고민과 이어지고`
      : `확정한 ‘${matchedLabels.join(", ")}’ 주제와 이어지고`;
  return `${lead}, ${TYPE_SHORT[content.type]}.`;
}

/** 미리보기용 구체적인 설명 — 이 자료가 다루는 내용과 고민의 연결, 접근 방식. */
export function buildDetail(args: {
  content: ContentFull;
  matchedLabels: string[];
  concernLabels: string[];
}): string {
  const { content, matchedLabels, concernLabels } = args;
  const subject = content.preview.subject;
  const first =
    concernLabels.length > 0
      ? `입력하신 ‘${concernLabels.join(", ")}’ 고민과 이 자료가 다루는 ‘${subject}’가 이어져요.`
      : `확정한 ‘${matchedLabels.join(", ")}’ 주제와 이 자료가 다루는 ‘${subject}’가 이어져요.`;
  return `${first} ${TYPE_DETAIL[content.type]}`;
}

export function shortageOf(count: number): RecommendationSet["shortage"] {
  return count >= 2 ? "none" : count === 1 ? "one" : "zero";
}

/**
 * 저장된 추천 묶음을 안전하게 복원한다. 카탈로그에 없는 자료·중복은 버리고, 형태가 틀리거나
 * 저장 형식 버전이 다르면 null(= 다시 만든다).
 */
export function sanitizeRecommendationSet(
  raw: unknown,
  catalogIds: readonly string[],
): RecommendationSet | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.version !== RECOMMENDATION_VERSION) return null;
  if (typeof r.id !== "string" || r.id.length === 0) return null;
  if (!Array.isArray(r.items) || !Array.isArray(r.directionTopicKeys)) return null;
  const items: RecommendationItem[] = [];
  for (const it of r.items) {
    if (typeof it !== "object" || it === null) continue;
    const o = it as Record<string, unknown>;
    if (
      typeof o.contentId === "string" &&
      catalogIds.includes(o.contentId) &&
      !items.some((x) => x.contentId === o.contentId) &&
      typeof o.reason === "string" &&
      o.reason.length > 0 &&
      typeof o.detail === "string" &&
      o.detail.length > 0 &&
      items.length < 2
    ) {
      items.push({
        contentId: o.contentId,
        reason: o.reason,
        detail: o.detail,
        matchedTopicKeys: Array.isArray(o.matchedTopicKeys)
          ? o.matchedTopicKeys.filter((k): k is string => typeof k === "string")
          : [],
      });
    }
  }
  return {
    id: r.id,
    version: RECOMMENDATION_VERSION,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
    directionTopicKeys: r.directionTopicKeys.filter((k): k is string => typeof k === "string"),
    items,
    shortage: shortageOf(items.length),
  };
}
