/**
 * 임시 UI 설정 — PRD-v0.2.md에서 아직 확정되지 않은 값만 모은다.
 * 여기 값은 "UI 데모용 임시 선택"이며 확정 정책이 아니다. 결정 목록: docs/ui-demo-decisions.md
 * 이 파일은 의존성이 없어야 한다(테스트가 직접 import).
 */

export type ConcernChip = {
  key: string;
  label: string;
  group: string;
};

export const PROVISIONAL = {
  /** PRD F1-01 / D-11 미확정. 값은 v0.1 제안(500자). */
  detailTextMax: 500,
  /** PRD F1-01 / D-11 미확정: '기타' 선택 시에도 추가 설명을 함께 노출할지. 데모는 항상 노출. */
  showDetailWithOther: true,
  /** PRD F1-05 / D-10 미확정: 세부 주제 최대 개수(v0.1 제안 5). 추가 방식은 "보유 토픽 목록에서 선택"으로 임시 구현. */
  maxSubTopics: 5,
  /**
   * PRD D-10 미확정: '다시 분석하기' 횟수 제한. 데모는 제한 없음(모의라 비용이 없음). 실제 AI 연결 시 비용 보호 필요.
   */
  reanalyzeLimit: null as number | null,
  /** PRD §11 화면 상태 제안: 분석이 이 시간(ms)을 넘기면 "조금 더 걸려요"와 취소를 보여준다. */
  slowNoticeMs: 20_000,
  /** 모의 분석 지연(ms). 로딩 상태를 눈으로 확인할 수 있게 둔 값이며 실제 AI 지연이 아니다. */
  mockAnalysisLatencyMs: 1_600,
} as const;

/**
 * 고민 칩 목록 — PRD F1-01 "초기 칩 선택지 제안(확정 아님)"과 D-03 미확정.
 * 이모지 금지(PRD 확정). '기타'는 개수 제한 밖이라 이 목록에 포함하지 않는다.
 */
export const CONCERN_CHIPS: readonly ConcernChip[] = [
  { key: "user-research", label: "사용자 리서치", group: "문제 정의와 리서치" },
  { key: "problem-definition", label: "문제 정의", group: "문제 정의와 리서치" },
  { key: "data-metrics", label: "데이터 해석과 지표 설정", group: "문제 정의와 리서치" },
  { key: "ia-flow", label: "정보구조와 플로우 설계", group: "설계" },
  { key: "ui-design", label: "UI 디자인", group: "설계" },
  { key: "design-system", label: "디자인 시스템", group: "설계" },
  { key: "interaction-prototype", label: "인터랙션과 프로토타이핑", group: "설계" },
  { key: "ux-writing", label: "UX 라이팅", group: "설계" },
  { key: "dev-collab", label: "개발자 협업", group: "협업과 소통" },
  { key: "pm-collab", label: "기획/PM 협업", group: "협업과 소통" },
  { key: "stakeholder", label: "이해관계자 설득", group: "협업과 소통" },
  { key: "design-feedback", label: "디자인 피드백 받기", group: "협업과 소통" },
  { key: "portfolio", label: "포트폴리오 구성", group: "커리어" },
  { key: "interview", label: "면접 준비", group: "커리어" },
  { key: "role-direction", label: "직무 이해와 방향 설정", group: "커리어" },
];

/** 칩 목록을 그룹(표시 순서 유지)별로 묶은 것. 온보딩과 세부 주제 추가 목록이 함께 쓴다. */
export const CONCERN_GROUPS: { name: string; chips: ConcernChip[] }[] = [];
for (const chip of CONCERN_CHIPS) {
  const last = CONCERN_GROUPS[CONCERN_GROUPS.length - 1];
  if (last && last.name === chip.group) last.chips.push(chip);
  else CONCERN_GROUPS.push({ name: chip.group, chips: [chip] });
}
