import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { PageContainer } from "./PageContainer";

/**
 * 하단 탐색이 있는 화면(홈/서재/설정)의 공통 틀.
 * 탐색 바는 문서 흐름 안의 sticky라서 마지막 내용을 가리지 않는다.
 */
export function TabScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PageContainer className="flex-1 pb-8 pt-6">{children}</PageContainer>
      <BottomNav />
    </div>
  );
}
