// 모의 추천·미리보기·학습 스택 규칙의 동작 검증 (PRD F2-02·F2-03·F2-04·F2-07·F4-02). 실제 개인화가 아니라 계약을 확인한다.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMO_BODIES } from "../src/config/demo-content-bodies.ts";
import { DEMO_CONTENTS } from "../src/config/demo-contents.ts";
import { CONCERN_CHIPS } from "../src/config/ui-provisional.ts";
import { createDemoContentService } from "../src/lib/content/demo-content-service.ts";
import { pickRecommendations, sanitizeRecommendationSet } from "../src/lib/content/recommend.ts";
import { CONTENT_TYPE_LABEL, RECOMMENDATION_VERSION } from "../src/lib/content/types.ts";
import type { ConfirmedDirection } from "../src/lib/direction-rules.ts";
import { EMPTY_DRAFT, type OnboardingDraft } from "../src/lib/onboarding-rules.ts";
import {
  ACTIVE_READING_SECONDS,
  STACK_DAYS,
  buildStackDays,
} from "../src/lib/stack-rules.ts";

const chipKeys = CONCERN_CHIPS.map((c) => c.key);
const chipLabel = (k: string) => CONCERN_CHIPS.find((c) => c.key === k)?.label ?? k;
const direction = (keys: string[]): ConfirmedDirection => ({
  coreDirection: { label: "핵심 방향", description: "설명" },
  topics: keys.map((key) => ({ key, label: chipLabel(key) })),
  edited: false,
  reanalysisCount: 0,
  confirmedAt: "t",
});
const input = (patch: Partial<OnboardingDraft> = {}): OnboardingDraft => ({
  ...EMPTY_DRAFT,
  situation: "job_seeker",
  ...patch,
});
const service = createDemoContentService(DEMO_CONTENTS, DEMO_BODIES);

/** 리더 본문에만 있는 문장들(카드와 미리보기에 나오면 안 되는 문자열) */
function bodyStrings(id: string): string[] {
  const b = DEMO_BODIES[id];
  // 짧은 용어(예: 주 행동)는 요약에도 자연스럽게 나오므로, 본문 전용 문장(20자 이상)만 비교한다
  return [
    b.goal,
    ...b.concepts.flatMap((c) => [c.term, c.explanation]),
    ...b.detail,
    b.caseStudy.title,
    b.caseStudy.situation,
    b.caseStudy.approach,
    b.caseStudy.result,
    ...b.steps.flatMap((s) => [s.step, s.tip]),
    ...b.checks,
    ...b.references.flatMap((r) => [r.title, r.note]),
  ].filter((s) => s.length >= 20);
}

describe("예시 자료 데이터", () => {
  it("id가 유일하고 주제 key가 모두 보유 토픽(칩 key)이며 필수 필드가 비어 있지 않다", () => {
    const ids = DEMO_CONTENTS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const c of DEMO_CONTENTS) {
      assert.ok(c.topics.length >= 1 && c.topics.every((k) => chipKeys.includes(k)), c.id);
      assert.ok(c.title && c.summary && c.keyLearnings.length >= 3, c.id);
      assert.ok(c.preview.subject && c.preview.whatYouLearn.length >= 2 && c.preview.actionAfter.length >= 1, c.id);
      assert.ok(c.estMinutes >= 5 && c.estMinutes <= 15, c.id);
      assert.ok(c.type in CONTENT_TYPE_LABEL, c.id);
      const all = JSON.stringify([c.title, c.summary, c.keyLearnings, c.preview]);
      assert.equal(/\p{Extended_Pictographic}/u.test(all), false, c.id);
    }
  });

  it("홈 카드용 소개는 구체적인 1~2문장이며 제목 반복, 잘린 문장, 효과 보장 표현이 없고 자료마다 다르다", () => {
    const seen = new Set<string>();
    for (const c of DEMO_CONTENTS) {
      const t = c.shortSummary;
      const sentences = t.split(/(?<=요)\.\s*/).filter(Boolean);
      assert.ok(sentences.length >= 1 && sentences.length <= 2, c.id + " " + t);
      assert.ok([...t].length >= 30 && [...t].length <= 130, c.id + " " + t);
      assert.equal(t.includes(c.title), false, c.id);
      assert.ok(/[.요다]$/.test(t), c.id);
      assert.equal(t.includes("…") || t.includes("..."), false, c.id);
      assert.equal(/보장|반드시|부족|효과|향상|완벽/.test(t), false, c.id);
      assert.equal(seen.has(t), false, c.id);
      seen.add(t);
      assert.equal(sentences.at(-1) === sentences[0] && sentences.length === 2, false, c.id);
    }
    // 두 번째 문장을 모든 자료에 같은 일반 문구로 붙이지 않는다
    const tails = DEMO_CONTENTS.map((c) => c.shortSummary.split(/(?<=요)\.\s*/).filter(Boolean).at(-1));
    assert.ok(new Set(tails).size === tails.length);
  });

  it("카드와 미리보기 응답에 짧은 소개, 소개, 핵심 학습 내용이 담긴다", async () => {
    const c = DEMO_CONTENTS[0];
    const set = await service.createRecommendation({
      direction: { coreDirection: { label: "x", description: "y" }, topics: c.topics.map((k) => ({ key: k, label: k })), edited: false, reanalysisCount: 0, confirmedAt: "2026-10-16T00:00:00.000Z" },
      input: { concernKeys: [...c.topics], otherSelected: false, otherText: "", detailText: "", situation: "junior" },
    });
    const cards = await service.getCards(set);
    assert.ok(cards.length >= 1 && cards.every((k) => k.shortSummary.length > 0));
    // 연결 주제는 확정한 주제와 자료 주제의 교집합이며 최대 2개다
    for (const k of cards) {
      assert.ok(k.linkedTopicLabels.length <= 2);
    }
    const pv = await service.getPreview(set, cards[0].contentId);
    assert.ok(pv && pv.summary.length > 0 && pv.keyLearnings.length >= 3 && pv.topicLabels.length >= 1 && pv.connection.length > 0);
  });

  it("후보 부족 상태 재현용으로 자료가 없는 주제가 있다", () => {
    const covered = new Set(DEMO_CONTENTS.flatMap((c) => c.topics));
    assert.equal(covered.has("ux-writing"), false);
  });
});

describe("리더 본문 데이터와 응답", () => {
  it("모든 자료에 본문이 있고, 요구한 7개 구성 요소를 갖는다", () => {
    for (const c of DEMO_CONTENTS) {
      const b = DEMO_BODIES[c.id];
      assert.ok(b, c.id);
      assert.ok(b.goal.length > 10, c.id);
      assert.ok(b.concepts.length >= 2 && b.concepts.every((x) => x.term && x.explanation), c.id);
      assert.ok(b.detail.length >= 2 && b.detail.every((x) => x.length > 20), c.id);
      assert.ok(b.caseStudy.title.includes("가상의 사례") && b.caseStudy.situation && b.caseStudy.approach && b.caseStudy.result, c.id);
      assert.ok(b.steps.length >= 3 && b.steps.every((x) => x.step && x.tip), c.id);
      assert.ok(b.checks.length >= 3 && b.checks.every((q) => q.endsWith("?")), c.id);
      assert.ok(b.references.length >= 2 && b.references.every((r) => r.title.includes("예시 표기") && r.note.includes("실제 출처가 아니라")), c.id);
    }
  });

  it("본문이 없는 자료와 본문만 있는 id는 리더 응답이 없다", async () => {
    assert.equal(await service.getReaderContent("nope"), null);
    const noBody = createDemoContentService(DEMO_CONTENTS, {});
    assert.equal(await noBody.getReaderContent(DEMO_CONTENTS[0].id), null);
  });

  it("이해 점검은 채점 요소(정답, 점수, 선택지)가 없는 읽기용 질문이다", () => {
    for (const c of DEMO_CONTENTS) {
      for (const q of DEMO_BODIES[c.id].checks) {
        assert.ok(!/정답|오답|점수|채점|d+s*점|① |② |보기/.test(q), q);
      }
    }
  });

  it("리더 응답에는 제목, 유형, 시간, 본문이 들어 있다", async () => {
    const r = await service.getReaderContent("user-interview-basics");
    assert.ok(r && r.title && r.typeLabel && r.estMinutes > 0 && r.body.goal);
  });
});

describe("추천 2개 선정", () => {
  const typical = ["user-research", "problem-definition", "data-metrics"];

  it("확정한 주제와 겹치는 서로 다른 자료 2개를 고르고, 가능하면 유형이 다르다", () => {
    const picked = pickRecommendations(DEMO_CONTENTS, typical);
    assert.equal(picked.length, 2);
    assert.notEqual(picked[0].content.id, picked[1].content.id);
    assert.notEqual(picked[0].content.type, picked[1].content.type);
    for (const p of picked) assert.ok(p.matched.length >= 1 && p.matched.every((k) => typical.includes(k)));
  });

  it("새 회차에서는 제외할 자료(직전 추천, 선택한 자료)를 뺀 후보에서 같은 기준으로 고르고, 모자라도 관련 없는 자료로 채우지 않는다", () => {
    const first = pickRecommendations(DEMO_CONTENTS, typical).map((p) => p.content.id);
    const next = pickRecommendations(DEMO_CONTENTS, typical, first);
    assert.ok(next.every((p) => !first.includes(p.content.id)));
    assert.ok(next.every((p) => p.matched.length >= 1 && p.matched.every((k) => typical.includes(k))));
    // 겹치는 자료를 모두 제외하면 비어 있어야 한다(관련 없는 자료로 채우지 않는다)
    const all = DEMO_CONTENTS.filter((c) => c.topics.some((k) => typical.includes(k))).map((c) => c.id);
    assert.equal(pickRecommendations(DEMO_CONTENTS, typical, all).length, 0);
  });

  it("같은 입력이면 같은 결과(결정적)", () => {
    const a = pickRecommendations(DEMO_CONTENTS, typical).map((p) => p.content.id);
    const b = pickRecommendations(DEMO_CONTENTS, typical).map((p) => p.content.id);
    assert.deepEqual(a, b);
  });

  it("주제 조합이 다르면 추천도 달라진다", () => {
    const design = pickRecommendations(DEMO_CONTENTS, ["ui-design", "design-system"]).map((p) => p.content.id);
    const career = pickRecommendations(DEMO_CONTENTS, ["portfolio", "interview"]).map((p) => p.content.id);
    assert.notDeepEqual(design, career);
  });

  it("후보가 1개뿐이면 1개만 돌려준다(관련 없는 자료로 채우지 않는다)", () => {
    const picked = pickRecommendations(DEMO_CONTENTS, ["dev-collab"]);
    assert.equal(picked.length, 1);
    assert.ok(picked[0].content.topics.includes("dev-collab"));
  });

  it("맞는 자료가 없으면 0개를 돌려준다", () => {
    assert.deepEqual(pickRecommendations(DEMO_CONTENTS, ["ux-writing"]), []);
    assert.deepEqual(pickRecommendations(DEMO_CONTENTS, []), []);
  });

  it("모든 주제 조합에서 추천된 자료는 항상 관련성이 있고 중복이 없다", () => {
    for (const k of chipKeys) {
      const picked = pickRecommendations(DEMO_CONTENTS, [k, "problem-definition"]);
      assert.ok(picked.length <= 2);
      assert.equal(new Set(picked.map((p) => p.content.id)).size, picked.length);
      for (const p of picked) assert.ok(p.matched.length >= 1);
    }
  });
});

describe("추천 묶음·카드·미리보기", () => {
  it("카드의 추천 이유는 고민과 이어지는 한 문장이고, 입력한 고민 전체를 나열하지 않는다", async () => {
    const set = await service.createRecommendation({
      direction: direction(["user-research", "problem-definition", "data-metrics"]),
      input: input({
        concernKeys: ["user-research", "problem-definition", "data-metrics"],
        otherSelected: true,
        otherText: "스펙 합의가 어려워요",
      }),
    });
    assert.equal(set.shortage, "none");
    assert.equal(set.items.length, 2);
    for (const item of set.items) {
      assert.ok(item.reason.includes("고민과 이어지고"), item.reason);
      assert.equal((item.reason.match(/[.]/g) ?? []).length, 1, `한 문장이 아님: ${item.reason}`);
      assert.ok(!item.reason.includes("스펙 합의"), "기타 입력을 반복하지 않는다");
      // 이 자료와 겹친 고민만 언급한다(겹치지 않은 고민은 나열하지 않음)
      const mentioned = ["사용자 리서치", "문제 정의", "데이터 해석과 지표 설정"].filter((l) => item.reason.includes(l));
      assert.ok(mentioned.length >= 1 && mentioned.length <= 3);
    }
    assert.notEqual(set.items[0].reason, set.items[1].reason);
  });

  it("사용자가 고른 고민과 겹치지 않은 주제(AI 제안·직접 추가)는 '확정한 주제'로 표현한다", async () => {
    const set = await service.createRecommendation({
      direction: direction(["dev-collab"]),
      input: input({ concernKeys: ["portfolio"] }),
    });
    assert.ok(set.items[0].reason.includes("확정한 ‘개발자 협업’ 주제와 이어지고"), set.items[0].reason);
  });

  it("입력이 없어도 확정 주제를 언급하는 이유를 만든다", async () => {
    const set = await service.createRecommendation({ direction: direction(["portfolio"]), input: null });
    assert.ok(set.items.length >= 1 && set.items[0].reason.includes("포트폴리오 구성"));
  });

  it("카드는 필수 정보 6개를 모두 가지며 본문은 없다", async () => {
    const set = await service.createRecommendation({
      direction: direction(["ui-design", "design-system"]),
      input: input({ concernKeys: ["ui-design"] }),
    });
    const cards = await service.getCards(set);
    assert.equal(cards.length, 2);
    for (const c of cards) {
      assert.ok(c.title && c.summary && c.keyLearnings.length >= 1 && c.reason && c.typeLabel && c.topicLabels.length >= 1);
      assert.equal((c.summary.match(/[.]/g) ?? []).length, 1, `소개는 한 문장: ${c.summary}`);
      assert.ok(c.keyLearnings.every((k) => k.length <= 16), "핵심 학습 내용은 짧은 구절");
      assert.ok(c.estMinutes > 0);
      const json = JSON.stringify(c);
      for (const s of bodyStrings(c.contentId)) assert.ok(!json.includes(s), "카드에 본문이 섞임: " + s.slice(0, 30));
      assert.ok(!("body" in c));
    }
  });

  it("미리보기는 5항목을 갖고 본문이 응답에 없다", async () => {
    const set = await service.createRecommendation({
      direction: direction(["user-research", "problem-definition"]),
      input: input({ concernKeys: ["user-research"] }),
    });
    const id = set.items[0].contentId;
    const p = await service.getPreview(set, id);
    assert.ok(p);
    assert.ok(p.subject && p.whatYouLearn.length >= 2 && p.connection && p.estMinutes > 0 && p.actionAfter.length >= 1);
    // 카드에는 요약(한 문장), 미리보기에는 구체적인 설명
    assert.equal(p.connection, set.items[0].detail);
    assert.ok(p.connection.length > set.items[0].reason.length);
    assert.ok(p.connection.includes(p.subject));
    const card = (await service.getCards(set))[0];
    assert.ok(p.whatYouLearn.join("").length > card.keyLearnings.join("").length, "미리보기가 카드보다 구체적");
    const json = JSON.stringify(p);
    for (const s of bodyStrings(id)) assert.ok(!json.includes(s), "미리보기에 본문이 섞임: " + s.slice(0, 30));
    assert.ok(!("body" in p));
  });

  it("추천 묶음마다 서로 다른 id가 붙는다(선택은 이 id에 연결)", async () => {
    const a = await service.createRecommendation({ direction: direction(["ui-design"]), input: null });
    const b = await service.createRecommendation({ direction: direction(["ui-design"]), input: null });
    assert.ok(a.id && b.id && a.id !== b.id);
  });

  it("추천 묶음에 없는 자료·없는 id는 미리보기를 줄 수 없다", async () => {
    const set = await service.createRecommendation({ direction: direction(["ui-design"]), input: null });
    const notIn = DEMO_CONTENTS.find((c) => !set.items.some((i) => i.contentId === c.id))!;
    assert.equal(await service.getPreview(set, notIn.id), null);
    assert.equal(await service.getPreview(set, "nope"), null);
  });

  it("저장된 추천 묶음 복원: 카탈로그에 없는 자료·중복을 버리고 상태를 다시 계산한다", () => {
    const ids = DEMO_CONTENTS.map((c) => c.id);
    const raw = {
      id: "set-x",
      version: RECOMMENDATION_VERSION,
      createdAt: "t",
      directionTopicKeys: ["user-research"],
      shortage: "none",
      items: [
        { contentId: ids[0], reason: "a", detail: "aa", matchedTopicKeys: [] },
        { contentId: ids[0], reason: "dup", detail: "dd", matchedTopicKeys: [] },
        { contentId: "ghost", reason: "x", detail: "xx", matchedTopicKeys: [] },
        { contentId: ids[1], reason: "no detail", matchedTopicKeys: [] },
      ],
    };
    const clean = sanitizeRecommendationSet(raw, ids);
    assert.equal(clean?.items.length, 1);
    assert.equal(clean?.shortage, "one");
    // 이전 저장 형식(버전 없음·다른 버전)은 버리고 다시 만든다
    const legacy: Record<string, unknown> = { ...raw };
    delete legacy.version;
    assert.equal(sanitizeRecommendationSet(legacy, ids), null);
    assert.equal(sanitizeRecommendationSet({ ...raw, version: RECOMMENDATION_VERSION - 1 }, ids), null);
    // 묶음 id가 없으면(선택을 연결할 수 없음) 버린다
    assert.equal(sanitizeRecommendationSet({ ...raw, id: "" }, ids), null);
    assert.equal(clean?.id, "set-x");
    assert.equal(sanitizeRecommendationSet({ items: "x" }, ids), null);
    assert.equal(sanitizeRecommendationSet(null, ids), null);
  });
});

describe("학습 스택(30일 잔디)", () => {
  const today = new Date(2026, 9, 21, 15, 30); // 2026-10-21

  it("기록이 없으면 30칸 모두 비활성이다 (접속·분석·확정으로는 채워지지 않는다)", () => {
    const days = buildStackDays(today, []);
    assert.equal(days.length, STACK_DAYS);
    assert.equal(days.filter((d) => d.active).length, 0);
  });

  it("오래된 날부터 오늘까지 연속된 날짜이고 마지막 칸만 오늘이다", () => {
    const days = buildStackDays(today, []);
    assert.equal(days[0].date, "2026-09-22");
    assert.equal(days[29].date, "2026-10-21");
    assert.equal(days.filter((d) => d.isToday).length, 1);
    assert.equal(days[29].isToday, true);
    for (let i = 1; i < days.length; i++) assert.ok(days[i].date > days[i - 1].date);
  });

  it("하루 합산 5분(300초) 미만은 비활성, 이상이면 활성이며 하루는 1칸이다", () => {
    const days = buildStackDays(today, [
      { date: "2026-10-20", activeSeconds: ACTIVE_READING_SECONDS - 1 },
      { date: "2026-10-19", activeSeconds: ACTIVE_READING_SECONDS },
      { date: "2026-10-18", activeSeconds: 100 },
      { date: "2026-10-18", activeSeconds: 200 }, // 같은 날 여러 자료의 시간 합산
    ]);
    const by = Object.fromEntries(days.map((d) => [d.date, d.active]));
    assert.equal(by["2026-10-20"], false);
    assert.equal(by["2026-10-19"], true);
    assert.equal(by["2026-10-18"], true);
    assert.equal(days.filter((d) => d.active).length, 2);
  });

  it("범위 밖 날짜와 0초 기록은 무시한다", () => {
    const days = buildStackDays(today, [
      { date: "2026-01-01", activeSeconds: 9999 },
      { date: "2026-10-21", activeSeconds: 0 },
    ]);
    assert.equal(days.filter((d) => d.active).length, 0);
  });

  it("월·연도 경계에서도 날짜가 하루씩 이어진다", () => {
    const days = buildStackDays(new Date(2027, 0, 5, 9), []);
    assert.equal(days[0].date, "2026-12-07");
    assert.equal(days[29].date, "2027-01-05");
    assert.equal(new Set(days.map((d) => d.date)).size, 30);
  });
});
