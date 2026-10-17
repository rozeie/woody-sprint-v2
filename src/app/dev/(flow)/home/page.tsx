import { notFound } from "next/navigation";
import HomePage from "@/app/home/page";

/** 개발용 홈: 실제 홈 화면을 개발용 저장소로 연다(개발 환경 전용, 운영에서는 404). */
export default function DevHomePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <HomePage />;
}
