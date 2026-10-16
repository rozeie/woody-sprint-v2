/**
 * 온보딩 입력 규칙 (PRD F1-01·F1-02). 순수 함수 — UI·저장소와 무관하며 의존성이 없다(테스트가 직접 import).
 * 확정 값: 일반 칩 최대 3개, '기타'는 개수 제한 밖, 기타 300자(초기값), 상황 1개 필수.
 * 글자 수는 문자열 length(UTF-16 코드 단위) 기준이다. 한글은 1자=1이고 이모지 등은 2로 셀 수 있다.
 */

export const MAX_CONCERN_CHIPS = 3;
export const OTHER_TEXT_MAX = 300;

export type Situation = "job_seeker" | "junior";
export const SITUATIONS: readonly Situation[] = ["job_seeker", "junior"];

export type OnboardingDraft = {
  /** 선택한 일반 고민 칩의 key (기타 제외) */
  concernKeys: string[];
  /** '기타' 선택 여부 — 개수 제한에 포함하지 않는다 */
  otherSelected: boolean;
  otherText: string;
  detailText: string;
  situation: Situation | null;
};

export const EMPTY_DRAFT: OnboardingDraft = {
  concernKeys: [],
  otherSelected: false,
  otherText: "",
  detailText: "",
  situation: null,
};

/** 최대 길이로 자른다. 서로게이트 쌍이 잘리면 깨진 글자를 남기지 않는다. */
export function clampText(value: string, max: number): string {
  if (value.length <= max) return value;
  let out = value.slice(0, max);
  const last = out.charCodeAt(out.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) out = out.slice(0, -1);
  return out;
}

/** 일반 칩 선택/해제. 이미 max개이면 새 선택은 차단하고 blocked=true를 돌려준다. */
export function toggleConcern(
  selected: readonly string[],
  key: string,
  max: number = MAX_CONCERN_CHIPS,
): { selected: string[]; blocked: boolean } {
  if (selected.includes(key)) {
    return { selected: selected.filter((k) => k !== key), blocked: false };
  }
  if (selected.length >= max) {
    return { selected: [...selected], blocked: true };
  }
  return { selected: [...selected, key], blocked: false };
}

/**
 * 선택하지 않은 칩을 비활성화해야 하는지. 이미 max개를 골랐다면 고르지 않은 칩은 비활성이고,
 * 선택된 칩은 해제할 수 있다. 하나를 해제하면 나머지는 다시 활성화된다. '기타'는 이 제한의 영향을 받지 않는다(호출하지 않는다).
 */
export function isChipDisabled(
  selected: readonly string[],
  key: string,
  max: number = MAX_CONCERN_CHIPS,
): boolean {
  return !selected.includes(key) && selected.length >= max;
}

export type DraftErrors = {
  /** 일반 칩 0개이고 '기타' 내용도 비어 있음 */
  concern?: "none" | "too-many";
  situation?: "missing";
};

export function validateDraft(draft: OnboardingDraft): {
  ok: boolean;
  errors: DraftErrors;
} {
  const errors: DraftErrors = {};
  if (draft.concernKeys.length > MAX_CONCERN_CHIPS) {
    errors.concern = "too-many";
  } else if (draft.concernKeys.length === 0 && draft.otherText.trim().length === 0) {
    errors.concern = "none";
  }
  if (draft.situation === null) {
    errors.situation = "missing";
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * 저장소(브라우저 임시 저장 등)에서 읽은 알 수 없는 값을 안전한 초안으로 만든다.
 * 알 수 없는 칩 key 제거, 중복 제거, 3개 초과 제거, 길이 제한, 잘못된 상황 값 제거.
 */
export function sanitizeDraft(
  raw: unknown,
  allowedChipKeys: readonly string[],
  detailMax: number,
): OnboardingDraft {
  if (typeof raw !== "object" || raw === null) return { ...EMPTY_DRAFT };
  const r = raw as Record<string, unknown>;

  const keys: string[] = [];
  if (Array.isArray(r.concernKeys)) {
    for (const k of r.concernKeys) {
      if (
        typeof k === "string" &&
        allowedChipKeys.includes(k) &&
        !keys.includes(k) &&
        keys.length < MAX_CONCERN_CHIPS
      ) {
        keys.push(k);
      }
    }
  }

  const otherText =
    typeof r.otherText === "string" ? clampText(r.otherText, OTHER_TEXT_MAX) : "";

  return {
    concernKeys: keys,
    // 기타는 토글 없이 입력창만 있다. 내용이 있으면 선택, 비어 있으면 미선택으로 본다(예전 저장값의 선택 표시는 무시).
    otherSelected: otherText.trim().length > 0,
    otherText,
    detailText:
      typeof r.detailText === "string" ? clampText(r.detailText, detailMax) : "",
    situation:
      typeof r.situation === "string" && SITUATIONS.includes(r.situation as Situation)
        ? (r.situation as Situation)
        : null,
  };
}
