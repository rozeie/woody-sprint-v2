"use client";

import { useEffect, useState } from "react";
import { formatCountdown, remainingMs } from "@/lib/recommendation-cycle";

/**
 * 다음 추천 교체(한국 시간 오후 6시)까지 남은 시간을 HH:MM:SS로 매초 보여 준다.
 * 숫자를 하나씩 빼지 않고 매번 현재 시각과 다음 오후 6시의 차이로 계산하므로 탭이 숨겨졌다 돌아와도 바로 맞는다.
 * 다음 초 경계에 맞춰 setTimeout을 하나만 예약하고(겹쳐 쌓이지 않음), 탭 복귀와 포커스 때 즉시 다시 계산한다.
 * 화면 읽기 도구에는 매초 바뀌는 숫자를 숨기고, 바뀌지 않는 안내 문구만 따로 준다.
 * Cache Components는 렌더 중 현재 시각을 읽지 못하므로 처음에는 비워 두고 효과 안에서 채운다.
 */
export function ReplaceCountdown() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      clearTimeout(timer);
      const now = Date.now();
      setText(formatCountdown(remainingMs(now)));
      timer = setTimeout(tick, 1000 - (now % 1000) + 20); // 다음 초 경계 직후
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, []);

  return (
    <>
      <p
        data-replace-countdown
        aria-hidden="true"
        className="min-h-[1.375rem] shrink-0 whitespace-nowrap text-caption font-semibold text-fg-secondary"
      >
        {text !== null && (
          <>
            교체까지 <span className="tabular-nums">{text}</span>
          </>
        )}
      </p>
      <span className="sr-only">추천은 매일 오후 6시(한국 시간)에 바뀌어요.</span>
    </>
  );
}
