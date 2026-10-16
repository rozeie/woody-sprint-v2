import Link from "next/link";
import { ArrowLeftIcon } from "./ui/icons";

/** 상단 바 (최소 56px). 하단 탐색이 없는 선형 화면(온보딩 등)에서 쓴다. */
export function TopBar({
  backHref,
  backLabel = "이전 화면으로",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="flex min-h-14 items-center gap-1">
      {backHref ? (
        <Link
          href={backHref}
          aria-label={backLabel}
          className="-ml-3 inline-flex h-12 w-12 items-center justify-center rounded-btn text-fg hover:bg-surface-subtle"
        >
          <ArrowLeftIcon />
        </Link>
      ) : null}
      <span className="text-card-title font-bold">Stack</span>
    </header>
  );
}
