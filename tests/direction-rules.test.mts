// 학습 방향 결과 규칙의 동작 검증 (PRD F1-04·F1-05)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONCERN_CHIPS, PROVISIONAL } from "../src/config/ui-provisional.ts";
import {
  addTopic,
  availableToAdd,
  canConfirm,
  isEdited,
  removeTopic,
  sanitizeConfirmed,
  sanitizeDirectionDraft,
  toConfirmed,
  topicsFromAnalysis,
  validateAnalysis,
  type AnalysisResult,
  type DirectionDraft,
} from "../src/lib/direction-rules.ts";
import { EMPTY_DRAFT } from "../src/lib/onboarding-rules.ts";

const keys = CONCERN_CHIPS.map((c) => c.key);
const label = (k: string) => CONCERN_CHIPS.find((c) => c.key === k)?.label ?? k;

const analysis = (topicKeys: string[]): AnalysisResult => ({
  interpretation: "해석",
  coreDirection: { label: "핵심 방향", description: "설명" },
  subTopics: topicKeys.map((key) => ({ key, label: label(key), why: "이유" })),
  directionSummary: "요약",
});

describe("분석 결과 검증 (핵심 방향 1개 + 세부 주제 2~3개)", () => {
  it("세부 주제 2개, 3개는 통과", () => {
    assert.equal(validateAnalysis(analysis(keys.slice(0, 2)), keys).ok, true);
    assert.equal(validateAnalysis(analysis(keys.slice(0, 3)), keys).ok, true);
  });

  it("세부 주제 1개, 4개는 거부", () => {
    assert.equal(validateAnalysis(analysis(keys.slice(0, 1)), keys).ok, false);
    assert.equal(validateAnalysis(analysis(keys.slice(0, 4)), keys).ok, false);
  });

  it("보유 토픽에 없는 key, 중복 key는 거부", () => {
    assert.equal(validateAnalysis(analysis([keys[0], "nope"]), keys).ok, false);
    assert.equal(validateAnalysis(analysis([keys[0], keys[0]]), keys).ok, false);
  });

  it("핵심 방향이 없거나 형태가 틀리면 거부", () => {
    const base = analysis(keys.slice(0, 2));
    assert.equal(validateAnalysis({ ...base, coreDirection: undefined }, keys).ok, false);
    assert.equal(validateAnalysis({ ...base, coreDirection: { label: "", description: "x" } }, keys).ok, false);
    assert.equal(validateAnalysis(null, keys).ok, false);
    assert.equal(validateAnalysis("text", keys).ok, false);
  });
});

describe("세부 주제 삭제·추가·확정 가능 여부", () => {
  const topics = topicsFromAnalysis(analysis(keys.slice(0, 3)));

  it("삭제는 해당 주제만 제거한다", () => {
    const next = removeTopic(topics, keys[1]);
    assert.deepEqual(next.map((t) => t.key), [keys[0], keys[2]]);
  });

  it("추가는 사용자 추가로 표시되고 중복·최대 개수는 차단된다", () => {
    const added = addTopic(topics, { key: keys[5], label: label(keys[5]) }, 5);
    assert.equal(added.blocked, undefined);
    assert.equal(added.topics.at(-1)?.source, "user");

    const dup = addTopic(topics, { key: keys[0], label: label(keys[0]) }, 5);
    assert.equal(dup.blocked, "duplicate");
    assert.equal(dup.topics.length, 3);

    const five = addTopic(addTopic(topics, { key: keys[5], label: "a" }, 5).topics, { key: keys[6], label: "b" }, 5).topics;
    assert.equal(five.length, 5);
    const over = addTopic(five, { key: keys[7], label: "c" }, 5);
    assert.equal(over.blocked, "max");
    assert.equal(over.topics.length, 5);
  });

  it("최대 개수는 임시 설정값에서 온다", () => {
    assert.equal(typeof PROVISIONAL.maxSubTopics, "number");
  });

  it("추가 가능한 주제 목록에서 이미 있는 주제는 빠진다", () => {
    const avail = availableToAdd(CONCERN_CHIPS, topics);
    assert.equal(avail.length, CONCERN_CHIPS.length - 3);
    assert.equal(avail.some((c) => topics.some((t) => t.key === c.key)), false);
  });

  it("세부 주제가 0개이면 확정할 수 없고 1개 이상이면 가능하다", () => {
    let t = topics;
    for (const k of keys.slice(0, 3)) t = removeTopic(t, k);
    assert.equal(t.length, 0);
    assert.equal(canConfirm(t), false);
    assert.equal(canConfirm(addTopic(t, { key: keys[4], label: "x" }, 5).topics), true);
  });

  it("삭제 후 같은 주제를 다시 추가하면 수정으로 보지 않는다", () => {
    const a = analysis(keys.slice(0, 3));
    const removed = removeTopic(topicsFromAnalysis(a), keys[0]);
    assert.equal(isEdited(a, removed), true);
    const back = addTopic(removed, { key: keys[0], label: label(keys[0]) }, 5).topics;
    assert.equal(isEdited(a, back), false);
  });
});

describe("확정 값", () => {
  const a = analysis(keys.slice(0, 3));
  const draft: DirectionDraft = {
    input: EMPTY_DRAFT,
    analysis: a,
    topics: removeTopic(topicsFromAnalysis(a), keys[2]),
    reanalysisCount: 2,
  };

  it("확정 시 핵심 방향은 AI 값 그대로, 주제는 현재 목록, 수정 여부가 기록된다", () => {
    const c = toConfirmed(draft, "2026-10-16T00:00:00.000Z");
    assert.deepEqual(c.coreDirection, a.coreDirection);
    assert.deepEqual(c.topics.map((t) => t.key), [keys[0], keys[1]]);
    assert.equal(c.edited, true);
    assert.equal(c.reanalysisCount, 2);
  });

  it("저장된 확정 값 복원: 올바른 값만 인정하고 주제 0개·깨진 값은 '확정 안 됨'으로 취급한다", () => {
    const ok = toConfirmed(draft, "t");
    assert.notEqual(sanitizeConfirmed(JSON.parse(JSON.stringify(ok)), keys), null);
    assert.equal(sanitizeConfirmed({ ...ok, topics: [] }, keys), null);
    assert.equal(sanitizeConfirmed({ ...ok, topics: [{ key: "nope", label: "x" }] }, keys), null);
    assert.equal(sanitizeConfirmed({ ...ok, coreDirection: null }, keys), null);
    assert.equal(sanitizeConfirmed(null, keys), null);
    assert.equal(sanitizeConfirmed("x", keys), null);
  });

  it("저장된 결과 초안 복원: 형태가 틀리면 null, 알 수 없는 주제·초과 개수는 정리", () => {
    assert.equal(sanitizeDirectionDraft({ analysis: {} }, keys, keys, 500, 5), null);
    const raw = JSON.parse(JSON.stringify(draft));
    raw.topics = [...keys.slice(0, 7).map((key) => ({ key, label: label(key), source: "ai" })), { key: "nope", label: "x" }];
    const clean = sanitizeDirectionDraft(raw, keys, keys, 500, 5);
    assert.equal(clean?.topics.length, 5);
    assert.equal(clean?.topics.some((t) => t.key === "nope"), false);
  });
});
