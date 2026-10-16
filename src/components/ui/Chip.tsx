/**
 * 토글 칩 (DESIGN §7): 시각 높이 36px, 터치 영역 48px, 선택 시 #333D4B 배경과 흰 글자(체크 아이콘 없음, 선택 전후 크기 불변).
 * `blocked`는 선택 개수 제한으로 새 선택이 불가한 상태이고, 이때 고르지 않은 칩은 실제 비활성(disabled)이다.
 * 이미 선택한 칩은 비활성이 아니라 해제할 수 있다. 이유 안내는 칩 묶음 아래의 상시 문구가 맡는다.
 */
export function Chip({
  label,
  selected,
  blocked = false,
  onClick,
  describedBy,
}: {
  label: string;
  selected: boolean;
  blocked?: boolean;
  onClick: () => void;
  describedBy?: string;
}) {
  const look = selected
    ? "border-transparent bg-chip-selected text-surface"
    : blocked
      ? "border-transparent bg-disabled-bg text-disabled-fg opacity-60"
      : "border-transparent bg-surface-subtle text-fg-secondary group-hover:bg-line";

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={blocked && !selected}
      aria-describedby={describedBy}
      onClick={onClick}
      className={`group inline-flex min-h-12 items-center ${
        blocked && !selected ? "cursor-not-allowed" : ""
      }`}
    >
      <span
        className={`inline-flex h-9 items-center gap-1 rounded-chip border px-3 text-label font-semibold transition-colors duration-150 ${look}`}
      >
        {label}
      </span>
    </button>
  );
}
