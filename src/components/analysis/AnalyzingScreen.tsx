"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef } from "react";
import { PROVISIONAL } from "@/config/ui-provisional";
import { getAnalysisService, readDemoMode } from "@/lib/analysis";
import { getRepository } from "@/lib/data";
import { topicsFromAnalysis } from "@/lib/direction-rules";
import { validateDraft, type OnboardingDraft } from "@/lib/onboarding-rules";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type View = { phase: "checking" | "loading" | "error"; slow: boolean };
type Action = { type: "reset" } | { type: "start" } | { type: "slow" } | { type: "error" };

function reducer(state: View, action: Action): View {
  switch (action.type) {
    case "reset":
      return { phase: "checking", slow: false };
    case "start":
      return { phase: "loading", slow: false };
    case "slow":
      return state.phase === "loading" ? { ...state, slow: true } : state;
    case "error":
      return { phase: "error", slow: false };
  }
}

/** 렌더와 무관하게 바뀌는 실행 상태: 요청 식별자·진행 중 여부·사용자 시도 횟수·분석할 입력 */
type RunState = { id: number; busy: boolean; attempt: number; input: OnboardingDraft | null };

/**
 * 모의 AI 분석 화면: 로딩 → (성공) 결과 화면 / (실패) 오류·재시도.
 * - 입력은 저장소에 그대로 남아 있고, 실패해도 지워지지 않는다.
 * - 진행 중에는 시작/재시도가 한 번만 실행된다(run.busy).
 * - 이전 화면을 숨긴 채 유지하는 라우터 동작 때문에, 화면이 다시 보일 때마다 effect가 새로 시작한다.
 */
export function AnalyzingScreen() {
  const router = useRouter();
  const [view, dispatch] = useReducer(reducer, { phase: "checking", slow: false });
  const runRef = useRef<RunState>({ id: 0, busy: false, attempt: 1, input: null });
  const headingRef = useRef<HTMLHeadingElement>(null);

  async function start(runId: number) {
    const run = runRef.current;
    const input = run.input;
    if (!input || run.busy) return;
    run.busy = true;
    dispatch({ type: "start" });
    const slowTimer = setTimeout(() => {
      if (runId === run.id) dispatch({ type: "slow" });
    }, PROVISIONAL.slowNoticeMs);
    try {
      const result = await getAnalysisService().analyze({
        input,
        variant: 0,
        attempt: run.attempt,
        demo: readDemoMode(),
      });
      if (runId !== run.id) return; // 화면을 떠났거나 취소됨
      await getRepository().saveDirectionDraft({
        input,
        analysis: result,
        topics: topicsFromAnalysis(result),
        reanalysisCount: 0,
      });
      router.push("/direction");
    } catch {
      if (runId === run.id) dispatch({ type: "error" });
    } finally {
      clearTimeout(slowTimer);
      run.busy = false;
    }
  }

  useEffect(() => {
    const run = runRef.current;
    const runId = ++run.id;
    run.attempt = 1;
    run.busy = false;
    dispatch({ type: "reset" });
    (async () => {
      const repo = getRepository();
      // 이미 학습 방향을 확정했다면 다시 분석해 방향·추천을 덮어쓰지 못하게 홈으로 보낸다
      if (await repo.hasConfirmedDirection()) {
        if (runId === run.id) router.replace("/home");
        return;
      }
      const draft = await repo.getOnboardingDraft();
      if (runId !== run.id) return;
      if (!draft || !validateDraft(draft).ok) {
        router.replace("/onboarding"); // 입력이 없으면 분석할 수 없다
        return;
      }
      run.input = draft;
      void start(runId);
    })();
    return () => {
      run.id++; // 진행 중인 요청 결과를 무시한다
      run.busy = false;
    };
    // start는 안정적인 ref 객체와 dispatch만 사용한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // 단계가 바뀔 때 제목으로 포커스를 옮겨 상태 변화를 알린다
  useEffect(() => {
    if (view.phase !== "checking") headingRef.current?.focus();
  }, [view.phase]);

  function retry() {
    const run = runRef.current;
    if (run.busy) return; // 중복 실행 차단
    run.attempt += 1;
    void start(run.id);
  }

  const demo = typeof window === "undefined" ? "none" : readDemoMode();

  if (view.phase === "checking") {
    return (
      <p role="status" className="py-10 text-body text-fg-secondary">
        입력한 내용을 확인하는 중이에요…
      </p>
    );
  }

  if (view.phase === "error") {
    return (
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-page-title font-bold outline-offset-4">
          분석을 끝내지 못했어요
        </h1>
        <div className="mt-4">
          <Alert tone="error" title="학습 방향을 분석하지 못했어요">
            일시적인 문제일 수 있어요. 입력하신 내용은 그대로 남아 있으니 다시 시도해 주세요.
          </Alert>
        </div>
        {demo === "error" || demo === "error-once" ? (
          <p className="mt-3 text-caption text-fg-muted">
            데모에서 오류를 일부러 재현하고 있어요.{" "}
            {demo === "error-once" ? "다시 시도하면 성공해요." : "이 주소에서는 계속 실패해요."}
          </p>
        ) : null}
        <div className="mt-6 grid gap-3">
          <Button onClick={retry}>다시 시도</Button>
          <ButtonLink href="/onboarding" variant="secondary">
            입력 수정하러 가기
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 ref={headingRef} tabIndex={-1} className="text-page-title font-bold outline-offset-4">
        학습 방향을 분석하고 있어요
      </h1>
      <div role="status" className="mt-4 flex items-start gap-3 rounded-card bg-surface p-4">
        <Spinner className="mt-1" />
        <div>
          <p className="text-body">
            입력하신 고민을 바탕으로 학습 방향을 정리하고 있어요. 잠시만 기다려 주세요.
          </p>
          <p className="mt-2 text-caption text-fg-secondary">
            모의 분석이라 실제 AI가 아니에요. 입력한 내용은 이 브라우저에 그대로 남아 있어요.
          </p>
        </div>
      </div>
      {view.slow && (
        <div className="mt-4">
          <Alert tone="warning" title="조금 더 걸려요" role="status">
            분석이 평소보다 오래 걸리고 있어요. 계속 기다리거나, 취소하고 입력 화면으로 돌아갈 수 있어요.
          </Alert>
          <div className="mt-3">
            <ButtonLink href="/onboarding" variant="secondary">
              분석 취소하고 입력으로 돌아가기
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
