"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getContentService } from "@/lib/content";
import type { ReaderContent } from "@/lib/content/types";
import { canGoBackInApp } from "@/lib/navigation";
import type { UserContent } from "@/lib/selection-rules";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useReaderEnv } from "./reader-env";
import { ExampleReaderBody } from "./ExampleReaderBody";
import { SourceHeader, SourceReaderBody } from "./SourceReaderBody";
import { useReadingTime } from "./useReadingTime";

type State =
  | { status: "loading" }
  | { status: "blocked" }
  | {
      status: "ready";
      content: ReaderContent;
      user: UserContent;
      confirmedTopics: { key: string; label: string }[];
    };

function dateText(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 학습 리더 (PRD F3-01, F3-02).
 * - 선택한 자료만 열 수 있다. 선택하지 않은 자료, 없는 자료, 확정 전에는 열리지 않는다.
 * - '바로 학습 시작', 이어서 읽기, 서재의 버튼은 중간 화면 없이 이 본문으로 곧바로 연결된다.
 * - 처음 열면 학습 시작 시각을 한 번만 기록한다. 완료는 하단의 "학습 완료" 버튼으로만 기록하며,
 *   진입, 스크롤, 시간 경과, 학습 시간 기준 도달로는 절대 완료하지 않는다. 다시 열어도 최초 완료 시각은 그대로다.
 * - 리더가 보이고 문서가 활성인 동안의 학습 시간을 따로 쌓는다(useReadingTime). 완료와 무관하며 완료가 시간을 만들지도 않는다.
 * - 외부 원문이 있는 자료는 원문 요약, 내 고민과 연결해 보기, 미니미션(선택), 짧은 회고(선택)로 구성한다.
 *   원문 출처가 없는 가상 예시 자료는 기존 본문을 그대로 쓰고 미션과 회고를 만들지 않는다.
 * - 하단 탐색은 숨기고 이전 버튼을 둔다. 시간이 지나도(오후 6시 포함) 이 화면을 바꾸거나 새로고침하지 않는다.
 */
export function ReaderScreen({ contentId }: { contentId: string }) {
  const router = useRouter();
  const { repo: getRepo, paths } = useReaderEnv();
  const [state, setState] = useState<State>({ status: "loading" });
  const [completing, setCompleting] = useState(false);
  const busyRef = useRef(false);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const [focusDone, setFocusDone] = useState(0);

  useReadingTime(state.status === "ready");

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = getRepo();
      const direction = await repo.getConfirmedDirection();
      if (!direction) {
        if (alive) router.replace(paths.onboarding);
        return;
      }
      const started = await repo.markStarted(contentId); // 선택하지 않은 자료면 null, 이미 기록됐다면 그대로
      const content = started ? await getContentService().getReaderContent(contentId) : null;
      if (!alive) return;
      setState(
        started && content
          ? { status: "ready", content, user: started, confirmedTopics: direction.topics.map((t) => ({ key: t.key, label: t.label })) }
          : { status: "blocked" },
      );
    })();
    return () => {
      alive = false;
    };
  }, [contentId, router, getRepo, paths]);

  // 완료한 직후 완료 상태 제목으로 포커스를 옮긴다(누른 버튼이 사라지므로)
  useEffect(() => {
    if (focusDone > 0) doneRef.current?.focus();
  }, [focusDone]);

  function goBack() {
    if (canGoBackInApp()) router.back();
    else router.push(paths.library);
  }

  async function onComplete() {
    if (busyRef.current || state.status !== "ready" || state.user.completedAt) return; // 중복 클릭 차단
    busyRef.current = true;
    setCompleting(true);
    try {
      const item = await getRepo().completeContent(contentId);
      if (item) {
        setState((prev) => (prev.status === "ready" ? { ...prev, user: item } : prev));
        setFocusDone((n) => n + 1);
      }
    } finally {
      busyRef.current = false;
      setCompleting(false);
    }
  }

  return (
    <div>
      <ScreenHeader title="학습" onBack={goBack} />

      <main className="pt-4">
        {state.status === "loading" && (
          <p role="status" className="py-10 text-body text-fg-secondary">
            학습 화면을 여는 중이에요…
          </p>
        )}

        {state.status === "blocked" && (
          <div>
            <h1 className="text-page-title font-bold">열 수 없는 자료예요</h1>
            <p className="mt-3 text-body text-fg-secondary">
              선택한 자료만 읽을 수 있어요. 홈의 오늘의 추천에서 자료를 고르거나, 서재에서 선택한 자료를 열어
              주세요.
            </p>
            <div className="mt-6 grid gap-3">
              <ButtonLink href={paths.home}>홈으로 가기</ButtonLink>
              <ButtonLink href={paths.library} variant="secondary">
                서재로 가기
              </ButtonLink>
            </div>
          </div>
        )}

        {state.status === "ready" && (
          <article>
            <p className="flex flex-wrap gap-x-3 text-caption font-semibold text-fg-secondary">
              <span>{state.content.typeLabel}</span>
              <span>
                {state.content.kind === "source"
                  ? `Stack 요약 읽는 시간 약 ${state.content.estMinutes}분`
                  : `약 ${state.content.estMinutes}분`}
              </span>
            </p>
            <h1 className="mt-1 text-page-title font-bold">{state.content.title}</h1>

            {state.content.kind === "source" ? (
              <>
                <SourceHeader source={state.content.source} />
                <SourceReaderBody
                  contentId={contentId}
                  reader={state.content.reader}
                  confirmedTopics={state.confirmedTopics}
                />
              </>
            ) : (
              <>
                <p className="mt-2 text-caption text-fg-muted">UI 확인용으로 미리 쓴 예시 본문이에요. 외부 원문이 있는 자료가 아니에요.</p>
                <ExampleReaderBody body={state.content.body} />
              </>
            )}

            {/* 완료: 이 버튼을 누를 때만 기록한다. 진입, 스크롤, 시간 경과, 학습 시간 기준 도달로는 자동 완료하지 않는다. */}
            <section aria-labelledby="done-title" className="mt-10 border-t border-line pt-6">
              {state.user.completedAt ? (
                <div>
                  <h2
                    id="done-title"
                    ref={doneRef}
                    tabIndex={-1}
                    className="text-section-title font-bold outline-offset-4"
                  >
                    학습을 완료했어요
                  </h2>
                  <p role="status" className="mt-2 text-body text-fg-secondary">
                    {dateText(state.user.completedAt)}에 완료했어요. 다시 열어 읽어도 처음 완료한 기록은 그대로예요.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <ButtonLink href={paths.library}>서재로 가기</ButtonLink>
                    <ButtonLink href={paths.home} variant="secondary">
                      홈으로 가기
                    </ButtonLink>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 id="done-title" className="text-section-title font-bold">
                    학습 완료
                  </h2>
                  <p className="mt-2 text-body text-fg-secondary">
                    끝까지 읽었다면 아래 버튼을 눌러 주세요. 화면을 열거나 스크롤하거나 시간이 지나도 자동으로
                    완료되지 않아요.
                    {state.content.kind === "source" &&
                      (state.content.reader.miniMission || state.content.reader.reflection) &&
                      " 미니미션과 회고는 선택이라 비워 두어도 완료할 수 있어요."}
                  </p>
                  <div className="mt-5">
                    <Button aria-disabled={completing || undefined} onClick={onComplete}>
                      {completing ? "저장 중…" : "학습 완료"}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
