"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getContentService } from "@/lib/content";
import type { ReaderContent } from "@/lib/content/types";
import { getRepository } from "@/lib/data";
import { canGoBackInApp } from "@/lib/navigation";
import type { UserContent } from "@/lib/selection-rules";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ArrowLeftIcon } from "@/components/ui/icons";

type State =
  | { status: "loading" }
  | { status: "blocked" }
  | { status: "ready"; content: ReaderContent; user: UserContent };

const H2 = "mb-3 mt-8 text-section-title font-bold";
const P = "mt-5 text-reader text-fg";

function dateText(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 학습 리더 (PRD F3-01, F3-02).
 * - 선택한 자료만 열 수 있다. 선택하지 않은 자료, 없는 자료, 확정 전에는 열리지 않는다.
 * - '바로 학습 시작', 이어서 읽기, 서재의 버튼은 중간 화면 없이 이 본문으로 곧바로 연결된다.
 * - 처음 열면 학습 시작 시각을 한 번만 기록한다. 완료는 하단의 "학습 완료" 버튼으로만 기록하며,
 *   진입, 스크롤, 시간 경과로는 절대 완료하지 않는다. 다시 열어도 최초 완료 시각은 그대로다.
 * - 하단 탐색은 숨기고 이전 버튼을 둔다. 시간이 지나도(오후 6시 포함) 이 화면을 바꾸거나 새로고침하지 않는다.
 * 본문은 UI 확인용으로 미리 쓴 예시이며, 회고와 읽기 시간 측정은 구현하지 않았다.
 */
export function ReaderScreen({ contentId }: { contentId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [completing, setCompleting] = useState(false);
  const busyRef = useRef(false);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const [focusDone, setFocusDone] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = getRepository();
      if (!(await repo.hasConfirmedDirection())) {
        if (alive) router.replace("/onboarding");
        return;
      }
      const started = await repo.markStarted(contentId); // 선택하지 않은 자료면 null, 이미 기록됐다면 그대로
      const content = started ? await getContentService().getReaderContent(contentId) : null;
      if (!alive) return;
      setState(started && content ? { status: "ready", content, user: started } : { status: "blocked" });
    })();
    return () => {
      alive = false;
    };
  }, [contentId, router]);

  // 완료한 직후 완료 상태 제목으로 포커스를 옮긴다(누른 버튼이 사라지므로)
  useEffect(() => {
    if (focusDone > 0) doneRef.current?.focus();
  }, [focusDone]);

  function goBack() {
    if (canGoBackInApp()) router.back();
    else router.push("/library");
  }

  async function onComplete() {
    if (busyRef.current || state.status !== "ready" || state.user.completedAt) return; // 중복 클릭 차단
    busyRef.current = true;
    setCompleting(true);
    try {
      const item = await getRepository().completeContent(contentId);
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
      <header className="flex min-h-14 items-center gap-1">
        <button
          type="button"
          onClick={goBack}
          aria-label="이전 화면으로"
          className="-ml-3 inline-flex h-12 w-12 items-center justify-center rounded-btn text-fg hover:bg-surface-subtle"
        >
          <ArrowLeftIcon />
        </button>
        <span className="text-card-title font-bold">학습</span>
      </header>

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
              <ButtonLink href="/home">홈으로 가기</ButtonLink>
              <ButtonLink href="/library" variant="secondary">
                서재로 가기
              </ButtonLink>
            </div>
          </div>
        )}

        {state.status === "ready" && (
          <article>
            <p className="flex flex-wrap gap-x-3 text-caption font-semibold text-fg-secondary">
              <span>{state.content.typeLabel}</span>
              <span>약 {state.content.estMinutes}분</span>
            </p>
            <h1 className="mt-1 text-page-title font-bold">{state.content.title}</h1>
            <p className="mt-2 text-caption text-fg-muted">UI 확인용으로 미리 쓴 예시 본문이에요.</p>

            <h2 className={H2}>학습 목표</h2>
            <p className="text-reader text-fg">{state.content.body.goal}</p>

            <h2 className={H2}>핵심 개념과 원리</h2>
            <dl>
              {state.content.body.concepts.map((c) => (
                <div key={c.term} className="mt-5 first:mt-0">
                  <dt className="text-reader font-semibold text-fg">{c.term}</dt>
                  <dd className="mt-1 text-reader text-fg">{c.explanation}</dd>
                </div>
              ))}
            </dl>

            <h2 className={H2}>상세 설명</h2>
            {state.content.body.detail.map((para, i) => (
              <p key={para} className={i === 0 ? "text-reader text-fg" : P}>
                {para}
              </p>
            ))}

            <h2 className={H2}>실무 사례</h2>
            <h3 className="text-card-title font-semibold">{state.content.body.caseStudy.title}</h3>
            <dl className="mt-3">
              {(
                [
                  ["상황", state.content.body.caseStudy.situation],
                  ["접근", state.content.body.caseStudy.approach],
                  ["결과", state.content.body.caseStudy.result],
                ] as const
              ).map(([label, text]) => (
                <div key={label} className="mt-4 first:mt-0">
                  <dt className="text-body font-semibold text-fg-secondary">{label}</dt>
                  <dd className="mt-1 text-reader text-fg">{text}</dd>
                </div>
              ))}
            </dl>

            <h2 className={H2}>실제 적용 방법</h2>
            <ol className="list-decimal space-y-4 pl-6 text-reader text-fg">
              {state.content.body.steps.map((s) => (
                <li key={s.step}>
                  <p>{s.step}</p>
                  <p className="mt-1 text-body text-fg-secondary">{s.tip}</p>
                </li>
              ))}
            </ol>

            <h2 className={H2}>이해 점검</h2>
            <p className="text-body text-fg-secondary">
              정답이나 점수는 없어요. 스스로 떠올려 보는 질문이에요.
            </p>
            <ol className="mt-3 list-decimal space-y-3 pl-6 text-reader text-fg">
              {state.content.body.checks.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>

            <h2 className={H2}>참고 자료</h2>
            <p className="text-body text-fg-secondary">더 공부하고 싶을 때 살펴볼 자료예요. 읽지 않아도 학습은 끝낼 수 있어요.</p>
            <ol className="mt-3 list-decimal space-y-3 pl-6 text-reader text-fg">
              {state.content.body.references.map((r) => (
                <li key={r.title}>
                  <p>{r.title}</p>
                  <p className="mt-1 text-body text-fg-secondary">{r.note}</p>
                </li>
              ))}
            </ol>

            {/* 완료: 이 버튼을 누를 때만 기록한다. 진입, 스크롤, 시간 경과로는 자동 완료하지 않는다. */}
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
                    <ButtonLink href="/library">서재로 가기</ButtonLink>
                    <ButtonLink href="/home" variant="secondary">
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
