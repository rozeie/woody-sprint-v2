import { CONCERN_CHIPS, PROVISIONAL } from "@/config/ui-provisional";
import { DEMO_CONTENT_IDS } from "@/lib/content";
import { sanitizeRecommendationSet } from "@/lib/content/recommend";
import type { RecommendationSet } from "@/lib/content/types";
import {
  sanitizeConfirmed,
  sanitizeDirectionDraft,
  type ConfirmedDirection,
  type DirectionDraft,
} from "@/lib/direction-rules";
import { sanitizeDraft, type OnboardingDraft } from "@/lib/onboarding-rules";
import { sanitizeStep } from "@/lib/onboarding-steps";
import { cycleKeyOf, cycleKeyOfIso } from "@/lib/recommendation-cycle";
import {
  completeReading,
  sanitizeUserContents,
  startReading,
  trySelect,
  type UserContent,
} from "@/lib/selection-rules";
import type { StackRepository } from "./types";

/**
 * UI 데모 전용 구현 — 브라우저 localStorage에 임시 저장한다.
 * 서버 DB·익명 세션이 아니며, 사이트 데이터를 지우거나 다른 브라우저에서 열면 사라진다.
 * 운영 데이터의 원본으로 사용하지 않는다.
 *
 * 선택·덮어쓰기 방지는 이 브라우저 안에서 "읽고 → 판단하고 → 쓰는" 구간을 한 번에(await 없이) 처리해
 * 같은 탭 안의 중복 요청은 막는다. 서버의 고유 제약·트랜잭션·여러 탭/기기 동시성 보장은 구현하지 않았다.
 */
const NS = "stack-demo:v1";
const DRAFT_KEY = `${NS}:onboarding-draft`;
const STEP_KEY = `${NS}:onboarding-step`;
const DIRECTION_DRAFT_KEY = `${NS}:direction-draft`;
const CONFIRMED_KEY = `${NS}:confirmed-direction`;
const RECOMMENDATION_KEY = `${NS}:recommendation-set`;
const USER_CONTENTS_KEY = `${NS}:user-contents`;

/** 모의 저장 지연(ms). 처리 중 상태와 중복 클릭 차단을 눈으로 확인할 수 있게 둔 값이며 실제 서버 지연이 아니다. */
const SAVE_LATENCY_MS = 350;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const CHIP_KEYS = CONCERN_CHIPS.map((c) => c.key);
// 주제 key는 칩 key와 1:1로 정렬한 임시 분류(PRD §12.4 제안)
const TOPIC_KEYS = CHIP_KEYS;

function read(key: string): unknown {
  try {
    const text = window.localStorage.getItem(key);
    return text === null ? null : JSON.parse(text);
  } catch {
    return null; // 저장소 차단·손상된 값: 없는 것으로 취급
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 데모에서 무시한다(화면 상태는 유지됨)
  }
}

const readSet = () => sanitizeRecommendationSet(read(RECOMMENDATION_KEY), DEMO_CONTENT_IDS);
const readUserContents = () => sanitizeUserContents(read(USER_CONTENTS_KEY), DEMO_CONTENT_IDS);
const readConfirmed = () => sanitizeConfirmed(read(CONFIRMED_KEY), TOPIC_KEYS);

export const demoRepository: StackRepository = {
  async getOnboardingDraft() {
    const raw = read(DRAFT_KEY);
    return raw === null ? null : sanitizeDraft(raw, CHIP_KEYS, PROVISIONAL.detailTextMax);
  },

  async saveOnboardingDraft(draft: OnboardingDraft) {
    write(DRAFT_KEY, draft);
  },

  async getOnboardingStep() {
    return sanitizeStep(read(STEP_KEY));
  },

  async saveOnboardingStep(step: number) {
    write(STEP_KEY, step);
  },

  async getDirectionDraft() {
    return sanitizeDirectionDraft(
      read(DIRECTION_DRAFT_KEY),
      TOPIC_KEYS,
      CHIP_KEYS,
      PROVISIONAL.detailTextMax,
      PROVISIONAL.maxSubTopics,
    );
  },

  async saveDirectionDraft(draft: DirectionDraft) {
    write(DIRECTION_DRAFT_KEY, draft);
  },

  async confirmDirection(direction: ConfirmedDirection) {
    // 확정한 방향은 덮어쓰지 않는다(재설정은 설정의 별도 기능이며 이번 범위에서 구현하지 않는다)
    if (readConfirmed() !== null) return { ok: false };
    write(CONFIRMED_KEY, direction);
    return { ok: true };
  },

  async getConfirmedDirection() {
    return readConfirmed();
  },

  async hasConfirmedDirection() {
    return readConfirmed() !== null;
  },

  async getRecommendationSet() {
    return readSet();
  },

  async saveRecommendationSet(set: RecommendationSet) {
    // 이미 선택이 연결된 묶음은 덮어쓰지 않는다(선택·서재 기록과 어긋나지 않게)
    // 새 회차의 묶음은 이전 회차에 선택이 있어도 저장할 수 있다(이전 선택과 서재 기록은 그대로 남는다)
    const current = readSet();
    if (
      current &&
      readUserContents().some((u) => u.setId === current.id) &&
      cycleKeyOfIso(current.createdAt) >= cycleKeyOfIso(set.createdAt)
    ) {
      return false;
    }
    write(RECOMMENDATION_KEY, set);
    return true;
  },

  async getUserContents() {
    return readUserContents();
  },

  async selectContent({ setId, contentId }) {
    await wait(SAVE_LATENCY_MS); // 모의 저장 지연. 이후 구간은 await 없이 읽고-판단-쓰기를 한 번에 한다.
    const set = readSet();
    if (!set || set.id !== setId) return { status: "not-in-set" };
    const { outcome, list } = trySelect(readUserContents(), set, contentId, new Date().toISOString());
    // 열어 둔 사이 추천 회차가 바뀌었다면 이전 회차의 자료를 뒤늦게 선택하지 못하게 한다(이미 선택한 자료의 재요청은 그대로 돌려준다)
    if (outcome.status === "selected" && cycleKeyOfIso(set.createdAt) < cycleKeyOf(Date.now())) {
      return { status: "expired" };
    }
    if (outcome.status === "selected") write(USER_CONTENTS_KEY, list);
    return outcome;
  },

  async markStarted(contentId: string) {
    const { item, list, changed } = startReading(readUserContents(), contentId, new Date().toISOString());
    if (changed) write(USER_CONTENTS_KEY, list as UserContent[]);
    return item;
  },

  async completeContent(contentId: string) {
    await wait(SAVE_LATENCY_MS); // 모의 저장 지연. 이후 구간은 await 없이 읽고-판단-쓰기를 한 번에 한다.
    const { item, list, changed } = completeReading(readUserContents(), contentId, new Date().toISOString());
    if (changed) write(USER_CONTENTS_KEY, list as UserContent[]);
    return item;
  },

  async getReadingDays() {
    // 읽기 시간 측정(리더·서버 집계)은 이번 범위 밖이다. 접속·분석·확정·선택·리더 진입으로 기록을 만들지 않는다.
    return [];
  },
};
