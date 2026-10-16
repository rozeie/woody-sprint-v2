// 온보딩 4단계 구성 규칙의 동작 검증 (사용자 확정, PRD v0.3 F1-06)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONCERN_CHIPS } from "../src/config/ui-provisional.ts";
import {
  FIRST_STEP,
  LAST_STEP,
  ONBOARDING_STEPS,
  canProceed,
  canStartAnalysis,
  clampStep,
  sanitizeStep,
  stepErrors,
} from "../src/lib/onboarding-steps.ts";
import { EMPTY_DRAFT, isChipDisabled, toggleConcern, type OnboardingDraft } from "../src/lib/onboarding-rules.ts";

const keys = CONCERN_CHIPS.map((c) => c.key);
const draft = (patch: Partial<OnboardingDraft> = {}): OnboardingDraft => ({ ...EMPTY_DRAFT, ...patch });
const valid = draft({ concernKeys: [keys[0]], situation: "junior" });

describe("4단계 구성", () => {
  it("단계 이름과 순서: 고민 영역, 현재 상황, 추가 설명, 시작 전 안내", () => {
    assert.deepEqual(ONBOARDING_STEPS.map((s) => s.label), ["고민 영역", "현재 상황", "추가 설명", "시작 전 안내"]);
    assert.equal(FIRST_STEP, 1);
    assert.equal(LAST_STEP, 4);
  });
});

describe("단계별 진행 조건", () => {
  it("1단계: 고민 영역을 1개 이상 고르거나 기타 내용을 적어야 다음으로 간다", () => {
    assert.equal(canProceed(1, draft()), false);
    assert.equal(canProceed(1, draft({ concernKeys: [keys[0]] })), true);
    assert.equal(canProceed(1, draft({ otherSelected: true, otherText: "고민" })), true);
  });

  it("1단계: 기타만 적어도 다음으로 가고, 기타가 공백뿐이고 칩도 없으면 막힌다", () => {
    assert.equal(canProceed(1, draft({ otherText: "기타 고민" })), true);
    assert.equal(canProceed(1, draft({ otherText: "   " })), false);
    assert.equal(canProceed(1, draft({ concernKeys: [keys[0]], otherText: "   " })), true);
  });

  it("2단계: 현재 상황을 골라야 다음으로 간다(1단계 오류는 영향 없음)", () => {
    assert.equal(canProceed(2, draft()), false);
    assert.equal(stepErrors(2, draft()).situation, "missing");
    assert.equal(canProceed(2, draft({ situation: "job_seeker" })), true);
  });

  it("3단계(추가 설명)는 선택이라 비어 있어도 항상 다음으로 간다", () => {
    assert.equal(canProceed(3, draft()), true);
    assert.equal(canProceed(3, draft({ detailText: "" })), true);
  });

  it("각 단계는 자기 단계의 오류만 돌려준다", () => {
    const empty = draft();
    assert.deepEqual(Object.keys(stepErrors(1, empty)).filter((k) => stepErrors(1, empty)[k as "concern"]), ["concern"]);
    assert.deepEqual(stepErrors(3, empty), {});
    assert.deepEqual(stepErrors(4, empty), {});
  });
});

describe("분석 시작 조건(안내 확인 체크)", () => {
  it("모든 입력이 유효해도 확인에 체크하지 않으면 시작할 수 없다", () => {
    assert.equal(canStartAnalysis(valid, false), false);
  });
  it("체크해도 필수 입력이 비어 있으면 시작할 수 없다", () => {
    assert.equal(canStartAnalysis(draft(), true), false);
    assert.equal(canStartAnalysis(draft({ concernKeys: [keys[0]] }), true), false);
  });
  it("필수 입력이 유효하고 체크했을 때만 시작할 수 있다", () => {
    assert.equal(canStartAnalysis(valid, true), true);
  });
});

describe("단계 복원(새로고침)", () => {
  it("저장된 단계 값은 1부터 4까지의 정수만 받는다", () => {
    for (const ok of [1, 2, 3, 4]) assert.equal(sanitizeStep(ok), ok);
    for (const bad of [0, 5, -1, 2.5, "2", null, undefined, NaN]) assert.equal(sanitizeStep(bad), null);
  });

  it("입력이 채워져 있으면 저장된 단계 그대로 복원한다", () => {
    for (const s of [1, 2, 3, 4]) assert.equal(clampStep(s, valid), s);
  });

  it("필수 단계가 비어 있으면 그 단계 뒤로는 복원하지 않는다", () => {
    assert.equal(clampStep(4, draft()), 1);
    assert.equal(clampStep(3, draft({ concernKeys: [keys[0]] })), 2);
    assert.equal(clampStep(4, draft({ concernKeys: [keys[0]] })), 2);
    assert.equal(clampStep(2, draft({ concernKeys: [keys[0]] })), 2);
  });

  it("저장된 값이 없거나 잘못되면 1단계", () => {
    assert.equal(clampStep(null, valid), 1);
    assert.equal(clampStep(99, valid), 1);
  });
});

describe("칩 선택 제한: 3개를 고르면 나머지는 비활성, 해제하면 다시 활성", () => {
  it("3개를 고르면 고르지 않은 칩은 모두 비활성이고, 고른 칩은 비활성이 아니다", () => {
    const sel = keys.slice(0, 3);
    for (const k of keys) assert.equal(isChipDisabled(sel, k), !sel.includes(k));
  });

  it("2개일 때는 비활성인 칩이 없다", () => {
    const sel = keys.slice(0, 2);
    assert.equal(keys.some((k) => isChipDisabled(sel, k)), false);
  });

  it("하나를 해제하면 나머지가 다시 활성화된다", () => {
    let sel: string[] = [];
    for (const k of keys.slice(0, 3)) sel = toggleConcern(sel, k).selected;
    assert.ok(isChipDisabled(sel, keys[5]));
    sel = toggleConcern(sel, keys[1]).selected;
    assert.equal(sel.length, 2);
    assert.equal(isChipDisabled(sel, keys[5]), false);
    assert.equal(toggleConcern(sel, keys[5]).blocked, false);
  });

  it("기타는 제한과 무관하다(3개를 골라도 기타 선택과 입력이 가능)", () => {
    const d = draft({ concernKeys: keys.slice(0, 3), otherSelected: true, otherText: "기타 고민", situation: "junior" });
    assert.equal(canProceed(1, d), true);
    assert.equal(stepErrors(1, d).concern, undefined);
  });
});
