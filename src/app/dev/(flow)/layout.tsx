import { notFound } from "next/navigation";
import { DevFlow } from "@/components/dev/DevFlow";

/**
 * 개발 환경 전용 전체 흐름(/dev/home, /dev/library, /dev/content/[id]/preview, /dev/read/[id])의 공통 틀.
 * 운영 빌드에서는 존재하지 않는 페이지(404)다. 각 페이지도 같은 검사를 한다.
 */
export default function DevFlowLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevFlow>{children}</DevFlow>;
}
