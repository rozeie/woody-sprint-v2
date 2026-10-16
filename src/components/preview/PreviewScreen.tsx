"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getContentService } from "@/lib/content";
import type { ContentPreview } from "@/lib/content/types";
import { getRepository } from "@/lib/data";
import { canGoBackInApp } from "@/lib/navigation";
import { stateOf, type UserContent } from "@/lib/selection-rules";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, ClockIcon } from "@/components/ui/icons";
import { TYPE_ICON, TYPE_PHRASE } from "@/components/home/RecommendationCard";
import { SelectArea } from "@/components/selection/SelectArea";
import { StartConfirmSheet } from "@/components/selection/StartConfirmSheet";
import { useSelectAction } from "@/components/selection/useSelectAction";

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; preview: ContentPreview; setId: string; userContents: UserContent[] };

/** 직전 화면(홈)으로 돌아간다. 새 탭·외부 링크로 직접 열었다면 앱 밖으로 나가지 않고 홈으로 이동한다. */
function useGoBack() {
  const router = useRouter();
  return () => {
    if (canGoBackInApp()) router.back();
    else router.push("/home");
  };
}

/**
 * 상세 미리보기 (PRD F2-04): 선택을 판단할 정보만 보여 주고, 같은 화면에서 학습을 시작(선택)한다.
 * 학습 본문은 응답에도 포함되지 않는다. 하단 탐색은 숨긴다(DESIGN).
 * 미선택 자료의 "학습 시작하기"는 확인 시트를 열 뿐 저장하지 않으며, 시트의 "학습 시작하기"를 눌러야 선택이 저장되고 리더로 이동한다.
 */
export function PreviewScreen({ contentId }: { contentId: string }) {
  const router = useRouter();
  const goBack = useGoBack();
  const [state, setState] = useState<State>({ status: "loading" });
  const [sheetOpen, setSheetOpen] = useState(false);
  // 저장에 성공했다면 시트가 완전히 내려간 뒤 리더로 이동한다. 이동 중에는 다시 누를 수 없다.
  const [navigating, setNavigating] = useState(false);
  const goReaderAfterClose = useRef(false);

  const refreshSelections = useCallback(async () => {
    const userContents = await getRepository().getUserContents();
    setState((prev) => (prev.status === "ready" ? { ...prev, userContents } : prev));
  }, []);
  const { pendingId, busy, notice, select } = useSelectAction(async () => {
    await refreshSelections();
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = getRepository();
      const direction = await repo.getConfirmedDirection();
      if (!alive) return;
      setNavigating(false); // 리더에서 돌아와 화면이 다시 보일 때
      if (!direction) {
        router.replace("/onboarding"); // 확정 전에는 접근할 수 없다
        return;
      }
      const set = await repo.getRecommendationSet();
      const preview = set ? await getContentService().getPreview(set, contentId) : null;
      const userContents = await repo.getUserContents();
      if (!alive) return;
      setState(
        preview && set
          ? { status: "ready", preview, setId: set.id, userContents }
          : { status: "missing" },
      );
    })();
    return () => {
      alive = false;
    };
  }, [contentId, router]);

  const mineUser =
    state.status === "ready" ? state.userContents.find((u) => u.contentId === state.preview.contentId) : undefined;
  const mineState = mineUser ? stateOf(mineUser) : null;

  async function confirmStart() {
    if (state.status !== "ready") return;
    const { setId, preview } = state;
    // 적용 시점에 저장소가 회차 만료, 다른 자료 선택, 중복을 다시 검증한다. 성공일 때만 이동한다.
    const ok = await select({ setId, contentId: preview.contentId, title: preview.title });
    goReaderAfterClose.current = ok;
    if (ok) setNavigating(true);
    setSheetOpen(false);
  }

  return (
    <div className="pb-10">
      {/* 제목은 뒤로가기 버튼을 뺀 남은 공간이 아니라 화면 기준 가운데에 둔다 */}
      <header className="relative flex h-14 items-center">
        <button
          type="button"
          onClick={goBack}
          aria-label="이전 화면으로"
          className="-ml-3 inline-flex size-12 items-center justify-center rounded-btn text-fg transition-colors duration-150 hover:bg-surface-subtle"
        >
          <ChevronLeftIcon />
        </button>
        <span className="pointer-events-none absolute inset-x-0 text-center text-card-title font-bold">미리보기</span>
      </header>

      <main className="pt-2">
        {state.status === "loading" && (
          <p role="status" className="py-10 text-body text-fg-secondary">
            미리보기를 불러오는 중이에요…
          </p>
        )}

        {state.status === "missing" && (
          <div>
            <h1 className="text-page-title font-bold">찾을 수 없는 자료예요</h1>
            <p className="mt-3 text-body text-fg-secondary">
              지금 추천된 자료가 아니거나 없는 자료예요. 홈에서 추천 자료를 다시 확인해 주세요.
            </p>
            <div className="mt-6">
              <Button variant="secondary" onClick={() => router.push("/home")}>
                홈으로 가기
              </Button>
            </div>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <PreviewBody
              preview={state.preview}
              select={
                <SelectArea
                  contentId={state.preview.contentId}
                  title={state.preview.title}
                  state={mineState}
                  otherSelected={state.userContents.some((u) => u.setId === state.setId) && mineState === null}
                  busy={busy || navigating}
                  notice={notice}
                  onOpenConfirm={() => setSheetOpen(true)}
                />
              }
            />
            <StartConfirmSheet
              open={sheetOpen}
              pending={pendingId !== null}
              onConfirm={confirmStart}
              onCancel={() => {
                goReaderAfterClose.current = false;
                setSheetOpen(false);
              }}
              onClosed={() => {
                if (goReaderAfterClose.current) {
                  goReaderAfterClose.current = false;
                  router.push(`/read/${state.preview.contentId}`);
                }
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}

function PreviewBody({ preview, select }: { preview: ContentPreview; select: React.ReactNode }) {
  const Icon = TYPE_ICON[preview.type];
  return (
    <div>
      {/* 상단 요약: 홈 카드와 같은 원형 아이콘, 그린 학습 방식 문구, 제목, 소개, 예상 소요 시간 */}
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full">
          <span className="absolute inset-0 rounded-full bg-primary/10" />
          <Icon className="relative size-7 text-primary" />
        </span>
        <p className="text-caption font-semibold text-primary">
          <span className="sr-only">학습 방식 </span>
          {TYPE_PHRASE[preview.type]}
        </p>
      </div>
      <h1 className="mt-3 text-page-title font-bold">{preview.title}</h1>
      <p className="mt-2 text-body text-fg-secondary">{preview.summary}</p>
      <p className="mt-3 flex items-center gap-1.5 text-caption text-fg-secondary">
        <ClockIcon className="size-4 shrink-0" />
        <span>예상 소요 시간 약 {preview.estMinutes}분</span>
      </p>

      {/* 정보 영역: 하나의 흰 영역(외곽 스트로크 없음)에 영역별 제목과 본문으로 정리한다 */}
      <div className="mt-6 rounded-card bg-surface p-5">
        <section aria-labelledby="pv-reason">
          <h2 id="pv-reason" className="text-card-title font-bold">
            내 고민과 연결되는 이유
          </h2>
          {preview.linkedTopicLabels.length > 0 && (
            <ul className="mt-2 flex list-none flex-wrap gap-1.5">
              <li className="sr-only">연결되는 고민</li>
              {preview.linkedTopicLabels.map((t) => (
                <li key={t} className="rounded-chip bg-primary/10 px-2.5 py-0.5 text-caption font-semibold text-primary">
                  {t}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-body text-fg-secondary">{preview.reason}</p>
        </section>

        <section aria-labelledby="pv-learn" className="mt-6">
          <h2 id="pv-learn" className="text-card-title font-bold">
            이 자료에서 배울 내용
          </h2>
          <p className="mt-2 text-body">{preview.subject}</p>
          <ul className="mt-3 flex list-none flex-wrap gap-1.5">
            <li className="sr-only">관련 주제</li>
            {preview.topicLabels.map((t) => (
              <li key={t} className="rounded-chip bg-surface-subtle px-2.5 py-0.5 text-caption font-semibold text-fg">
                {t}
              </li>
            ))}
          </ul>
          <ul className="mt-3 list-decimal space-y-1.5 pl-6 text-body">
            {preview.whatYouLearn.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p className="mt-3 text-caption text-fg-secondary">
            <span className="font-semibold text-fg">핵심 포인트 </span>
            {preview.keyLearnings.join(", ")}
          </p>
        </section>

        <section aria-labelledby="pv-action" className="mt-6">
          <h2 id="pv-action" className="text-card-title font-bold">
            학습 후 해볼 수 있는 것
          </h2>
          <ul className="mt-2 list-decimal space-y-1.5 pl-6 text-body">
            {preview.actionAfter.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6">{select}</div>
    </div>
  );
}
