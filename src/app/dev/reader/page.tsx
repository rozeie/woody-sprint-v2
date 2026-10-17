import { notFound } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { DevReaderScreen } from "@/components/reader/DevReaderScreen";

/**
 * 개발 환경 전용 리더 확인 경로(/dev/reader). 운영 빌드에서는 존재하지 않는 페이지(404)다.
 * 실제 리더와 같은 컴포넌트를 쓰되 저장 공간은 실제 사용자 기록과 분리한다.
 */
export default function DevReaderPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <PageContainer className="pb-12">
        <DevReaderScreen />
      </PageContainer>
    </div>
  );
}
