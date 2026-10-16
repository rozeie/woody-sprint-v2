"use client";

import { useState } from "react";
import { ACTIVE_READING_SECONDS, type StackDay } from "@/lib/stack-rules";

const minutes = ACTIVE_READING_SECONDS / 60;

/**
 * 학습 스택 — 홈 상단의 간결한 영역 (PRD F4-02, DESIGN §9).
 * 28칸(7×4 연속 배열, 활성/비활성 이진)·오늘 구분(외곽선)·날짜 범위·5분 기준·날짜별 목록을 모두 유지하되,
 * 격자를 작게 하고 설명을 한 문장으로 줄여 추천을 밀어내지 않게 한다.
 * 칸은 장식이며 개별 조작 대상이 아니다. 같은 정보를 요약 문장(aria-label)과 날짜별 목록으로 함께 제공한다.
 */
export function StudyStack({ days }: { days: StackDay[] }) {
  const [open, setOpen] = useState(false);
  const activeCount = days.filter((d) => d.active).length;
  const first = days[0];
  const last = days[days.length - 1];
  const summary = `최근 ${days.length}일(${first.label} ~ ${last.label}) 중 참여 기록이 있는 날은 ${activeCount}일이에요.`;

  return (
    <section aria-labelledby="stack-title" className="rounded-card border border-line bg-surface p-3">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-3">
        <h2 id="stack-title" className="text-card-title font-semibold">
          학습 스택
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="stack-dates"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 inline-flex min-h-12 items-center rounded-btn px-2 text-caption font-semibold text-primary-ink"
        >
          {open ? "날짜별 보기 닫기" : "날짜별로 보기"}
        </button>
      </div>

      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div
          role="img"
          aria-label={summary}
          className="grid w-[154px] shrink-0 grid-cols-7 gap-1"
        >
          {days.map((d) => (
            <span
              key={d.date}
              aria-hidden="true"
              data-stack-cell={d.active ? "active" : "inactive"}
              className={`aspect-square rounded-sm border ${
                d.active ? "border-primary-ink bg-primary" : "border-line bg-surface-subtle"
              } ${d.isToday ? "outline-2 outline-offset-1 outline-fg" : ""}`}
            />
          ))}
        </div>
        <div className="min-w-[min(8.5rem,100%)] flex-1 text-caption text-fg-secondary">
          <p className="font-semibold text-fg">
            {first.label} ~ {last.label}
            <span className="font-normal"> (오늘)</span>
          </p>
          <p className="mt-1">
            최근 {days.length}일 중 참여 {activeCount}일{activeCount === 0 && ". 읽기 기록이 아직 없어요."}
          </p>
        </div>
      </div>

      <p className="mt-2 text-caption text-fg-secondary">
        하루 합산 {minutes}분 이상 읽으면 채워져요. 접속하거나 선택하는 것만으로는 채워지지 않아요.
      </p>

      {open && (
        <div id="stack-dates" className="mt-2 border-t border-line pt-2">
          <ul className="space-y-1 text-caption text-fg-secondary">
            {days.map((d) => (
              <li key={d.date}>
                {d.label}
                {d.isToday ? " (오늘)" : ""}: {d.active ? "참여 기록 있음" : `${minutes}분 기준 미충족`}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-caption text-fg-muted">
            학습 참여를 기록할 뿐, 이해도나 성과를 나타내지는 않아요.
          </p>
        </div>
      )}
    </section>
  );
}
