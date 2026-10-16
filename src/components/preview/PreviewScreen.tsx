"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getContentService } from "@/lib/content";
import type { ContentPreview } from "@/lib/content/types";
import { getRepository } from "@/lib/data";
import { canGoBackInApp } from "@/lib/navigation";
import { stateOf, type UserContent } from "@/lib/selection-rules";
import { Button } from "@/components/ui/Button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { SelectArea } from "@/components/selection/SelectArea";
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
 * 상세 미리보기 (PRD F2-04): 선택을 판단할 5가지 정보만 보여 주고, 같은 화면에서 선택할 수 있다.
 * 학습 본문은 응답에도 포함되지 않는다. 하단 탐색은 숨긴다(DESIGN).
 */
export function PreviewScreen({ contentId }: { contentId: string }) {
  const router = useRouter();
  const goBack = useGoBack();
  const [state, setState] = useState<State>({ status: "loading" });

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

  return (
    <div className="pb-10">
      <header className="flex min-h-14 items-center gap-1">
        <button
          type="button"
          onClick={goBack}
          aria-label="이전 화면으로"
          className="-ml-3 inline-flex h-12 w-12 items-center justify-center rounded-btn text-fg hover:bg-surface-subtle"
        >
          <ArrowLeftIcon />
        </button>
        <span className="text-card-title font-bold">미리보기</span>
      </header>

      <main className="pt-4">
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
          <PreviewBody
            preview={state.preview}
            onBack={goBack}
            select={
              <SelectArea
                layout="page"
                contentId={state.preview.contentId}
                title={state.preview.title}
                state={mineState}
                otherSelected={state.userContents.some((u) => u.setId === state.setId) && mineState === null}
                pending={pendingId === state.preview.contentId}
                busy={busy}
                notice={notice}
                onSelect={() =>
                  select({ setId: state.setId, contentId: state.preview.contentId, title: state.preview.title })
                }
              />
            }
          />
        )}
      </main>
    </div>
  );
}

function PreviewBody({
  preview,
  onBack,
  select,
}: {
  preview: ContentPreview;
  onBack: () => void;
  select: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-caption font-semibold text-fg-secondary">{preview.typeLabel}</p>
      <h1 className="mt-1 text-page-title font-bold">{preview.title}</h1>

      <section aria-labelledby="pv-subject" className="mt-8">
        <h2 id="pv-subject" className="text-section-title font-bold">
          이 자료가 다루는 주제
        </h2>
        <p className="mt-3 text-body">{preview.subject}</p>
        <p className="mt-2 text-caption text-fg-secondary">관련 주제: {preview.topicLabels.join(", ")}</p>
      </section>

      <section aria-labelledby="pv-learn" className="mt-8">
        <h2 id="pv-learn" className="text-section-title font-bold">
          구체적으로 학습할 내용
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-body">
          {preview.whatYouLearn.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pv-reason" className="mt-8">
        <h2 id="pv-reason" className="text-section-title font-bold">
          내 고민과 연결되는 이유
        </h2>
        <p className="mt-3 text-body">{preview.connection}</p>
      </section>

      <section aria-labelledby="pv-time" className="mt-8">
        <h2 id="pv-time" className="text-section-title font-bold">
          예상 학습 시간
        </h2>
        <p className="mt-3 text-body">약 {preview.estMinutes}분</p>
      </section>

      <section aria-labelledby="pv-action" className="mt-8">
        <h2 id="pv-action" className="text-section-title font-bold">
          학습 후 이해하거나 시도할 수 있는 행동
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-body">
          {preview.actionAfter.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </section>

      <p className="mt-8 text-caption text-fg-muted">
        선택을 돕는 미리보기라서 학습 본문은 나오지 않아요.
      </p>

      <div className="mt-4">{select}</div>

      <div className="mt-4">
        <Button variant="secondary" onClick={onBack}>
          추천 목록으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
