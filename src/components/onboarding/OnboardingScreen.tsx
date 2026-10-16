"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRepository } from "@/lib/data";
import { EMPTY_DRAFT, type OnboardingDraft } from "@/lib/onboarding-rules";
import { OnboardingForm } from "./OnboardingForm";

type State =
  | { status: "loading" }
  | { status: "redirecting" }
  | { status: "ready"; draft: OnboardingDraft; step: number | null; loadId: number };

/**
 * 저장된 입력과 현재 단계(데모 임시 저장)를 불러온 뒤 4단계 입력 화면을 보여준다.
 * 불러오기 전에는 화면을 그리지 않아 빈 값으로 덮어쓰지 않는다.
 * 이미 학습 방향을 확정했다면 입력 화면을 보여주지 않고 홈으로 보낸다. 확정한 방향은 그대로 유지한다
 * (방향 재설정은 설정 화면의 별도 기능이며 이번 범위에서 구현하지 않는다).
 */
export function OnboardingScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = getRepository();
      if (await repo.hasConfirmedDirection()) {
        if (!alive) return;
        setState({ status: "redirecting" });
        router.replace("/home");
        return;
      }
      const draft = await repo.getOnboardingDraft();
      const step = await repo.getOnboardingStep();
      // loadId를 올려 화면이 다시 보일 때(분석에서 돌아오기 등) 저장된 입력과 단계로 폼을 새로 시작한다. 안내 확인 체크도 초기화된다.
      if (alive) setState({ status: "ready", draft: draft ?? EMPTY_DRAFT, step, loadId: Date.now() });
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (state.status === "redirecting") {
    return (
      <p role="status" className="py-10 text-body text-fg-secondary">
        이미 학습 방향을 정했어요. 홈으로 이동하는 중이에요…
      </p>
    );
  }
  if (state.status === "loading") {
    return (
      <p role="status" className="py-10 text-body text-fg-secondary">
        입력 화면을 불러오는 중이에요…
      </p>
    );
  }
  return <OnboardingForm key={state.loadId} initialDraft={state.draft} initialStep={state.step} />;
}
