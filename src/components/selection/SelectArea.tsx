import { Button, ButtonLink } from "@/components/ui/Button";
import type { ContentState } from "@/lib/selection-rules";
import type { SelectNotice } from "./useSelectAction";

/** 선택한 자료의 상태별 학습 버튼 이름과 상태 문구 */
const MINE: Record<ContentState, { action: string; hint: string }> = {
  selected: { action: "학습 시작하기", hint: "선택함. 서재에 저장됐어요." },
  reading: { action: "이어서 읽기", hint: "읽는 중이에요." },
  completed: { action: "다시 읽기", hint: "학습을 완료했어요." },
};

/**
 * 선택 영역(상세 미리보기 화면에서만 쓴다. 홈 카드에는 선택 동작이 없다) (PRD F2-04, F2-05).
 * - 아직 선택 전: "학습 시작하기"를 누르면 저장하지 않고 확인 시트를 연다(시트는 PreviewScreen이 둔다). "변경할 수 없어요" 안내는 상시로 두지 않고 시트에서만 한다
 * - 이 자료를 선택함: 확인 시트 없이 상태에 맞는 버튼(학습 시작하기, 이어서 읽기, 다시 읽기)이 곧바로 리더 본문으로 연결된다
 * - 이번 묶음에서 다른 자료를 선택함: 시작 버튼 비활성과 이유(교체 전까지 유지)
 */
export function SelectArea({
  contentId,
  title,
  state,
  otherSelected,
  busy,
  notice,
  onOpenConfirm,
}: {
  contentId: string;
  title: string;
  /** 이 자료를 선택했다면 그 상태, 선택하지 않았다면 null */
  state: ContentState | null;
  otherSelected: boolean;
  busy: boolean;
  notice: SelectNotice | null;
  onOpenConfirm: () => void;
}) {
  const hintId = `select-hint-${contentId}`;
  const myNotice = notice && notice.contentId === contentId ? notice : null;

  const action = state ? (
    <ButtonLink href={`/read/${contentId}`} data-start={contentId} aria-label={`‘${title}’ ${MINE[state].action}`}>
      {MINE[state].action}
    </ButtonLink>
  ) : (
    <Button
      aria-disabled={otherSelected || busy || undefined}
      aria-describedby={otherSelected ? hintId : undefined}
      aria-haspopup="dialog"
      aria-label={`‘${title}’ 학습 시작하기`}
      data-open-start-sheet
      onClick={() => {
        if (otherSelected || busy) return; // 비활성이거나 처리 중이면 아무것도 하지 않는다
        onOpenConfirm();
      }}
    >
      학습 시작하기
    </Button>
  );

  const hint = state ? MINE[state].hint : otherSelected ? "이번 추천에서는 다른 자료를 이미 선택했어요." : null;

  return (
    <div>
      {action}
      {hint && (
        <p id={hintId} className="mt-2 text-caption text-fg-secondary">
          {hint}
        </p>
      )}
      {/* 성공 안내는 상태 문구와 같은 뜻이라 화면 낭독용으로만 둔다. 오류는 눈에 보이게 알린다. */}
      <p
        role={myNotice?.tone === "error" ? "alert" : "status"}
        className={myNotice?.tone === "error" ? "mt-2 text-caption text-danger" : "sr-only"}
      >
        {myNotice?.text}
      </p>
    </div>
  );
}
