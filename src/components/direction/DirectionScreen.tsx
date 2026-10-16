"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { TopicItem } from "@/lib/direction-rules";
import { CONCERN_CHIPS, PROVISIONAL } from "@/config/ui-provisional";
import { getAnalysisService, readDemoMode } from "@/lib/analysis";
import { getContentService } from "@/lib/content";
import { getRepository } from "@/lib/data";
import {
  addTopic,
  canConfirm,
  isEdited,
  removeTopic,
  toConfirmed,
  topicsFromAnalysis,
  type DirectionDraft,
} from "@/lib/direction-rules";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ProgressSteps } from "@/components/onboarding/ProgressSteps";
import { Spinner } from "@/components/ui/Spinner";
import { AlertIcon, PlusIcon } from "@/components/ui/icons";
import { AddTopicSheet } from "./AddTopicSheet";
import { CompassGraphic, MoreIcon, TopicGraphic } from "./TopicGraphic";

const SITUATION_LABEL = { job_seeker: "취업 준비생", junior: "주니어 실무자" } as const;
const chipLabel = new Map(CONCERN_CHIPS.map((c) => [c.key, c.label]));
const ADD_TOGGLE_ID = "add-toggle";
const UNDO_MS = 5000;
const TOAST_MS = 3000;
const APPLY_TOAST_MS = 5000;

type UndoState = { topic: TopicItem; index: number };

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
  const [menuKey, setMenuKey] = useState<string | null>(null); // 더보기 메뉴가 열린 주제
  const [undo, setUndo] = useState<UndoState | null>(null); // 방금 삭제한 주제(5초간 되돌릴 수 있음)
  const [toast, setToast] = useState<string | null>(null); // 짧은 토스트(주제 추가, 확정 불가 안내)
  const [confirmOpen, setConfirmOpen] = useState(false); // 수정한 주제가 있을 때 재분석 확인창
  const [confirming, setConfirming] = useState(false);
  const addToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // 메뉴가 열려 있을 때 바깥 클릭과 Escape로 닫는다
  useEffect(() => {
    if (menuKey === null) return;
    function onPointerDown(e: PointerEvent) {
      if (!(e.target instanceof Element) || !e.target.closest("[data-topic-menu]")) setMenuKey(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const key = menuKey;
      setMenuKey(null);
      if (key) requestFocus(key); // 닫은 뒤 더보기 버튼으로 포커스를 돌려준다
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuKey]);

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      if (addToastTimer.current) clearTimeout(addToastTimer.current);
    },
    [],
  );

  function showToast(message: string, ms = TOAST_MS) {
    if (addToastTimer.current) clearTimeout(addToastTimer.current);
    setToast(message);
    addToastTimer.current = setTimeout(() => setToast(null), ms);
  }

  function clearUndo() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    setUndo(null);
  }

  function requestFocus(target: string) {
    setFocusRequest((prev) => ({ target, n: (prev?.n ?? 0) + 1 }));
  }

  const { input, analysis, topics } = draft;
  const maxTopics = PROVISIONAL.maxSubTopics;
  const atMax = topics.length >= maxTopics;
  const hasTopics = canConfirm(topics);
  const limit = PROVISIONAL.reanalyzeLimit;
  const limitReached = limit !== null && draft.reanalysisCount >= limit;

  // 데모 임시 저장: 편집할 때마다 저장(서버 저장이 아님)
  function commit(next: DirectionDraft) {
    setDraft(next);
    void getRepository().saveDirectionDraft(next);
  }

  function onRemove(key: string, label: string) {
    if (reanalyzing) return;
    const index = topics.findIndex((t) => t.key === key);
    const neighbor = topics[index + 1] ?? topics[index - 1];
    const removed = topics[index];
    commit({ ...draft, topics: removeTopic(topics, key) });
    setMenuKey(null);
    setNotice(`‘${label}’ 주제를 삭제했어요.`);
    if (removed) {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      setUndo({ topic: removed, index });
      undoTimer.current = setTimeout(clearUndo, UNDO_MS);
    }
    requestFocus(neighbor ? neighbor.key : ADD_TOGGLE_ID); // 남은 항목 또는 주제 추가 버튼으로
  }

  function onUndo() {
    if (!undo || reanalyzing) return;
    const { topic, index } = undo;
    if (topics.some((t) => t.key === topic.key)) {
      clearUndo();
      setNotice(`‘${topic.label}’ 주제가 이미 목록에 있어 복원하지 않았어요.`);
      return;
    }
    if (topics.length >= maxTopics) {
      // 복원하면 최대 개수를 넘으므로 막고 이유를 알린다. 이 안내는 사라지지 않고 남는다.
      clearUndo();
      setNotice(
        `세부 주제는 최대 ${maxTopics}개까지라 ‘${topic.label}’ 주제를 복원할 수 없어요. 다른 주제를 삭제한 뒤 다시 추가해 주세요.`,
      );
      return;
    }
    const next = [...topics];
    next.splice(Math.min(index, next.length), 0, topic); // 삭제 전 위치와 내용 그대로
    commit({ ...draft, topics: next });
    clearUndo();
    setNotice(`‘${topic.label}’ 주제를 복원했어요.`);
    requestFocus(topic.key);
  }

  /** 시트에서 임시로 고른 주제를 한 번에 기존 목록 뒤에 붙인다(중복과 최대 개수는 여기서도 다시 막는다). */
  function onApplyTopics(keys: string[]) {
    if (reanalyzing) return;
    let next = topics;
    for (const key of keys) {
      const result = addTopic(next, { key, label: chipLabel.get(key) ?? key }, maxTopics);
      if (!result.blocked) next = result.topics;
    }
    if (next.length !== topics.length) {
      commit({ ...draft, topics: next });
      showToast("선택한 주제를 적용했어요", APPLY_TOAST_MS);
    }
    setAddOpen(false); // 시트가 내려가며 닫힌다
  }

  /** 추가하거나 삭제한 주제가 있으면 확인창을 먼저 보이고, 없으면 바로 재분석한다. */
  function onReanalyzeClick() {
    if (busyRef.current || limitReached || confirmingRef.current) return;
    if (isEdited(analysis, topics)) setConfirmOpen(true);
    else void onReanalyze();
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
      clearUndo();
      setMenuKey(null);
      setNotice("새로운 분석 결과로 바꿨어요. 이전에 수정한 세부 주제는 새 결과로 대체됐어요.");
    } catch {
      setReanalyzeFailed(true); // 기존 결과·편집 내용은 그대로 둔다
    } finally {
      busyRef.current = false;
      setReanalyzing(false);
    }
  }

  async function onConfirm() {
    if (reanalyzing || confirmingRef.current) return; // 중복 실행 차단
    if (!hasTopics) {
      showToast("학습 주제를 1개 이상 추가해 주세요."); // 0개 확정 불가
      return;
    }
    confirmingRef.current = true;
    setConfirming(true);
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
      <div className="mb-6">
        <ProgressSteps current={5} />
      </div>
      <h1 className="text-page-title font-bold">Stack이 제안하는 학습 방향</h1>
      <p className="mt-2 text-body text-fg-secondary">
        입력한 고민을 바탕으로 제안한 학습 방향이에요. 나에게 맞는지 확인하고 세부 주제를 조정해 주세요.
      </p>

      {/* 1. 입력한 고민 */}
      <section aria-labelledby="sec-input" className="mt-6">
        <h2 id="sec-input" className="text-card-title font-semibold text-fg">
          나의 커리어 고민
        </h2>
        <dl className="mt-2 space-y-2 rounded-card bg-surface px-3 py-2.5 text-caption text-fg">
          {input.situation && (
            <div>
              <dt className="text-caption font-semibold text-fg-muted">현재 포지션</dt>
              <dd>{SITUATION_LABEL[input.situation]}</dd>
            </div>
          )}
          {input.concernKeys.length > 0 && (
            <div>
              <dt className="text-caption font-semibold text-fg-muted">고민 영역</dt>
              <dd>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {input.concernKeys.map((k) => (
                    <li
                      key={k}
                      className="rounded-chip bg-surface-subtle px-2.5 py-0.5 text-caption font-semibold text-fg"
                    >
                      {chipLabel.get(k) ?? k}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {input.otherSelected && input.otherText.trim() && (
            <div>
              <dt className="text-caption font-semibold text-fg-muted">기타</dt>
              <dd className="whitespace-pre-wrap">{input.otherText}</dd>
            </div>
          )}
          {input.detailText.trim() && (
            <div>
              <dt className="text-caption font-semibold text-fg-muted">추가 설명</dt>
              <dd className="whitespace-pre-wrap">{input.detailText}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* 2. 해석한 어려움 */}
      <section aria-labelledby="sec-interpretation" className="mt-8">
        <h2 id="sec-interpretation" className="text-section-title font-bold">
          Stack이 정리한 현재 어려움
        </h2>
        <p className="mt-3 rounded-card bg-surface p-4 text-body">{analysis.interpretation}</p>
      </section>

      {/* 3. 핵심 학습 방향 (읽기 전용) */}
      <section aria-labelledby="sec-core" className="mt-8">
        <h2 id="sec-core" className="text-section-title font-bold">
          핵심 학습 방향
        </h2>
        <div className="mt-3 rounded-card bg-surface p-4">
          <div className="flex items-start gap-4">
            <CompassGraphic className="size-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-card-title font-bold">{analysis.coreDirection.label}</p>
              <p className="mt-1 text-body text-fg-secondary">{analysis.coreDirection.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 세부 학습 주제 (삭제·추가) */}
      <section aria-labelledby="sec-topics" className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 id="sec-topics" className="text-section-title font-bold">
            세부 학습 주제
          </h2>
          <button
            id={ADD_TOGGLE_ID}
            type="button"
            aria-expanded={addOpen}
            aria-haspopup="dialog"
            aria-disabled={atMax || reanalyzing || undefined}
            onClick={() => {
              if (atMax || reanalyzing) return;
              setAddOpen((v) => !v);
            }}
            className="inline-flex min-h-12 shrink-0 items-center gap-1 rounded-btn px-2 text-label font-semibold text-primary transition-colors duration-150 hover:text-primary-hover aria-disabled:cursor-not-allowed aria-disabled:text-disabled-fg aria-disabled:hover:text-disabled-fg"
          >
            <PlusIcon />
            주제 추가
          </button>
        </div>
        <p className="mt-1 text-caption text-fg-secondary">
          추천 주제는 최대 {maxTopics}개까지 추가하거나 삭제해 조정할 수 있어요.
        </p>

        <ul className="mt-3 space-y-3">
          {topics.map((t) => {
            const open = menuKey === t.key;
            return (
              <li
                key={t.key}
                data-topic-card={t.key}
                className="relative flex items-start gap-3 rounded-card bg-surface p-4 pr-14"
              >
                <TopicGraphic topicKey={t.key} className="mt-1 h-[3.375rem] w-18 shrink-0 min-[480px]:h-[4.5rem] min-[480px]:w-24" />
                <div className="min-w-0 flex-1">
                  <p className="text-card-title font-semibold">{t.label}</p>
                  {t.source === "user" && <p className="mt-1 text-caption text-fg-muted">내가 추가</p>}
                  {t.why && <p className="mt-1 text-body text-fg-secondary">{t.why}</p>}
                </div>
                <div data-topic-menu className="absolute top-1 right-1 z-10">
                  <button
                    type="button"
                    data-remove={t.key}
                    aria-label={`‘${t.label}’ 주제 더보기 메뉴`}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-disabled={reanalyzing || undefined}
                    onClick={() => {
                      if (reanalyzing) return;
                      setMenuKey(open ? null : t.key);
                    }}
                    onKeyDown={(e) => {
                      if (reanalyzing) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setMenuKey(t.key);
                      }
                    }}
                    className="inline-flex size-12 items-center justify-center rounded-btn bg-transparent text-fg-muted transition-colors duration-150 hover:bg-transparent hover:text-fg aria-expanded:bg-transparent aria-expanded:text-fg aria-disabled:cursor-not-allowed aria-disabled:text-disabled-fg"
                  >
                    <MoreIcon />
                  </button>
                  {open && (
                    <TopicMenu
                      label={t.label}
                      onDelete={() => onRemove(t.key, t.label)}
                      onClose={() => {
                        setMenuKey(null);
                        requestFocus(t.key);
                      }}
                    />
                  )}
                </div>
              </li>
            );
          })}
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
      </section>

      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 z-30 w-[calc(100%-2.5rem)] max-w-[440px] -translate-x-1/2 rounded-card bg-chip-selected px-4 py-3 text-caption text-surface shadow-lg ${
            undo ? "bottom-20" : "bottom-4"
          }`}
        >
          {toast}
        </div>
      )}

      {undo && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-2.5rem)] max-w-[440px] -translate-x-1/2 items-center justify-between gap-3 rounded-card bg-chip-selected py-1 pr-1 pl-4 text-caption text-surface shadow-lg"
        >
          <span className="min-w-0">‘{undo.topic.label}’ 주제를 삭제했어요.</span>
          <button
            type="button"
            data-undo
            onClick={onUndo}
            className="inline-flex min-h-12 shrink-0 items-center rounded-btn px-3 text-label font-semibold text-surface underline underline-offset-2"
          >
            실행 취소
          </button>
        </div>
      )}

      {/* 5. 다시 분석하기 / 확정 */}
      <section aria-label="결과 확정" className="mt-8">
        {reanalyzeFailed && (
          <div className="mb-4">
            <Alert tone="error" title="다시 분석하지 못했어요">
              지금 보이는 결과와 수정한 내용은 그대로 남아 있어요. 다시 시도해 주세요.
            </Alert>
          </div>
        )}

        <div className="flex gap-3">
          <div className="min-w-0 flex-[2]">
            <Button
              variant="secondary"
              compact
              onClick={onReanalyzeClick}
              aria-disabled={reanalyzing || limitReached || confirming || undefined}
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
          </div>
          <div className="min-w-0 flex-[3]">
            <Button compact onClick={onConfirm} aria-disabled={reanalyzing || confirming || undefined}>
              확정하기
            </Button>
          </div>
        </div>
        {limitReached && (
          <p className="mt-2 text-caption text-fg-secondary">다시 분석할 수 있는 횟수를 모두 사용했어요.</p>
        )}
      </section>

      <AddTopicSheet
        open={addOpen}
        existingKeys={topics.map((t) => t.key)}
        maxTopics={maxTopics}
        onApply={onApplyTopics}
        onCancel={() => setAddOpen(false)}
        onClosed={() => requestFocus(ADD_TOGGLE_ID)}
      />

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void onReanalyze();
        }}
      />
    </div>
  );
}

/** 재분석 확인창. 기본 dialog 요소를 쓰므로 포커스 가두기, Escape 닫기, 닫은 뒤 포커스 복귀를 브라우저가 처리한다. */
function ConfirmDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="reanalyze-confirm-text"
      onCancel={(e) => {
        e.preventDefault(); // Escape: 닫기만 하고 수정 내용은 유지
        onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-card border border-line bg-surface p-5 text-fg shadow-lg backdrop:bg-black/40"
    >
      <p id="reanalyze-confirm-text" className="text-body">
        다시 분석하면 추가하거나 삭제한 학습 주제가 새 결과로 바뀌어요.
      </p>
      <div className="mt-5 flex gap-3">
        <div className="min-w-0 flex-1">
          <Button variant="secondary" compact autoFocus onClick={onCancel}>
            취소
          </Button>
        </div>
        <div className="min-w-0 flex-1">
          <Button compact onClick={onConfirm}>
            다시 분석하기
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/** 주제 더보기 메뉴. 열리면 '삭제' 항목으로 포커스가 가고, 방향키·Tab·Escape로 조작한다(Escape와 바깥 클릭은 부모가 처리). */
function TopicMenu({ label, onDelete, onClose }: { label: string; onDelete: () => void; onClose: () => void }) {
  const itemRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    itemRef.current?.focus();
  }, []);
  return (
    <div
      role="menu"
      aria-label={`‘${label}’ 주제 메뉴`}
      className="absolute top-11 right-0 min-w-32 rounded-card border border-line bg-surface p-1 shadow-lg"
    >
      <button
        ref={itemRef}
        type="button"
        role="menuitem"
        onClick={onDelete}
        onKeyDown={(e) => {
          if (e.key === "Tab" || e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault(); // 항목이 하나뿐이라 포커스를 메뉴 안에 둔다
            if (e.key === "Tab") onClose();
          }
        }}
        className="inline-flex min-h-12 w-full items-center rounded-btn px-3 text-label font-semibold text-danger hover:bg-danger-bg"
      >
        삭제
      </button>
    </div>
  );
}
