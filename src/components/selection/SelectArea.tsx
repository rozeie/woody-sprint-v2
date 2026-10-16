import { Button, ButtonLink } from "@/components/ui/Button";
import type { ContentState } from "@/lib/selection-rules";
import type { SelectNotice } from "./useSelectAction";

export const CHANGE_NOTICE = "선택한 학습 자료는 변경할 수 없어요.";

/** 선택한 자료의 상태별 학습 버튼 이름과 상태 문구 */
const MINE: Record<ContentState, { action: string; hint: string }> = {
  selected: { action: "바로 학습 시작", hint: "선택함. 서재에 저장됐어요." },
  reading: { action: "이어서 읽기", hint: "읽는 중이에요." },
  completed: { action: "다시 읽기", hint: "학습을 완료했어요." },
};

/** 카드의 두 버튼: 공간이 있으면 한 줄에 나란히, 좁거나 글자가 커지면 세로로 쌓여 글자가 잘리지 않는다(rem 기준) */
const CARD_BUTTON = "!w-auto flex-1 basis-[9rem]";

/**
 * 선택 영역 (PRD F2-04, F2-05, DESIGN §1.1): 선택 버튼 바로 옆에 "선택한 학습 자료는 변경할 수 없어요."를 상시 보여 준다.
 * 선택 확인 모달은 쓰지 않는다(PRD 미확정, 상시 안내로 갈음). 선택은 서재 저장까지만 하고 학습 시작이나 완료로 처리하지 않는다.
 * - 아직 선택 전: 선택하기 버튼과 변경 불가 안내
 * - 이 자료를 선택함: 상태에 맞는 학습 버튼(바로 학습 시작, 이어서 읽기, 다시 읽기)이 곧바로 리더 본문으로 연결된다
 * - 이번 묶음에서 다른 자료를 선택함: 선택 버튼 비활성과 이유(교체 전까지 유지)
 */
export function SelectArea({
  contentId,
  title,
  state,
  otherSelected,
  pending,
  busy,
  notice,
  onSelect,
  layout,
  previewHref,
}: {
  contentId: string;
  title: string;
  /** 이 자료를 선택했다면 그 상태, 선택하지 않았다면 null */
  state: ContentState | null;
  otherSelected: boolean;
  pending: boolean;
  busy: boolean;
  notice: SelectNotice | null;
  onSelect: () => void;
  layout: "card" | "page";
  /** 카드 레이아웃에서 나란히 둘 "상세 미리보기" 링크 */
  previewHref?: string;
}) {
  const hintId = `select-hint-${contentId}-${layout}`;
  const myNotice = notice && notice.contentId === contentId ? notice : null;
  const compact = layout === "card";

  const action = state ? (
    <ButtonLink
      href={`/read/${contentId}`}
      compact={compact}
      className={compact ? CARD_BUTTON : ""}
      data-start={contentId}
      aria-label={`‘${title}’ ${MINE[state].action}`}
    >
      {MINE[state].action}
    </ButtonLink>
  ) : (
    <Button
      compact={compact}
      className={compact ? CARD_BUTTON : ""}
      aria-disabled={otherSelected || busy || undefined}
      aria-describedby={hintId}
      aria-label={`‘${title}’ 선택하기`}
      onClick={() => {
        if (otherSelected || busy) return; // 비활성이거나 처리 중이면 아무것도 하지 않는다
        onSelect();
      }}
    >
      {pending ? "저장 중…" : layout === "page" ? "이 자료 선택하기" : "선택하기"}
    </Button>
  );

  const hint = state
    ? MINE[state].hint
    : otherSelected
      ? "이번 추천에서는 다른 자료를 이미 선택했어요."
      : CHANGE_NOTICE;

  return (
    <div className={compact ? "mt-3" : ""}>
      {compact ? (
        <div className="flex flex-wrap gap-2">
          {previewHref && (
            <ButtonLink
              href={previewHref}
              compact
              className={CARD_BUTTON}
              variant="secondary"
              aria-label={`‘${title}’ 상세 미리보기`}
            >
              상세 미리보기
            </ButtonLink>
          )}
          {action}
        </div>
      ) : (
        action
      )}
      <p id={hintId} className="mt-1 text-caption text-fg-secondary">
        {hint}
      </p>
      {/* 성공 안내는 위의 상태 문구와 같은 뜻이라 화면 낭독용으로만 둔다. 오류는 눈에 보이게 알린다. */}
      <p
        role={myNotice?.tone === "error" ? "alert" : "status"}
        className={myNotice?.tone === "error" ? "mt-1 text-caption text-danger" : "sr-only"}
      >
        {myNotice?.text}
      </p>
    </div>
  );
}
