import { ChevronLeftIcon } from "./ui/icons";

/**
 * 제목이 가운데에 오는 하위 화면 상단 바(미리보기, 리더가 함께 쓴다).
 * 높이 56px, 뒤로가기 터치 영역 48px(왼쪽 쉐브론), 제목은 뒤로가기 버튼을 뺀 남은 공간이 아니라
 * 화면 좌우 여백 안쪽 전체 너비의 가운데에 둔다(좌우 여백이 같으므로 앱 프레임의 가운데와 일치한다).
 */
export function ScreenHeader({
  title,
  onBack,
  backLabel = "이전 화면으로",
}: {
  title: string;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <header className="relative flex h-14 items-center">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="-ml-3 inline-flex size-12 items-center justify-center rounded-btn text-fg transition-colors duration-150 hover:bg-surface-subtle"
      >
        <ChevronLeftIcon />
      </button>
      <span data-screen-header-title className="pointer-events-none absolute inset-x-0 text-center text-card-title font-bold">
        {title}
      </span>
    </header>
  );
}
