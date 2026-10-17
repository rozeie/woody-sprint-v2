"use client";

import type { ContentSummary } from "@/lib/content";
import { stateOf, type UserContent } from "@/lib/selection-rules";
import { ButtonLink } from "@/components/ui/Button";
import { useReaderEnv } from "@/components/reader/reader-env";

export type ContinueItem = { user: UserContent; summary: ContentSummary };

/**
 * 이어서 읽기 (PRD F4-01): 선택했지만 아직 완료하지 않은 자료를 최근 순으로. 선택한 자료가 없으면 이 영역은 그리지 않는다.
 * 버튼은 리더 본문으로 바로 연결된다. 선택만 했다면 "학습 시작", 리더에 들어간 적이 있으면 "이어서 읽기".
 * 읽던 위치 복원은 P1이라 약속하지 않는다. 완료한 자료는 서재에서 다시 읽는다.
 */
export function ContinueReading({ items }: { items: ContinueItem[] }) {
  const { paths } = useReaderEnv();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="continue-title" className="mt-6">
      <h2 id="continue-title" className="text-section-title font-bold">
        이어서 읽기
      </h2>
      <ul className="mt-3 list-none space-y-3">
        {items.map(({ user, summary }) => {
          const reading = stateOf(user) === "reading";
          return (
            <li
              key={user.contentId}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-card bg-surface p-4"
            >
              <div className="min-w-0 flex-1 basis-40">
                <p className="text-card-title font-semibold">{summary.title}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-caption text-fg-secondary">
                  <span>{summary.typeLabel}</span>
                  <span>약 {summary.estMinutes}분</span>
                  <span className="font-semibold text-fg">{reading ? "읽는 중" : "선택함"}</span>
                </p>
              </div>
              <ButtonLink
                href={paths.read(user.contentId)}
                variant="secondary"
                className="!w-auto"
                aria-label={`‘${summary.title}’ ${reading ? "이어서 읽기" : "학습 시작"}`}
              >
                {reading ? "이어서 읽기" : "학습 시작"}
              </ButtonLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
