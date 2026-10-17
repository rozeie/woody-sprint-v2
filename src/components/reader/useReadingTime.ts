"use client";

import { useEffect } from "react";
import { createReadingStore } from "@/lib/data/reading-store";
import { useReaderEnv } from "./reader-env";
import { ReadingTracker, TICK_MS } from "@/lib/reading-time";

/**
 * 리더에서 학습 시간을 쌓는다(규칙은 lib/reading-time.ts).
 * 이 화면이 보이고(visible) 브라우저가 이 문서에 포커스가 있는 동안만 센다. 탭이 숨겨지거나 포커스를 잃거나 리더를 벗어나면(정리 함수)
 * 마지막 구간을 반영하고 멈춘다. 외부 원문 탭에서 보낸 시간은 이 탭이 숨겨지거나 포커스를 잃은 상태이므로 세지 않는다.
 * 스크롤, 클릭, 입력 여부는 보지 않는다.
 */
export function useReadingTime(enabled: boolean): void {
  const { readingStorage } = useReaderEnv();
  useEffect(() => {
    if (!enabled) return;
    let tracker: ReadingTracker;
    try {
      tracker = new ReadingTracker({
        now: () => Date.now(),
        store: createReadingStore(readingStorage()),
        ownerId: crypto.randomUUID(),
      });
    } catch {
      return; // 저장소를 쓸 수 없으면 기록하지 않는다
    }
    const isActive = () => document.visibilityState === "visible" && document.hasFocus();
    const sync = () => {
      if (isActive()) tracker.start();
      else tracker.stop();
    };
    const stop = () => tracker.stop();
    const timer = setInterval(() => {
      sync(); // 놓친 이벤트가 있어도 매 초 상태를 다시 맞춘다
      tracker.tick();
    }, TICK_MS);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("blur", stop);
    window.addEventListener("pagehide", stop);
    sync();
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("blur", stop);
      window.removeEventListener("pagehide", stop);
      tracker.stop(); // 리더를 벗어나면 마지막 구간을 반영하고 멈춘다
    };
  }, [enabled, readingStorage]);
}
