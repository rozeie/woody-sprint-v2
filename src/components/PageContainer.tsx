import type { ReactNode } from "react";

/**
 * 화면 좌우 여백과 중앙 컬럼 (DESIGN §5, §10).
 * 320~359px: 16px, 360~767px: 20px, 768px 이상: 좌우 32px와 콘텐츠 최대 720px 중앙 한 열.
 * reader: 긴 글 리더는 모든 폭에서 본문 최대 680px (DESIGN §8).
 * fill: 중앙 컬럼이 화면 높이를 채우는 세로 flex가 되어, 안쪽 요소를 화면 아래쪽에 붙일 수 있다(첫 화면의 시작하기).
 */
export function PageContainer({
  children,
  className = "",
  reader = false,
  fill = false,
}: {
  children: ReactNode;
  className?: string;
  reader?: boolean;
  fill?: boolean;
}) {
  return (
    <div className={`px-4 min-[360px]:px-5 md:px-8 ${fill ? "flex flex-1 flex-col" : ""} ${className}`}>
      <div
        className={`mx-auto w-full ${reader ? "max-w-[680px]" : "max-w-[720px]"} ${
          fill ? "flex flex-1 flex-col" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
