/**
 * 리더의 선택 입력(미니미션 답, 짧은 회고) 규칙. 순수 함수이며 의존성이 없다(테스트가 직접 import).
 * 자료별로 이 브라우저에만 저장하며 서버나 분석 도구로 보내지 않는다. 평가나 AI 피드백에 쓰지 않는다.
 */

/** 입력 하나의 최대 글자 수 */
export const NOTE_MAX = 2000;

export type ReaderNotes = { mission: string; reflection: string; updatedAt: string | null };

export const EMPTY_NOTES: ReaderNotes = { mission: "", reflection: "", updatedAt: null };

const clip = (v: unknown) => (typeof v === "string" ? v.slice(0, NOTE_MAX) : "");

/** 저장된 값 전체(자료 id별)를 안전하게 복원한다. 알 수 없는 자료, 형태가 틀린 항목, 빈 항목은 버린다. */
export function sanitizeNotesMap(raw: unknown, catalogIds: readonly string[]): Record<string, ReaderNotes> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const out: Record<string, ReaderNotes> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!catalogIds.includes(id) || typeof v !== "object" || v === null) continue;
    const o = v as Record<string, unknown>;
    const mission = clip(o.mission);
    const reflection = clip(o.reflection);
    if (mission === "" && reflection === "") continue;
    out[id] = { mission, reflection, updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : null };
  }
  return out;
}

/** 입력이 모두 비면 항목을 지운다. 입력 길이는 NOTE_MAX로 자른다. */
export function withNotes(
  map: Record<string, ReaderNotes>,
  contentId: string,
  notes: { mission: string; reflection: string },
  nowIso: string,
): Record<string, ReaderNotes> {
  const mission = clip(notes.mission);
  const reflection = clip(notes.reflection);
  const next = { ...map };
  if (mission === "" && reflection === "") delete next[contentId];
  else next[contentId] = { mission, reflection, updatedAt: nowIso };
  return next;
}
