"use client";

import { useId, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * 데모 고지: 화면마다 이 한 곳에서만 알린다(개별 카드와 섹션에 반복하지 않는다).
 * 홈과 미리보기는 예시 자료와 모의 추천이라는 점을, 학습 화면은 본문이 예시라는 점을, 나머지 화면은 모의 분석이라는 점을 알린다.
 * 기본 안내는 한 줄로 줄이고(홈은 예시 자료와 모의 추천 안내를 한 줄 더), 화면별 상세한 한계는 "자세히"로 펼쳐 확인한다(접근 가능한 버튼, aria-expanded).
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

/** 화면이 바뀌면 접힌 상태로 돌아간다(key). 글자 크기는 14px를 유지하고 패딩과 줄 간격만 줄였다. */
function Notice({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const { title, body } = noticeFor(pathname);
  return (
    <div data-demo-notice className="bg-surface-subtle px-5 py-1.5 text-center text-caption leading-5 text-fg-secondary">
      <p>
        <strong className="font-semibold text-fg">UI 데모:</strong> 실제 AI 분석과 서버 저장은 제공하지 않아요.
        {pathname === "/home" && " 예시 자료와 모의 추천을 사용해요."}{" "}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen((v) => !v)}
          className="inline-block rounded-btn px-1 font-semibold text-fg underline underline-offset-2"
        >
          {open ? "접기" : "자세히"}
        </button>
      </p>
      {open && (
        <p id={detailId} className="mt-1">
          <strong className="font-semibold text-fg">{title}</strong>
          <span> — {body}</span>
        </p>
      )}
    </div>
  );
}

export function DemoNotice() {
  const pathname = usePathname() ?? "";
  return <Notice key={pathname} pathname={pathname} />;
}
