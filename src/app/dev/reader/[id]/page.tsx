import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/PageContainer";
import { DevReaderScreen } from "@/components/reader/DevReaderScreen";
import { SOURCE_CONTENTS } from "@/config/source-contents";

export function generateStaticParams() {
  return SOURCE_CONTENTS.map((c) => ({ id: c.id }));
}

async function DevContent({ params }: { params: PageProps<"/dev/reader/[id]">["params"] }) {
  const { id } = await params;
  if (!SOURCE_CONTENTS.some((c) => c.id === id)) notFound(); // 원문 기반 자료만 확인할 수 있다
  return <DevReaderScreen contentId={id} />;
}

/**
 * 개발 환경 전용 리더 확인 경로(/dev/reader/자료id). 운영 빌드에서는 존재하지 않는 페이지(404)다.
 * 실제 리더와 같은 컴포넌트를 쓰되 저장 공간은 실제 사용자 기록과 분리한다.
 */
export default function DevReaderByIdPage({ params }: PageProps<"/dev/reader/[id]">) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <PageContainer className="pb-12">
        <Suspense fallback={<p role="status" className="py-10 text-body text-fg-secondary">확인 화면을 여는 중이에요…</p>}>
          <DevContent params={params} />
        </Suspense>
      </PageContainer>
    </div>
  );
}
