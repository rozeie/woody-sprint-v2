"use client";

import { useEffect, useState } from "react";
import { getContentService, type ContentSummary } from "@/lib/content";
import { getRepository } from "@/lib/data";
import { stateOf, type ContentState, type UserContent } from "@/lib/selection-rules";
import { ButtonLink } from "@/components/ui/Button";
import { TabScreen } from "@/components/TabScreen";

type Row = { user: UserContent; summary: ContentSummary };

const STATE_LABEL: Record<ContentState, string> = { selected: "선택함", reading: "읽는 중", completed: "완료" };
// 버튼은 상태와 관계없이 학습 리더 본문으로 바로 연결된다
const ACTION_LABEL: Record<ContentState, string> = {
  selected: "학습 시작",
  reading: "이어서 읽기",
  completed: "다시 읽기",
};

/**
 * 서재 (PRD F3-04, 최소 구현): 선택한 자료와 상태(선택함, 읽는 중, 완료)를 보여 주고 리더 본문으로 바로 이어 준다.
 * 삭제 기능은 없다(PRD 확정). 회고 확인은 이번 범위가 아니다.
 * 선택한 자료는 추천이 바뀌어도 이 목록에서 계속 읽을 수 있다.
 */
export function LibraryScreen() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getRepository().getUserContents();
      const summaries = await getContentService().getSummaries(user.map((u) => u.contentId));
      const list = user
        .map((u) => ({ user: u, summary: summaries.find((s) => s.contentId === u.contentId) }))
        .filter((r): r is Row => r.summary !== undefined)
        .sort((a, b) => b.user.selectedAt.localeCompare(a.user.selectedAt));
      if (alive) setRows(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <TabScreen>
      <h1 className="text-page-title font-bold">서재</h1>
      <p className="mt-2 text-caption text-fg-secondary">
        선택한 자료는 추천이 바뀌어도 여기서 계속 읽을 수 있어요.
      </p>

      {rows === null ? (
        <p role="status" className="mt-6 text-body text-fg-secondary">
          서재를 불러오는 중이에요…
        </p>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-card border border-line bg-surface p-4">
          <p className="text-card-title font-semibold">아직 선택한 자료가 없어요</p>
          <p className="mt-1 text-body text-fg-secondary">홈의 오늘의 추천에서 자료를 골라 보세요.</p>
          <div className="mt-4">
            <ButtonLink href="/home" variant="secondary">
              홈에서 고르기
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="mt-4 list-none space-y-3">
          {rows.map(({ user, summary }) => {
            const state = stateOf(user);
            return (
              <li
                key={user.contentId}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-card border border-line bg-surface p-4"
              >
                <div className="min-w-0 flex-1 basis-40">
                  <p className="text-card-title font-semibold">{summary.title}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-caption text-fg-secondary">
                    <span>{summary.typeLabel}</span>
                    <span>약 {summary.estMinutes}분</span>
                    <span className="font-semibold text-fg">{STATE_LABEL[state]}</span>
                  </p>
                </div>
                <ButtonLink
                  href={`/read/${user.contentId}`}
                  variant="secondary"
                  className="!w-auto"
                  aria-label={`‘${summary.title}’ ${ACTION_LABEL[state]}`}
                >
                  {ACTION_LABEL[state]}
                </ButtonLink>
              </li>
            );
          })}
        </ul>
      )}
    </TabScreen>
  );
}
