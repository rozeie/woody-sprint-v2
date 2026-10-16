/**
 * 모의 콘텐츠 서비스 — 고정 예시 자료에서 추천·카드·미리보기를 만든다. 실제 DB·개인화가 아니다.
 * 카드와 미리보기 응답에는 리더용 본문(bodyPlaceholder)을 포함하지 않는다(PRD F2-04, §12.3).
 */
import { CONCERN_CHIPS } from "../../config/ui-provisional.ts";
import type { ConfirmedDirection } from "../direction-rules.ts";
import type { OnboardingDraft } from "../onboarding-rules.ts";
import {
  buildDetail,
  buildReason,
  concernLabelsFor,
  pickRecommendations,
  shortageOf,
} from "./recommend.ts";
import {
  CONTENT_TYPE_LABEL,
  RECOMMENDATION_VERSION,
  type ContentFull,
  type ContentPreview,
  type ReaderBody,
  type ReaderContent,
  type RecommendationCard,
  type RecommendationSet,
} from "./types.ts";

/** 서재·이어서 읽기·리더 머리말용 요약 */
export type ContentSummary = {
  contentId: string;
  title: string;
  typeLabel: string;
  estMinutes: number;
};

export interface ContentService {
  createRecommendation(args: {
    direction: ConfirmedDirection;
    input: OnboardingDraft | null;
    /** 새 회차에서 후보에서 뺄 자료 id(직전 추천, 이미 선택한 자료). 빼고 남는 자료가 모자라면 부족 상태가 된다 */
    excludeContentIds?: readonly string[];
  }): Promise<RecommendationSet>;
  getCards(set: RecommendationSet): Promise<RecommendationCard[]>;
  /** 추천 묶음에 포함된 자료의 미리보기. 포함되지 않았거나 없으면 null. */
  getPreview(set: RecommendationSet, contentId: string): Promise<ContentPreview | null>;
  /** 서재·이어서 읽기 목록용 요약(본문 제외). 없는 id는 건너뛴다. */
  getSummaries(contentIds: readonly string[]): Promise<ContentSummary[]>;
  /** 리더 본문. 선택한 자료에만 호출한다(선택 여부 확인은 호출 측의 저장소 계층이 맡는다). 없으면 null. */
  getReaderContent(contentId: string): Promise<ReaderContent | null>;
}

const chipLabel = new Map(CONCERN_CHIPS.map((c) => [c.key, c.label]));
const labelOf = (key: string) => chipLabel.get(key) ?? key;

export function createDemoContentService(
  catalog: readonly ContentFull[],
  bodies: Readonly<Record<string, ReaderBody>>,
): ContentService {
  const byId = new Map(catalog.map((c) => [c.id, c]));

  return {
    async createRecommendation({ direction, input, excludeContentIds }) {
      const topicKeys = direction.topics.map((t) => t.key);
      const picked = pickRecommendations(catalog, topicKeys, excludeContentIds);
      const items = picked.map(({ content, matched }) => {
        const args = {
          content,
          matchedLabels: matched.map(labelOf),
          concernLabels: concernLabelsFor(matched, input, labelOf),
        };
        return {
          contentId: content.id,
          matchedTopicKeys: matched,
          reason: buildReason(args),
          detail: buildDetail(args),
        };
      });
      return {
        id: crypto.randomUUID(),
        version: RECOMMENDATION_VERSION,
        createdAt: new Date().toISOString(),
        directionTopicKeys: topicKeys,
        items,
        shortage: shortageOf(items.length),
      };
    },

    async getCards(set) {
      const cards: RecommendationCard[] = [];
      for (const item of set.items) {
        const c = byId.get(item.contentId);
        if (!c) continue;
        cards.push({
          contentId: c.id,
          title: c.title,
          type: c.type,
          shortSummary: c.shortSummary,
          linkedTopicLabels: item.matchedTopicKeys.filter((k) => c.topics.includes(k)).slice(0, 2).map(labelOf),
          summary: c.summary,
          keyLearnings: [...c.keyLearnings],
          typeLabel: CONTENT_TYPE_LABEL[c.type],
          topicLabels: c.topics.map(labelOf),
          estMinutes: c.estMinutes,
          reason: item.reason,
        });
      }
      return cards;
    },

    async getSummaries(contentIds) {
      const out: ContentSummary[] = [];
      for (const id of contentIds) {
        const c = byId.get(id);
        if (c) out.push({ contentId: c.id, title: c.title, typeLabel: CONTENT_TYPE_LABEL[c.type], estMinutes: c.estMinutes });
      }
      return out;
    },

    async getReaderContent(contentId) {
      const c = byId.get(contentId);
      const body = bodies[contentId];
      if (!c || !body) return null;
      return { contentId: c.id, title: c.title, typeLabel: CONTENT_TYPE_LABEL[c.type], estMinutes: c.estMinutes, body };
    },

    async getPreview(set, contentId) {
      const item = set.items.find((i) => i.contentId === contentId);
      const c = byId.get(contentId);
      if (!item || !c) return null;
      return {
        contentId: c.id,
        title: c.title,
        typeLabel: CONTENT_TYPE_LABEL[c.type],
        summary: c.summary,
        keyLearnings: [...c.keyLearnings],
        subject: c.preview.subject,
        topicLabels: c.topics.map(labelOf),
        whatYouLearn: [...c.preview.whatYouLearn],
        connection: item.detail,
        estMinutes: c.estMinutes,
        actionAfter: [...c.preview.actionAfter],
      };
    },
  };
}
