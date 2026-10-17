"use client";

import { useRef, useState } from "react";
import { useReaderEnv } from "@/components/reader/reader-env";

export type SelectNotice = { contentId: string; tone: "ok" | "error"; text: string };

/**
 * 자료 선택 동작(상세 미리보기의 학습 시작 확인 시트에서 호출한다). 처리 중에는 다른 요청을 시작하지 않아 빠른 중복 클릭이 1건만 처리된다.
 * 결과(성공, 이미 선택, 다른 자료 선택됨, 회차 만료, 오류)를 notice로 알리고, 저장 상태가 바뀌면 onChanged로 화면을 갱신한다.
 * select는 저장에 성공했는지(selected: 리더로 이동해도 되는지)를 돌려준다. 실패나 만료면 false이며 호출 측은 이동하지 않는다.
 */
export function useSelectAction(
  onChanged: (info: { contentId: string; selected: boolean }) => Promise<void> | void,
) {
  const { repo: getRepo } = useReaderEnv();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<SelectNotice | null>(null);
  // 렌더와 무관한 진행 중 표시. state는 비동기 갱신이라 연속 클릭을 막지 못한다.
  const busyRef = useRef(false);

  async function select(args: { setId: string; contentId: string; title: string }): Promise<boolean> {
    if (busyRef.current) return false;
    busyRef.current = true;
    setPendingId(args.contentId);
    setNotice(null);
    let selected = false;
    try {
      const out = await getRepo().selectContent({ setId: args.setId, contentId: args.contentId });
      selected = out.status === "selected" || out.status === "already-selected";
      if (selected) {
        setNotice({ contentId: args.contentId, tone: "ok", text: `‘${args.title}’을(를) 선택했어요. 서재에 저장했어요.` });
      } else if (out.status === "set-has-selection") {
        setNotice({
          contentId: args.contentId,
          tone: "error",
          text: "이번 추천에서는 이미 다른 자료를 선택했어요. 선택은 바꿀 수 없어요.",
        });
      } else if (out.status === "expired") {
        setNotice({
          contentId: args.contentId,
          tone: "error",
          text: "추천이 새로 바뀌었어요. 이전 추천의 자료는 선택할 수 없어요. 홈에서 새 추천을 확인해 주세요.",
        });
      } else {
        setNotice({
          contentId: args.contentId,
          tone: "error",
          text: "지금 추천에 없는 자료예요. 홈에서 추천을 다시 확인해 주세요.",
        });
      }
      await onChanged({ contentId: args.contentId, selected });
    } catch {
      selected = false;
      setNotice({ contentId: args.contentId, tone: "error", text: "저장하지 못했어요. 다시 시도해 주세요." });
    } finally {
      busyRef.current = false;
      setPendingId(null);
    }
    return selected;
  }

  return { pendingId, busy: pendingId !== null, notice, select };
}
