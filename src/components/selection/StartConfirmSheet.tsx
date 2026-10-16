"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

/**
 * 학습 시작 확인 바텀시트. 상세 미리보기에서 아직 선택하지 않은 자료의 "학습 시작하기"를 눌렀을 때만 연다(웹과 모바일이 같다).
 * 시트를 여는 것만으로는 선택을 저장하거나 학습 시작 기록을 만들지 않는다. 시트 안의 "학습 시작하기"를 눌러야 선택이 저장된다.
 * AddTopicSheet와 같은 방식: 기본 dialog 모달(포커스는 안에 머물고 닫히면 누른 버튼으로 돌아감), 어두운 배경, 열린 동안 배경 스크롤 잠금(스크롤 위치 유지),
 * 바깥 클릭과 Escape는 저장 없이 닫기, globals.css의 stack-sheet 애니메이션(움직임 줄이기에서는 즉시 끝남).
 * 저장 중(pending)에는 닫기와 중복 실행을 막는다.
 */
export function StartConfirmSheet({
  open,
  pending,
  onConfirm,
  onCancel,
  onClosed,
}: {
  open: boolean;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClosed: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const prevOverflow = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !open) return;
    if (!el.open) el.showModal();
    if (prevOverflow.current === null) prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }, [open]);

  useEffect(
    () => () => {
      if (prevOverflow.current !== null) document.body.style.overflow = prevOverflow.current;
    },
    [],
  );

  function finishClose() {
    ref.current?.close(); // 열기 전에 포커스가 있던 버튼으로 포커스가 돌아온다
    if (prevOverflow.current !== null) document.body.style.overflow = prevOverflow.current;
    prevOverflow.current = null;
    onClosed();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="start-sheet-title"
      aria-describedby="start-sheet-desc"
      onCancel={(e) => {
        e.preventDefault(); // Escape: 저장하지 않고 내려가며 닫는다
        if (!pending) onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel(); // 어두운 바깥 영역
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-end bg-transparent p-0 text-fg open:flex backdrop:bg-black/50"
    >
      <div
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && !open) finishClose();
        }}
        className={`mx-auto flex max-h-[85dvh] w-full max-w-[480px] flex-col rounded-t-2xl bg-surface shadow-lg ${
          open ? "stack-sheet-enter" : "stack-sheet-exit"
        }`}
      >
        <div className="min-h-0 w-full overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
          <h2 id="start-sheet-title" className="text-card-title font-bold">
            이 자료로 학습을 시작할까요?
          </h2>
          <p id="start-sheet-desc" className="mt-2 text-body text-fg-secondary">
            이번 추천에서는 한 자료만 선택할 수 있어요. 선택한 자료는 변경할 수 없고, 서재에 보관돼요.
          </p>
          {/* 설명과 CTA 사이 기본 120px. 높이가 낮은 화면에서는 간격을 줄이고, 그래도 넘치면 시트 안에서 스크롤한다(고정 높이 없음) */}
          <div className="mt-30 [@media(max-height:640px)]:mt-6">
            <Button aria-disabled={pending || undefined} onClick={() => !pending && onConfirm()}>
              {pending ? "저장 중…" : "학습 시작하기"}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
