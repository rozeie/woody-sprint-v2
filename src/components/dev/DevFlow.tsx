"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Chip } from "@/components/ui/Chip";
import { Button, ButtonLink } from "@/components/ui/Button";
import { DEV_APP_PATHS, ReaderEnvProvider, type ReaderEnv } from "@/components/reader/reader-env";
import { createDemoRepository } from "@/lib/data/demo-repository";
import { clearPrefixed, prefixedStorage } from "@/lib/data/storage-scope";
import { CONCERN_CHIPS } from "@/config/ui-provisional";

/**
 * 개발 환경 전용 전체 학습 흐름(홈, 미리보기, 리더, 서재). 운영 빌드에서는 라우트가 404다.
 * 실제 화면 컴포넌트와 추천 함수를 그대로 쓰고, 저장 공간만 접두어로 분리한다(실제 사용자 키 stack-demo:v1:*는 읽지도 쓰지도 않는다).
 * 경로는 /dev 아래 같은 구성(DEV_APP_PATHS)이라 화면을 오가도 같은 개발용 저장소를 쓴다.
 * 다른 개발 확인 화면(/dev/reader)의 접두어(stack-dev-reader:)와도 겹치지 않는다.
 */
export const DEV_HOME_PREFIX = "stack-dev-home:";
const NS = "stack-demo:v1";
const SCENARIO_KEY = "scenario";

export const SCENARIOS = [
  { key: "ux-writing", label: "UX 라이팅" },
  { key: "dev-collab", label: "개발자 협업" },
  { key: "usability-test", label: "사용성 테스트" },
  { key: "accessibility", label: "접근성 고려" },
] as const;
type ScenarioKey = (typeof SCENARIOS)[number]["key"];

const isScenario = (v: unknown): v is ScenarioKey => SCENARIOS.some((s) => s.key === v);

/** 시나리오의 주제가 확정된 개발용 상태를 만든다. 추천 묶음은 만들지 않는다(홈이 실제 추천 함수로 만든다). */
function seedScenario(storage: Storage, key: ScenarioKey): void {
  const dev = prefixedStorage(storage, DEV_HOME_PREFIX);
  const label = CONCERN_CHIPS.find((c) => c.key === key)?.label ?? key;
  dev.setItem(SCENARIO_KEY, key);
  dev.setItem(
    `${NS}:confirmed-direction`,
    JSON.stringify({
      coreDirection: { label: `개발 확인용: ${label}`, description: "개발용 확인 화면에서 시나리오로 만든 가짜 학습 방향이에요." },
      topics: [{ key, label }],
      edited: false,
      reanalysisCount: 0,
      confirmedAt: new Date().toISOString(),
    }),
  );
}

export function DevFlow({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // init: 저장된 시나리오 확인 / pick: 시나리오 없음 / resetting: 화면을 내리고 개발용 저장소만 비운 뒤 다시 만듦 / ready
  const [phase, setPhase] = useState<"init" | "pick" | "resetting" | "ready">("init");
  const [scenario, setScenario] = useState<ScenarioKey | null>(null);
  const [pending, setPending] = useState<ScenarioKey | null>(null);

  const env = useMemo<ReaderEnv>(() => {
    const scoped = () => prefixedStorage(window.localStorage, DEV_HOME_PREFIX);
    const repo = createDemoRepository(scoped);
    return { repo: () => repo, readingStorage: scoped, paths: DEV_APP_PATHS };
  }, []);

  useEffect(() => {
    if (phase === "init") {
      const saved = window.localStorage.getItem(`${DEV_HOME_PREFIX}${SCENARIO_KEY}`);
      queueMicrotask(() => {
        if (isScenario(saved)) {
          setScenario(saved);
          setPhase("ready");
        } else {
          setPhase("pick");
        }
      });
    } else if (phase === "resetting" && pending) {
      // 리더를 먼저 내려 학습 시간의 마지막 구간이 저장된 뒤에, 개발용 접두어의 키만 지운다(브라우저 전체 저장소 삭제 아님)
      clearPrefixed(window.localStorage, DEV_HOME_PREFIX);
      seedScenario(window.localStorage, pending);
      const next = pending;
      if (pathname !== DEV_APP_PATHS.home) router.replace(DEV_APP_PATHS.home);
      queueMicrotask(() => {
        setScenario(next);
        setPending(null);
        setPhase("ready");
      });
    }
  }, [phase, pending, pathname, router]);

  // 시나리오 없이 홈이 아닌 개발 화면을 열면 시나리오를 고르는 홈으로 보낸다
  useEffect(() => {
    if (phase === "pick" && pathname !== DEV_APP_PATHS.home) router.replace(DEV_APP_PATHS.home);
  }, [phase, pathname, router]);

  function start(key: ScenarioKey) {
    setPending(key);
    setPhase("resetting");
  }

  return (
    <ReaderEnvProvider value={env}>
      <div data-dev-flow className="border-b border-line bg-surface-subtle px-5 py-3">
        <p className="text-caption font-bold text-fg">개발용 확인 화면 (운영 화면 아님)</p>
        <p className="mt-1 text-caption text-fg-secondary">
          시나리오로 만든 가짜 학습 방향과 선택, 미션과 회고, 완료, 읽기 시간은 실제 사용자 기록과 학습 스택에 반영되지 않는 별도 공간에만 저장돼요.
        </p>
        <div role="group" aria-label="시나리오" className="mt-2 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <Chip key={s.key} label={s.label} selected={(pending ?? scenario) === s.key} onClick={() => start(s.key)} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            compact
            data-dev-reset
            aria-disabled={!scenario || undefined}
            onClick={() => {
              if (scenario) start(scenario);
            }}
          >
            테스트 상태 초기화
          </Button>
          {/* 일반 서비스로 돌아가는 명시적 동작: 실제 경로는 실제 사용자 저장소만 쓴다 */}
          <ButtonLink href="/home" variant="secondary" compact data-dev-exit>
            일반 서비스로
          </ButtonLink>
        </div>
        <p role="status" className="mt-2 text-caption text-fg-secondary">
          {scenario ? `현재 시나리오: ${SCENARIOS.find((s) => s.key === scenario)?.label}` : "시나리오를 고르면 그 주제가 확정된 상태로 시작해요."}
        </p>
      </div>
      {phase === "ready" && scenario ? children : null}
    </ReaderEnvProvider>
  );
}
