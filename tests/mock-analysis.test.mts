// 모의 분석 생성기·서비스의 동작 검증 (PRD F1-04). 실제 AI가 아니라 계약(형태·실패·재시도)을 확인한다.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONCERN_CHIPS } from "../src/config/ui-provisional.ts";
import { validateAnalysis } from "../src/lib/direction-rules.ts";
import { buildMockAnalysis } from "../src/lib/analysis/mock-analysis-core.ts";
import { AnalysisError, createMockAnalysisService } from "../src/lib/analysis/mock-analysis.ts";
import { EMPTY_DRAFT, type OnboardingDraft } from "../src/lib/onboarding-rules.ts";

const keys = CONCERN_CHIPS.map((c) => c.key);
const input = (patch: Partial<OnboardingDraft>): OnboardingDraft => ({
  ...EMPTY_DRAFT,
  situation: "junior",
  ...patch,
});

const SILENT = console.info;
console.info = () => {}; // 서비스의 데모 로그를 테스트 출력에서 숨긴다
process.on("exit", () => {
  console.info = SILENT;
});

describe("모의 분석 결과 형태", () => {
  const inputs: Record<string, OnboardingDraft> = {
    "칩 1개": input({ concernKeys: [keys[0]] }),
    "칩 2개": input({ concernKeys: [keys[0], keys[8]] }),
    "칩 3개(서로 다른 그룹)": input({ concernKeys: [keys[0], keys[3], keys[12]] }),
    "기타만": input({ otherSelected: true, otherText: "개발자와 스펙 합의가 어려워요" }),
    "칩 + 기타": input({ concernKeys: [keys[3]], otherSelected: true, otherText: "프로토타입 검증" }),
  };

  for (const [name, inp] of Object.entries(inputs)) {
    it(`${name}: 모든 variant에서 핵심 방향 1개 + 세부 주제 2~3개이며 보유 토픽과 연결된다`, () => {
      for (let variant = 0; variant < 8; variant++) {
        const result = buildMockAnalysis(inp, variant);
        const v = validateAnalysis(result, keys);
        assert.equal(v.ok, true, `variant ${variant}: ${JSON.stringify(v)}`);
      }
    });
  }

  it("사용자가 고른 칩이 우선 제안된다", () => {
    const result = buildMockAnalysis(input({ concernKeys: [keys[1]] }), 0);
    assert.equal(result.subTopics[0].key, keys[1]);
  });

  it("같은 입력·variant는 같은 결과, 다시 분석(variant 증가)은 다른 제안", () => {
    const inp = input({ concernKeys: [keys[0], keys[1]] });
    assert.deepEqual(buildMockAnalysis(inp, 0), buildMockAnalysis(inp, 0));
    const a = buildMockAnalysis(inp, 0).subTopics.map((t) => t.key).join();
    const b = buildMockAnalysis(inp, 1).subTopics.map((t) => t.key).join();
    assert.notEqual(a, b);
  });

  it("해석에는 사용자가 입력한 고민이 언급된다", () => {
    const r = buildMockAnalysis(input({ concernKeys: [keys[0]], otherSelected: true, otherText: "스펙 합의" }), 0);
    assert.ok(r.interpretation.includes("사용자 리서치"));
    assert.ok(r.interpretation.includes("스펙 합의"));
  });

  it("점수·등급·수준 단정 표현이 없다 (능력 평가·점수화 금지)", () => {
    const banned = /\d+\s*점|점수|등급|상위\s*\d|하위\s*\d|\d+\s*%|수준이\s*(낮|높)|부족합니다|뛰어납니다|레벨/;
    for (const inp of Object.values({
      a: input({ concernKeys: keys.slice(0, 3) }),
      b: input({ concernKeys: [keys[13]] }),
      c: input({ otherSelected: true, otherText: "아무 고민" }),
    })) {
      for (let variant = 0; variant < 4; variant++) {
        const r = buildMockAnalysis(inp, variant);
        const text = [r.interpretation, r.coreDirection.label, r.coreDirection.description, r.directionSummary, ...r.subTopics.map((t) => t.why)].join("\n");
        assert.equal(banned.test(text), false, text);
        assert.equal(/\p{Extended_Pictographic}/u.test(text), false);
      }
    }
  });
});

describe("모의 분석 서비스: 실패와 재시도 재현", () => {
  const service = createMockAnalysisService({ latencyMs: 0 });
  const inp = input({ concernKeys: [keys[0]] });

  it("정상 모드는 성공한다", async () => {
    const r = await service.analyze({ input: inp, variant: 0, attempt: 1, demo: "none" });
    assert.equal(r.subTopics.length >= 2, true);
  });

  it("error 모드는 몇 번을 시도해도 실패한다", async () => {
    for (const attempt of [1, 2, 3]) {
      await assert.rejects(service.analyze({ input: inp, variant: 0, attempt, demo: "error" }), AnalysisError);
    }
  });

  it("error-once 모드는 첫 시도만 실패하고 재시도는 성공한다", async () => {
    await assert.rejects(service.analyze({ input: inp, variant: 0, attempt: 1, demo: "error-once" }), AnalysisError);
    const r = await service.analyze({ input: inp, variant: 0, attempt: 2, demo: "error-once" });
    assert.equal(validateAnalysis(r, keys).ok, true);
  });
});
