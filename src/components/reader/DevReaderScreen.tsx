"use client";

import { useEffect, useMemo, useState } from "react";
import { SOURCE_CONTENTS } from "@/config/source-contents";
import { CONCERN_CHIPS } from "@/config/ui-provisional";
import { createDemoRepository } from "@/lib/data/demo-repository";
import { clearPrefixed, prefixedStorage } from "@/lib/data/storage-scope";
import { Button } from "@/components/ui/Button";
import { APP_PATHS, ReaderEnvProvider, type ReaderEnv } from "./reader-env";
import { ReaderScreen } from "./ReaderScreen";

/** 개발 확인용 저장 공간의 키 접두어. 실제 사용자 키(stack-demo:v1:...)와 겹치지 않는다. */
export const DEV_PREFIX = "stack-dev-reader:";
export const DEV_CONTENT_ID = "nng-five-users-usability-testing";
export const DEV_SET_ID = "dev-reader-set";

const NS = "stack-demo:v1";

/** 원문 기반 자료들이 다루는 주제(개발 확인용 가짜 학습 방향의 확정 주제). 연결 설명이 모두 보이게 한다 */
const DEV_TOPICS = [...new Set(SOURCE_CONTENTS.flatMap((c) => c.topics))].map((key) => ({
  key,
  label: CONCERN_CHIPS.find((c) => c.key === key)?.label ?? key,
}));

/** 개발 확인용 저장 공간에 가짜 학습 방향과 `읽기 전` 상태의 선택 기록을 만든다. 이미 있는 항목은 그대로 둔다. */
function ensureSeed(storage: Storage, contentId: string): void {
  const dev = prefixedStorage(storage, DEV_PREFIX);
  const nowIso = new Date().toISOString();
  if (dev.getItem(`${NS}:confirmed-direction`) === null) {
    dev.setItem(
      `${NS}:confirmed-direction`,
      JSON.stringify({
        coreDirection: { label: "개발 확인용 방향", description: "개발용 리더 확인 화면의 가짜 학습 방향이에요." },
        topics: DEV_TOPICS,
        edited: false,
        reanalysisCount: 0,
        confirmedAt: nowIso,
      }),
    );
  }
  let list: Record<string, unknown>[] = [];
  try {
    const raw = JSON.parse(dev.getItem(`${NS}:user-contents`) ?? "[]");
    if (Array.isArray(raw)) list = raw;
  } catch {
    list = [];
  }
  if (!list.some((u) => u.contentId === contentId)) {
    list.push({ contentId, setId: `${DEV_SET_ID}-${contentId}`, selectedAt: nowIso, startedAt: null, completedAt: null });
    dev.setItem(`${NS}:user-contents`, JSON.stringify(list));
  }
}

/**
 * 개발 환경 전용 리더 확인 화면(운영 빌드에서는 라우트가 404).
 * 실제 ReaderScreen을 그대로 쓰되, 저장 공간만 접두어로 분리한다.
 * 완료 상태, 미니미션과 회고, 읽기 시간 모두 이 분리된 공간에만 쌓이고 실제 사용자 기록과 학습 스택에는 닿지 않는다.
 */
export function DevReaderScreen({ contentId = DEV_CONTENT_ID }: { contentId?: string }) {
  const [phase, setPhase] = useState<"init" | "resetting" | "ready">("init");
  const env = useMemo<ReaderEnv>(() => {
    const scoped = () => prefixedStorage(window.localStorage, DEV_PREFIX);
    const repo = createDemoRepository(scoped);
    return { repo: () => repo, readingStorage: scoped, paths: APP_PATHS };
  }, []);

  // 처음 열 때는 분리된 공간에 없는 항목만 읽기 전 상태로 만든다(이전 확인 내용은 이어서 보인다).
  // 초기화는 리더를 먼저 내린 뒤(자식 정리 함수가 학습 시간의 마지막 구간을 저장한다) 이 공간만 비우고 다시 만든다.
  useEffect(() => {
    if (phase === "ready") return;
    if (phase === "resetting") clearPrefixed(window.localStorage, DEV_PREFIX);
    ensureSeed(window.localStorage, contentId);
    queueMicrotask(() => setPhase("ready"));
  }, [phase, contentId]);

  return (
    <ReaderEnvProvider value={env}>
      <div data-dev-reader className="-mx-5 mb-2 border-b border-line bg-surface-subtle px-5 py-3">
        <p className="text-caption font-bold text-fg">개발용 확인 화면 (운영 화면 아님)</p>
        <p className="mt-1 text-caption text-fg-secondary">
          완료, 미니미션, 회고, 읽기 시간은 실제 사용자 기록과 학습 스택에 반영되지 않는 별도 공간에만 저장돼요.
        </p>
        <div className="mt-2">
          <Button variant="secondary" compact data-dev-reset onClick={() => setPhase("resetting")}>
            테스트 상태 초기화
          </Button>
        </div>
      </div>
      {phase === "ready" && <ReaderScreen contentId={contentId} />}
    </ReaderEnvProvider>
  );
}
