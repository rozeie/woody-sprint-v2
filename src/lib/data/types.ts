import type { RecommendationSet } from "@/lib/content/types";
import type { ConfirmedDirection, DirectionDraft } from "@/lib/direction-rules";
import type { OnboardingDraft } from "@/lib/onboarding-rules";
import type { SelectOutcome, UserContent } from "@/lib/selection-rules";
import type { ReadingDay } from "@/lib/stack-rules";

/**
 * 데이터 접근 계층 계약. UI는 이 인터페이스만 사용한다.
 * 현재 구현은 브라우저 임시 저장을 쓰는 데모(demo-repository.ts)뿐이며,
 * PRD의 서버 DB·익명 세션 복원은 이 계층 뒤에 별도 구현으로 교체한다(이번 범위 밖).
 */
export interface StackRepository {
  getOnboardingDraft(): Promise<OnboardingDraft | null>;
  saveOnboardingDraft(draft: OnboardingDraft): Promise<void>;
  /** 온보딩 현재 단계(1부터 4). 새로고침 때 복원한다. 저장된 값이 없거나 올바르지 않으면 null. */
  getOnboardingStep(): Promise<number | null>;
  saveOnboardingStep(step: number): Promise<void>;

  /** 분석 결과 + 세부 주제 편집 상태(확정 전 초안) */
  getDirectionDraft(): Promise<DirectionDraft | null>;
  saveDirectionDraft(draft: DirectionDraft): Promise<void>;

  /**
   * 학습 방향 확정. 확정 후에만 홈에 접근할 수 있다(PRD F4-01).
   * 이미 확정한 방향이 있으면 덮어쓰지 않고 `{ ok: false }`를 돌려준다.
   */
  confirmDirection(direction: ConfirmedDirection): Promise<{ ok: boolean }>;
  getConfirmedDirection(): Promise<ConfirmedDirection | null>;
  hasConfirmedDirection(): Promise<boolean>;

  /** 확정 직후(또는 홈 첫 진입 시) 만든 추천 묶음. 데모에서는 고정이다. */
  getRecommendationSet(): Promise<RecommendationSet | null>;
  /** 선택이 연결된 묶음은 덮어쓰지 않는다. 저장했으면 true. */
  saveRecommendationSet(set: RecommendationSet): Promise<boolean>;

  /** 서재(선택한 자료와 선택/읽는 중/완료 상태). 최근에 선택한 순서 보장은 호출 측에서 정렬한다. */
  getUserContents(): Promise<UserContent[]>;
  /**
   * 자료 선택(모의 서재 저장). 묶음당 1개, 같은 자료 중복 차단, 변경·취소 없음.
   * 실제 서버의 고유 제약·동시성 보장이 아니라 이 브라우저 안에서만의 모의 처리다.
   */
  selectContent(args: { setId: string; contentId: string }): Promise<SelectOutcome>;
  /** 학습 리더 진입 기록. 선택한 자료에만 적용되고 처음 한 번만 기록한다. 선택하지 않은 자료면 null. */
  markStarted(contentId: string): Promise<UserContent | null>;
  /**
   * 명시적 "학습 완료" 기록. 선택한 자료에만 적용되고, 이미 완료했다면 최초 완료 시각을 그대로 둔다. 선택하지 않은 자료면 null.
   */
  completeContent(contentId: string): Promise<UserContent | null>;

  /** 날짜별 활성 읽기 시간. 읽기 시간 측정은 이번 범위 밖이라 데모에서는 항상 비어 있다. */
  getReadingDays(): Promise<ReadingDay[]>;
}
