import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cycleEndMs,
  cycleKeyOf,
  cycleKeyOfIso,
  cycleStartMs,
  formatRemaining,
  remainingMs,
} from "../src/lib/recommendation-cycle.ts";

// KST 시각을 UTC ms로 만든다 (KST = UTC+9)
const kst = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0) => Date.UTC(y, mo - 1, d, h - 9, mi, s);

describe("추천 회차 (KST 오후 6시 교체)", () => {
  it("오후 5:59:59와 6:00:00 경계에서 회차 키가 바뀐다", () => {
    assert.equal(cycleKeyOf(kst(2026, 10, 16, 17, 59, 59)), "2026-10-15");
    assert.equal(cycleKeyOf(kst(2026, 10, 16, 18, 0, 0)), "2026-10-16");
    assert.equal(cycleKeyOf(kst(2026, 10, 17, 17, 59, 59)), "2026-10-16");
  });

  it("같은 회차의 모든 시각은 같은 키를 갖는다 (자정을 넘어도 다음 오후 6시 전까지)", () => {
    const key = cycleKeyOf(kst(2026, 10, 16, 18, 0, 0));
    for (const t of [kst(2026, 10, 16, 23, 59, 59), kst(2026, 10, 17, 0, 0, 0), kst(2026, 10, 17, 9, 30), kst(2026, 10, 17, 17, 59, 59)]) {
      assert.equal(cycleKeyOf(t), key);
    }
  });

  it("월말과 연말 경계에서도 키가 이어진다", () => {
    assert.equal(cycleKeyOf(kst(2026, 12, 31, 18, 0, 0)), "2026-12-31");
    assert.equal(cycleKeyOf(kst(2027, 1, 1, 10, 0, 0)), "2026-12-31");
    assert.equal(cycleKeyOf(kst(2027, 1, 1, 18, 0, 0)), "2027-01-01");
  });

  it("회차는 24시간이고 끝은 다음 오후 6시다", () => {
    const now = kst(2026, 10, 16, 12, 0, 0);
    assert.equal(cycleEndMs(now), kst(2026, 10, 16, 18, 0, 0));
    assert.equal(cycleEndMs(now) - cycleStartMs(now), 24 * 3_600_000);
    assert.equal(remainingMs(now), 6 * 3_600_000);
    assert.equal(remainingMs(kst(2026, 10, 16, 18, 0, 0)), 24 * 3_600_000);
  });

  it("남은 시간 문구: 1시간 이상은 시간과 분, 1시간 미만은 분만, 분은 올림", () => {
    assert.equal(formatRemaining(6 * 3_600_000), "교체까지 6시간 0분");
    assert.equal(formatRemaining(3 * 3_600_000 + 12 * 60_000), "교체까지 3시간 12분");
    assert.equal(formatRemaining(60 * 60_000), "교체까지 1시간 0분");
    assert.equal(formatRemaining(59 * 60_000 + 1), "교체까지 1시간 0분"); // 59분 0.001초는 올림해 60분이 아니라 1시간으로 센다
    assert.equal(formatRemaining(45 * 60_000), "교체까지 45분");
    assert.equal(formatRemaining(1_000), "교체까지 1분");
  });

  it("저장된 ISO 시각에서 회차 키를 구한다 (읽을 수 없으면 가장 오래된 회차)", () => {
    assert.equal(cycleKeyOfIso(new Date(kst(2026, 10, 16, 17, 59, 59)).toISOString()), "2026-10-15");
    assert.equal(cycleKeyOfIso(new Date(kst(2026, 10, 16, 18, 0, 0)).toISOString()), "2026-10-16");
    assert.equal(cycleKeyOfIso("not-a-date"), "");
    assert.ok(cycleKeyOfIso("not-a-date") < cycleKeyOf(Date.now()));
  });
});
