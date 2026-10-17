/**
 * 학습 스택(잔디) 규칙 (PRD F4-02, DESIGN §9). 순수 함수이며 의존성이 없다(테스트가 직접 import).
 * - 오늘을 포함한 최근 30일 연속 배열, 하루 최대 1칸. 날짜는 한국 시간(KST) 기준이다.
 * - 하루 누적 활성 읽기 시간으로 세 단계를 나눈다: 1분 미만은 빈 칸(none), 1분 이상 5분 미만은 ‘학습 진행’(progress, 연한 그린),
 *   5분 이상은 ‘학습한 날’(active, 진한 그린). ‘학습한 날 N일’은 5분 이상인 날만 센다.
 * - 입력은 읽기 기록(날짜별 활성 초)뿐이다. 접속, 분석, 확정, 선택, 읽기 완료, 예상 소요 시간으로는 칸이 채워지지 않는다.
 */
import { kstDateKey } from "./reading-time.ts";

export const STACK_DAYS = 30;
/** 이 시간 이상이면 ‘학습 진행’(연한 칸) */
export const PROGRESS_READING_SECONDS = 60;
/** 이 시간 이상이면 ‘학습한 날’(진한 칸) */
export const ACTIVE_READING_SECONDS = 300;

const DAY_MS = 86_400_000;

export type ReadingDay = { date: string; activeSeconds: number };

export type StackLevel = "none" | "progress" | "active";

export type StackDay = {
  /** yyyy-mm-dd (한국 시간) */
  date: string;
  label: string;
  /** 5분 이상인 ‘학습한 날’인지 */
  active: boolean;
  level: StackLevel;
  /** 그날 누적 활성 시간(초, 소수 버림) */
  seconds: number;
  isToday: boolean;
};

export function levelOf(seconds: number): StackLevel {
  if (seconds >= ACTIVE_READING_SECONDS) return "active";
  if (seconds >= PROGRESS_READING_SECONDS) return "progress";
  return "none";
}

/** "yyyy-mm-dd"를 "M월 D일"로 */
export function labelOfKey(key: string): string {
  return `${Number(key.slice(5, 7))}월 ${Number(key.slice(8, 10))}일`;
}

/** 누적 시간을 "N분 N초", "N초", "N분"으로 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}초`;
  return r === 0 ? `${m}분` : `${m}분 ${r}초`;
}

/**
 * 오래된 날 → 오늘 순서로 days개의 칸을 만든다. now는 현재 시각(ms 또는 Date)이며 날짜는 한국 시간으로 계산한다.
 * 기록이 없으면 모두 빈 칸이다.
 */
export function buildStackDays(
  now: Date | number,
  readingDays: readonly ReadingDay[],
  days: number = STACK_DAYS,
): StackDay[] {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const seconds = new Map<string, number>();
  for (const r of readingDays) {
    if (r.activeSeconds > 0) seconds.set(r.date, (seconds.get(r.date) ?? 0) + r.activeSeconds);
  }
  const result: StackDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = kstDateKey(nowMs - i * DAY_MS); // 한국은 서머타임이 없어 24시간씩 빼면 정확히 하루씩 이동한다
    const sec = Math.floor(seconds.get(key) ?? 0);
    const level = levelOf(sec);
    result.push({
      date: key,
      label: labelOfKey(key),
      active: level === "active",
      level,
      seconds: sec,
      isToday: i === 0,
    });
  }
  return result;
}
