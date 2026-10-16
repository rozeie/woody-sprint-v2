"use client";

import { useEffect, useRef, useState } from "react";
import { CONCERN_GROUPS } from "@/config/ui-provisional";

/**
 * 세부 주제 추가 바텀시트. 기본 dialog 요소의 모달로 만들어 열린 동안 포커스가 안에 머물고 뒤 화면은 비활성이 된다.
 * 고른 주제는 시트 안의 임시 선택일 뿐이며 '적용'을 눌러야 한 번에 반영한다. 바깥 클릭과 Escape는 임시 선택을 버리고 닫는다.
 * 올라오고 내려가는 움직임은 globals.css의 stack-sheet 애니메이션이며 '움직임 줄이기' 설정에서는 즉시 끝난다.
 */
export function AddTopicSheet({
  open,
  existingKeys,
  maxTopics,
  onApply,
  onCancel,
  onClosed,
}: {
  open: boolean;
  existingKeys: readonly string[];
  maxTopics: number;
  onApply: (keys: string[]) => void;
  onCancel: () => void;
  onClosed: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const busyRef = useRef(false);
  const prevOverflow = useRef<string | null>(null);

  // 열리면 모달을 띄우고 뒤 화면의 스크롤을 잠근다(스크롤 위치는 그대로). 닫기 요청(open=false)은 내려가는 움직임으로 처리한다.
  useEffect(() => {
    const el = ref.current;
    if (!el || !open) return;
    busyRef.current = false;
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

  const full = existingKeys.length + selected.length >= maxTopics;
  // 이미 목록에 있는 주제는 선택지에서 빼고, 남는 항목이 없는 카테고리는 제목도 숨긴다
  const groups = CONCERN_GROUPS.map((g) => ({ name: g.name, chips: g.chips.filter((c) => !existingKeys.includes(c.key)) })).filter(
    (g) => g.chips.length > 0,
  );

  function toggle(key: string) {
    setSelected((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key); // 한도에 닿아도 해제는 할 수 있다
      if (cur.length + existingKeys.length >= maxTopics) return cur;
      return [...cur, key];
    });
  }

  function apply() {
    if (busyRef.current || selected.length === 0) return; // 적용 중 중복 실행 차단
    busyRef.current = true;
    onApply(selected);
  }

  function finishClose() {
    ref.current?.close();
    if (prevOverflow.current !== null) document.body.style.overflow = prevOverflow.current;
    prevOverflow.current = null;
    setSelected([]); // 취소했던 임시 선택은 다시 열었을 때 남지 않는다
    onClosed();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="add-sheet-title"
      onCancel={(e) => {
        e.preventDefault(); // Escape: 선택을 버리고 내려가며 닫는다
        if (!busyRef.current) onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busyRef.current) onCancel(); // 어두운 바깥 영역
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
        <div className="border-b border-line">
          <div className="flex w-full items-center justify-between gap-3 px-4 py-1">
            <h2 id="add-sheet-title" className="text-card-title font-bold">
              학습 주제 추가
            </h2>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={apply}
              className="inline-flex min-h-12 shrink-0 items-center rounded-btn px-2 text-label font-semibold text-primary transition-colors duration-150 hover:text-primary-hover disabled:cursor-not-allowed disabled:text-disabled-fg"
            >
              적용
            </button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain pb-6">
          <div className="w-full px-4">
            <p className="mt-3 text-caption text-fg-secondary">
              학습 주제는 기존 항목을 포함해 최대 {maxTopics}개까지 선택할 수 있어요.
            </p>
            {groups.map((group) => (
              <div key={group.name} role="group" aria-label={group.name} className="mt-3">
                <p className="text-caption font-semibold text-fg-secondary">{group.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-2">
                  {group.chips.map((c) => {
                    const on = selected.includes(c.key);
                    const blocked = !on && full; // 한도에 닿으면 고르지 않은 항목은 실제 disabled(1단계 비활성 칩과 같은 스타일)
                    const look = on
                      ? "bg-chip-selected text-surface"
                      : blocked
                        ? "bg-disabled-bg text-disabled-fg opacity-60"
                        : "bg-surface-subtle text-fg-secondary group-hover:bg-line";
                    return (
                      <button
                        key={c.key}
                        type="button"
                        aria-pressed={on}
                        disabled={blocked}
                        onClick={() => toggle(c.key)}
                        className={`group inline-flex min-h-12 items-center ${blocked ? "cursor-not-allowed" : ""}`}
                      >
                        <span
                          className={`inline-flex h-9 items-center rounded-chip px-3 text-label font-semibold transition-colors duration-150 ${look}`}
                        >
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="mt-3 text-caption text-fg-secondary">추가할 수 있는 주제가 더 없어요.</p>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
