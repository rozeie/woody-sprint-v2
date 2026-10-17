// 원문 기반 자료와 리더 구성, 선택 입력 저장 규칙, 추천 관련성 검증.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG } from "../src/config/catalog.ts";
import { DEMO_BODIES } from "../src/config/demo-content-bodies.ts";
import { DEMO_CONTENTS } from "../src/config/demo-contents.ts";
import { SOURCE_CONTENTS, SOURCE_READERS } from "../src/config/source-contents.ts";
import { CONCERN_CHIPS } from "../src/config/ui-provisional.ts";
import { createDemoContentService } from "../src/lib/content/demo-content-service.ts";
import { pickRecommendations } from "../src/lib/content/recommend.ts";
import { EMPTY_NOTES, NOTE_MAX, sanitizeNotesMap, withNotes } from "../src/lib/reader-notes.ts";

const service = createDemoContentService(CATALOG, DEMO_BODIES, SOURCE_READERS);
const ids = CATALOG.map((c) => c.id);

describe("원문 기반 자료", () => {
  it("모든 원문 자료는 https 원문 주소, 발행 기관, 제목, 확인일을 갖고 알 수 없는 값은 null이다", () => {
    assert.ok(SOURCE_CONTENTS.length >= 1);
    for (const c of SOURCE_CONTENTS) {
      assert.ok(c.source, c.id);
      assert.match(c.source.url, /^https:\/\/[^\s]+$/, c.id);
      assert.ok(c.source.publisher.length > 0 && c.source.title.length > 0, c.id);
      assert.match(c.source.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, c.id);
      assert.ok(c.source.publishedAt === null || /^\d{4}-\d{2}-\d{2}$/.test(c.source.publishedAt), c.id);
      assert.ok(c.source.author === null || c.source.author.length > 0, c.id);
    }
  });

  it("가상 예시 자료에는 원문 출처가 없고 원문 자료만 출처를 갖는다", () => {
    for (const c of DEMO_CONTENTS) assert.equal(c.source, undefined, c.id);
    for (const c of SOURCE_CONTENTS) assert.ok(c.source, c.id);
  });

  it("자료 id는 중복되지 않고 원문 자료는 원문 리더 데이터가 있다", () => {
    assert.equal(new Set(ids).size, ids.length);
    for (const c of SOURCE_CONTENTS) assert.ok(SOURCE_READERS[c.id], c.id);
  });

  it("원문 요약은 직접 쓴 요약이다: 문단이 길지 않고 따옴표 인용으로 원문을 옮기지 않는다", () => {
    for (const r of Object.values(SOURCE_READERS)) {
      assert.ok(r.summary.length >= 3);
      for (const s of r.summary) {
        for (const p of [...s.paragraphs, ...(s.points ?? [])]) {
          assert.ok(p.length <= 400, p.slice(0, 30));
          assert.ok(!/["“”]/.test(p), `따옴표 인용: ${p.slice(0, 30)}`);
        }
      }
    }
  });

  it("역량을 진단하거나 효과를 보장하는 표현이 없다", () => {
    const text = JSON.stringify([SOURCE_CONTENTS, SOURCE_READERS]);
    for (const bad of ["반드시 성공", "보장", "부족한 역량", "실력이 부족", "100%"]) assert.ok(!text.includes(bad), bad);
  });

  it("연결 설명은 이 자료의 주제 key만 가리킨다", () => {
    for (const c of SOURCE_CONTENTS) {
      for (const k of SOURCE_READERS[c.id].connections.map((x) => x.topicKey)) assert.ok(c.topics.includes(k), `${c.id}:${k}`);
    }
  });

  it("원문 자료의 리더 응답은 source 구성이고 가상 예시 자료는 기존 본문(example)이다", async () => {
    const src = await service.getReaderContent(SOURCE_CONTENTS[0].id);
    assert.ok(src && src.kind === "source" && src.source.url.startsWith("https://") && src.reader.summary.length > 0);
    const ex = await service.getReaderContent("user-interview-basics");
    assert.ok(ex && ex.kind === "example" && ex.body.goal);
    assert.equal("source" in ex, false);
  });

  it("원문 리더 데이터가 없으면 열리지 않고, 출처가 없는 자료에 원문 리더를 붙여도 원문 자료처럼 열리지 않는다", async () => {
    const noReader = createDemoContentService(CATALOG, DEMO_BODIES, {});
    assert.equal(await noReader.getReaderContent(SOURCE_CONTENTS[0].id), null);
    const fake = createDemoContentService(CATALOG, DEMO_BODIES, { "user-interview-basics": SOURCE_READERS[SOURCE_CONTENTS[0].id] });
    const r = await fake.getReaderContent("user-interview-basics");
    assert.ok(r && r.kind === "example");
  });

  it("미니미션은 예상 시간과 구체적인 단계가 있고 회고는 질문 1개다(선택 데이터)", () => {
    for (const r of Object.values(SOURCE_READERS)) {
      if (r.miniMission) {
        assert.ok(r.miniMission.estMinutes > 0 && r.miniMission.steps.length >= 3 && r.miniMission.instruction.length > 20);
        assert.ok(!/평가|점수|AI 피드백/.test(JSON.stringify(r.miniMission)));
      }
      if (r.reflection) assert.ok(r.reflection.question.endsWith("?") || r.reflection.question.includes("?"));
    }
  });

  it("예시 자료에는 미션과 회고 데이터를 만들어 붙이지 않았다", () => {
    for (const c of DEMO_CONTENTS) assert.equal(SOURCE_READERS[c.id], undefined, c.id);
  });
});

describe("추천 관련성", () => {
  it("원문 자료도 확정 주제와 겹칠 때만 추천된다(관련 없는 조합에는 나오지 않는다)", () => {
    const withTopic = pickRecommendations(CATALOG, ["usability-test"]);
    assert.ok(withTopic.some((p) => p.content.id === SOURCE_CONTENTS[0].id));
    const unrelated = pickRecommendations(CATALOG, ["portfolio", "role-direction", "ia-flow"]);
    assert.ok(!unrelated.some((p) => p.content.id === SOURCE_CONTENTS[0].id));
  });

  it("직전 추천 제외 규칙은 원문 자료에도 같게 적용된다", () => {
    const again = pickRecommendations(CATALOG, ["usability-test"], [SOURCE_CONTENTS[0].id]);
    assert.equal(again.length, 0);
  });

  it("주제 key는 모두 고민 칩과 정렬되어 있다", () => {
    const keys = new Set(CONCERN_CHIPS.map((c) => c.key));
    for (const c of SOURCE_CONTENTS) for (const t of c.topics) assert.ok(keys.has(t), t);
  });
});

describe("미니미션과 회고 입력 저장 규칙", () => {
  it("저장하면 자료별로 복원되고, 모두 비면 항목을 지운다", () => {
    let map = withNotes({}, "a", { mission: "내 답", reflection: "" }, "t1");
    assert.deepEqual(sanitizeNotesMap(map, ["a", "b"]).a, { mission: "내 답", reflection: "", updatedAt: "t1" });
    map = withNotes(map, "a", { mission: "", reflection: "" }, "t2");
    assert.deepEqual(sanitizeNotesMap(map, ["a"]), {});
  });

  it("자료마다 따로 보존되고 다른 자료 입력을 덮어쓰지 않는다", () => {
    let map = withNotes({}, "a", { mission: "A", reflection: "a" }, "t");
    map = withNotes(map, "b", { mission: "B", reflection: "" }, "t");
    const r = sanitizeNotesMap(map, ["a", "b"]);
    assert.equal(r.a.mission, "A");
    assert.equal(r.b.mission, "B");
  });

  it("길이는 상한으로 자르고, 알 수 없는 자료와 손상된 값은 버린다", () => {
    const long = "가".repeat(NOTE_MAX + 50);
    const map = withNotes({}, "a", { mission: long, reflection: "" }, "t");
    assert.equal(map.a.mission.length, NOTE_MAX);
    assert.deepEqual(sanitizeNotesMap({ zzz: { mission: "x", reflection: "" } }, ["a"]), {});
    assert.deepEqual(sanitizeNotesMap("bad", ["a"]), {});
    assert.deepEqual(sanitizeNotesMap({ a: 5 }, ["a"]), {});
    assert.equal(EMPTY_NOTES.mission, "");
  });
});
