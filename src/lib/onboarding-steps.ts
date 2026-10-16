/**
 * 온보딩 4단계 구성과 진행 규칙 (사용자 확정, PRD v0.3 F1-06). 순수 함수 — 의존성 없음(테스트가 직접 import).
 * 단계: 1 고민 영역, 2 현재 상황, 3 추가 설명(선택), 4 시작 전 안내. AI 분석과 결과 확인은 이 4단계 이후다.
 * 입력은 단계 사이를 오가도 유지되고, 현재 단계도 저장해 새로고침 때 복원한다.
 */
import { validateDraft, type DraftErrors, type OnboardingDraft } from "./onboarding-rules.ts";

export const ONBOARDING_STEPS = [
  { id: "concern", label: "고민 영역" },
  { id: "situation", label: "현재 상황" },
  { id: "detail", label: "추가 설명" },
  { id: "notice", label: "시작 전 안내" },
] as const;

/**
 * 상단 진행 표시용 전체 단계: 입력 4단계 + 5 학습 방향 확인(결과 확인과 확정). 분석 로딩과 실패는 4에서 5로 넘어가는
 * 처리 상태라 별도 단계로 세지 않고 4단계로 표시한다. 5단계는 결과 화면에 도착한 것만으로 완료되지 않고 확정해야 끝난다.
 */
export const PROGRESS_STEPS = [...ONBOARDING_STEPS, { id: "direction", label: "학습 방향 확인" }] as const;

export const FIRST_STEP = 1;
/** 입력 화면(/onboarding)에서 오갈 수 있는 마지막 단계. 5단계는 별도 화면(/direction)이다. */
export const LAST_STEP = ONBOARDING_STEPS.length;

/** 그 단계에서 막히는 오류만 골라낸다. 3단계(추가 설명)와 4단계(안내)는 입력 오류가 없다. */
export function stepErrors(step: number, draft: OnboardingDraft): DraftErrors {
  const all = validateDraft(draft).errors;
  const out: DraftErrors = {};
  if (step === 1) {
    if (all.concern) out.concern = all.concern;
  } else if (step === 2) {
    if (all.situation) out.situation = all.situation;
  }
  return out;
}

/** 다음 단계로 갈 수 있는지(필수 입력을 채웠는지). 추가 설명(3단계)은 선택이라 항상 갈 수 있다. */
export function canProceed(step: number, draft: OnboardingDraft): boolean {
  return Object.keys(stepErrors(step, draft)).length === 0;
}

/** 저장된 단계 값을 안전하게 읽는다. 1부터 4까지의 정수가 아니면 null. */
export function sanitizeStep(raw: unknown): number | null {
  return typeof raw === "number" && Number.isInteger(raw) && raw >= FIRST_STEP && raw <= LAST_STEP ? raw : null;
}

/**
 * 복원하거나 이동할 단계를 안전한 범위로 맞춘다. 필수 단계(1, 2)를 채우지 않았다면 그 단계 뒤로는 갈 수 없다
 * (예: 저장된 단계가 4인데 현재 상황이 비어 있으면 2단계로).
 */
export function clampStep(step: number | null, draft: OnboardingDraft): number {
  const wanted = sanitizeStep(step) ?? FIRST_STEP;
  for (let s = FIRST_STEP; s < wanted; s++) {
    if (!canProceed(s, draft)) return s;
  }
  return wanted;
}

/** 분석 시작 조건: 모든 필수 입력이 유효하고 안내 확인에 체크했다. (법적 동의나 개인정보 수집 동의가 아니다.) */
export function canStartAnalysis(draft: OnboardingDraft, acknowledged: boolean): boolean {
  return acknowledged && validateDraft(draft).ok;
}
