/**
 * 자료 선택·시작·완료 규칙 (PRD F2-05, F3-01, F3-04). 순수 함수 — 의존성 없음(테스트가 직접 import).
 * - 추천 묶음(세트)당 1개만 선택한다. 선택 후 변경·취소·추가 선택은 없다.
 * - 선택 / 학습 시작 / 학습 완료는 서로 다른 시각으로 기록한다. 선택만으로 시작·완료가 되지 않는다.
 * - 같은 자료는 한 번만 선택된다(중복 선택 차단).
 * 이 규칙은 UI 데모의 모의 서비스 계층에서 쓴다. 서버의 고유 제약·동시성 보장은 구현하지 않았다.
 */

export type UserContent = {
  contentId: string;
  /** 이 선택이 속한 추천 묶음의 id */
  setId: string;
  selectedAt: string;
  /** 학습 리더에 처음 들어온 시각. 선택만으로는 채워지지 않는다. */
  startedAt: string | null;
  /** 명시적 '학습 완료'를 누른 시각(5단계). 이번 단계에서는 항상 null. */
  completedAt: string | null;
};

export type ContentState = "selected" | "reading" | "completed";

export function stateOf(item: UserContent): ContentState {
  if (item.completedAt) return "completed";
  if (item.startedAt) return "reading";
  return "selected";
}

export type SelectOutcome =
  | { status: "selected"; item: UserContent }
  /** 같은 자료를 이미 선택했다(중복 요청). 기존 기록을 그대로 돌려준다. */
  | { status: "already-selected"; item: UserContent }
  /** 이 묶음에서는 이미 다른 자료를 선택했다. */
  | { status: "set-has-selection"; item: UserContent }
  /** 이 묶음에 없는 자료다. */
  | { status: "not-in-set" }
  /** 이 묶음의 추천 회차가 끝났다(오후 6시가 지나 추천이 새로 바뀜). 이전 회차의 자료는 새로 선택할 수 없다. */
  | { status: "expired" };

export type SetRef = { id: string; items: readonly { contentId: string }[] };

/** 선택을 시도한다. 기존 목록은 바꾸지 않고 새 목록을 돌려준다. */
export function trySelect(
  existing: readonly UserContent[],
  set: SetRef,
  contentId: string,
  nowIso: string,
): { outcome: SelectOutcome; list: UserContent[] } {
  const list = [...existing];
  if (!set.items.some((i) => i.contentId === contentId)) {
    return { outcome: { status: "not-in-set" }, list };
  }
  const same = list.find((u) => u.contentId === contentId);
  if (same) return { outcome: { status: "already-selected", item: same }, list };
  const inSet = list.find((u) => u.setId === set.id);
  if (inSet) return { outcome: { status: "set-has-selection", item: inSet }, list };

  const item: UserContent = { contentId, setId: set.id, selectedAt: nowIso, startedAt: null, completedAt: null };
  return { outcome: { status: "selected", item }, list: [...list, item] };
}

/** 학습 리더에 처음 들어온 시각을 기록한다. 이미 기록됐거나 선택하지 않은 자료면 바꾸지 않는다. */
export function startReading(
  existing: readonly UserContent[],
  contentId: string,
  nowIso: string,
): { item: UserContent | null; list: UserContent[]; changed: boolean } {
  const index = existing.findIndex((u) => u.contentId === contentId);
  if (index < 0) return { item: null, list: [...existing], changed: false };
  const current = existing[index];
  if (current.startedAt) return { item: current, list: [...existing], changed: false };
  const item = { ...current, startedAt: nowIso };
  const list = [...existing];
  list[index] = item;
  return { item, list, changed: true };
}

/**
 * 명시적 "학습 완료"를 기록한다. 선택하지 않은 자료는 완료할 수 없고, 이미 완료했다면 최초 완료 시각을 그대로 둔다.
 * 완료에는 시작이 전제되므로 시작 시각이 비어 있으면 완료 시각으로 채운다.
 * 진입·스크롤·시간 경과는 이 함수를 호출하지 않는다(호출 경로는 완료 버튼 하나뿐이다).
 */
export function completeReading(
  existing: readonly UserContent[],
  contentId: string,
  nowIso: string,
): { item: UserContent | null; list: UserContent[]; changed: boolean } {
  const index = existing.findIndex((u) => u.contentId === contentId);
  if (index < 0) return { item: null, list: [...existing], changed: false };
  const current = existing[index];
  if (current.completedAt) return { item: current, list: [...existing], changed: false };
  const item: UserContent = { ...current, startedAt: current.startedAt ?? nowIso, completedAt: nowIso };
  const list = [...existing];
  list[index] = item;
  return { item, list, changed: true };
}

/** 이어서 읽기 대상(완료하지 않은 자료)을 최근 활동 순으로. */
export function continueReadingOrder(list: readonly UserContent[]): UserContent[] {
  return list
    .filter((u) => !u.completedAt)
    .sort((a, b) => (b.startedAt ?? b.selectedAt).localeCompare(a.startedAt ?? a.selectedAt));
}

/** 저장된 값을 안전하게 복원한다. 알 수 없는 자료·형태가 틀린 항목·중복은 버린다. */
export function sanitizeUserContents(raw: unknown, catalogIds: readonly string[]): UserContent[] {
  if (!Array.isArray(raw)) return [];
  const out: UserContent[] = [];
  for (const r of raw) {
    if (typeof r !== "object" || r === null) continue;
    const o = r as Record<string, unknown>;
    if (
      typeof o.contentId !== "string" ||
      !catalogIds.includes(o.contentId) ||
      typeof o.setId !== "string" ||
      o.setId.length === 0 ||
      typeof o.selectedAt !== "string" ||
      out.some((u) => u.contentId === o.contentId || u.setId === o.setId)
    ) {
      continue;
    }
    out.push({
      contentId: o.contentId,
      setId: o.setId,
      selectedAt: o.selectedAt,
      startedAt: typeof o.startedAt === "string" ? o.startedAt : null,
      completedAt: typeof o.completedAt === "string" ? o.completedAt : null,
    });
  }
  return out;
}
