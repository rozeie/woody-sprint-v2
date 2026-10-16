"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONCERN_CHIPS, CONCERN_GROUPS, PROVISIONAL } from "@/config/ui-provisional";
import { getAnalysisService, readDemoMode } from "@/lib/analysis";
import { getContentService } from "@/lib/content";
import { getRepository } from "@/lib/data";
import {
  addTopic,
  availableToAdd,
  canConfirm,
  removeTopic,
  toConfirmed,
  topicsFromAnalysis,
  type DirectionDraft,
} from "@/lib/direction-rules";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Spinner } from "@/components/ui/Spinner";
import { AlertIcon } from "@/components/ui/icons";

const SITUATION_LABEL = { job_seeker: "취업 준비생", junior: "주니어 실무자" } as const;
const chipLabel = new Map(CONCERN_CHIPS.map((c) => [c.key, c.label]));
const ADD_TOGGLE_ID = "add-toggle";

/** 저장된 결과 초안을 불러온 뒤 결과 화면을 보여준다. 결과가 없으면 입력 화면으로 돌려보낸다. */
export function DirectionScreen() {
  const router = useRouter();
  const [loaded, setLoaded] = useState<{ draft: DirectionDraft | null } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = getRepository();
      // 이미 학습 방향을 확정했다면 이 화면에서 다시 확정해 방향·추천을 덮어쓰지 못하게 홈으로 보낸다
      if (await repo.hasConfirmedDirection()) {
        if (alive) router.replace("/home");
        return;
      }
      const draft = await repo.getDirectionDraft();
      if (!alive) return;
      if (!draft) router.replace("/onboarding");
      else setLoaded({ draft });
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (!loaded || !loaded.draft) {
    return (
      <p role="status" className="py-10 text-body text-fg-secondary">
        분석 결과를 불러오는 중이에요…
      </p>
    );
  }
  // 저장된 내용이 달라지면(새 분석 등) 편집 상태를 새로 시작하도록 key에 반영
  const d = loaded.draft;
  const viewKey = `${d.analysis.interpretation}|${d.reanalysisCount}|${d.topics.map((t) => t.key).join(",")}`;
  return <DirectionView key={viewKey} initial={d} />;
}

function DirectionView({ initial }: { initial: DirectionDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<DirectionDraft>(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeFailed, setReanalyzeFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const busyRef = useRef(false);
  const attemptRef = useRef(0);
  const confirmingRef = useRef(false);
  // 삭제·추가 뒤 포커스가 사라지지 않도록 옮길 대상을 요청한다 (키보드·스크린리더 사용자 배려)
  const [focusRequest, setFocusRequest] = useState<{ target: string; n: number } | null>(null);

  useEffect(() => {
    if (!focusRequest) return;
    const el =
      focusRequest.target === ADD_TOGGLE_ID
        ? document.getElementById(ADD_TOGGLE_ID)
        : document.querySelector<HTMLElement>(`[data-remove="${focusRequest.target}"]`);
    el?.focus();
  }, [focusRequest]);

  function requestFocus(target: string) {
    setFocusRequest((prev) => ({ target, n: (prev?.n ?? 0) + 1 }));
  }

  const { input, analysis, topics } = draft;
  const maxTopics = PROVISIONAL.maxSubTopics;
  const atMax = topics.length >= maxTopics;
  const hasTopics = canConfirm(topics);
  const limit = PROVISIONAL.reanalyzeLimit;
  const limitReached = limit !== null && draft.reanalysisCount >= limit;
  const addable = availableToAdd(CONCERN_CHIPS, topics);

  // 데모 임시 저장: 편집할 때마다 저장(서버 저장이 아님)
  function commit(next: DirectionDraft) {
    setDraft(next);
    void getRepository().saveDirectionDraft(next);
  }

  function onRemove(key: string, label: string) {
    if (reanalyzing) return;
    const index = topics.findIndex((t) => t.key === key);
    const neighbor = topics[index + 1] ?? topics[index - 1];
    commit({ ...draft, topics: removeTopic(topics, key) });
    setNotice(`‘${label}’ 주제를 삭제했어요.`);
    requestFocus(neighbor ? neighbor.key : ADD_TOGGLE_ID); // 남은 항목 또는 주제 추가 버튼으로
  }

  function onAdd(key: string, label: string) {
    if (reanalyzing) return;
    const result = addTopic(topics, { key, label }, maxTopics);
    if (result.blocked) return;
    commit({ ...draft, topics: result.topics });
    if (result.topics.length >= maxTopics) setAddOpen(false); // 최대에 닿으면 패널을 닫아 둔다(삭제 후 저절로 다시 열리지 않게)
    setNotice(`‘${label}’ 주제를 추가했어요.`);
    requestFocus(ADD_TOGGLE_ID); // 누른 칩이 목록에서 사라지므로 추가 버튼으로
  }

  async function onReanalyze() {
    if (busyRef.current || limitReached) return; // 중복 실행 차단
    busyRef.current = true;
    attemptRef.current += 1;
    setReanalyzing(true);
    setReanalyzeFailed(false);
    setNotice("");
    try {
      const variant = draft.reanalysisCount + 1;
      const result = await getAnalysisService().analyze({
        input: draft.input,
        variant,
        attempt: attemptRef.current,
        demo: readDemoMode(),
      });
      attemptRef.current = 0;
      commit({
        ...draft,
        analysis: result,
        topics: topicsFromAnalysis(result),
        reanalysisCount: variant,
      });
      setAddOpen(false);
      setNotice("새로운 분석 결과로 바꿨어요. 이전에 수정한 세부 주제는 새 결과로 대체됐어요.");
    } catch {
      setReanalyzeFailed(true); // 기존 결과·편집 내용은 그대로 둔다
    } finally {
      busyRef.current = false;
      setReanalyzing(false);
    }
  }

  async function onConfirm() {
    if (!hasTopics || reanalyzing || confirmingRef.current) return; // 0개 확정 불가·중복 차단
    confirmingRef.current = true;
    const repo = getRepository();
    const confirmed = toConfirmed(draft, new Date().toISOString());
    const { ok } = await repo.confirmDirection(confirmed);
    if (!ok) {
      // 다른 탭 등에서 이미 확정됨: 기존 확정 방향과 추천을 그대로 두고 홈으로 간다
      router.replace("/home");
      return;
    }
    try {
      // 최초 확정 직후 추천 2개를 바로 만든다(PRD F1-05 ⑥). 실패해도 홈에서 다시 만든다.
      const set = await getContentService().createRecommendation({
        direction: confirmed,
        input: draft.input,
      });
      await repo.saveRecommendationSet(set);
    } catch {
      /* 홈 진입 시 다시 생성 */
    }
    router.push("/home");
  }

  return (
    <div className="pb-10">
      <h1 className="text-page-title font-bold">AI가 제안한 학습 방향</h1>
      <p className="mt-2 text-body text-fg-secondary">
        입력하신 내용만으로 만든 제안이에요. 능력이나 수준을 평가한 결과가 아니고, 아래에서 확인하고 고칠 수
        있어요.
      </p>
      <p className="mt-2 text-caption text-fg-muted">
        모의 분석 결과예요. 실제 AI가 아니라 입력한 칩에 맞춰 미리 만든 문장이에요.
      </p>

      {/* 1. 입력한 고민 */}
      <section aria-labelledby="sec-input" className="mt-8">
        <h2 id="sec-input" className="text-section-title font-bold">
          내가 입력한 고민
        </h2>
        <dl className="mt-3 space-y-3 rounded-card bg-surface p-4 text-body">
          {input.concernKeys.length > 0 && (
            <div>
              <dt className="text-caption font-semibold text-fg-secondary">고민 영역</dt>
              <dd>{input.concernKeys.map((k) => chipLabel.get(k) ?? k).join(", ")}</dd>
            </div>
          )}
          {input.otherSelected && input.otherText.trim() && (
            <div>
              <dt className="text-caption font-semibold text-fg-secondary">기타</dt>
              <dd className="whitespace-pre-wrap">{input.otherText}</dd>
            </div>
          )}
          {input.detailText.trim() && (
            <div>
              <dt className="text-caption font-semibold text-fg-secondary">추가 설명</dt>
              <dd className="whitespace-pre-wrap">{input.detailText}</dd>
            </div>
          )}
          {input.situation && (
            <div>
              <dt className="text-caption font-semibold text-fg-secondary">현재 상황</dt>
              <dd>{SITUATION_LABEL[input.situation]}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* 2. 해석한 어려움 */}
      <section aria-labelledby="sec-interpretation" className="mt-8">
        <h2 id="sec-interpretation" className="text-section-title font-bold">
          AI가 해석한 현재 어려움
        </h2>
        <p className="mt-3 text-body">{analysis.interpretation}</p>
      </section>

      {/* 3. 핵심 학습 방향 (읽기 전용) */}
      <section aria-labelledby="sec-core" className="mt-8">
        <h2 id="sec-core" className="text-section-title font-bold">
          핵심 학습 방향
        </h2>
        <div className="mt-3 rounded-card border border-line bg-surface p-4">
          <p className="text-card-title font-semibold">{analysis.coreDirection.label}</p>
          <p className="mt-2 text-body text-fg-secondary">{analysis.coreDirection.description}</p>
          <p className="mt-3 text-caption text-fg-muted">
            AI가 제안한 항목이라 직접 고칠 수 없어요. 방향이 맞지 않으면 다시 분석하거나 입력 화면에서 고민을
            바꿔 주세요.
          </p>
        </div>
      </section>

      {/* 4. 세부 학습 주제 (삭제·추가) */}
      <section aria-labelledby="sec-topics" className="mt-8">
        <h2 id="sec-topics" className="text-section-title font-bold">
          세부 학습 주제
        </h2>
        <p className="mt-1 text-caption text-fg-secondary">
          AI가 2~3개를 제안했어요. 맞지 않으면 삭제하고, 필요한 주제는 추가할 수 있어요.
        </p>

        <ul className="mt-3 space-y-3">
          {topics.map((t) => (
            <li key={t.key} className="rounded-card border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="text-card-title font-semibold">{t.label}</p>
                  <p className="mt-1 text-caption text-fg-muted">
                    {t.source === "ai" ? "AI 제안" : "내가 추가"}
                  </p>
                  {t.why && <p className="mt-2 text-body text-fg-secondary">{t.why}</p>}
                </div>
                <button
                  type="button"
                  data-remove={t.key}
                  aria-label={`‘${t.label}’ 주제 삭제`}
                  aria-disabled={reanalyzing || undefined}
                  onClick={() => onRemove(t.key, t.label)}
                  className="inline-flex min-h-12 items-center rounded-btn bg-danger-bg px-4 text-label font-semibold text-danger transition-colors duration-150 aria-disabled:cursor-not-allowed aria-disabled:bg-disabled-bg aria-disabled:text-disabled-fg"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>

        <p role="status" className="mt-2 min-h-6 text-caption text-fg-secondary">
          {notice}
        </p>

        {!hasTopics && (
          <p className="mt-2 flex items-start gap-2 rounded-btn bg-warning-bg px-3 py-2 text-caption text-warning">
            <AlertIcon className="mt-0.5 shrink-0" />
            <span>세부 주제가 하나도 없으면 확정할 수 없어요. 아래에서 주제를 추가해 주세요.</span>
          </p>
        )}

        <div className="mt-3">
          <button
            id={ADD_TOGGLE_ID}
            type="button"
            aria-expanded={addOpen}
            aria-controls="add-panel"
            aria-disabled={atMax || reanalyzing || undefined}
            aria-describedby="add-hint"
            onClick={() => {
              if (atMax || reanalyzing) return;
              setAddOpen((v) => !v);
            }}
            className="inline-flex min-h-13 w-full items-center justify-center rounded-btn border border-line-control bg-surface px-5 text-label font-semibold text-fg transition-colors duration-150 hover:bg-surface-subtle aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-disabled-bg aria-disabled:text-disabled-fg aria-disabled:hover:bg-disabled-bg"
          >
            {addOpen && !atMax ? "주제 추가 닫기" : "주제 추가"}
          </button>
          <p id="add-hint" className="mt-1 text-caption text-fg-secondary">
            {atMax
              ? `세부 주제는 최대 ${maxTopics}개까지 둘 수 있어요(데모 임시 기준). 추가하려면 먼저 삭제해 주세요.`
              : `최대 ${maxTopics}개까지 둘 수 있어요(데모 임시 기준).`}
          </p>
        </div>

        {addOpen && !atMax && (
          <div id="add-panel" className="mt-3 rounded-card bg-surface p-4">
            <p className="text-label font-semibold">추가할 주제를 눌러 주세요</p>
            {addable.length === 0 ? (
              <p className="mt-2 text-caption text-fg-secondary">추가할 수 있는 주제가 더 없어요.</p>
            ) : (
              CONCERN_GROUPS.map((group) => {
                const items = group.chips.filter((c) => addable.some((a) => a.key === c.key));
                if (items.length === 0) return null;
                return (
                  <div key={group.name} role="group" aria-label={group.name} className="mt-3">
                    <p className="text-caption font-semibold text-fg-secondary">{group.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-2">
                      {items.map((c) => (
                        <Chip
                          key={c.key}
                          label={c.label}
                          selected={false}
                          onClick={() => onAdd(c.key, c.label)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* 5. 간단 설명 */}
      <section aria-labelledby="sec-summary" className="mt-8">
        <h2 id="sec-summary" className="text-section-title font-bold">
          추천 학습 방향 설명
        </h2>
        <p className="mt-3 text-body">{analysis.directionSummary}</p>
      </section>

      {/* 6. 다시 분석하기 / 확정 */}
      <section aria-label="결과 확정" className="mt-8">
        {reanalyzeFailed && (
          <div className="mb-4">
            <Alert tone="error" title="다시 분석하지 못했어요">
              지금 보이는 결과와 수정한 내용은 그대로 남아 있어요. 다시 시도해 주세요.
            </Alert>
          </div>
        )}

        <Button
          variant="secondary"
          onClick={onReanalyze}
          aria-disabled={reanalyzing || limitReached || undefined}
          aria-describedby="reanalyze-hint"
        >
          {reanalyzing ? (
            <span className="inline-flex items-center gap-2">
              <Spinner />
              분석 중…
            </span>
          ) : (
            "다시 분석하기"
          )}
        </Button>
        <p id="reanalyze-hint" className="mt-1 text-caption text-fg-secondary">
          {limitReached
            ? "다시 분석할 수 있는 횟수를 모두 사용했어요."
            : "같은 입력으로 다시 분석해요. 지금까지 수정한 세부 주제는 새 결과로 바뀌어요."}
        </p>

        <div className="mt-6">
          <Button
            onClick={onConfirm}
            aria-disabled={!hasTopics || reanalyzing || undefined}
            aria-describedby="confirm-hint"
          >
            이 학습 방향으로 확정하기
          </Button>
          <p id="confirm-hint" className="mt-1 text-caption text-fg-secondary">
            {!hasTopics
              ? "세부 주제를 1개 이상 남겨야 확정할 수 있어요."
              : reanalyzing
                ? "분석이 끝나면 확정할 수 있어요."
                : "확정하면 이 방향을 기준으로 홈에 추천 자료 2개가 나와요(모의 추천이에요)."}
          </p>
        </div>
      </section>
    </div>
  );
}
