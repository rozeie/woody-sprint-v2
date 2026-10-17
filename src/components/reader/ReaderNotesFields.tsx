"use client";

import { useEffect, useRef, useState } from "react";
import { NOTE_MAX } from "@/lib/reader-notes";
import { useReaderEnv } from "./reader-env";
import { TextArea } from "@/components/ui/TextArea";

const SAVE_DELAY_MS = 600;

/**
 * 선택 입력(미니미션 답, 짧은 회고). 자료별로 이 브라우저에 자동 저장하고 새로고침과 재열람 때 복원한다.
 * 비워 두어도 학습 완료에는 영향이 없다. 평가나 AI 피드백, 서버 전송은 없다.
 * 입력이 멈추면 저장하고, 화면이 숨겨지거나 리더를 벗어날 때도 마지막 내용을 저장한다.
 */
export function useReaderNotes(contentId: string, hasMission: boolean, hasReflection: boolean) {
  const { repo } = useReaderEnv();
  const [mission, setMission] = useState("");
  const [reflection, setReflection] = useState("");
  const [loaded, setLoaded] = useState(false);
  const latest = useRef({ mission: "", reflection: "" });
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasMission && !hasReflection) return;
    let alive = true;
    repo()
      .getReaderNotes(contentId)
      .then((n) => {
        if (!alive) return;
        latest.current = { mission: n.mission, reflection: n.reflection };
        setMission(n.mission);
        setReflection(n.reflection);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [contentId, hasMission, hasReflection, repo]);

  useEffect(() => {
    function save() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      if (!dirty.current) return;
      dirty.current = false;
      void repo().saveReaderNotes(contentId, latest.current);
    }
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", save);
      save(); // 리더를 벗어날 때 마지막 입력을 저장한다
    };
  }, [contentId, repo]);

  function change(field: "mission" | "reflection", value: string) {
    if (!loaded) return;
    latest.current = { ...latest.current, [field]: value };
    if (field === "mission") setMission(value);
    else setReflection(value);
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      dirty.current = false;
      void repo().saveReaderNotes(contentId, latest.current);
    }, SAVE_DELAY_MS);
  }

  return {
    loaded,
    mission,
    reflection,
    setMission: (v: string) => change("mission", v),
    setReflection: (v: string) => change("reflection", v),
  };
}

/** TextArea에 예시 문구를 보조 설명(hint)으로 붙인 입력. 라벨은 화면에서 숨기고 보조 기술에는 전달한다. */
export function NoteField({
  id,
  label,
  example,
  value,
  onChange,
}: {
  id: string;
  label: string;
  example: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return <TextArea id={id} label={label} hideLabel hint={example} value={value} max={NOTE_MAX} onChange={onChange} rows={6} />;
}
