"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONCERN_GROUPS, PROVISIONAL } from "@/config/ui-provisional";
import { getRepository } from "@/lib/data";
import {
  MAX_CONCERN_CHIPS,
  OTHER_TEXT_MAX,
  SITUATIONS,
  clampText,
  toggleConcern,
  validateDraft,
  type OnboardingDraft,
  type Situation,
} from "@/lib/onboarding-rules";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextArea } from "@/components/ui/TextArea";
import { AlertIcon, CheckIcon } from "@/components/ui/icons";

const SITUATION_LABEL: Record<Situation, string> = {
  job_seeker: "취업 준비생",
  junior: "주니어 실무자",
};

const CAP_MESSAGE = `일반 고민은 최대 ${MAX_CONCERN_CHIPS}개까지 고를 수 있어요. 다른 고민을 고르려면 선택한 칩을 먼저 해제해 주세요.`;

const GROUPS = CONCERN_GROUPS;

function focusById(id: string) {
  document.getElementById(id)?.focus();
}

export function OnboardingForm({ initialDraft }: { initialDraft: OnboardingDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [attempted, setAttempted] = useState(false);
  const [capNudge, setCapNudge] = useState(false);

  const { ok, errors } = validateDraft(draft);
  const atCap = draft.concernKeys.length >= MAX_CONCERN_CHIPS;
  const show = attempted;

  // 데모 임시 저장: 변경될 때마다 저장(서버 저장이 아님)
  function update(next: OnboardingDraft) {
    setDraft(next);
    void getRepository().saveOnboardingDraft(next);
  }

  function onToggleConcern(key: string) {
    const result = toggleConcern(draft.concernKeys, key);
    if (result.blocked) {
      setCapNudge(true);
      return;
    }
    setCapNudge(false);
    update({ ...draft, concernKeys: result.selected });
  }

  function onToggleOther() {
    update({ ...draft, otherSelected: !draft.otherSelected });
  }

  function onSubmit() {
    if (!ok) {
      setAttempted(true);
      // 첫 번째로 빠진 입력으로 포커스 이동
      if (errors.concern) focusById("concern-group");
      else if (errors.other) focusById("other-text");
      else if (errors.situation) focusById(`situation-${SITUATIONS[0]}`);
      return;
    }
    router.push("/onboarding/analyzing");
  }

  const missing: string[] = [];
  if (errors.concern) missing.push("고민 1개 이상");
  if (errors.other) missing.push("'기타' 내용");
  if (errors.situation) missing.push("현재 상황");

  const concernErrorText =
    errors.concern === "none"
      ? "고민을 1개 이상 골라 주세요. 해당하는 칩이 없다면 '기타'에 직접 적을 수 있어요."
      : undefined;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="pb-10"
    >
      <h1 className="text-page-title font-bold">지금 학습으로 풀고 싶은 고민을 골라 주세요</h1>
      <p className="mt-2 text-body text-fg-secondary">
        일반 고민은 최대 {MAX_CONCERN_CHIPS}개까지 고를 수 있어요. &lsquo;기타&rsquo;는 개수에
        포함되지 않아요.
      </p>

      {/* 고민 영역 */}
      <section aria-labelledby="concern-title" className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 id="concern-title" className="text-section-title font-bold">
            고민 영역
          </h2>
          <p className="text-caption text-fg-secondary">
            일반 고민 {draft.concernKeys.length}/{MAX_CONCERN_CHIPS} 선택
          </p>
        </div>

        <div
          id="concern-group"
          tabIndex={-1}
          aria-describedby={`concern-cap${show && concernErrorText ? " concern-error" : ""}`}
          className="mt-3 outline-offset-4"
        >
          {GROUPS.map((group) => (
            <div
              key={group.name}
              role="group"
              aria-labelledby={`group-${group.name}`}
              className="mt-3 first:mt-0"
            >
              <p id={`group-${group.name}`} className="text-caption font-semibold text-fg-secondary">
                {group.name}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-2">
                {group.chips.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    selected={draft.concernKeys.includes(chip.key)}
                    blocked={atCap}
                    onClick={() => onToggleConcern(chip.key)}
                    describedBy="concern-cap"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 개수 제한 안내: 3개에 도달하면 상시 표시, 4번째 선택 시도 시 강조 */}
        <div id="concern-cap" role="status" className="mt-2">
          {atCap && (
            <p
              className={`flex items-start gap-2 rounded-btn px-3 py-2 text-caption ${
                capNudge ? "bg-warning-bg text-warning" : "bg-surface-subtle text-fg-secondary"
              }`}
            >
              <AlertIcon className="mt-0.5 shrink-0" />
              <span>{CAP_MESSAGE}</span>
            </p>
          )}
        </div>
        <div id="concern-error" className="mt-1 text-caption text-danger">
          {show && concernErrorText && (
            <p className="flex items-start gap-1">
              <AlertIcon className="mt-0.5 shrink-0" />
              <span>{concernErrorText}</span>
            </p>
          )}
        </div>

        {/* 기타: 개수 제한 밖 */}
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-caption font-semibold text-fg-secondary">
            기타 (위 {MAX_CONCERN_CHIPS}개 제한에 포함되지 않아요)
          </p>
          <div className="mt-1">
            <Chip label="기타" selected={draft.otherSelected} onClick={onToggleOther} />
          </div>
          {draft.otherSelected && (
            <div className="mt-3">
              <TextArea
                id="other-text"
                label="가장 해결하고 싶은 하나의 고민"
                hint="가장 해결하고 싶은 고민 하나를 구체적으로 적어 주세요."
                value={draft.otherText}
                max={OTHER_TEXT_MAX}
                onChange={(v) => update({ ...draft, otherText: clampText(v, OTHER_TEXT_MAX) })}
                error={show && errors.other ? "내용을 적어 주세요. 적지 않으려면 '기타'를 해제해 주세요." : undefined}
              />
            </div>
          )}
        </div>
      </section>

      {/* 현재 상황 */}
      <fieldset className="mt-8">
        <legend className="text-section-title font-bold">
          현재 상황 <span className="text-caption font-semibold text-fg-secondary">(필수)</span>
        </legend>
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

      {/* 추가 설명 (선택) */}
      {(PROVISIONAL.showDetailWithOther || !draft.otherSelected) && (
        <section className="mt-8">
          <TextArea
            id="detail-text"
            label="추가 설명 (선택)"
            hint="고민에 대해 더 알려주고 싶은 상황이 있다면 적어 주세요. 적지 않아도 괜찮아요."
            value={draft.detailText}
            max={PROVISIONAL.detailTextMax}
            onChange={(v) => update({ ...draft, detailText: clampText(v, PROVISIONAL.detailTextMax) })}
          />
        </section>
      )}

      {/* 안내 */}
      <section aria-labelledby="notice-title" className="mt-8 rounded-card bg-surface-subtle p-4">
        <h2 id="notice-title" className="text-card-title font-semibold">
          시작하기 전에 알아두세요
        </h2>
        <dl className="mt-2 space-y-3 text-caption text-fg-secondary">
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
      </section>

      {/* 제출 */}
      <div className="mt-8">
        <Button
          type="submit"
          aria-disabled={!ok}
          aria-describedby="submit-hint"
        >
          AI 학습 방향 분석하기
        </Button>
        <p id="submit-hint" className="mt-2 text-caption text-fg-secondary">
          {ok
            ? "누르면 모의 분석이 시작돼요. 실제 AI 분석이 아니에요."
            : `아직 필요해요: ${missing.join(", ")}`}
        </p>
      </div>
    </form>
  );
}
