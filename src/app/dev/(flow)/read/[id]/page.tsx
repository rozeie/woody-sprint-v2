import { notFound } from "next/navigation";
import ReadPage from "@/app/read/[id]/page";
import { DEMO_CONTENT_IDS } from "@/lib/content";

export function generateStaticParams() {
  return DEMO_CONTENT_IDS.map((id) => ({ id }));
}

/** 개발용 리더: 실제 리더 화면을 개발용 저장소로 연다(개발 환경 전용, 운영에서는 404). */
export default function DevReadPage(props: PageProps<"/dev/read/[id]">) {
  if (process.env.NODE_ENV === "production") notFound();
  return <ReadPage params={props.params} searchParams={props.searchParams} />;
}
