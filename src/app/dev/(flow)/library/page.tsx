import { notFound } from "next/navigation";
import LibraryPage from "@/app/library/page";

/** 개발용 서재: 실제 서재 화면을 개발용 저장소로 연다(개발 환경 전용, 운영에서는 404). */
export default function DevLibraryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <LibraryPage />;
}
