// 추천 공백 조사: 대표 학습 주제 조합 20개로 현재 자료와 현재 추천 규칙을 검사한다(규칙을 바꾸지 않고 동작만 측정한다).
// 실행: node scripts/recommendation-gap.mts            (원문 기반 자료를 포함한 현재 전체 목록)
//       node scripts/recommendation-gap.mts --demo     (가상 예시 자료 11개만: 원문 기반 자료를 추가하기 전)
// 가능한 모든 조합을 검사하는 것이 아니라 단일 주제와 복수 주제를 섞어 전체 주제군에 분산한 대표 20개다.
import { CATALOG } from "../src/config/catalog.ts";
import { DEMO_CONTENTS } from "../src/config/demo-contents.ts";
import { CONCERN_CHIPS } from "../src/config/ui-provisional.ts";
import { explainZero, pickRecommendations } from "../src/lib/content/recommend.ts";

const label = (k: string) => CONCERN_CHIPS.find((c) => c.key === k)?.label ?? k;

const COMBOS: string[][] = [
  ["ux-writing"],
  ["dev-collab"],
  ["usability-test"],
  ["accessibility"],
  ["portfolio"],
  ["ux-writing", "edge-states"],
  ["dev-collab", "handoff-docs"],
  ["ux-writing", "dev-collab"],
  ["user-research", "problem-definition", "data-metrics"],
  ["user-research", "persona-journey"],
  ["problem-definition", "hypothesis-test"],
  ["ia-flow", "interaction-prototype"],
  ["ui-design", "design-system", "accessibility"],
  ["pm-collab", "stakeholder"],
  ["design-feedback", "design-review"],
  ["resume", "design-task", "portfolio"],
  ["interview", "design-task"],
  ["role-direction", "growth-plan"],
  ["work-adapt", "competitor-analysis"],
  ["usability-test", "edge-states", "accessibility"],
];

const POOL = process.argv.includes("--demo") ? DEMO_CONTENTS : CATALOG;
const covered = new Set(POOL.flatMap((c) => c.topics));
const uncoveredHit = new Map<string, number>();
const rows: string[] = [];
let problems = 0;

COMBOS.forEach((keys, i) => {
  const related = POOL.filter((c) => c.topics.some((t) => keys.includes(t)));
  const relatedIds = related.map((c) => c.id);
  const ids = (p: { content: { id: string } }[]) => p.map((x) => x.content.id);

  const c1 = ids(pickRecommendations(POOL, keys));
  // 새 회차, 선택 없음: 직전 추천을 뒤로 미루고 신규를 먼저 쓴다
  const c2 = ids(pickRecommendations(POOL, keys, [], c1));
  const fresh2 = c2.filter((id) => !c1.includes(id));
  const refill2 = c2.filter((id) => c1.includes(id));
  // 새 회차, 첫 추천을 선택함: 선택한 자료는 계속 뺀다
  const c2sel = ids(pickRecommendations(POOL, keys, c1.slice(0, 1), c1));
  // 관련 자료를 모두 선택한 경우
  const allSel = ids(pickRecommendations(POOL, keys, relatedIds, c1));
  const emptyReason = allSel.length === 0 ? explainZero(POOL, keys, relatedIds) : "비어 있지 않음(오류)";

  // 관련 없는 자료나 중복이 들어가지 않는지
  const all = [c1, c2, c2sel];
  const unrelated = all.flat().filter((id) => !relatedIds.includes(id));
  const dup = all.some((l) => new Set(l).size !== l.length);
  const selectedLeak = c2sel.some((id) => id === c1[0]);
  const ok = unrelated.length === 0 && !dup && !selectedLeak && allSel.length === 0;
  if (!ok) problems++;

  const missing = keys.filter((k) => !covered.has(k));
  for (const k of missing) uncoveredHit.set(k, (uncoveredHit.get(k) ?? 0) + 1);

  const refillNote =
    related.length === 0
      ? "후보 없음"
      : refill2.length > 0
        ? `보충 ${refill2.length}개`
        : c2.length >= 2
          ? "신규만으로 충분"
          : "보충할 자료 없음";
  rows.push(
    `| ${i + 1} | ${keys.map(label).join(", ")} | ${missing.length ? missing.map(label).join(", ") : "없음"} | ${related.length} | ${c1.length} | ${c2.length}(신규 ${fresh2.length}) | ${refillNote} | ${c2sel.length} | ${related.length === 0 ? "자료 없음" : emptyReason === "all-selected" ? "선택 완료 안내" : emptyReason} | ${ok ? "통과" : "실패"} |`,
  );
});

console.log("| # | 조합 | 자료 없는 주제 | 관련 후보 | 1회차 | 2회차(선택 없음) | 직전 추천 보충 | 2회차(첫 추천 선택) | 모두 선택한 뒤 빈 상태 | 무관, 중복, 선택 재노출 검사 |");
console.log("|---|---|---|---|---|---|---|---|---|---|");
console.log(rows.join("\n"));
console.log(`\n검사 실패 ${problems}건`);
console.log(`자료 있는 주제 ${covered.size}개 / 전체 ${CONCERN_CHIPS.length}개, 자료 없는 주제 ${CONCERN_CHIPS.length - covered.size}개`);
console.log("조합에서 자료 없는 주제가 나온 횟수:", [...uncoveredHit].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${label(k)} ${n}`).join(", ") || "없음");
console.log("주제별 자료 수:", CONCERN_CHIPS.map((c) => `${c.label} ${POOL.filter((x) => x.topics.includes(c.key)).length}`).join(", "));
