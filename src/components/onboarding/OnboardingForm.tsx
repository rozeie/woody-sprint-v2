"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONCERN_GROUPS, PROVISIONAL } from "@/config/ui-provisional";
import { getRepository } from "@/lib/data";
import {
  MAX_CONCERN_CHIPS,
  OTHER_TEXT_MAX,
  SITUATIONS,
  clampText,
  isChipDisabled,
  toggleConcern,
  type OnboardingDraft,
  type Situation,
} from "@/lib/onboarding-rules";
import {
  canProceed,
  canStartAnalysis,
  clampStep,
  stepErrors,
} from "@/lib/onboarding-steps";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextArea } from "@/components/ui/TextArea";
import { AlertIcon, ArrowLeftIcon, CheckIcon } from "@/components/ui/icons";
import { ProgressSteps } from "./ProgressSteps";

const SITUATION_LABEL: Record<Situation, string> = {
  job_seeker: "취업 준비생",
  junior: "주니어 실무자",
};

const STEP_TITLE = [
  "어떤 고민을 해결하고 싶나요?",
  "지금 어떤 상황인가요?",
  "더 알려주고 싶은 상황이 있나요?",
  "시작하기 전에 알아두세요",
] as const;

// 하단 바의 버튼 두 개(건너뛰기, 다음)는 공간이 있으면 나란히, 좁거나 글자가 커지면 세로로 쌓인다
// 1단계 미입력 안내 토스트가 떠 있는 시간(ms)
const TOAST_MS = 5000;
const CONCERN_TOAST = "고민을 선택하거나 기타에 입력해 주세요.";

const PAIR_BUTTON = "!w-auto flex-1 basis-[9rem]";

function focusById(id: string) {
  document.getElementById(id)?.focus();
}

/**
 * 온보딩 4단계 (사용자 확정): 1 고민 영역, 2 현재 상황, 3 추가 설명(선택, 건너뛰기), 4 시작 전 안내(확인 체크).
 * AI 분석과 결과 확인은 이 4단계 이후다. 입력은 단계를 오가도 유지되고, 입력과 현재 단계는 데모 임시 저장에 남아
 * 새로고침 때 복원된다. 각 단계의 CTA는 하단에 고정한다(문서 흐름 안의 sticky라 마지막 내용은 가려지지 않는다).
 * 안내 확인 체크는 법적 동의나 개인정보 수집 동의가 아니라 안내를 읽었다는 표시다.
 */
export function OnboardingForm({
  initialDraft,
  initialStep,
}: {
  initialDraft: OnboardingDraft;
  initialStep: number | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [step, setStep] = useState<number>(() => clampStep(initialStep, initialDraft));
  const [attempted, setAttempted] = useState(false);
  const [ack, setAck] = useState(false); // 안내 확인은 기본 미체크이며 저장하지 않는다
  const [moves, setMoves] = useState(0);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // 단계가 바뀌면 제목으로 포커스를 옮기고 맨 위로 스크롤한다
  useEffect(() => {
    if (moves === 0) return;
    headingRef.current?.focus();
    window.scrollTo(0, 0);
  }, [moves]);

  // 데모 임시 저장: 변경될 때마다 저장(서버 저장이 아님)
  function update(next: OnboardingDraft) {
    setDraft(next);
    // 조건을 채우면(칩 선택, 공백이 아닌 기타 입력) 1단계 토스트를 바로 닫는다
    if (toastTimer.current && canProceed(1, next)) hideToast();
    void getRepository().saveOnboardingDraft(next);
  }

  function hideToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToast(false);
  }

  // 반복해서 눌러도 토스트는 하나이고 시간만 다시 센다
  function showToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(true);
    toastTimer.current = setTimeout(hideToast, TOAST_MS);
  }

  function go(next: number) {
    hideToast();
    setStep(next);
    setAttempted(false);
    void getRepository().saveOnboardingStep(next);
    setMoves((n) => n + 1);
  }

  const errors = stepErrors(step, draft);
  const stepOk = canProceed(step, draft);
  const show = attempted;

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function onToggleConcern(key: string) {
    const result = toggleConcern(draft.concernKeys, key);
    if (result.blocked) return;
    update({ ...draft, concernKeys: result.selected });
  }

  function onNext() {
    if (!stepOk) {
      // 1단계는 스크롤과 포커스를 옮기지 않고 CTA 위 토스트로만 알린다
      if (step === 1) {
        showToast();
        return;
      }
      setAttempted(true);
      // 첫 번째로 빠진 입력으로 포커스 이동
      if (errors.concern) focusById("concern-group");
      else if (errors.situation) focusById(`situation-${SITUATIONS[0]}`);
      return;
    }
    go(step + 1);
  }

  function onSkip() {
    // 건너뛰기: 이 단계의 내용은 사용하지 않고 다음으로 간다
    update({ ...draft, detailText: "" });
    go(step + 1);
  }

  function onStart() {
    if (!canStartAnalysis(draft, ack)) {
      setAttempted(true);
      if (!ack) focusById("notice-ack");
      return;
    }
    router.push("/onboarding/analyzing");
  }

  const missing: string[] = [];
  if (errors.concern) missing.push("고민 영역 1개 이상");
  if (errors.situation) missing.push("현재 상황");

  const ctaHint =
    step === 4
      ? ack
        ? "누르면 모의 분석이 시작돼요. 실제 AI 분석이 아니에요."
        : "내용을 확인하면 분석을 시작할 수 있어요."
      : !stepOk && step !== 1
        ? `아직 필요해요: ${missing.join(", ")}`
        : "";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex min-h-14 items-center gap-1">
        {step === 1 ? (
          <Link
            href="/"
            aria-label="이전 화면으로"
            className="-ml-3 inline-flex h-12 w-12 items-center justify-center rounded-btn text-fg hover:bg-surface-subtle"
          >
            <ArrowLeftIcon />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="이전 단계로"
            onClick={() => go(step - 1)}
            className="-ml-3 inline-flex h-12 w-12 items-center justify-center rounded-btn text-fg hover:bg-surface-subtle"
          >
            <ArrowLeftIcon />
          </button>
        )}
        <span className="text-card-title font-bold">Stack</span>
      </header>

      <div className="pt-2">
        <ProgressSteps current={step} />
      </div>

      <main className="flex-1 pb-6 pt-6">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-page-title font-bold outline-offset-4"
        >
          {STEP_TITLE[step - 1]}
        </h1>

        {/* 1단계: 고민 영역 */}
        {step === 1 && (
          <section aria-label="고민 영역" className="mt-3">
            <p id="concern-help" className="text-caption text-fg-secondary">
              고민 영역은 최대 {MAX_CONCERN_CHIPS}개까지 고를 수 있어요. 기타에 적는 내용은 선택 개수에 포함되지 않아요.
            </p>

            <div
              id="concern-group"
              tabIndex={-1}
              aria-describedby="concern-help"
              className="mt-4 outline-offset-4"
            >
              {CONCERN_GROUPS.map((group) => (
                <div
                  key={group.name}
                  role="group"
                  aria-labelledby={`group-${group.name}`}
                  className="mt-6 first:mt-0"
                >
                  <p id={`group-${group.name}`} className="text-caption font-semibold text-fg-muted">
                    {group.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-2">
                    {group.chips.map((chip) => (
                      <Chip
                        key={chip.key}
                        label={chip.label}
                        selected={draft.concernKeys.includes(chip.key)}
                        blocked={isChipDisabled(draft.concernKeys, chip.key)}
                        onClick={() => onToggleConcern(chip.key)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* 기타: 토글 없이 처음부터 입력창을 보여 준다. 내용이 있으면 선택, 비어 있으면 미선택. 3개 제한과 무관 */}
              <div className="mt-6">
                <TextArea
                  id="other-text"
                  label="기타 (선택)"
                  hint="위 항목에 없는 고민이 있다면, 가장 해결하고 싶은 고민 하나를 적어 주세요."
                  value={draft.otherText}
                  max={OTHER_TEXT_MAX}
                  onChange={(v) => {
                    const otherText = clampText(v, OTHER_TEXT_MAX);
                    update({ ...draft, otherText, otherSelected: otherText.trim().length > 0 });
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* 2단계: 현재 상황 */}
        {step === 2 && (
          <fieldset className="mt-4">
            <legend className="sr-only">현재 상황 (필수)</legend>
            <p className="text-caption text-fg-secondary">하나를 골라 주세요. 필수예요.</p>
            <div
              className="mt-3 grid gap-2"
              aria-describedby={show && errors.situation ? "situation-error" : undefined}
            >
              {SITUATIONS.map((value) => {
                const checked = draft.situation === value;
                return (
                  <label key={value} className="block">
                    <input
                      id={`situation-${value}`}
                      type="radio"
                      name="situation"
                      value={value}
                      checked={checked}
                      onChange={() => update({ ...draft, situation: value })}
                      className="peer sr-only"
                    />
                    <span
                      className={`flex min-h-13 items-center justify-between gap-2 rounded-btn border px-4 text-label peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
                        checked
                          ? "border-primary-ink bg-primary-tint font-bold text-primary-ink"
                          : "border-line-control bg-surface font-semibold text-fg"
                      }`}
                    >
                      {SITUATION_LABEL[value]}
                      {checked && <CheckIcon />}
                    </span>
                  </label>
                );
              })}
            </div>
            <div id="situation-error" className="mt-1 text-caption text-danger">
              {show && errors.situation && (
                <p className="flex items-start gap-1">
                  <AlertIcon className="mt-0.5 shrink-0" />
                  <span>현재 상황을 하나 골라 주세요.</span>
                </p>
              )}
            </div>
          </fieldset>
        )}

        {/* 3단계: 추가 설명(선택) */}
        {step === 3 && (
          <section className="mt-4">
            <TextArea
              id="detail-text"
              label="추가 설명 (선택)"
              hint="고민에 대해 더 알려주고 싶은 상황이 있다면 적어 주세요. 적지 않아도 괜찮아요."
              value={draft.detailText}
              max={PROVISIONAL.detailTextMax}
              onChange={(v) => update({ ...draft, detailText: clampText(v, PROVISIONAL.detailTextMax) })}
              rows={6}
            />
            <p className="mt-2 text-caption text-fg-secondary">
              건너뛰면 이 단계에 적은 내용은 사용하지 않아요.
            </p>
          </section>
        )}

        {/* 4단계: 시작 전 안내 */}
        {step === 4 && (
          <section aria-labelledby="notice-title" className="mt-4">
            <h2 id="notice-title" className="sr-only">
              안내 내용
            </h2>
            <dl className="space-y-4 rounded-card bg-surface-subtle p-4 text-caption text-fg-secondary">
              <div>
                <dt className="font-semibold text-fg">AI 사용</dt>
                <dd>
                  입력한 고민은 AI가 학습 방향을 제안하는 데 사용돼요. 이 데모에서는 실제 AI 대신 모의 분석을
                  사용해요.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-fg">기록 보관</dt>
                <dd>
                  기록은 이 기기와 브라우저에 연결돼요. 기록을 지우거나 다른 기기나 브라우저에서 열면 이어서 볼 수
                  없어요. 이 데모는 입력을 이 브라우저에만 임시 저장하고 서버에는 저장하지 않아요.
                </dd>
              </div>
            </dl>

            <label className="mt-5 flex min-h-12 cursor-pointer items-center gap-3 text-body">
              <input
                id="notice-ack"
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                aria-describedby="cta-hint"
                className="h-6 w-6 shrink-0 accent-primary-ink"
              />
              <span>내용을 확인했습니다</span>
            </label>
            {show && !ack && (
              <p className="mt-1 flex items-start gap-1 text-caption text-danger">
                <AlertIcon className="mt-0.5 shrink-0" />
                <span>내용을 확인했다면 위 칸에 체크해 주세요.</span>
              </p>
            )}
          </section>
        )}
      </main>

      {/* 하단 고정 CTA: 문서 흐름 안의 sticky. 하단 여백은 safe area를 반영하고, 입력에 포커스가 가면 바 높이만큼 스크롤 여백을 둔다 */}
      <div
        data-sticky-bar
        className="sticky bottom-0 z-10 border-t border-line bg-background pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
      >
        {/* 1단계 미입력 토스트: 바 바로 위에 놓여 CTA를 가리지 않는다. 스크린리더에는 alert로 전달 */}
        <div role="alert" className="pointer-events-none absolute inset-x-0 bottom-full mb-2">
          {toast && (
            <p className="rounded-btn bg-fg px-4 py-3 text-caption text-surface shadow-lg">{CONCERN_TOAST}</p>
          )}
        </div>
        <p id="cta-hint" className={`mb-2 text-caption text-fg-secondary ${ctaHint ? "" : "sr-only"}`}>
          {ctaHint}
        </p>
        {step === 3 && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className={PAIR_BUTTON} onClick={onSkip}>
              건너뛰기
            </Button>
            <Button className={PAIR_BUTTON} onClick={onNext}>
              다음
            </Button>
          </div>
        )}
        {step === 4 && (
          <Button aria-disabled={!ack || undefined} aria-describedby="cta-hint" onClick={onStart}>
            AI 학습 방향 분석하기
          </Button>
        )}
        {step < 3 && (
          <Button aria-disabled={!stepOk || undefined} aria-describedby="cta-hint" onClick={onNext}>
            다음
          </Button>
        )}
      </div>
    </div>
  );
}

