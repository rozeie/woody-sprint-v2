import type { ReactNode } from "react";

/**
 * 화면 좌우 여백과 중앙 컬럼 (DESIGN §5, §10).
 * 320~359px: 16px, 360~767px: 20px, 768px 이상: 좌우 32px와 콘텐츠 최대 720px 중앙 한 열.
 * reader: 긴 글 리더는 모든 폭에서 본문 최대 680px (DESIGN §8).
 */
export function PageContainer({
  children,
  className = "",
  reader = false,
}: {
  children: ReactNode;
  className?: string;
  reader?: boolean;
}) {
  return (
    <div className={`px-4 min-[360px]:px-5 md:px-8 ${className}`}>
      <div className={`mx-auto w-full ${reader ? "max-w-[680px]" : "max-w-[720px]"}`}>{children}</div>
    </div>
  );
}
