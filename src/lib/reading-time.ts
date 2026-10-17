/**
 * 실제 학습 시간(활성 읽기 시간) 기록 규칙. 순수 로직이며 의존성이 없다(테스트가 직접 import).
 * - 리더가 화면에 보이고 문서가 활성인 동안만 누적한다(켜고 끄는 일은 호출 측이 start/stop으로 알린다).
 * - 1초마다 tick으로 지난 시간을 더한다. 간격이 MAX_GAP_MS보다 길면(절전, 탭 동결, 긴 멈춤) 그 구간은 더하지 않는다.
 *   그래서 백그라운드에서 흘러간 시간을 복귀했을 때 한꺼번에 더하는 일이 없다.
 * - 구간은 한국 시간(KST, UTC+9) 날짜별로 나누어 저장한다. 자정을 걸치는 구간도 정확히 둘로 나뉜다.
 * - 같은 브라우저의 여러 리더 탭이 같은 시간을 중복해서 더하지 않도록, 한 번에 한 탭만 쓰는 짧은 임대(lease)를 둔다.
 * - 스크롤, 클릭, 입력 여부로 학습 여부를 판정하지 않는다. 예상 소요 시간이나 완료 버튼도 시간을 만들지 않는다.
 */

export const TICK_MS = 1000;
/** 한 번의 tick에서 인정하는 최대 간격. 이보다 길면 그 구간은 버린다 */
export const MAX_GAP_MS = 3000;
/** 저장소에 반영하는 주기 */
export const FLUSH_MS = 5000;
/** 한 탭이 시간을 쓰는 권한을 유지하는 시간. 매 tick마다 갱신한다 */
export const LEASE_MS = 3000;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const KST_OFFSET = 9 * HOUR;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** 한국 시간 기준 날짜(yyyy-mm-dd) */
export function kstDateKey(ms: number): string {
  return new Date(ms + KST_OFFSET).toISOString().slice(0, 10);
}

/** [startMs, endMs) 구간을 한국 시간 날짜별 밀리초로 나눈다. 자정을 넘으면 날짜마다 정확히 나뉜다. */
export function splitByKstDay(startMs: number, endMs: number): Map<string, number> {
  const out = new Map<string, number>();
  if (!(endMs > startMs)) return out;
  let cursor = startMs;
  while (cursor < endMs) {
    const nextMidnight = (Math.floor((cursor + KST_OFFSET) / DAY) + 1) * DAY - KST_OFFSET;
    const stop = Math.min(endMs, nextMidnight);
    const key = kstDateKey(cursor);
    out.set(key, (out.get(key) ?? 0) + (stop - cursor));
    cursor = stop;
  }
  return out;
}

/** 저장된 날짜별 활성 시간(ms)을 안전하게 복원한다. 날짜 형식이 아니거나 하루(24시간)를 넘는 값은 버리거나 상한으로 맞춘다. */
export function sanitizeReadingMs(raw: unknown): Record<string, number> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!DATE_KEY.test(k) || typeof v !== "number" || !Number.isFinite(v) || v <= 0) continue;
    out[k] = Math.min(Math.floor(v), DAY);
  }
  return out;
}

/** 저장소에 더하는 값(같은 날짜는 합산, 하루 상한 24시간) */
export function mergeReadingMs(
  current: Record<string, number>,
  add: ReadonlyMap<string, number>,
): Record<string, number> {
  const next = { ...current };
  for (const [k, ms] of add) {
    if (ms > 0) next[k] = Math.min(DAY, (next[k] ?? 0) + Math.floor(ms));
  }
  return next;
}

/** 시간 기록 저장소(브라우저 localStorage 구현은 demo-repository 쪽). 읽기-갱신-쓰기는 호출 안에서 한 번에 끝낸다 */
export interface ReadingStore {
  /** 날짜별 밀리초를 더한다 */
  addMs(add: ReadonlyMap<string, number>): void;
  /** 이 탭이 시간을 쓸 권한을 얻거나 유지한다. 다른 탭이 유효한 권한을 갖고 있으면 false */
  acquireLease(ownerId: string, nowMs: number): boolean;
  releaseLease(ownerId: string): void;
}

export type TrackerDeps = { now: () => number; store: ReadingStore; ownerId: string };

/**
 * 활성 시간 누적기. 활성이 되면 start(), 비활성(탭 숨김, 포커스 잃음, 화면 이탈)이면 stop(), 1초마다 tick().
 * 마지막 구간은 stop()에서 반영하고 저장한다. FLUSH_MS마다 중간 저장을 한다.
 */
export class ReadingTracker {
  private deps: TrackerDeps;
  private running = false;
  private last = 0;
  private lastFlush = 0;
  private pending = new Map<string, number>();

  constructor(deps: TrackerDeps) {
    this.deps = deps;
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    const now = this.deps.now();
    this.running = true;
    this.last = now; // 비활성이던 동안은 세지 않는다
    this.lastFlush = now;
  }

  tick(): void {
    if (!this.running) return;
    const now = this.deps.now();
    this.accrue(now);
    if (now - this.lastFlush >= FLUSH_MS) this.flush(now);
  }

  stop(): void {
    if (!this.running) return;
    const now = this.deps.now();
    this.accrue(now);
    this.flush(now);
    this.running = false;
    this.deps.store.releaseLease(this.deps.ownerId);
  }

  private accrue(now: number): void {
    const from = this.last;
    this.last = now;
    const delta = now - from;
    if (delta <= 0 || delta > MAX_GAP_MS) return; // 시계가 거꾸로 가거나, 오래 멈췄다가 돌아온 구간은 세지 않는다
    if (!this.deps.store.acquireLease(this.deps.ownerId, now)) return; // 다른 탭이 이미 세고 있다
    for (const [k, ms] of splitByKstDay(from, now)) this.pending.set(k, (this.pending.get(k) ?? 0) + ms);
  }

  private flush(now: number): void {
    this.lastFlush = now;
    if (this.pending.size === 0) return;
    this.deps.store.addMs(this.pending);
    this.pending = new Map();
  }
}
