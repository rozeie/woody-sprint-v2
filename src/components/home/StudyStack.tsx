"use client";

import { useRef, useState } from "react";
import { ACTIVE_READING_SECONDS, type StackDay } from "@/lib/stack-rules";

const minutes = ACTIVE_READING_SECONDS / 60;
const COLUMNS = 10;

const statusOf = (d: StackDay) => (d.active ? "학습 기록 있음" : "학습 기록 없음");
const nameOf = (d: StackDay) => `${d.label}${d.isToday ? "(오늘)" : ""}`;

/**
 * 학습 스택 (PRD-v0.4 F4-02, DESIGN §9 결정 기록은 docs/ui-demo-decisions.md).
 * 오늘을 포함한 최근 30일을 10열 3행의 연속 배열로 보여 준다(요일 주차 정렬이 아니다). 활성/비활성 이진 표현이다.
 * 각 칸은 날짜와 기록 상태를 알려 주는 버튼이다. 누르거나 방향키로 옮기면 아래에 그 날의 상태가 보이고(터치와 키보드용),
 * 화면 읽기 도구에는 칸의 이름("10월 3일, 학습 기록 있음")으로 전달한다. 날짜별 긴 목록은 두지 않는다.
 * 기록이 없는 날은 "학습 기록 없음"이며 미충족이나 실패로 표현하지 않는다.
 */
export function StudyStack({ days }: { days: StackDay[] }) {
  const todayIndex = Math.max(0, days.findIndex((d) => d.isToday));
  const [selected, setSelected] = useState(todayIndex);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const activeCount = days.filter((d) => d.active).length;
  const first = days[0];
  const last = days[days.length - 1];

  function move(to: number) {
    const next = Math.min(days.length - 1, Math.max(0, to));
    setSelected(next);
    cells.current[next]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLUMNS, ArrowDown: COLUMNS };
    if (e.key in step) {
      e.preventDefault();
      move(i + step[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      move(0);
    } else if (e.key === "End") {
      e.preventDefault();
      move(days.length - 1);
    }
  }

  const current = days[selected];

  return (
    <section aria-labelledby="stack-title">
      <h2 id="stack-title" className="text-section-title font-bold">
        학습 스택
      </h2>
      <div className="mt-3 rounded-card bg-surface px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-caption text-fg-muted">
            {first.label} ~ {last.label}
          </p>
          <p className="text-caption font-semibold text-fg">
            최근 {days.length}일, 학습한 날 {activeCount}일
          </p>
        </div>

        <div
          role="group"
          aria-label={`최근 ${days.length}일 학습 기록, 학습한 날 ${activeCount}일. 방향키로 날짜를 옮길 수 있어요.`}
          className="mt-2 grid max-w-[18rem] gap-1"
          style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
        >
          {days.map((d, i) => (
            <button
              key={d.date}
              ref={(el) => {
                cells.current[i] = el;
              }}
              type="button"
              aria-label={`${nameOf(d)}, ${statusOf(d)}`}
              aria-pressed={i === selected}
              tabIndex={i === selected ? 0 : -1}
              data-stack-cell={d.active ? "active" : "inactive"}
              data-today={d.isToday ? "true" : undefined}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`relative flex aspect-square items-center justify-center rounded-sm border ${
                d.active ? "border-primary bg-primary" : "border-line bg-surface-subtle"
              } ${i === selected ? "outline-2 outline-offset-1 outline-fg" : ""}`}
            >
              {d.isToday && <span aria-hidden="true" className="size-1.5 rounded-full bg-fg" />}
            </button>
          ))}
        </div>

        {/* 칸의 이름이 같은 내용을 전달하므로 화면 읽기 도구에서는 숨긴다(눈으로 보는 확인용) */}
        <p aria-hidden="true" data-stack-detail className="mt-2 text-caption font-semibold text-fg">
          {nameOf(current)}: {statusOf(current)}
        </p>

        <p className="mt-1 text-caption text-fg-secondary">하루 총 {minutes}분 이상 읽으면 기록돼요.</p>
      </div>
    </section>
  );
}
