// 자료 선택·시작·완료 규칙의 동작 검증 (PRD F2-05, F3-01, F3-04). 서버 제약이 아니라 모의 서비스 계층의 규칙이다.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  completeReading,
  continueReadingOrder,
  sanitizeUserContents,
  startReading,
  stateOf,
  trySelect,
  type UserContent,
} from "../src/lib/selection-rules.ts";

const set = { id: "set-1", items: [{ contentId: "a" }, { contentId: "b" }] };
const T0 = "2026-10-16T09:00:00.000Z";
const T1 = "2026-10-16T09:05:00.000Z";

describe("선택: 묶음당 1개, 변경·취소·추가 선택 없음", () => {
  it("추천에 있는 자료를 선택하면 기록되고, 선택만으로는 시작·완료가 아니다", () => {
    const { outcome, list } = trySelect([], set, "a", T0);
    assert.equal(outcome.status, "selected");
    assert.equal(list.length, 1);
    assert.equal(list[0].selectedAt, T0);
    assert.equal(list[0].startedAt, null);
    assert.equal(list[0].completedAt, null);
    assert.equal(stateOf(list[0]), "selected");
  });

  it("같은 자료를 다시 선택해도(중복 요청) 기록은 1건이고 선택 시각이 바뀌지 않는다", () => {
    const first = trySelect([], set, "a", T0).list;
    const second = trySelect(first, set, "a", T1);
    assert.equal(second.outcome.status, "already-selected");
    assert.equal(second.list.length, 1);
    assert.equal(second.list[0].selectedAt, T0);
  });

  it("같은 묶음에서 다른 자료를 추가로 선택할 수 없다(변경·교체·추가 모두 차단)", () => {
    const first = trySelect([], set, "a", T0).list;
    const other = trySelect(first, set, "b", T1);
    assert.equal(other.outcome.status, "set-has-selection");
    assert.equal(other.list.length, 1);
    assert.equal(other.list[0].contentId, "a");
  });

  it("묶음에 없는 자료는 선택할 수 없다", () => {
    const r = trySelect([], set, "zzz", T0);
    assert.equal(r.outcome.status, "not-in-set");
    assert.equal(r.list.length, 0);
  });

  it("새 묶음(다른 id)에서는 다시 1개를 선택할 수 있고 이전 선택은 그대로 남는다", () => {
    const first = trySelect([], set, "a", T0).list;
    const next = trySelect(first, { id: "set-2", items: [{ contentId: "c" }, { contentId: "d" }] }, "c", T1);
    assert.equal(next.outcome.status, "selected");
    assert.deepEqual(next.list.map((u) => u.contentId), ["a", "c"]);
  });

  it("이미 선택한 자료가 새 묶음에 다시 나와도 중복 선택되지 않는다", () => {
    const first = trySelect([], set, "a", T0).list;
    const r = trySelect(first, { id: "set-2", items: [{ contentId: "a" }, { contentId: "d" }] }, "a", T1);
    assert.equal(r.outcome.status, "already-selected");
    assert.equal(r.list.length, 1);
  });

  it("입력 목록을 변경하지 않는다", () => {
    const base: UserContent[] = [];
    trySelect(base, set, "a", T0);
    assert.equal(base.length, 0);
  });
});

describe("선택 / 학습 시작 / 학습 완료는 서로 다른 상태", () => {
  const selected = trySelect([], set, "a", T0).list;

  it("리더에 처음 들어오면 시작 시각이 기록되고 상태가 '읽는 중'이 된다(완료 아님)", () => {
    const r = startReading(selected, "a", T1);
    assert.equal(r.changed, true);
    assert.equal(r.item?.startedAt, T1);
    assert.equal(r.item?.completedAt, null);
    assert.equal(stateOf(r.item!), "reading");
    assert.equal(r.item?.selectedAt, T0);
  });

  it("다시 들어와도 처음 시작 시각이 유지된다(멱등)", () => {
    const once = startReading(selected, "a", T0).list;
    const twice = startReading(once, "a", T1);
    assert.equal(twice.changed, false);
    assert.equal(twice.item?.startedAt, T0);
  });

  it("선택하지 않은 자료는 시작으로 기록되지 않는다", () => {
    const r = startReading(selected, "b", T1);
    assert.equal(r.item, null);
    assert.equal(r.changed, false);
    assert.equal(r.list.length, 1);
  });

  it("완료 시각이 있어야만 '완료'이며, 시작만으로는 완료가 아니다", () => {
    const started = startReading(selected, "a", T1).item!;
    assert.equal(stateOf(started), "reading");
    assert.equal(stateOf({ ...started, completedAt: T1 }), "completed");
  });
});

describe("이어서 읽기 목록과 저장값 복원", () => {
  it("완료하지 않은 자료만, 최근 활동 순으로", () => {
    const list: UserContent[] = [
      { contentId: "a", setId: "s1", selectedAt: "2026-10-15T00:00:00.000Z", startedAt: null, completedAt: null },
      { contentId: "b", setId: "s2", selectedAt: "2026-10-16T00:00:00.000Z", startedAt: null, completedAt: null },
      { contentId: "c", setId: "s3", selectedAt: "2026-10-14T00:00:00.000Z", startedAt: "2026-10-17T00:00:00.000Z", completedAt: null },
      { contentId: "d", setId: "s4", selectedAt: "2026-10-13T00:00:00.000Z", startedAt: "2026-10-13T01:00:00.000Z", completedAt: "2026-10-13T02:00:00.000Z" },
    ];
    assert.deepEqual(continueReadingOrder(list).map((u) => u.contentId), ["c", "b", "a"]);
  });

  it("저장값 복원: 알 수 없는 자료·형태 오류·같은 자료/같은 묶음 중복을 버린다", () => {
    const ids = ["a", "b", "c"];
    const raw = [
      { contentId: "a", setId: "s1", selectedAt: T0 },
      { contentId: "a", setId: "s2", selectedAt: T0 }, // 같은 자료 중복
      { contentId: "b", setId: "s1", selectedAt: T0 }, // 같은 묶음 중복
      { contentId: "ghost", setId: "s3", selectedAt: T0 },
      { contentId: "c", setId: "", selectedAt: T0 },
      { contentId: "c", setId: "s4" },
      "x",
      null,
      { contentId: "c", setId: "s5", selectedAt: T0, startedAt: T1, completedAt: 5 },
    ];
    const clean = sanitizeUserContents(raw, ids);
    assert.deepEqual(clean.map((u) => u.contentId), ["a", "c"]);
    assert.equal(clean[1].startedAt, T1);
    assert.equal(clean[1].completedAt, null);
    assert.deepEqual(sanitizeUserContents("nope", ids), []);
  });
});

describe("완료: 명시적 완료 호출로만 기록, 최초 완료 시각 유지", () => {
  const T2 = "2026-10-16T09:20:00.000Z";
  const started = startReading(trySelect([], set, "a", T0).list, "a", T1).list;

  it("완료하면 완료 시각이 기록되고 선택, 시작 시각은 그대로이며 상태가 '완료'가 된다", () => {
    const r = completeReading(started, "a", T2);
    assert.equal(r.changed, true);
    assert.equal(r.item?.completedAt, T2);
    assert.equal(r.item?.selectedAt, T0);
    assert.equal(r.item?.startedAt, T1);
    assert.equal(stateOf(r.item!), "completed");
  });

  it("이미 완료한 자료를 다시 완료해도 최초 완료 시각이 유지된다", () => {
    const first = completeReading(started, "a", T2).list;
    const again = completeReading(first, "a", "2026-10-17T00:00:00.000Z");
    assert.equal(again.changed, false);
    assert.equal(again.item?.completedAt, T2);
    assert.deepEqual(again.list, first);
  });

  it("선택하지 않은 자료는 완료할 수 없다", () => {
    const r = completeReading(started, "b", T2);
    assert.equal(r.item, null);
    assert.equal(r.changed, false);
    assert.equal(r.list.length, 1);
  });

  it("완료에는 시작이 전제되므로 시작 시각이 비어 있으면 완료 시각으로 채운다", () => {
    const onlySelected = trySelect([], set, "a", T0).list;
    const r = completeReading(onlySelected, "a", T2);
    assert.equal(r.item?.startedAt, T2);
    assert.equal(r.item?.completedAt, T2);
  });

  it("선택과 시작만으로는 완료가 되지 않는다(완료 시각은 completeReading 호출로만 생긴다)", () => {
    const afterSelect = trySelect([], set, "a", T0).list;
    const afterStart = startReading(afterSelect, "a", T1).list;
    assert.equal(afterSelect[0].completedAt, null);
    assert.equal(afterStart[0].completedAt, null);
    assert.equal(stateOf(afterStart[0]), "reading");
  });

  it("완료한 자료는 이어서 읽기 목록에서 빠지고, 완료는 저장값 복원에서도 유지된다", () => {
    const done = completeReading(started, "a", T2).list;
    assert.deepEqual(continueReadingOrder(done), []);
    const restored = sanitizeUserContents(JSON.parse(JSON.stringify(done)), ["a", "b"]);
    assert.equal(restored[0].completedAt, T2);
  });
});
