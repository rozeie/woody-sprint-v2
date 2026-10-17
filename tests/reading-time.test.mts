// 학습 시간 기록 규칙 검증: 한국 시간 날짜 분할, 누적, 일시정지와 복귀, 오래 멈춘 구간 제외, 탭 중복 방지,
// 저장소 복원, 학습 스택 단계 경계(59초, 60초, 299초, 300초). 실제 시간을 기다리지 않고 가짜 시계를 쓴다.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReadingStore, LEASE_KEY, READING_KEY, readReadingDays } from "../src/lib/data/reading-store.ts";
import {
  FLUSH_MS,
  LEASE_MS,
  MAX_GAP_MS,
  mergeReadingMs,
  ReadingTracker,
  sanitizeReadingMs,
  splitByKstDay,
  kstDateKey,
  type ReadingStore,
} from "../src/lib/reading-time.ts";
import { buildStackDays, formatDuration, levelOf } from "../src/lib/stack-rules.ts";

const KST = 9 * 3_600_000;
// 한국 시간 yyyy-mm-dd hh:mm:ss 를 ms로
const kst = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0) => Date.UTC(y, mo - 1, d, h, mi, s) - KST;

/** 가짜 localStorage */
function fakeStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

function makeTab(storage: ReturnType<typeof fakeStorage>, clock: { t: number }, id: string) {
  const store = createReadingStore(storage);
  const tracker = new ReadingTracker({ now: () => clock.t, store, ownerId: id });
  return tracker;
}
/** 1초씩 n번 흘리며 tick */
function run(tracker: ReadingTracker, clock: { t: number }, seconds: number) {
  for (let i = 0; i < seconds; i++) {
    clock.t += 1000;
    tracker.tick();
  }
}
const totalMs = (storage: ReturnType<typeof fakeStorage>) =>
  Object.values(JSON.parse(storage.getItem(READING_KEY) ?? "{}") as Record<string, number>).reduce((a, b) => a + b, 0);

describe("한국 시간 날짜 분할", () => {
  it("한국 시간 날짜 키", () => {
    assert.equal(kstDateKey(kst(2026, 10, 17, 0, 0, 0)), "2026-10-17");
    assert.equal(kstDateKey(kst(2026, 10, 17, 23, 59, 59)), "2026-10-17");
    assert.equal(kstDateKey(kst(2026, 10, 17, 0, 0, 0) - 1), "2026-10-16");
  });

  it("자정을 걸친 구간은 날짜별로 정확히 나뉜다", () => {
    const m = splitByKstDay(kst(2026, 10, 17, 23, 59, 58), kst(2026, 10, 18, 0, 0, 3));
    assert.equal(m.get("2026-10-17"), 2000);
    assert.equal(m.get("2026-10-18"), 3000);
    assert.equal(m.size, 2);
  });

  it("자정에 딱 끝나는 구간은 한 날짜이고, 빈 구간이나 거꾸로 간 구간은 비어 있다", () => {
    assert.equal(splitByKstDay(kst(2026, 10, 17, 23, 59, 59), kst(2026, 10, 18, 0, 0, 0)).get("2026-10-17"), 1000);
    assert.equal(splitByKstDay(5, 5).size, 0);
    assert.equal(splitByKstDay(10, 5).size, 0);
  });

  it("여러 날을 걸친 구간도 합이 같다", () => {
    const start = kst(2026, 12, 30, 20);
    const end = kst(2027, 1, 2, 4);
    const m = splitByKstDay(start, end);
    assert.equal([...m.values()].reduce((a, b) => a + b, 0), end - start);
    assert.deepEqual([...m.keys()], ["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
  });
});

describe("학습 시간 누적기", () => {
  it("활성인 동안 1초씩 쌓이고, 멈추면 마지막 구간까지 저장한다", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 10) };
    const tab = makeTab(storage, clock, "a");
    tab.start();
    run(tab, clock, 59);
    clock.t += 400; // 멈추기 직전 0.4초
    tab.stop();
    assert.equal(totalMs(storage), 59_400);
    assert.equal(readReadingDays(storage)[0].activeSeconds, 59); // 소수 초는 버림
  });

  it("중간 저장은 FLUSH_MS마다 반영된다", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 10) };
    const tab = makeTab(storage, clock, "a");
    tab.start();
    run(tab, clock, FLUSH_MS / 1000 - 1);
    assert.equal(totalMs(storage), 0);
    run(tab, clock, 1);
    assert.equal(totalMs(storage), FLUSH_MS);
  });

  it("멈춘 동안은 세지 않고, 복귀하면 그 시점부터 다시 센다(한꺼번에 더하지 않는다)", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 10) };
    const tab = makeTab(storage, clock, "a");
    tab.start();
    run(tab, clock, 10);
    tab.stop(); // 탭 숨김
    clock.t += 30 * 60_000; // 30분 뒤 복귀
    tab.start();
    run(tab, clock, 5);
    tab.stop();
    assert.equal(totalMs(storage), 15_000);
  });

  it("오래 멈췄다 돌아온 tick(절전, 동결)의 구간은 세지 않는다", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 10) };
    const tab = makeTab(storage, clock, "a");
    tab.start();
    run(tab, clock, 5);
    clock.t += MAX_GAP_MS + 1; // 갑자기 길게 건너뜀
    tab.tick();
    run(tab, clock, 5);
    tab.stop();
    assert.equal(totalMs(storage), 10_000);
  });

  it("시계가 거꾸로 가면 더하지 않는다", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 10) };
    const tab = makeTab(storage, clock, "a");
    tab.start();
    run(tab, clock, 3);
    clock.t -= 10_000;
    tab.tick();
    tab.stop();
    assert.equal(totalMs(storage), 3000);
  });

  it("자정을 넘기며 읽으면 한국 시간 날짜별로 나뉘어 저장된다", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 23, 59, 30) };
    const tab = makeTab(storage, clock, "a");
    tab.start();
    run(tab, clock, 60); // 23:59:30 ~ 00:00:30
    tab.stop();
    const saved = JSON.parse(storage.getItem(READING_KEY)!);
    assert.equal(saved["2026-10-17"], 30_000);
    assert.equal(saved["2026-10-18"], 30_000);
  });

  it("start 전과 stop 뒤의 tick은 아무것도 세지 않는다", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 10) };
    const tab = makeTab(storage, clock, "a");
    run(tab, clock, 5);
    tab.start();
    tab.stop();
    run(tab, clock, 5);
    assert.equal(totalMs(storage), 0);
  });
});

describe("복수 탭 중복 합산 방지", () => {
  it("두 탭이 동시에 활성이어도 같은 시간을 두 번 더하지 않는다", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 10) };
    const a = makeTab(storage, clock, "a");
    const b = makeTab(storage, clock, "b");
    a.start();
    b.start();
    for (let i = 0; i < 30; i++) {
      clock.t += 1000;
      a.tick();
      b.tick();
    }
    a.stop();
    b.stop();
    assert.ok(totalMs(storage) <= 30_000, `합계 ${totalMs(storage)}`);
    assert.ok(totalMs(storage) >= 28_000, `합계 ${totalMs(storage)}`);
  });

  it("먼저 쓰던 탭이 멈추면 임대가 풀려 다른 탭이 이어서 센다", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 10) };
    const a = makeTab(storage, clock, "a");
    const b = makeTab(storage, clock, "b");
    a.start();
    b.start();
    for (let i = 0; i < 10; i++) {
      clock.t += 1000;
      a.tick();
      b.tick();
    }
    a.stop();
    for (let i = 0; i < 10; i++) {
      clock.t += 1000;
      b.tick();
    }
    b.stop();
    assert.ok(totalMs(storage) >= 18_000 && totalMs(storage) <= 20_000, `합계 ${totalMs(storage)}`);
  });

  it("임대는 LEASE_MS가 지나면 만료되어 다른 탭이 가져갈 수 있다", () => {
    const storage = fakeStorage();
    const store: ReadingStore = createReadingStore(storage);
    assert.equal(store.acquireLease("a", 1000), true);
    assert.equal(store.acquireLease("b", 1000 + LEASE_MS - 1), false);
    assert.equal(store.acquireLease("b", 1000 + LEASE_MS + 1), true);
    store.releaseLease("a"); // 남의 임대는 풀지 못한다
    assert.equal(JSON.parse(storage.getItem(LEASE_KEY)!).owner, "b");
  });
});

describe("저장 값 복원", () => {
  it("형식이 틀린 날짜, 음수, 숫자가 아닌 값은 버리고 하루 상한(24시간)을 둔다", () => {
    const r = sanitizeReadingMs({ "2026-10-17": 1500, "bad": 5, "2026-10-18": -1, "2026-10-19": "x", "2026-10-20": 9e9 });
    assert.deepEqual(r, { "2026-10-17": 1500, "2026-10-20": 86_400_000 });
    assert.deepEqual(sanitizeReadingMs(null), {});
    assert.deepEqual(sanitizeReadingMs([1]), {});
  });

  it("손상된 JSON이어도 빈 기록으로 읽는다", () => {
    const storage = fakeStorage();
    storage.setItem(READING_KEY, "{broken");
    assert.deepEqual(readReadingDays(storage), []);
  });

  it("합산은 같은 날짜를 더하고 상한을 넘지 않는다", () => {
    assert.deepEqual(mergeReadingMs({ "2026-10-17": 1000 }, new Map([["2026-10-17", 2000], ["2026-10-18", 500]])), {
      "2026-10-17": 3000,
      "2026-10-18": 500,
    });
  });

  it("새로고침을 흉내 낸 새 누적기는 저장된 값에 이어서 더한다", () => {
    const storage = fakeStorage();
    const clock = { t: kst(2026, 10, 17, 10) };
    const first = makeTab(storage, clock, "a");
    first.start();
    run(first, clock, 20);
    first.stop(); // pagehide
    const second = makeTab(storage, clock, "c");
    second.start();
    run(second, clock, 15);
    second.stop();
    assert.equal(totalMs(storage), 35_000);
  });
});

describe("학습 스택 단계(한국 시간 기준)", () => {
  it("1분 미만은 빈 칸, 1분 이상 5분 미만은 학습 진행, 5분 이상은 학습한 날이다(59, 60, 299, 300초 경계)", () => {
    assert.equal(levelOf(0), "none");
    assert.equal(levelOf(59), "none");
    assert.equal(levelOf(60), "progress");
    assert.equal(levelOf(299), "progress");
    assert.equal(levelOf(300), "active");
    assert.equal(levelOf(10_000), "active");
  });

  it("학습한 날 수는 5분 이상인 날만 센다(학습 진행은 세지 않는다)", () => {
    const now = kst(2026, 10, 17, 12);
    const days = buildStackDays(now, [
      { date: "2026-10-17", activeSeconds: 299 },
      { date: "2026-10-16", activeSeconds: 300 },
      { date: "2026-10-15", activeSeconds: 59 },
      { date: "2026-10-14", activeSeconds: 60 },
    ]);
    const by = Object.fromEntries(days.map((d) => [d.date, d]));
    assert.equal(by["2026-10-17"].level, "progress");
    assert.equal(by["2026-10-17"].active, false);
    assert.equal(by["2026-10-16"].level, "active");
    assert.equal(by["2026-10-15"].level, "none");
    assert.equal(by["2026-10-14"].level, "progress");
    assert.equal(days.filter((d) => d.active).length, 1);
    assert.equal(by["2026-10-17"].isToday, true);
  });

  it("한국 시간 자정에 오늘이 바뀐다(UTC 기준이 아니다)", () => {
    const before = buildStackDays(kst(2026, 10, 17, 23, 59, 59), []);
    const after = buildStackDays(kst(2026, 10, 18, 0, 0, 0), []);
    assert.equal(before[29].date, "2026-10-17");
    assert.equal(after[29].date, "2026-10-18");
    assert.equal(after[0].date, "2026-09-19");
    assert.equal(after.length, 30);
  });

  it("누적 시간 표시", () => {
    assert.equal(formatDuration(0), "0초");
    assert.equal(formatDuration(45), "45초");
    assert.equal(formatDuration(60), "1분");
    assert.equal(formatDuration(200), "3분 20초");
  });

  it("예상 소요 시간이나 완료로는 시간이 생기지 않는다: 기록이 없으면 모든 칸이 빈 칸이다", () => {
    const days = buildStackDays(kst(2026, 10, 17, 12), []);
    assert.ok(days.every((d) => d.level === "none" && d.seconds === 0));
  });
});
