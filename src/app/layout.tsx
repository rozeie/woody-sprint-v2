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
      <body className="flex min-h-dvh flex-col antialiased">
        <DemoNotice />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
