/**
 * 모의 분석 서비스 — 실제 AI·서버 호출이 아니다. 지연과 실패를 로컬에서 재현하기 위한 UI 데모용 구현이다.
 * 교체 지점은 index.ts의 getAnalysisService() 하나다.
 */
import { CONCERN_CHIPS } from "../../config/ui-provisional.ts";
import { validateAnalysis, type AnalysisResult } from "../direction-rules.ts";
import type { OnboardingDraft } from "../onboarding-rules.ts";
import { buildMockAnalysis } from "./mock-analysis-core.ts";

/** none: 정상 / error: 항상 실패 / error-once: 첫 시도만 실패 / slow: 매우 느림(로딩 장기화 안내 확인용) */
export type DemoMode = "none" | "error" | "error-once" | "slow";

export type AnalysisRequest = {
  input: OnboardingDraft;
  /** 0부터 시작. '다시 분석하기'마다 1씩 올라간다. */
  variant: number;
  /** 사용자가 직접 시도한 횟수(1부터). 자동 재호출은 올리지 않는다. */
  attempt: number;
  demo: DemoMode;
};

export class AnalysisError extends Error {
  readonly code: "failed" | "invalid";
  constructor(code: "failed" | "invalid") {
    super(code);
    this.name = "AnalysisError";
    this.code = code;
  }
}

export interface AnalysisService {
  analyze(request: AnalysisRequest): Promise<AnalysisResult>;
}

export const SLOW_DEMO_LATENCY_MS = 25_000;

const topicKeys = CONCERN_CHIPS.map((c) => c.key);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createMockAnalysisService(options: { latencyMs: number }): AnalysisService {
  return {
    async analyze({ input, variant, attempt, demo }) {
      console.info("[stack-demo] mock analysis request", { attempt, variant, demo });
      await wait(demo === "slow" ? SLOW_DEMO_LATENCY_MS : options.latencyMs);

      if (demo === "error") throw new AnalysisError("failed");
      if (demo === "error-once" && attempt <= 1) throw new AnalysisError("failed");

      const result = buildMockAnalysis(input, variant);
      // 실제 서비스와 같은 계약: 응답 형태가 어긋나면 오류로 취급한다.
      if (!validateAnalysis(result, topicKeys).ok) throw new AnalysisError("invalid");
      return result;
    },
  };
}

/** URL의 ?demo= 값을 읽는다(클라이언트 전용). 데모에서 실패·지연을 재현하는 용도. */
export function readDemoMode(): DemoMode {
  if (typeof window === "undefined") return "none";
  const value = new URLSearchParams(window.location.search).get("demo");
  return value === "error" || value === "error-once" || value === "slow" ? value : "none";
}
