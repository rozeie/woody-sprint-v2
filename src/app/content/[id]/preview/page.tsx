import { Suspense } from "react";
import { PageContainer } from "@/components/PageContainer";
import { PreviewScreen } from "@/components/preview/PreviewScreen";
import { DEMO_CONTENT_IDS } from "@/lib/content";

export function generateStaticParams() {
  return DEMO_CONTENT_IDS.map((id) => ({ id }));
}

/** params를 읽는 부분만 Suspense 안에 둔다(바깥 틀은 즉시 보이게 하고, 요청 시점 데이터 접근 오류를 피한다). */
async function PreviewContent({ params }: { params: PageProps<"/content/[id]/preview">["params"] }) {
  const { id } = await params;
  return <PreviewScreen contentId={id} />;
}

export default function PreviewPage({ params }: PageProps<"/content/[id]/preview">) {
  return (
    <PageContainer className="pb-10">
      <Suspense
        fallback={
          <p role="status" className="py-10 text-body text-fg-secondary">
            미리보기를 불러오는 중이에요…
          </p>
        }
      >
        <PreviewContent params={params} />
      </Suspense>
    </PageContainer>
  );
}
