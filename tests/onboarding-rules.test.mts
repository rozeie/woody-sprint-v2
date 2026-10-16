// 온보딩 입력 규칙의 동작 검증 (PRD F1-01·F1-02). Node 내장 테스트 러너 사용 — 별도 테스트 라이브러리 없음.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONCERN_CHIPS, PROVISIONAL } from "../src/config/ui-provisional.ts";
import {
  EMPTY_DRAFT,
  MAX_CONCERN_CHIPS,
  OTHER_TEXT_MAX,
  clampText,
  sanitizeDraft,
  toggleConcern,
  validateDraft,
  type OnboardingDraft,
} from "../src/lib/onboarding-rules.ts";

const keys = CONCERN_CHIPS.map((c) => c.key);
const draft = (patch: Partial<OnboardingDraft>): OnboardingDraft => ({
  ...EMPTY_DRAFT,
  ...patch,
});

describe("일반 고민 칩 선택 제한", () => {
  it("3개까지 선택되고 4번째는 차단되며 기존 선택은 유지된다", () => {
    let sel: string[] = [];
    for (const k of keys.slice(0, 3)) sel = toggleConcern(sel, k).selected;
    assert.equal(sel.length, MAX_CONCERN_CHIPS);

    const blocked = toggleConcern(sel, keys[3]);
    assert.equal(blocked.blocked, true);
    assert.deepEqual(blocked.selected, sel);
  });

  it("선택을 해제하면 다시 다른 칩을 고를 수 있다", () => {
    const full = keys.slice(0, 3);
    const released = toggleConcern(full, keys[0]);
    assert.equal(released.blocked, false);
    assert.equal(released.selected.length, 2);
    const added = toggleConcern(released.selected, keys[3]);
    assert.equal(added.blocked, false);
    assert.equal(added.selected.length, 3);
  });

  it("가득 찬 상태에서도 이미 선택한 칩의 해제는 차단되지 않는다", () => {
    const result = toggleConcern(keys.slice(0, 3), keys[1]);
    assert.equal(result.blocked, false);
    assert.equal(result.selected.includes(keys[1]), false);
  });
});

describe("'기타'는 개수 제한 밖이다", () => {
  it("일반 칩 3개 + 기타를 함께 써도 유효하다", () => {
    const d = draft({
      concernKeys: keys.slice(0, 3),
      otherSelected: true,
      otherText: "개발자와 스펙 합의가 어려워요",
      situation: "junior",
    });
    assert.equal(validateDraft(d).ok, true);
  });

  it("기타만 선택하고 내용을 적으면 유효하다", () => {
    const d = draft({ otherSelected: true, otherText: "포트폴리오 방향", situation: "job_seeker" });
    assert.equal(validateDraft(d).ok, true);
  });

  it("기타를 선택했지만 내용이 비어 있거나 공백뿐이면 입력을 요구한다", () => {
    for (const text of ["", "   \n "]) {
      const r = validateDraft(
        draft({ concernKeys: [keys[0]], otherSelected: true, otherText: text, situation: "junior" }),
      );
      assert.equal(r.ok, false);
      assert.equal(r.errors.other, "empty");
    }
  });

  it("기타 입력은 300자로 제한된다", () => {
    assert.equal(OTHER_TEXT_MAX, 300);
    assert.equal(clampText("가".repeat(450), OTHER_TEXT_MAX).length, 300);
    assert.equal(clampText("가".repeat(300), OTHER_TEXT_MAX).length, 300);
    assert.equal(clampText("가".repeat(12), OTHER_TEXT_MAX).length, 12);
  });

  it("자를 때 서로게이트 쌍이 깨진 글자를 남기지 않는다", () => {
    const s = "a".repeat(299) + "😀"; // 마지막 이모지가 경계에 걸림
    const out = clampText(s, 300);
    assert.equal(out, "a".repeat(299));
  });
});

describe("필수 입력", () => {
  it("고민이 하나도 없으면 오류", () => {
    const r = validateDraft(draft({ situation: "junior" }));
    assert.equal(r.ok, false);
    assert.equal(r.errors.concern, "none");
  });

  it("현재 상황이 없으면 오류", () => {
    const r = validateDraft(draft({ concernKeys: [keys[0]] }));
    assert.equal(r.ok, false);
    assert.equal(r.errors.situation, "missing");
  });

  it("일반 칩만 고르고 추가 설명 없이도 제출 가능하다", () => {
    const r = validateDraft(draft({ concernKeys: [keys[0]], situation: "job_seeker", detailText: "" }));
    assert.equal(r.ok, true);
  });

  it("추가 설명 상한은 임시 설정값으로 분리되어 있고 그 값으로 제한된다", () => {
    const max = PROVISIONAL.detailTextMax;
    assert.equal(clampText("나".repeat(max + 50), max).length, max);
  });
});

describe("저장된 초안 복원(sanitize)", () => {
  it("알 수 없는 칩, 중복, 3개 초과, 잘못된 상황, 과도한 길이를 정리한다", () => {
    const raw = {
      concernKeys: [keys[0], keys[0], "unknown-chip", keys[1], keys[2], keys[3]],
      otherSelected: true,
      otherText: "가".repeat(999),
      detailText: "나".repeat(9999),
      situation: "hacker",
    };
    const d = sanitizeDraft(raw, keys, PROVISIONAL.detailTextMax);
    assert.deepEqual(d.concernKeys, [keys[0], keys[1], keys[2]]);
    assert.equal(d.otherText.length, OTHER_TEXT_MAX);
    assert.equal(d.detailText.length, PROVISIONAL.detailTextMax);
    assert.equal(d.situation, null);
  });

  it("객체가 아닌 값이면 빈 초안을 돌려준다", () => {
    for (const bad of [null, undefined, "x", 3, []]) {
      assert.deepEqual(sanitizeDraft(bad, keys, 500).concernKeys, []);
    }
  });
});

describe("칩 목록 데이터", () => {
  it("이모지가 없다 (PRD F1-01: 이모지 칩 금지)", () => {
    const emoji = /\p{Extended_Pictographic}/u;
    for (const chip of CONCERN_CHIPS) {
      assert.equal(emoji.test(chip.label), false, chip.label);
      assert.equal(emoji.test(chip.group), false, chip.group);
    }
  });

  it("key가 중복되지 않고 '기타'는 일반 칩 목록에 없다", () => {
    assert.equal(new Set(keys).size, keys.length);
    assert.equal(CONCERN_CHIPS.some((c) => c.label === "기타"), false);
  });
});
