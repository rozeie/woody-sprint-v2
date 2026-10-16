/**
 * 학습 스택(잔디) 규칙 (PRD F4-02 확정, DESIGN §9). 순수 함수 — 의존성 없음.
 * - 오늘을 포함한 최근 30일 연속 배열, 하루 최대 1칸.
 * - 하루 합산 활성 읽기 시간이 5분(300초) 이상일 때만 활성. 접속·분석·확정·선택만으로는 절대 활성화되지 않는다.
 * 이 모듈이 받는 입력은 "읽기 기록(날짜별 활성 초)"뿐이며, 현재 데모에는 읽기 측정이 없어 기록이 비어 있다.
 * 날짜 경계는 PRD D-14(KST 0시 제안) 미확정이라, 데모는 브라우저 로컬 날짜를 쓴다.
 */

export const STACK_DAYS = 30;
export const ACTIVE_READING_SECONDS = 300;

export type ReadingDay = { date: string; activeSeconds: number };

export type StackDay = {
  /** yyyy-mm-dd */
  date: string;
  label: string;
  active: boolean;
  isToday: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dateLabel(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 오래된 날 → 오늘 순서로 days개의 칸을 만든다. 기록이 없으면 모두 비활성이다. */
export function buildStackDays(
  today: Date,
  readingDays: readonly ReadingDay[],
  days: number = STACK_DAYS,
): StackDay[] {
  const seconds = new Map<string, number>();
  for (const r of readingDays) {
    if (r.activeSeconds > 0) seconds.set(r.date, (seconds.get(r.date) ?? 0) + r.activeSeconds);
  }
  const result: StackDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    // 정오 기준으로 날짜를 옮겨 일광절약시간 경계에서도 하루씩만 이동하게 한다
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i, 12);
    const key = toDateKey(d);
    result.push({
      date: key,
      label: dateLabel(d),
      active: (seconds.get(key) ?? 0) >= ACTIVE_READING_SECONDS,
      isToday: i === 0,
    });
  }
  return result;
}
