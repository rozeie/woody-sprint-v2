import type { Metadata, Viewport } from "next";
import { DemoNotice } from "@/components/DemoNotice";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stack",
  description:
    "하루 10분, 커리어에 필요한 배움을 차곡차곡 쌓아가는 서비스 (UI 데모)",
};

// 사용자 확대를 막지 않는다(maximumScale/userScalable 미지정). safe area 사용을 위해 cover.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <body className="antialiased">
        {/* 모든 화면의 공통 앱 프레임: 최대 480px, 가운데 정렬(480px 이하에서는 화면 너비를 채운다). 장식 테두리와 그림자는 없다 */}
        <div data-app-frame className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background">
          <DemoNotice />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
