import { LEASE_MS, mergeReadingMs, sanitizeReadingMs, type ReadingStore } from "../reading-time.ts";
import type { ReadingDay } from "../stack-rules.ts";

/**
 * 학습 시간 기록의 브라우저 저장 구현(localStorage). 날짜별 활성 시간(ms)과 탭 간 중복 방지용 임대를 둔다.
 * 서버 저장이 아니며 사이트 데이터를 지우면 사라진다. 읽기-갱신-쓰기는 await 없이 한 번에 처리한다.
 * 저장소를 인자로 받아 테스트에서 가짜 저장소로 바꿀 수 있다.
 */
export const READING_KEY = "stack-demo:v1:reading-time";
export const LEASE_KEY = "stack-demo:v1:reading-lease";

type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function parse(text: string | null): unknown {
  try {
    return text === null ? null : JSON.parse(text);
  } catch {
    return null; // 손상된 값은 없는 것으로 취급
  }
}

export function readReadingMs(storage: KV): Record<string, number> {
  try {
    return sanitizeReadingMs(parse(storage.getItem(READING_KEY)));
  } catch {
    return {};
  }
}

/** 날짜별 누적 시간(초, 소수 버림). 0초인 날은 포함하지 않는다. */
export function readReadingDays(storage: KV): ReadingDay[] {
  return Object.entries(readReadingMs(storage))
    .map(([date, ms]) => ({ date, activeSeconds: Math.floor(ms / 1000) }))
    .filter((d) => d.activeSeconds > 0);
}

export function createReadingStore(storage: KV): ReadingStore {
  return {
    addMs(add) {
      try {
        storage.setItem(READING_KEY, JSON.stringify(mergeReadingMs(readReadingMs(storage), add)));
      } catch {
        // 저장 실패는 데모에서 무시한다
      }
    },
    acquireLease(ownerId, nowMs) {
      try {
        const lease = parse(storage.getItem(LEASE_KEY)) as { owner?: unknown; until?: unknown } | null;
        const held =
          lease && typeof lease.owner === "string" && typeof lease.until === "number" && lease.until > nowMs;
        if (held && lease.owner !== ownerId) return false;
        storage.setItem(LEASE_KEY, JSON.stringify({ owner: ownerId, until: nowMs + LEASE_MS }));
        return true;
      } catch {
        return true; // 저장소를 쓸 수 없으면 기록도 되지 않으므로 중복 걱정이 없다
      }
    },
    releaseLease(ownerId) {
      try {
        const lease = parse(storage.getItem(LEASE_KEY)) as { owner?: unknown } | null;
        if (lease && lease.owner === ownerId) storage.removeItem(LEASE_KEY);
      } catch {
        // 무시
      }
    },
  };
}
