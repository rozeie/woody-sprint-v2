/**
 * 추천 회차(주기) 계산 (PRD F2-06): 한국 시간(KST, UTC+9, 서머타임 없음) 기준 매일 오후 6시에 교체된다.
 * 회차 시작은 현재 시각 이전의 가장 가까운 오후 6시, 끝은 그 24시간 뒤다. 회차 키는 시작 시각의 KST 날짜(yyyy-mm-dd)다.
 * 순수 함수이며 의존성이 없다(테스트가 직접 import). 데모는 서버가 없어 브라우저 시계를 쓴다(PRD는 서버 시각 기준을 정하고 있다).
 */

export const CYCLE_HOUR_KST = 18;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const KST_OFFSET = 9 * HOUR;

/** 현재 회차가 시작된 시각(ms). */
export function cycleStartMs(nowMs: number): number {
  const shifted = nowMs + KST_OFFSET; // KST 벽시계를 UTC 필드로 읽기 위해 옮긴 시각
  const midnight = Math.floor(shifted / DAY) * DAY;
  const sixPm = midnight + CYCLE_HOUR_KST * HOUR;
  return (shifted >= sixPm ? sixPm : sixPm - DAY) - KST_OFFSET;
}

/** 현재 회차가 끝나는(다음 교체) 시각(ms). */
export function cycleEndMs(nowMs: number): number {
  return cycleStartMs(nowMs) + DAY;
}

/** 회차 키: 회차 시작 시각의 KST 날짜. 같은 회차의 모든 시각은 같은 키를 갖는다. */
export function cycleKeyOf(ms: number): string {
  return new Date(cycleStartMs(ms) + KST_OFFSET).toISOString().slice(0, 10);
}

/** 저장된 ISO 시각의 회차 키. 읽을 수 없는 값이면 빈 문자열(가장 오래된 회차로 취급한다). */
export function cycleKeyOfIso(iso: string): string {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? "" : cycleKeyOf(ms);
}

/** 다음 교체까지 남은 시간(ms). */
export function remainingMs(nowMs: number): number {
  return cycleEndMs(nowMs) - nowMs;
}

/** "교체까지 N시간 N분", 1시간 미만이면 "교체까지 N분". 분은 올림이라 교체 직전에도 0분으로 보이지 않는다. */
export function formatRemaining(ms: number): string {
  const total = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h < 1 ? `교체까지 ${m}분` : `교체까지 ${h}시간 ${m}분`;
}
