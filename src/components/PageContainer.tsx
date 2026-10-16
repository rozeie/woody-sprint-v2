import type { ReactNode } from "react";

/**
 * 화면 좌우 여백. 바깥 폭은 앱 프레임(layout.tsx, 최대 480px 중앙)이 정하므로 이 컴포넌트는 모든 폭에서 좌우 20px만 둔다.
 * fill: 중앙 컬럼이 화면 높이를 채우는 세로 flex가 되어, 안쪽 요소를 화면 아래쪽에 붙일 수 있다(첫 화면의 시작하기).
 */
export function PageContainer({
  children,
  className = "",
  fill = false,
}: {
  children: ReactNode;
  className?: string;
  fill?: boolean;
}) {
  return (
    <div className={`px-5 ${fill ? "flex flex-1 flex-col" : ""} ${className}`}>
      <div className={`w-full ${fill ? "flex flex-1 flex-col" : ""}`}>{children}</div>
    </div>
  );
}
