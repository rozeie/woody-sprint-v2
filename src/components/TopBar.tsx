import Link from "next/link";
import { ChevronLeftIcon } from "./ui/icons";

/**
 * 온보딩 상단 바(입력 1~5단계, 분석 로딩과 오류, 결과 화면이 함께 쓴다). 서비스명 없이 뒤로가기만 둔다.
 * 높이 48px, 뒤로가기 터치 영역 48px, 진행 표시까지의 간격은 각 화면이 같은 값(pt-2)으로 맞춘다.
 * backHref는 링크, onBack은 같은 모양의 버튼(입력 단계 사이 이동)이다.
 */
export function TopBar({
  backHref,
  onBack,
  backLabel = "이전 화면으로",
}: {
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  const cls =
    "-ml-3 inline-flex h-12 w-12 items-center justify-center rounded-btn bg-transparent text-fg transition-colors duration-150 hover:bg-transparent hover:text-fg-secondary";
  return (
    <header className="flex h-12 items-center">
      {onBack ? (
        <button type="button" aria-label={backLabel} onClick={onBack} className={cls}>
          <ChevronLeftIcon />
        </button>
      ) : backHref ? (
        <Link href={backHref} aria-label={backLabel} className={cls}>
          <ChevronLeftIcon />
        </Link>
      ) : null}
    </header>
  );
}
