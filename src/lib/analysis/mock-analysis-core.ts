/**
 * 모의 분석 생성기 (순수 함수). 실제 AI가 아니라 입력한 칩에 맞춰 고정 문구를 조합한다.
 * 같은 입력과 variant에는 항상 같은 결과를 돌려준다. '다시 분석하기'는 variant를 올려 다른 제안을 만든다.
 */
import { CONCERN_CHIPS } from "../../config/ui-provisional.ts";
import {
  GROUP_FIXTURES,
  OTHER_ONLY_TOPICS,
  SITUATION_PHRASE,
  TOPIC_WHY,
} from "../../config/mock-analysis-fixtures.ts";
import type { AnalysisResult } from "../direction-rules.ts";
import type { OnboardingDraft } from "../onboarding-rules.ts";

const chipByKey = new Map(CONCERN_CHIPS.map((c) => [c.key, c]));

function rotate<T>(list: readonly T[], by: number): T[] {
  if (list.length === 0) return [];
  const n = ((by % list.length) + list.length) % list.length;
  return [...list.slice(n), ...list.slice(0, n)];
}

export function buildMockAnalysis(input: OnboardingDraft, variant: number): AnalysisResult {
  const chosen = input.concernKeys
    .map((k) => chipByKey.get(k))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const groupName = chosen.length > 0 ? chosen[0].group : "기타";
  const fixture = GROUP_FIXTURES[groupName] ?? GROUP_FIXTURES["기타"];

  // 후보 순서: 사용자가 고른 칩(회전) → 같은 그룹의 관련 주제(회전) → 기타 전용 기본 주제
  const baseKeys = rotate(chosen.map((c) => c.key), variant);
  const related = rotate(
    CONCERN_CHIPS.filter((c) => c.group === groupName && !baseKeys.includes(c.key)).map((c) => c.key),
    variant,
  );
  const fallback = rotate(OTHER_ONLY_TOPICS, variant).filter((k) => !baseKeys.includes(k));
  const candidates = [...new Set([...baseKeys, ...related, ...fallback])];

  // variant가 짝수이면 3개, 홀수이면 2개를 제안한다(2~3개 범위 안에서 결과가 달라지게)
  const count = Math.min(variant % 2 === 0 ? 3 : 2, candidates.length);
  const topics = candidates.slice(0, Math.max(count, 2)).map((key) => ({
    key,
    label: chipByKey.get(key)?.label ?? key,
    why: TOPIC_WHY[key] ?? "이 주제와 연결된 학습을 살펴봐요.",
  }));

  const situation = input.situation ? SITUATION_PHRASE[input.situation] : "지금 상황에서";

  return {
    interpretation:
      `${situation} ${fixture.difficulty}에서 막막함을 느끼고 계실 수 있어요. ` +
      `입력하신 내용만으로 정리한 내용이라 실제와 다를 수 있어요.`,
    coreDirection: { ...fixture.core },
    subTopics: topics,
    directionSummary:
      `‘${fixture.core.label}’ 방향에서 위의 세부 주제를 차례로 살펴보는 것을 제안해요. ` +
      `지금 고민과 맞지 않는 주제는 삭제하고, 필요한 주제는 추가해 조정할 수 있어요.`,
  };
}
