"use client";

import { usePathname } from "next/navigation";

/**
 * 데모 고지: 화면마다 이 한 곳에서만 알린다(개별 카드와 섹션에 반복하지 않는다).
 * 홈과 미리보기는 예시 자료와 모의 추천이라는 점을, 학습 화면은 본문이 예시라는 점을, 나머지 화면은 모의 분석이라는 점을 알린다.
 * 사용자 지시에 따라 가운데 점 문자는 쓰지 않는다. 제목과 설명은 콜론과 대시로 구분한다.
 */
function noticeFor(pathname: string): { title: string; body: string } {
  if (pathname === "/home") {
    return {
      title: "UI 데모: 모의 추천",
      body: "예시 자료(검수 전)와 모의 추천 이유예요. 읽기 시간 측정은 아직 없고, 추천은 서버가 아니라 이 브라우저에서 접속할 때 오후 6시(한국 시간) 기준으로 바뀌어요.",
    };
  }
  if (pathname.startsWith("/content/")) {
    return {
      title: "UI 데모: 모의 추천",
      body: "예시 자료(검수 전)와 모의 추천 이유예요. 선택은 이 브라우저에만 임시 저장돼요.",
    };
  }
  if (pathname === "/library") {
    return {
      title: "UI 데모: 모의 서재",
      body: "선택하고 읽은 기록은 이 브라우저에만 임시 저장돼요. 회고와 삭제는 아직 없어요.",
    };
  }
  if (pathname.startsWith("/read/")) {
    return {
      title: "UI 데모: 학습 화면",
      body: "본문은 UI 확인용으로 미리 쓴 예시이고 검수된 콘텐츠가 아니에요. 읽기 시간 측정은 없어서 학습 스택에는 반영되지 않아요.",
    };
  }
  return {
    title: "UI 데모: 모의 분석/추천",
    body: "실제 AI 분석, 개인화, 서버 저장이 아니에요.",
  };
}

export function DemoNotice() {
  const { title, body } = noticeFor(usePathname() ?? "");
  return (
    <div
      data-demo-notice
      className="bg-surface-subtle px-4 py-2 text-center text-caption text-fg-secondary min-[360px]:px-5"
    >
      <strong className="font-semibold text-fg">{title}</strong>
      <span> — {body}</span>
    </div>
  );
}
