import { CheckIcon } from "./icons";

/**
 * 토글 칩 (DESIGN §7): 시각 높이 36px, 터치 영역 48px, 선택 시 체크 + 진한 경계.
 * `blocked`는 선택 개수 제한으로 새 선택이 불가한 상태. 포커스는 유지하고(aria-disabled)
 * 눌렀을 때 이유를 안내할 수 있게 한다.
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
    ? "border-primary-ink bg-primary-tint text-primary-ink"
    : blocked
      ? "border-transparent bg-disabled-bg text-disabled-fg"
      : "border-transparent bg-surface-subtle text-fg-secondary group-hover:bg-line";

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={blocked && !selected ? true : undefined}
      aria-describedby={describedBy}
      onClick={onClick}
      className={`group inline-flex min-h-12 items-center ${
        blocked && !selected ? "cursor-not-allowed" : ""
      }`}
    >
      <span
        className={`inline-flex h-9 items-center gap-1 rounded-chip border px-3 text-label font-semibold transition-colors duration-150 ${look}`}
      >
        {selected && <CheckIcon />}
        {label}
      </span>
    </button>
  );
}
