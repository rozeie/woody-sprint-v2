import { notFound } from "next/navigation";
import PreviewPage from "@/app/content/[id]/preview/page";
import { DEMO_CONTENT_IDS } from "@/lib/content";

export function generateStaticParams() {
  return DEMO_CONTENT_IDS.map((id) => ({ id }));
}

/** 개발용 미리보기: 실제 미리보기 화면을 개발용 저장소로 연다(개발 환경 전용, 운영에서는 404). */
export default function DevPreviewPage(props: PageProps<"/dev/content/[id]/preview">) {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewPage params={props.params} searchParams={props.searchParams} />;
}
