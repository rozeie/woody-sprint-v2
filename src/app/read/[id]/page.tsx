import { Suspense } from "react";
import { PageContainer } from "@/components/PageContainer";
import { ReaderScreen } from "@/components/reader/ReaderScreen";
import { DEMO_CONTENT_IDS } from "@/lib/content";

export function generateStaticParams() {
  return DEMO_CONTENT_IDS.map((id) => ({ id }));
}

/** params를 읽는 부분만 Suspense 안에 둔다(바깥 틀은 즉시 보이게 하고, 요청 시점 데이터 접근 오류를 피한다). */
async function ReadContent({ params }: { params: PageProps<"/read/[id]">["params"] }) {
  const { id } = await params;
  return <ReaderScreen contentId={id} />;
}

/** 긴 글 리더: 읽기 표면은 흰색, 본문 폭은 최대 680px (DESIGN §8). 하단 탐색은 없다. */
export default function ReadPage({ params }: PageProps<"/read/[id]">) {
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <PageContainer reader className="pb-12">
        <Suspense
          fallback={
            <p role="status" className="py-10 text-body text-fg-secondary">
              학습 화면을 여는 중이에요…
            </p>
          }
        >
          <ReadContent params={params} />
        </Suspense>
      </PageContainer>
    </div>
  );
}
