import { PROVISIONAL } from "@/config/ui-provisional";
import { createMockAnalysisService, type AnalysisService } from "./mock-analysis";

const service = createMockAnalysisService({ latencyMs: PROVISIONAL.mockAnalysisLatencyMs });

/** 분석 서비스의 교체 지점. 실제 AI 연동이 생기면 여기서만 바꾼다. */
export function getAnalysisService(): AnalysisService {
  return service;
}

export { AnalysisError, readDemoMode } from "./mock-analysis";
export type { AnalysisRequest, DemoMode } from "./mock-analysis";
